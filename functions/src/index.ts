import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as xml2js from "xml2js";
import { default as axios } from "axios";
import * as firebase from "firebase";
import DocumentReference = firebase.firestore.DocumentReference;
import moment = require("moment");
import { StorageFileMetadata } from "./models";

const API_KEY = "AIzaSyCHgxdEJZeAiydl18PhyK2l2GX7FxGazd8";
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

admin.initializeApp({
  storageBucket: "vtracker-4a593.appspot.com",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.queryLiveStreamsByChannelId = functions.https.onRequest(
  async (req, res) => {
    if (req.query["hub.mode"] === "subscribe") {
      functions.logger.log("new subscription: ", req.query);
      res.send(req.query["hub.challenge"]);
      return;
    }
    try {
      const xmlData = req.rawBody.toString();
      let parsedData: any = {};
      xml2js.parseString(xmlData, (error: Error, result: any) => {
        parsedData = result;
      });

      // handle deleted-entry feed type
      const deleteEntry = parsedData.feed["at:deleted-entry"];
      if (deleteEntry) {
        functions.logger.log("deleted feed entry:", deleteEntry.link);
        res.sendStatus(200);
        return;
      }

      const videoId = parsedData.feed.entry[0]["yt:videoId"][0];

      const url = `${YOUTUBE_API_BASE_URL}/videos`;
      const resp = await axios.get(url, {
        params: {
          key: API_KEY,
          id: videoId,
          part: "snippet,liveStreamingDetails",
        },
      });

      const data = resp.data;

      // handle unavailable video
      if (!data.items.length) {
        await db.collection("videos").doc(videoId).set(
          {
            available: false,
          },
          { merge: true }
        );
        functions.logger.log("stream unavailable:", videoId);
        res.sendStatus(200);
        return;
      }

      const liveData = data.items[0].liveStreamingDetails;
      const snippet = data.items[0].snippet;

      const scheduledTime = new Date(liveData.scheduledStartTime); // this line will throw exception if the video is not a stream
      const liveViewerCount: string | undefined = liveData.concurrentViewers;
      const title: string = snippet.title;
      const channelId: string = snippet.channelId;
      const channelName: string = snippet.channelTitle;
      const description: string = snippet.description;
      const thumbnailUrl: string = snippet.thumbnails.standard.url;
      const liveStatus: "live" | "none" | "upcoming" =
        snippet.liveBroadcastContent;

      // read description for member
      const youtubeChannelIdRegex = /channel\/.{24}/g;
      const regexResults = description.match(youtubeChannelIdRegex);
      const members: FirebaseFirestore.DocumentReference[] = [];

      regexResults &&
        regexResults.forEach((r) => {
          const id = r.split("channel/")[1];
          members.push(db.doc(`channels/${id}`));
        });

      await db
        .collection("videos")
        .doc(videoId)
        .set(
          {
            title,
            channelId,
            channelName,
            // convert date to UNIX seconds
            scheduledTime: new admin.firestore.Timestamp(
              scheduledTime.valueOf() / 1000,
              0
            ),
            liveViewerCount: liveStatus === "live" ? liveViewerCount : 0,
            thumbnailUrl,
            liveStatus,
            members: members.length
              ? admin.firestore.FieldValue.arrayUnion(...members)
              : admin.firestore.FieldValue.arrayUnion(...[channelId]),
          },
          { merge: true }
        );

      await db
        .collection("schedules")
        .doc(scheduledTime.toISOString().split("T")[0])
        .set(
          {
            videoIds: admin.firestore.FieldValue.arrayUnion(
              db.doc(`videos/${videoId}`)
            ),
          },
          { merge: true }
        );

      functions.logger.log("stream update: ", videoId);
      res.sendStatus(200);
    } catch (e) {
      functions.logger.log("unexpected error:", e);
      res.sendStatus(500);
    }
  }
);

exports.fetchSchedules = functions.https.onRequest(async (req, res) => {
  let startTimeInUnix: number = Number(req.query["from"]);
  let endTimeInUnix: number = Number(req.query["to"]);

  // default to -1 day until +1 day
  if (!startTimeInUnix || !endTimeInUnix) {
    endTimeInUnix = moment().add(1, "day").unix();
    startTimeInUnix = moment().subtract(1, "day").unix();
  }

  const formattedEndTime = new admin.firestore.Timestamp(endTimeInUnix, 0);
  const formattedStartTime = new admin.firestore.Timestamp(startTimeInUnix, 0);

  const result = await db
    .collection("videos")
    .where("scheduledTime", ">=", formattedStartTime)
    .where("scheduledTime", "<=", formattedEndTime)
    .orderBy("scheduledTime", "desc")
    .get();

  const getDbLockResult = await db
    .collection("_dbLock")
    .doc("lastLiveDetailsQueryTime")
    .get();

  const lastQueryTimestamp = getDbLockResult.get("time");
  const lastQuery = moment.unix(lastQueryTimestamp._seconds);
  const oneMinuteAfterLastQuery = lastQuery.add(1, "minutes");
  const now = moment();
  const isWriteUnlocked = now.isAfter(oneMinuteAfterLastQuery);

  if (isWriteUnlocked) {
    const upcomingStreamVideoIds = result.docs.reduce((prev, cur) => {
      const liveStatus = cur.data().liveStatus;
      const videoId = cur.id;
      if (liveStatus === "upcoming" || liveStatus === "live") {
        return `${prev},${videoId}`;
      }
      return prev;
    }, "");

    const url = `${YOUTUBE_API_BASE_URL}/videos`;
    const resp = await axios.get(url, {
      params: {
        key: API_KEY,
        id: upcomingStreamVideoIds,
        part: "snippet,liveStreamingDetails",
      },
    });

    let toBeWrittenToStorage: any = { data: {} };

    for (const item of resp.data.items) {
      const liveData = item.liveStreamingDetails;
      const snippet = item.snippet;
      const videoId = item.id;

      const scheduledTime = new Date(liveData.scheduledStartTime); // this line will throw exception if the video is not a stream
      const title: string = snippet.title;
      const description: string = snippet.description;
      const channelId: string = snippet.channelId;
      const channelName: string = snippet.channelTitle;
      const thumbnailUrl: string = snippet.thumbnails.standard.url;
      const liveViewerCount = liveData.concurrentViewers;
      const liveStatus: "live" | "none" | "upcoming" =
        snippet.liveBroadcastContent;
      const newLiveViewerCount = liveViewerCount ? liveViewerCount : 0;

      // read description for member
      const youtubeChannelIdRegex = /channel\/.{24}/g;
      const regexResults = description.match(youtubeChannelIdRegex);
      const members: string[] = [];

      regexResults &&
        regexResults.forEach((r) => {
          const id = r.split("channel/")[1];
          members.push(`channels/${id}`);
        });

      const currentStream = result.docs.find((doc) => doc.id === videoId);
      const maxViewerCount =
        currentStream && currentStream.data().maxViewerCount
          ? currentStream.data().maxViewerCount
          : 0;
      const newMaxViewerCount =
        Number(newLiveViewerCount) > maxViewerCount
          ? newLiveViewerCount
          : maxViewerCount;

      await db
        .collection("videos")
        .doc(videoId)
        .set(
          {
            title,
            scheduledTime: new admin.firestore.Timestamp(
              scheduledTime.valueOf() / 1000,
              0
            ),
            liveViewerCount: Number(newLiveViewerCount),
            liveStatus,
            maxViewerCount: Number(newMaxViewerCount),
          },
          { merge: true }
        );

      const newData = {
        title,
        channelId,
        channelName,
        scheduledTime: {
          _seconds: scheduledTime.valueOf() / 1000,
        },
        liveViewerCount: Number(newLiveViewerCount),
        liveStatus,
        maxViewerCount: Number(newMaxViewerCount),
        thumbnailUrl,
        members: members.length ? members : [channelId],
      };
      toBeWrittenToStorage = {
        data: {
          ...toBeWrittenToStorage.data,
          [videoId]: newData,
        },
      };
    }

    const stringified = JSON.stringify(toBeWrittenToStorage);
    await bucket.file("test.json").save(stringified, { resumable: false });

    await db
      .collection("_dbLock")
      .doc("lastLiveDetailsQueryTime")
      .set(
        {
          time: new admin.firestore.Timestamp(now.unix(), 0),
        },
        { merge: true }
      );
  }

  // handle automated query (such as cron)
  if (req.header("X-Automated-Query")) {
    res.sendStatus(200);
    return;
  }

  // TODO clean this up
  const finalResult = isWriteUnlocked
    ? await db
        .collection("videos")
        .where("scheduledTime", ">=", formattedStartTime)
        .where("scheduledTime", "<=", formattedEndTime)
        .orderBy("scheduledTime", "desc")
        .get()
    : result;

  const response = finalResult.docs.reduce(
    (prev, cur) => {
      const videoId = cur.id;
      const members = cur.data().members;
      const memberIds =
        members &&
        members.map((m: DocumentReference) => {
          return m.id;
        });
      return {
        data: {
          ...prev.data,
          [videoId]: { ...cur.data(), members: memberIds },
        },
      };
    },
    { data: {} }
  );

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "accept-language");
  res.send(response);
});

exports.fetchLiveStreams = functions.https.onRequest(async (req, res) => {
  // set required headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", ["accept-language", "x-md5-hash"]);

  // get file hash
  const getMetadataResponse = await bucket.file("test.json").getMetadata();
  const metadata: StorageFileMetadata = getMetadataResponse[0];
  const currentHash = metadata.md5Hash;

  // send current hash through header
  res.set("x-md5-hash", currentHash);
  res.set("Access-Control-Expose-Headers", "x-md5-hash");

  // compare hash of with already fetched file
  // return if nothing changed
  const previousHash = req.header("x-md5-hash");
  if (currentHash === previousHash) {
    res.sendStatus(200);
    return;
  }

  // download file from storage and send its content in response body
  const jsonFile = await bucket.file("test.json").download();
  const rawJsonString = jsonFile[0].toString(); // It has this type [Buffer], so we take 0th index
  res.set("Content-Type", "application/json");
  res.send(rawJsonString);
});

exports.fetchChannels = functions.https.onRequest(async (req, res) => {
  const result = await db.collection("channels").get();

  const response = result.docs.reduce(
    (prev, cur) => {
      const channelId = cur.id;
      return { data: { ...prev.data, [channelId]: cur.data() } };
    },
    { data: {} }
  );

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "accept-language");
  res.send(response);
});
