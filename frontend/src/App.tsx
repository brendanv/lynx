import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AddLink from "@/components/pages/AddLink";
import ApiKeys from "@/components/pages/ApiKeys";
import Home from "@/components/pages/Home";
import Login from "@/components/pages/Login";
import LinkViewer from "@/components/pages/LinkViewer";
import Cookies from "@/components/pages/Cookies";
import AuthWrapper from "@/components/AuthWrapper";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import { ThemeProvider } from "@/components/ThemeProvider";
import URLS from "@/lib/urls";

const App = () => {
  return (
    <ThemeProvider>
      <PocketBaseProvider>
        <Router>
          <Routes>
            <Route path={URLS.LOGIN} element={<Login />} />
            <Route element={<AuthWrapper />}>
              <Route path={URLS.HOME} element={<Home />} />
              <Route path={URLS.ADD_LINK} element={<AddLink />} />
              <Route path={URLS.LINK_VIEWER_TEMPLATE} element={<LinkViewer />} />
              <Route path={URLS.COOKIES} element={<Cookies />} />
              <Route path={URLS.API_KEYS} element={<ApiKeys />} />
            </Route>
          </Routes>
        </Router>
      </PocketBaseProvider>
    </ThemeProvider>
  );
};

export default App;