// components/Layout.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); // for mobile
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthResolved(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--mm-shell)] px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(29,78,216,0.18),_transparent_72%)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.16),_transparent_68%)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/65 bg-white/75 px-8 py-10 text-center shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-lg">
            MM
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--mm-muted)]">
            {isAuthResolved ? "Redirecting" : "Preparing workspace"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--mm-ink)]">
            M&amp;M Store Manager
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Loading the inventory workspace and syncing the latest operating data.
          </p>
          <div className="mx-auto mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-2/5 rounded-full bg-[linear-gradient(90deg,var(--mm-gold),var(--mm-blue))] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--mm-shell)] text-[var(--mm-text)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.14),_transparent_70%)] blur-3xl" />
        <div className="absolute right-[-6rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.12),_transparent_72%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),transparent_22%,transparent_78%,rgba(148,163,184,0.06))]" />
      </div>

      {/* Top NavBar */}
      <NavBar onMenuToggle={toggleNav} user={user} />

      {/* Sidebar / Nav */}
      <Nav isOpen={isNavOpen} onClose={closeNav} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 pt-20 sm:pl-24">{children}</main>
    </div>
  );
}
