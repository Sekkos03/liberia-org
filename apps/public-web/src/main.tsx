import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import Events from "./pages/Events";
import Photos from "./pages/Photos";
import Album from "./pages/Album";
import Adverts from "./pages/Adverts"; // ny offentlig side for slideshow + modal
import "./index.css";
import Membership from "./pages/Membership";
import Postbox from "./pages/Postbox";

const qc = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <div>Forside</div> },
      { path: "events", element: <Events /> },
      { path: "photos", element: <Photos /> },
      { path: "photos/:slug", element: <Album /> },
      { path: "adverts", element: <Adverts /> }, // kobler til ny Adverts-side
      {path: "/forms", element: <Membership />,},
      { path: "post", element: <Postbox /> },
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
