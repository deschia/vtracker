import React from "react";
import "./index.scss";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import {
  AppBar,
  Hidden,
  IconButton,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { default as MenuIcon } from "@material-ui/icons/Menu";

interface Props {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: Props) => {
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        flexGrow: 1,
        display: "flex",
      },
      menuButton: {
        marginRight: theme.spacing(2),
      },
      title: {
        flexGrow: 1,
      },
      appBar: {
        zIndex: theme.zIndex.drawer + 1,
      },
    })
  );
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Hidden implementation={"js"} smUp>
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
            >
              <MenuIcon />
            </IconButton>
          </Hidden>
          <Typography variant={"h5"} noWrap>
            VTracker
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Header;
