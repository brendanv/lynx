import { useRequireAuth } from "@/hooks/usePocketBase";
import { Outlet, Navigate } from "react-router-dom";
import { CommandMenuProvider } from "@/lib/CommandMenuContext";
import CommandMenu from "@/components/CommandMenu";

// This component is a simple wrapper for all Lynx pages that
// require authentication. It does two things:
// 1. It checks if the user is authenticated.
//    If not, it redirects them to the login page.
// 2. It wraps the page in a CommandMenuContext so that any
//    subcomponent can open/close the menu.
const LynxLoggedInPage = () => {
  const user = useRequireAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CommandMenuProvider>
      <Outlet />
      <CommandMenu />
    </CommandMenuProvider>
  );
};

export default LynxLoggedInPage;
