import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import type { LynxCommandGroup } from "@/lib/CommandMenuContext";
import URLS from "@/lib/urls";
import { useAllUserTagsWithoutMetadata } from "@/hooks/useAllUserTags";
import {
  CirclePlus,
  Cookie,
  House,
  KeyRound,
  Rss,
  Search,
  Settings,
  Tag,
} from "lucide-react";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customCommands?: LynxCommandGroup[];
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  open,
  onOpenChange,
  customCommands,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const {
    tags,
    loading: tagsLoading,
    error: tagsError,
  } = useAllUserTagsWithoutMetadata();
  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };
  const navigateHome = useCallback(
    () => runCommand(() => navigate(URLS.HOME)),
    [navigate],
  );
  const navigateSettings = useCallback(
    () => runCommand(() => navigate(URLS.SETTINGS)),
    [navigate],
  );
  const navigateFeeds = useCallback(
    () => runCommand(() => navigate(URLS.FEEDS)),
    [navigate],
  );
  const navigateCookies = useCallback(
    () => runCommand(() => navigate(URLS.COOKIES)),
    [navigate],
  );
  const navigateApiKeys = useCallback(
    () => runCommand(() => navigate(URLS.API_KEYS)),
    [navigate],
  );
  const navigateAddLink = useCallback(
    () => runCommand(() => navigate(URLS.ADD_LINK)),
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command or search..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {(customCommands || []).map((group) => (
          <CommandGroup key={group.display} heading={group.display}>
            {group.items.map((item) => (
              <CommandItem
                onSelect={item.onSelect}
                key={group.display + item.display}
              />
            ))}
          </CommandGroup>
        ))}
        <CommandGroup heading="Pages">
          <CommandItem onSelect={navigateHome}>
            <House className="mr-2 h-4 w-4" /> Home
          </CommandItem>
          <CommandItem onSelect={navigateSettings}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
          <CommandItem onSelect={navigateApiKeys}>
            <KeyRound className="mr-2 h-4 w-4" /> API Keys
          </CommandItem>
          <CommandItem onSelect={navigateCookies}>
            <Cookie className="mr-2 h-4 w-4" /> Cookies
          </CommandItem>
          <CommandItem onSelect={navigateFeeds}>
            <Rss className="mr-2 h-4 w-4" /> Feeds
          </CommandItem>
          <CommandItem onSelect={navigateAddLink}>
            <CirclePlus className="mr-2 h-4 w-4" /> Add Link
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="View Tagged Links">
          {tagsLoading ? (
            <CommandItem>Loading...</CommandItem>
          ) : tagsError ? (
            <CommandItem>Error: {tagsError}</CommandItem>
          ) : (
            tags.map((tag) => (
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate(URLS.HOME_WITH_TAGS_SEARCH(tag.id)))
                }
                key={tag.id}
              >
                <Tag className="mr-2 h-4 w-4" /> {tag.name}
              </CommandItem>
            ))
          )}
        </CommandGroup>
        {search !== "" && (
          <CommandGroup heading="Search">
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate(URLS.HOME_WITH_SEARCH_STRING(search)))
              }
            >
              <Search className="mr-2 h-4 w-4" /> Search for "{search}"
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandMenu;
