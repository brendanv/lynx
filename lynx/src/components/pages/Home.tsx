import React from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { DarkModeToggle } from "../DarkModeToggle";

const Home = () => {
  const { user } = usePocketBase();

  return (
    <div>
      <h1>Lynx</h1>
      <DarkModeToggle />
      {user && <p>Welcome, {user.username || user.email}!</p>}
    </div>
  );
};

export default Home;
