import { useCallback, useEffect, useState } from "react";
import { api } from "../../api.js";

export function useStudents() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    setError("");
    return api("/admin/students").then(setStudents, (e) => setError(e.message));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { students, setStudents, error, reload };
}

export const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const fmt1 = (v) => (v === null ? "–" : v.toFixed(1));
