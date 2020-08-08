import React from "react";
import "./index.scss";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Drawer, Toolbar } from "@material-ui/core";
import SideMenuItem from "~/components/navigation/SideMenu/SideMenuItem";

const defaultWidth = 240;

interface Props {
  width?: number;
}

const SideMenu = ({ width = defaultWidth }: Props) => {
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        display: "flex",
      },
      appBar: {
        zIndex: theme.zIndex.drawer + 1,
      },
      drawer: {
        width,
        flexShrink: 0,
      },
      drawerPaper: {
        width,
      },
      drawerContainer: {
        overflow: "auto",
      },
      content: {
        flexGrow: 1,
        padding: theme.spacing(3),
      },
    })
  );
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Toolbar />
        <div className={classes.drawerContainer}>
          <SideMenuItem />
        </div>
      </Drawer>
    </div>
  );
};

export default SideMenu;
