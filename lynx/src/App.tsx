import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "@/components/pages/Home";
import Login from "@/components/pages/Login";
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
            </Route>
          </Routes>
        </Router>
      </PocketBaseProvider>
    </ThemeProvider>
  );
};

export default App;
