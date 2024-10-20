import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import URLS from "@/lib/urls";
import LynxLoggedInPage from "@/pages/LynxLoggedInPage";
import LinkViewer from "@/pages/LinkViewer";

const Login = lazy(() => import("@/pages/Login"));
const Settings = lazy(() => import("@/pages/Settings"));
const AddLink = lazy(() => import("@/pages/AddLink"));
const FeedItems = lazy(() => import("@/pages/FeedItems"));
const EditLink = lazy(() => import("@/pages/EditLink"));
const ArchiveViewer = lazy(() => import("@/pages/ArchiveViewer"));
const Highlights = lazy(() => import("@/pages/Highlights"));

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
          <Route path={URLS.FEED_ITEMS_TEMPLATE} element={<FeedItems />} />
          <Route path={URLS.EDIT_LINK_TEMPLATE} element={<EditLink />} />
          <Route path={URLS.HIGHLIGHTS} element={<Highlights />} />
          <Route
            path={URLS.LINK_ARCHIVE_TEMPLATE}
            element={<ArchiveViewer />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
