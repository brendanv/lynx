import { useState, useEffect, createContext, useContext } from "react";
import PocketBase from "pocketbase";
import type { AuthModel } from "pocketbase";
import { useNavigate } from "react-router-dom";
import URLS from "@/lib/urls";

type PocketBaseContextValue = {
  pb: PocketBase;
  user: AuthModel;
};
const PocketBaseContext = createContext<PocketBaseContextValue | null>(null);

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL;

export const PocketBaseProvider = ({ children }) => {
  const [pb, setPb] = useState(new PocketBase(POCKETBASE_URL))
  const [user, setUser] = useState(pb.authStore.model);

  useEffect(() => {
    // Update user state when auth store changes
    const unsubscribe = pb.authStore.onChange((_, model) => {
      setUser(model);
    });

    return unsubscribe;
  }, [pb.authStore]);

  return (
    <PocketBaseContext.Provider value={{ pb, user }}>
      {children}
    </PocketBaseContext.Provider>
  );
};

export const usePocketBase = () => {
  const context = useContext(PocketBaseContext);
  if (context === null) {
    throw new Error("usePocketBase must be used within a PocketBaseProvider");
  }
  return context;
};

export const useRequireAuth = () => {
  const { pb, user } = usePocketBase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate(URLS.LOGIN);
    }
  }, [pb.authStore.isValid, navigate]);

  return user;
};
