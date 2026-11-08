import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./auth.jsx";
import { PageSkeleton, ShellSkeleton } from "./ui.jsx";
import Layout from "./Layout.jsx";
import AuthPage from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Diagnostic from "./pages/Diagnostic.jsx";
import Unit from "./pages/Unit.jsx";
import Search from "./pages/Search.jsx";
import Documents from "./pages/Documents.jsx";
import Report from "./pages/Report.jsx";
import Terms from "./pages/Terms.jsx";
// Backoffice is teacher-only: keep it out of the bundle students download.
const Overview = lazy(() => import("./pages/teacher/Overview.jsx"));
const Students = lazy(() => import("./pages/teacher/Students.jsx"));
const QuestionBank = lazy(() => import("./pages/teacher/QuestionBank.jsx"));
const ContentEditor = lazy(() => import("./pages/teacher/ContentEditor.jsx"));

function Protected({ teacher, children }) {
  const { user, loading } = useAuth();
  if (loading) return teacher ? null : <ShellSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (teacher && user.role !== "teacher") return <Navigate to="/" replace />;
  return teacher ? <Suspense fallback={<PageSkeleton stats rows={5} />}>{children}</Suspense> : children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <ShellSkeleton />;
  if (user) return <Navigate to={user.role === "teacher" ? "/teacher" : "/"} replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="diagnostic" element={<Diagnostic />} />
        <Route path="units/:id/:tab?" element={<Unit />} />
        <Route path="search" element={<Search />} />
        <Route path="documents" element={<Documents />} />
        <Route path="report" element={<Report />} />
        <Route path="terms" element={<Terms />} />
        <Route path="teacher" element={<Protected teacher><Overview /></Protected>} />
        <Route path="teacher/students" element={<Protected teacher><Students /></Protected>} />
        <Route path="teacher/questions" element={<Protected teacher><QuestionBank /></Protected>} />
        <Route path="teacher/content" element={<Protected teacher><ContentEditor /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
