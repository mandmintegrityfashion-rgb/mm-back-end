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

    const redirectToLogin = async () => {
      if (!isMounted || router.pathname === "/login") {
        return;
      }

      try {
        await router.replace("/login");
      } catch (error) {
        window.location.replace("/login");
      }
    };

    fetch("/api/auth/me")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to resolve session");
        }

        return data;
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        if (data.user) {
          setUser(data.user);
        } else {
          redirectToLogin();
        }
      })
      .catch(() => {
        redirectToLogin();
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-blue-100 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[var(--mm-blue)] text-sm font-semibold uppercase tracking-[0.24em] text-white">
            MM
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {isAuthResolved ? "Redirecting" : "Preparing workspace"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--mm-ink)]">
            M&amp;M Store Manager
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Loading the inventory workspace and syncing the latest operating data.
          </p>
          <div className="mx-auto mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-2/5 rounded-full bg-[var(--mm-blue)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-[var(--mm-text)]">
      {/* Top NavBar */}
      <NavBar onMenuToggle={toggleNav} user={user} />

      {/* Sidebar / Nav */}
      <Nav isOpen={isNavOpen} onClose={closeNav} />

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 pt-16 sm:pl-24">{children}</main>
    </div>
  );
}
