import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import URLS from "@/lib/urls";
import LynxLoggedInPage from "@/pages/LynxLoggedInPage";

const Login = lazy(() => import("@/pages/Login"));

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={URLS.LOGIN} element={<Login />} />
        <Route element={<LynxLoggedInPage />}>
          <Route path={URLS.HOME} element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
