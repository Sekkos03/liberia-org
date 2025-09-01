import { Outlet, Link, NavLink } from "react-router-dom";
// 👇 file is AdminEvent.tsx (singular)

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b px-4 py-3 flex items-center gap-6">
        <Link to="/" className="font-semibold">Admin</Link>
        <nav className="flex gap-4">
          <NavLink to="/events">Events</NavLink>
          {/* add more links */}
        </nav>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}