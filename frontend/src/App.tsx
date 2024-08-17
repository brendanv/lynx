import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "@/components/pages/Home";
import LinkViewer from "@/components/pages/LinkViewer";
import AuthWrapper from "@/components/AuthWrapper";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import { ThemeProvider } from "@/components/ThemeProvider";
import URLS from "@/lib/urls";

const Login = lazy(() => import("@/components/pages/Login"));
const AddLink = lazy(() => import("@/components/pages/AddLink"));
const ApiKeys = lazy(() => import("@/components/pages/ApiKeys"));
const Cookies = lazy(() => import("@/components/pages/Cookies"));

const App = () => {
  return (
    <Suspense>
      <ThemeProvider>
        <PocketBaseProvider>
          <Router>
            <Routes>
              <Route path={URLS.LOGIN} element={<Login />} />
              <Route element={<AuthWrapper />}>
                <Route path={URLS.HOME} element={<Home />} />
                <Route path={URLS.ADD_LINK} element={<AddLink />} />
                <Route
                  path={URLS.LINK_VIEWER_TEMPLATE}
                  element={<LinkViewer />}
                />
                <Route path={URLS.COOKIES} element={<Cookies />} />
                <Route path={URLS.API_KEYS} element={<ApiKeys />} />
              </Route>
            </Routes>
          </Router>
        </PocketBaseProvider>
      </ThemeProvider>
    </Suspense>
  );
};

export default App;
