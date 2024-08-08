import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "@/components/pages/Home";
import Login from "@/components/pages/Login";
import AuthWrapper from "@/components/AuthWrapper";
import { PocketBaseProvider } from "@/hooks/usePocketBase";

const App = () => {
  return (
    <PocketBaseProvider>
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AuthWrapper />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </PocketBaseProvider>
  );
};

export default App;
