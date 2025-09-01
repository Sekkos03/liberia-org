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
    element: <ProtectedRoute />,   // <-- no BrowserRouter here
    children: [
      {
        element: <App />,          // shell layout (nav/sidebar/etc.)
        children: [
          { index: true, element: <AdminEvents /> },
          { path: "events", element: <AdminEvents /> },
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
