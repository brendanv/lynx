import React, { createContext, useContext, useState } from "react";
import { spotlight } from "@mantine/spotlight";

export interface LynxCommandItem {
  display: string;
  onSelect: () => void;
}

export interface LynxCommandGroup {
  display: string;
  items: LynxCommandItem[];
}

interface CommandMenuContextType {
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  customCommands: LynxCommandGroup[];
  setCustomCommands: React.Dispatch<React.SetStateAction<LynxCommandGroup[]>>;
}

const CommandMenuContext = createContext<CommandMenuContextType>({
  openMenu: () => {},
  closeMenu: () => {},
  toggleMenu: () => {},
  customCommands: [],
  setCustomCommands: () => {},
});

export const CommandMenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customCommands, setCustomCommands] = useState<LynxCommandGroup[]>([]);

  return (
    <CommandMenuContext.Provider
      value={{
        openMenu: spotlight.open,
        closeMenu: spotlight.close,
        toggleMenu: spotlight.toggle,
        customCommands,
        setCustomCommands,
      }}
    >
      {children}
    </CommandMenuContext.Provider>
  );
};

export const useCommandMenu = () => {
  return useContext(CommandMenuContext);
};
