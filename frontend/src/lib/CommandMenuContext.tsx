import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

export interface LynxCommandItem {
  display: string;
  onSelect: () => void;
}

export interface LynxCommandGroup {
  display: string;
  items: LynxCommandItem[];
}

interface CommandMenuContextType {
  isOpen: boolean;
  setCommandMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customCommands: LynxCommandGroup[];
  setCustomCommands: React.Dispatch<React.SetStateAction<LynxCommandGroup[]>>;
}

const CommandMenuContext = createContext<CommandMenuContextType>({
  isOpen: false,
  setCommandMenuOpen: () => {},
  customCommands: [],
  setCustomCommands: () => {},
});

export const CommandMenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customCommands, setCustomCommands] = useState<LynxCommandGroup[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandMenuContext.Provider
      value={{
        isOpen,
        setCommandMenuOpen: setIsOpen,
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
