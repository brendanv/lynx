import {
  useCallback,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import PocketBase from "pocketbase";
import type { AuthRecord } from "pocketbase";
import { useNavigate } from "react-router-dom";
import URLS from "@/lib/urls";

type PocketBaseContextValue = {
  pb: PocketBase;
  user: AuthRecord;
  logout: () => void;
};
const PocketBaseContext = createContext<PocketBaseContextValue | null>(null);

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL;

export const PocketBaseProvider = ({ children }: { children: any }) => {
  const [pb, _] = useState(new PocketBase(POCKETBASE_URL));
  const [user, setUser] = useState(pb.authStore.record);

  useEffect(() => {
    // Update user state when auth store changes
    const unsubscribe = pb.authStore.onChange((_, model) => {
      setUser(model);
    });

    return unsubscribe;
  }, [pb.authStore]);

  const logout = useCallback(() => pb.authStore.clear(), [pb.authStore]);

  return (
    <PocketBaseContext.Provider value={{ pb, user, logout }}>
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
