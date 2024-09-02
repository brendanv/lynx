import URLS from "@/lib/urls";
import React from "react";
import { Link, useLocation } from "react-router-dom";

const SettingsBase: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const selectedClassName = "font-semibold text-primary";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-48 lg:w-64 flex-shrink-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              { url: URLS.SETTINGS, label: "General" },
              { url: URLS.FEEDS, label: "Feeds" },
              { url: URLS.TAGS, label: "Tags" },
              { url: URLS.COOKIES, label: "Cookies" },
              { url: URLS.API_KEYS, label: "API Keys" },
            ].map((item) => (
              <li key={item.url}>
                <Link
                  to={item.url}
                  className={
                    location.pathname === item.url ? selectedClassName : ""
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
};

export default SettingsBase;