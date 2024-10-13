import React from "react";
import { useMantineColorScheme } from "@mantine/core";
import classes from "./LynxLogo.module.css";

const LynxLogo: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();

  if (colorScheme === "light") {
    return (
      <img className={classes.logo} src="/img/lynx_dark.svg" alt="Lynx Logo" />
    );
  }

  if (colorScheme === "dark") {
    return (
      <img className={classes.logo} src="/img/lynx_light.svg" alt="Lynx Logo" />
    );
  }

  return (
    <picture>
      <source
        className={classes.logo}
        srcSet="/img/lynx_light.svg"
        media="(prefers-color-scheme: dark)"
      />
      <img className={classes.logo} src="/img/lynx_dark.svg" alt="Lynx Logo" />
    </picture>
  );
};

export default LynxLogo;
