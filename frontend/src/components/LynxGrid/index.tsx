import { ReactNode } from "react";
import classes from "./LynxGrid.module.css";

const LynxGrid = ({ children }: { children: ReactNode }) => {
  return <div className={classes.grid}>{children}</div>;
};

export default LynxGrid;
