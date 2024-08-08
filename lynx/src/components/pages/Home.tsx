import React from "react";
import { usePocketBase } from "@/hooks/usePocketBase";

const Home = () => {
  const { user } = usePocketBase();

  return (
    <div>
      <h1>Lynx</h1>
      {user && <p>Welcome, {user.username || user.email}!</p>}
    </div>
  );
};

export default Home;
