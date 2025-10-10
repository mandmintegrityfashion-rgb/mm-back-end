// components/Layout.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false); // for mobile
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.push("/login");
      });
  }, [router]);

  if (!user) return null; // add spinner if desired

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top NavBar */}
      <NavBar onMenuToggle={toggleNav} user={user} />

      {/* Sidebar / Nav */}
      <Nav isOpen={isNavOpen} onClose={closeNav} />

      {/* Main Content */}
      <main className="pt-16 sm:pt-16 sm:pl-20 flex-1 bg-slate-50">{children}</main>
    </div>
  );
}
