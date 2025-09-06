import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import Membership from "./pages/Membership";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Adverts from "./pages/Adverts";
import Photos from "./pages/Photos";
import Album from "./pages/Album";
import Postbox from "./pages/Postbox";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/adverts" element={<Adverts />} />
        <Route path="/photos" element={<Album />} />
        <Route path="/post" element={<Postbox />} />
        <Route path="/about" element={<div />} />
        <Route path="/contact" element={<div />} />
      </Routes>
    </QueryClientProvider>
  );
}
