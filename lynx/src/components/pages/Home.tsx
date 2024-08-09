import React from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { DarkModeToggle } from "../DarkModeToggle";
import Header from "@/components/Header";

const Home = () => {
  const { user } = usePocketBase();

  return (
    <>
      <Header />
      <main className="container mx-auto px-4">
        {user && <p>Welcome, {user.username || user.email}!</p>}
        this is some content
        <DarkModeToggle />
      </main>
    </>
  );
};

export default Home;
