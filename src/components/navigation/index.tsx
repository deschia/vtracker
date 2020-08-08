import React, { useState } from "react";
import Header from "~/components/navigation/Header";
import SideMenu from "~/components/navigation/SideMenu";
import { Hidden } from "@material-ui/core";

const Navigation: React.FC = () => {
  const [isMobileSideMenuOpen, setIsMobileSideMenuOpen] = useState(false);
  const openMobileSideMenu = () => {
    isMobileSideMenuOpen
      ? setIsMobileSideMenuOpen(false)
      : setIsMobileSideMenuOpen(true);
  };
  return (
    <>
      <Header onMenuClick={openMobileSideMenu} />
      <Hidden implementation={"js"} xsDown>
        <SideMenu />
      </Hidden>
      {isMobileSideMenuOpen && <SideMenu />}
    </>
  );
};

export default Navigation;
