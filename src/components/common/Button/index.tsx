import React from "react";
import classNames from "classnames";

const Button: React.FC = ({ children }) => {
  return <div className={classNames("button")}>{children}</div>;
};

export default Button;
