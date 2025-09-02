// public-web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import Events from "./pages/Events";
import Photos from "./pages/Photos";
import Album from "./pages/Album";
import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <div>Forside</div> },
      { path: "events", element: <Events /> },
      { path: "forms", element: <div>Google Forms (coming)</div> },
      { path: "adverts", element: <div>Annonser</div> },
      { path: "photos", element: <Photos /> },
      { path: "photos/:slug", element: <Album /> },
      { path: "post", element: <div>Forslagskasse</div> },
      { path: "about", element: <div>Om oss</div> },
      { path: "contact", element: <div>Kontakt</div> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
