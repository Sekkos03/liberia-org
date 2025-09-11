import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";

import App from "./App";
import Login from "./pages/Login";

// Admin-sider
import AdminEvents from "./pages/events/AdminEvents";
import AdminAlbums from "./pages/albums/AdminAlbums";   // justér sti hvis filen ligger et annet sted
import AdminAdverts from "./pages/adverts/AdminAdverts"; // justér sti hvis filen ligger et annet sted

import "./index.css";
import AdminMembership from "./pages/membership/AdminMembership";
import AdminSuggestions from "./pages/suggestions/AdminSuggestions";
import AdminAlbumDetail from "./pages/admin/AdminAlbumDetail";

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
          { index: true, element: <Navigate to="/" replace /> },
          { path: "events", element: <AdminEvents /> },
          { path: "albums", element: <AdminAlbums /> },
          { path: "adverts", element: <AdminAdverts /> },
          {path: "membership", element: <AdminMembership />},
          {path: "suggestions", element: <AdminSuggestions />},
          {path: "/admin/albums/:id", element: <AdminAlbumDetail />}


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
