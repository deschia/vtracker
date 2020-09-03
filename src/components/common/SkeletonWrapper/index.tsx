import React from "react";
import { Skeleton } from "@material-ui/lab";

interface Props {
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  className?: string;
  variant?: "circle" | "text" | "rect";
}

const SkeletonWrapper = ({ children, ...props }: Props) => {
  return (
    <Skeleton animation={"wave"} {...props}>
      {children}
    </Skeleton>
  );
};

export default SkeletonWrapper;
