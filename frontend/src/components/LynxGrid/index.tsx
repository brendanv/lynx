import { ReactNode } from "react";
import cx from "clsx";
import classes from "./LynxGrid.module.css";

const LynxGrid = ({
  children,
  fullBleedAtSingleColumn,
}: {
  children: ReactNode;
  fullBleedAtSingleColumn?: boolean;
}) => {
  return (
    <div
      className={cx(
        classes.grid,
        fullBleedAtSingleColumn && classes.gridFullBleed,
      )}
    >
      {children}
    </div>
  );
};

export default LynxGrid;
