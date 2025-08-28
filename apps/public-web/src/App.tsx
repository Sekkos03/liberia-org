import { Link } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-[#162957] text-white">
        <nav className="mx-auto max-w-5xl flex items-center gap-6 py-3">
          <Link to="/">Home</Link>
          <Link to="/forms">Forms</Link>
          <Link to="/events">Events</Link>
          <Link to="/adverts">Adverts</Link>
          <Link to="/photos">Photos</Link>
          <Link to="/post">Post</Link>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl py-24 text-center">
        <h1 className="text-5xl font-bold">Liberian Organization</h1>
        <p className="mt-3 text-lg">In union with Norway</p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link className="rounded-md bg-[#162957] px-4 py-2 text-white" to="/forms">Join our community</Link>
          <Link className="rounded-md border border-[#162957] px-4 py-2" to="/about">Learn more</Link>
        </div>
      </main>

      <footer className="bg-[#162957] py-6 text-center text-white">
        Copyright © 2025 Liberia organization Oslo Norway | Webdesign by Sekou Kosiah
      </footer>
    </div>
  );
}
