import React from "react";
import {
  BackgroundImage as MantineBackgroundImage
} from "@mantine/core";
import classes from "./LinkCard.module.css";

interface Props {
  imgSrc: string | null;
  linkId: string;
  children: React.ReactNode;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateHSLColor = (baseSeed: string) => {
  const seed = hashString(baseSeed);
  const h = Math.floor(seededRandom(seed) * 360);
  const s = Math.floor(seededRandom(seed + 1) * 30 + 70); // 70-100%
  const l = Math.floor(seededRandom(seed + 2) * 30 + 35); // 35-65%
  return `hsla(${h}, ${s}%, ${l}%, 0.8)`;
};

const generateGradient = (seed: string) => {
  const color1 = generateHSLColor(seed + '1');
  const color2 = generateHSLColor(seed + '2');
  const angle = Math.floor(seededRandom(hashString(seed + '3')) * 360);
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
};

const BackgroundImage = ({ imgSrc, linkId, children }: Props) => {
  if (imgSrc) {
    return (
      <MantineBackgroundImage
        className={classes.headerImage}
        src={imgSrc}
      >
        {children}
      </MantineBackgroundImage>
    );
  } else {
    return (
      <div className={classes.headerImage} style={{
        background: generateGradient(linkId),
      }}>
        {children}
      </div>
    );
  }
};

export default BackgroundImage;