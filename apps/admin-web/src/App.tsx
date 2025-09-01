import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
// 👇 file is AdminEvent.tsx (singular)
import AdminEvents from "./pages/events/AdminEvent";
import { useAuth } from "./auth/AuthProvider";
import type { JSX } from "react";

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/events"
          element={
            <Protected>
              <AdminEvents />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/admin/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
