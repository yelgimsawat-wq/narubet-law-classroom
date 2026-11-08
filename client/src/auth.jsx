import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setContent(null);
    window.speechSynthesis?.cancel();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, c] = await Promise.all([api("/me"), api("/content")]);
      setUser(me);
      setContent(c);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (getToken()) load();
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [load, logout]);

  const signIn = async (path, body) => {
    const { token } = await api(path, { method: "POST", body });
    setToken(token);
    await load();
  };

  const reloadContent = async () => setContent(await api("/content"));
  const setProgress = (progress) => setUser((u) => ({ ...u, progress }));

  return (
    <AuthCtx.Provider value={{ user, setUser, content, loading, signIn, logout, setProgress, reloadContent }}>
      {children}
    </AuthCtx.Provider>
  );
}
