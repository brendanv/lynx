import URLS from "@/lib/urls";
import React from "react";
import { Link, useLocation } from "react-router-dom";

const SettingsBase: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const selectedClassName = "font-semibold text-primary";

  return (
    <>
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <nav
          className="grid gap-4 text-sm text-muted-foreground"
          x-chunk="dashboard-04-chunk-0"
        >
          <Link
            to={URLS.SETTINGS}
            className={
              location.pathname === URLS.SETTINGS ? selectedClassName : ""
            }
          >
            General
          </Link>
          <Link
            to={URLS.FEEDS}
            className={
              location.pathname === URLS.FEEDS ? selectedClassName : ""
            }
          >
            Feeds
          </Link>
          <Link
            to={URLS.TAGS}
            className={
              location.pathname === URLS.TAGS ? selectedClassName : ""
            }
          >
            Tags
          </Link>
          <Link
            to={URLS.COOKIES}
            className={
              location.pathname === URLS.COOKIES ? selectedClassName : ""
            }
          >
            Cookies
          </Link>
          <Link
            to={URLS.API_KEYS}
            className={
              location.pathname === URLS.API_KEYS ? selectedClassName : ""
            }
          >
            API Keys
          </Link>
        </nav>
        <div className="grid gap-6">{children}</div>
      </div>
    </>
  );
};

export default SettingsBase;
