import { useRequireAuth } from "@/hooks/usePocketBase";
import { Outlet, Navigate } from "react-router-dom";
import { CommandMenuProvider } from "@/lib/CommandMenuContext";
import CommandMenu from "@/components/CommandMenu";
import React from "react";

// This component is a simple wrapper for all Lynx pages that
// require authentication. It does two things:
// 1. It checks if the user is authenticated.
//    If not, it redirects them to the login page.
// 2. It wraps the page in a CommandMenuContext so that any
//    subcomponent can open/close the menu.
export const AuthOnly = ({ children }: { children: React.ReactNode }) => {
  const user = useRequireAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const LynxLoggedInPage = () => {
  return (
    <AuthOnly>
      <CommandMenuProvider>
        <Outlet />
        <CommandMenu />
      </CommandMenuProvider>
    </AuthOnly>
  );
};

export default LynxLoggedInPage;
