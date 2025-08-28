import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

function Screen({ title }: { title: string }) {
  return <div className="p-6">{title}</div>;
}

const router = createBrowserRouter([
  { path: "/", element: <Screen title="Admin Dashboard" /> },
  { path: "/events", element: <Screen title="Events CRUD" /> },
  { path: "/adverts", element: <Screen title="Adverts CRUD" /> },
  { path: "/albums", element: <Screen title="Albums & Photos" /> },
  { path: "/pages", element: <Screen title="Pages Editor" /> },
  { path: "/suggestions", element: <Screen title="Suggestions Inbox" /> },
  { path: "/people", element: <Screen title="Executives" /> },
  { path: "/settings", element: <Screen title="Settings & Admins" /> },
]);

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
