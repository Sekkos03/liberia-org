import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import Membership from "./pages/Membership";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Adverts from "./pages/Adverts";
import Contact from "./pages/Contact";
import EventsCalendar from "./pages/EventsCalendar";
import AboutUs from "./pages/AboutUs";
import Constitution from "./pages/Constitution";
import WhatsAppGuidelines from "./pages/WhatsAppGuidelines";
import Albums from "./pages/Albums";
import AlbumDetail from "./pages/AlbumDetail";
import Donate from "./pages/Donate";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/calendar" element={<EventsCalendar />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/adverts" element={<Adverts />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/post" element={<Contact />} />
        <Route path="/postbox" element={<Contact />} />
        <Route path="/about" element={<AboutUs/>} />
        <Route path="/about/whatsapp-guidelines" element={<WhatsAppGuidelines />} />
        <Route path="/about/constitution" element={<Constitution />} />
        <Route path="/albums/:slug" element={<AlbumDetail />} />
        <Route path="/donate" element={<Donate />} />
      </Routes>
    </QueryClientProvider>
  );
}