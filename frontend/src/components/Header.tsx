import React, { useCallback } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import URLS from "@/lib/urls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  CirclePlus,
} from "lucide-react";

const Header = () => {
  const { pb, user } = usePocketBase();
  const navigate = useNavigate();
  const handleLogout = useCallback(() => {
    pb.authStore.clear();
    navigate(URLS.LOGIN);
  }, [pb.authStore]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-opacity-80 backdrop-blur-sm shadow-md z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to={URLS.HOME} className="text-xl font-bold text-foreground">
              Lynx
            </Link>
          </div>
          <div className="flex items-center space-x-1 justify-end md:flex-1 lg:w-0">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Links</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            to={URLS.ADD_LINK}
                          >
                            <CirclePlus className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Add Link
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Save article content to read later
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href={URLS.FEEDS} title="Feeds">
                        Manage RSS feed subscriptions
                      </ListItem>
                      <ListItem href={URLS.NOTES} title="Notes">
                        Browse your saved highlights
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Avatar>
                      <AvatarImage src={user && user.avatar} />
                      <AvatarFallback>
                        {user && user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      <ListItem href={URLS.PROFILE} title="Profile">Manage your profile and change your Lynx settings</ListItem>
                      <ListItem href={URLS.COOKIES} title="Cookies">Save logins from your favorite sites</ListItem>
                      <ListItem href={URLS.TAGS} title="Tags">Organize and manage your tags</ListItem>
                      <ListItem href={URLS.IMPORT} title="Import">Import links from other services</ListItem>
                      <ListItem onClick= {handleLogout} title="Logout">Logout</ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={props.href || ""}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});

export default Header;
