// admin-web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import App from "./App";
import Login from "./pages/Login";
import AdminEvents from "./pages/events/AdminEvents";
import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <div>Admin dashboard</div> },
          { path: "events", element: <AdminEvents /> },
          { path: "albums", element: <div>Albums & Photos (kommer)</div> },
          { path: "adverts", element: <div>Adverts (kommer)</div> },
          { path: "pages", element: <div>Pages (kommer)</div> },
          { path: "suggestions", element: <div>Inbox (kommer)</div> },
          { path: "people", element: <div>Executives (kommer)</div> },
          { path: "settings", element: <div>Settings (kommer)</div> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
