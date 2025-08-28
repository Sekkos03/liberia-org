import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/forms", element: <div>Forms (Google Form embed later)</div> },
  { path: "/events", element: <div>Events page</div> },
  { path: "/adverts", element: <div>Adverts carousel</div> },
  { path: "/photos", element: <div>Photo albums</div> },
  { path: "/post", element: <div>Suggestions / Postbox</div> },
  { path: "/about", element: <div>About us</div> },
  { path: "/contact", element: <div>Contact widget</div> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
