import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/Home.page";
import URLS from "@/lib/urls";

const Login = lazy(() => import("@/pages/Login"));

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={URLS.HOME} element={<HomePage />} />
        <Route path={URLS.LOGIN} element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
