import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as xml2js from "xml2js";
import { default as axios } from "axios";

const API_KEY = "AIzaSyCHgxdEJZeAiydl18PhyK2l2GX7FxGazd8";
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

admin.initializeApp();

const db = admin.firestore();

exports.queryLiveStreamsByChannelId = functions.https.onRequest(
  async (req, res) => {
    if (req.query["hub.mode"] === "subscription") {
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
        const link = deleteEntry.link[0];
        functions.logger.log("deleted feed entry:", link);
        res.sendStatus(200);
        return;
      }

      const videoId = parsedData.feed.entry[0]["yt:videoId"][0];
      const channelId = parsedData.feed.entry[0]["yt:channelId"][0];
      const channelName = parsedData.feed.entry[0].author[0].name[0];

      const url = `${YOUTUBE_API_BASE_URL}/videos`;
      const resp = await axios.get(url, {
        params: {
          key: API_KEY,
          id: videoId,
          part: "snippet,liveStreamingDetails",
        },
      });

      const data = resp.data;
      const liveData = data.items[0].liveStreamingDetails;
      const snippet = data.items[0].snippet;

      const scheduledTime = new Date(liveData.scheduledStartTime);
      const liveViewerCount: string | undefined = liveData.concurrentViewers;
      const title: string = snippet.title;
      const thumbnailUrl: string = snippet.thumbnails.maxres.url;
      const liveStatus: "live" | "none" | "upcoming" =
        snippet.liveBroadcastContent;

      // TODO read description for member

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
            liveViewerCount: liveStatus === "live" ? liveViewerCount : "",
            thumbnailUrl,
            liveStatus,
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
  const from = String(req.query["from"]);
  const to = String(req.query["to"]);

  // bad request
  if (!from || !to) {
    res.sendStatus(400);
    return;
  }

  const result = await db
    .collection("videos")
    .where("scheduledTime", ">=", new Date(from))
    .where("scheduledTime", "<=", new Date(to))
    .orderBy("scheduledTime", "desc")
    .get();

  const response = result.docs.reduce(
    (prev, cur) => {
      const videoId = cur.id;
      return { data: { ...prev.data, [videoId]: cur.data() } };
    },
    { data: {} }
  );

  res.send(response);
});
