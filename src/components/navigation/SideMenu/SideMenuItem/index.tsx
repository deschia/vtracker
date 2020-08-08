import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Home, Person, LiveTv, SportsEsports } from "@material-ui/icons";
import React from "react";

type MenuListType = {
  name: string;
  icon: any;
};

const menuList: MenuListType[] = [
  {
    name: "Home",
    icon: <Home />,
  },
  {
    name: "Stream",
    icon: <LiveTv />,
  },
  {
    name: "Vtubers",
    icon: <Person />,
  },
  {
    name: "Games",
    icon: <SportsEsports />,
  },
];

const SideMenuItem = () => {
  return (
    <List>
      {menuList.map((menu) => (
        <ListItem button key={menu.name}>
          <ListItemIcon>{menu.icon}</ListItemIcon>
          <ListItemText primary={menu.name} />
        </ListItem>
      ))}
    </List>
  );
};

export default SideMenuItem;
