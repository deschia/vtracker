import {
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Link,
  Tooltip,
  Typography,
} from "@material-ui/core";
import React, { useState } from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import "./index.scss";
import classNames from "classnames";
import endpoints from "~/constant/endpoints";
import { default as moment } from "moment";
import SkeletonWrapper from "~/components/common/SkeletonWrapper";
import { AvatarGroup } from "@material-ui/lab";
import numeral from "numeral";

interface Props {
  changes?: string;
  stream?: any;
  skeleton?: boolean;
  selfChannel?: any;
  members?: any[];
}

const useStyle = makeStyles({
  rootCard: {
    maxWidth: 360,
    border: 0,
  },
  rootGridItem: {
    paddingTop: 5,
  },
  rootChip: {
    marginTop: 10,
    marginRight: 10,
  },
  containerTitle: {
    height: 50,
    overflow: "hidden",
  },
  expandTitleTypography: {
    marginTop: 10,
  },
  cardMedia: {
    height: 180,
    marginBottom: 10,
    cursor: "pointer",
  },
  cardMediaSkeleton: {
    height: 175,
    width: 500,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarSkeleton: {
    width: 40,
    height: 40,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    cursor: "pointer",
  },
  tooltip: {
    fontSize: 12,
  },
});

const StreamCard = (props: Props) => {
  const classes = useStyle();
  const { goToYoutubeVideo } = endpoints;
  const { stream, skeleton, selfChannel, members } = props;
  const [isHovered, setIsHovered] = useState(false);

  const openVtuberPage = (id: string) => {
    // TODO implement this
  };

  const renderViewerChanges = () => {
    if (skeleton) {
      return <SkeletonWrapper />;
    }
    // TODO implement me
    return (
      <Typography variant={"body2"} align={"right"}>
        {}
      </Typography>
    );
  };

  const renderThumbnail = () => {
    if (skeleton) {
      return (
        <SkeletonWrapper>
          <div className={classes.cardMediaSkeleton} />
        </SkeletonWrapper>
      );
    }
    const { id, thumbnailUrl } = stream;
    return (
      <Link href={skeleton ? "" : goToYoutubeVideo(id && id)}>
        {skeleton ? (
          <SkeletonWrapper>
            <div className={classes.cardMediaSkeleton} />
          </SkeletonWrapper>
        ) : (
          <CardMedia className={classes.cardMedia} image={thumbnailUrl} />
        )}
      </Link>
    );
  };

  const renderAvatar = () => {
    if (skeleton) {
      return (
        <SkeletonWrapper
          variant={"circle"}
          className={classes.avatarSkeleton}
        />
      );
    }
    return (
      <Link href={"#"}>
        <Avatar
          className={classes.avatar}
          src={selfChannel.thumbnailUrl}
          variant={"circle"}
        />
      </Link>
    );
  };

  const renderStreamTitle = () => {
    if (skeleton) {
      return <SkeletonWrapper />;
    }
    const { title } = stream;
    return (
      <div className={classes.containerTitle}>
        <Typography variant={"body1"}>{title}</Typography>
      </div>
    );
  };

  const renderStreamDate = () => {
    if (skeleton) {
      return <SkeletonWrapper />;
    }
    const { scheduledTime } = stream;
    const formattedTime = moment.unix(scheduledTime._seconds).format("ddd LT");
    return (
      <Typography variant={"body2"} align={"right"}>
        {formattedTime}
      </Typography>
    );
  };

  const renderLiveStatus = () => {
    if (skeleton) {
      return <SkeletonWrapper />;
    }
    const { liveStatus, scheduledTime } = stream;
    const formattedTime = moment.unix(scheduledTime._seconds).fromNow();
    return (
      <Typography variant={"body2"}>
        {liveStatus === "live" ? "Now streaming" : formattedTime}
      </Typography>
    );
  };

  const renderViewers = () => {
    if (skeleton) {
      return <SkeletonWrapper />;
    }
    const { liveViewerCount } = stream;
    if (!liveViewerCount) return;
    let formattedNumber: string;
    if (Number(liveViewerCount) < 1000) {
      formattedNumber = numeral(liveViewerCount).format("0a");
    } else {
      formattedNumber = numeral(liveViewerCount).format("0.0a");
    }
    return (
      <Typography variant={"body2"}>{`${formattedNumber} viewers`}</Typography>
    );
  };

  const renderTag = () => {
    if (skeleton) return;
    return (
      <>
        <Typography variant={"body2"} className={classes.expandTitleTypography}>
          {"Tag"}
        </Typography>
      </>
    );
  };

  const renderGame = () => {
    if (skeleton) return;
    return (
      <>
        <Typography variant={"body2"} className={classes.expandTitleTypography}>
          {"Game"}
        </Typography>
      </>
    );
  };

  const renderMember = () => {
    if (skeleton) return;

    const allAvatars = [];
    const selfAvatar = (
      <Tooltip
        title={selfChannel.channelName}
        classes={{ tooltip: classes.tooltip }}
      >
        <Avatar
          className={classes.memberAvatar}
          src={selfChannel.thumbnailUrl}
          variant={"circle"}
        />
      </Tooltip>
    );

    allAvatars.push(selfAvatar);

    const otherAvatars =
      members &&
      members.map((member) => {
        return (
          <Tooltip
            title={member.channelName}
            classes={{ tooltip: classes.tooltip }}
          >
            <Avatar
              className={classes.memberAvatar}
              src={member.thumbnailUrl}
              variant={"circle"}
              onClick={() => openVtuberPage(member.id)}
            />
          </Tooltip>
        );
      });

    if (otherAvatars) {
      allAvatars.push(otherAvatars);
    }

    return (
      <>
        <Typography variant={"body2"} className={classes.expandTitleTypography}>
          {"Who's in this stream?"}
        </Typography>
        <AvatarGroup>{allAvatars}</AvatarGroup>
      </>
    );
  };

  return (
    <div className={"card-container"}>
      <Card
        variant={isHovered ? "elevation" : "outlined"}
        classes={{ root: classes.rootCard }}
        className={classNames("card", { "card-animation": !skeleton })}
        elevation={3}
      >
        <CardContent
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Grid container spacing={0}>
            <Grid item xs={12}>
              {renderThumbnail()}
            </Grid>
            <Grid item xl={2} md={3} sm={2}>
              {renderAvatar()}
            </Grid>
            <Grid item xl={10} md={9} sm={10}>
              {renderStreamTitle()}
            </Grid>
            <Grid item xs={6}>
              {renderLiveStatus()}
            </Grid>
            <Grid item xs={6}>
              {renderStreamDate()}
            </Grid>
            <Grid item xs={6}>
              {renderViewers()}
            </Grid>
            <Grid item xs={6}>
              {renderViewerChanges()}
            </Grid>
            <div hidden={!isHovered || skeleton}>
              <Grid item xs={12}>
                {renderTag()}
              </Grid>
              <Grid item xs={12}>
                {renderMember()}
              </Grid>
              <Grid item xs={12}>
                {renderGame()}
              </Grid>
            </div>
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamCard;
