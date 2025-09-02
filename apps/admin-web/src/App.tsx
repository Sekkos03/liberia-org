// admin-web/src/App.tsx
import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <nav className="flex gap-6 text-indigo-400 mb-4">
        <Link to="/">Admin</Link>
        <Link to="/events">Events</Link>
        <Link to="/albums">Albums</Link>
      </nav>
      <hr className="border-white/10 mb-6" />
      <Outlet />
    </div>
  );
}
