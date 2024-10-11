import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import URLS from "@/lib/urls";
import LynxLoggedInPage from "@/pages/LynxLoggedInPage";
import LinkViewer from "@/pages/LinkViewer";

const Login = lazy(() => import("@/pages/Login"));
const Settings = lazy(() => import("@/pages/Settings"))
const AddLink = lazy(() => import("@/pages/AddLink"))

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={URLS.LOGIN} element={<Login />} />
        <Route element={<LynxLoggedInPage />}>
          <Route path={URLS.HOME} element={<HomePage />} />
          <Route path={URLS.LINK_VIEWER_TEMPLATE} element={<LinkViewer />} />
          <Route path={URLS.SETTINGS_TEMPLATE} element={<Settings />} />
          <Route path={URLS.ADD_LINK} element={<AddLink />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
