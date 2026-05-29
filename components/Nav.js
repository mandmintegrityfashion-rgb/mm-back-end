"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faList,
  faChartLine,
  faCaretRight,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Nav({ isOpen, onClose }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pathname } = router;
  const sidebarRef = useRef(null);

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
  const closeMenu = () => setOpenMenu(null);

  // ✅ Detect outside click to close submenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Show loading spinner when navigating
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const railItemClass = (isActive) =>
    `group mx-3 flex w-[calc(100%-1.5rem)] flex-col items-center justify-center rounded-[26px] border px-2 py-4 text-center transition-all duration-300 ${
      isActive
        ? "border-transparent bg-[linear-gradient(145deg,var(--mm-navy),var(--mm-blue))] text-white shadow-[0_18px_40px_rgba(29,78,216,0.28)]"
        : "border-white/75 bg-white/78 text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.05)] hover:border-slate-200 hover:bg-white hover:text-[var(--mm-navy)]"
    }`;

  const subMenuItemClass = (isActive) =>
    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[var(--mm-navy)] text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)]"
        : "text-slate-600 hover:bg-blue-50 hover:text-[var(--mm-navy)]"
    }`;

  const renderMenuItem = (href, icon, label) => (
    <li key={href}>
      <Link
        href={href}
        onClick={() => {
          closeMenu();
          onClose();
        }}
        className={railItemClass(pathname === href)}
      >
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
          {label}
        </span>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label }) => {
      const isActive = pathname === href;
      return (
        <li key={href}>
          <Link
            href={href}
            className={subMenuItemClass(isActive)}
            onClick={() => {
              closeMenu();
              onClose();
            }}
          >
            <span>{label}</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-[var(--mm-gold)]" : "bg-slate-300"
              }`}
            />
          </Link>
        </li>
      );
    });

  const isParentActive = (routes) => routes.some((r) => pathname.startsWith(r));

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef} // ✅ Reference to detect outside clicks
        className={`fixed left-0 top-20 z-20 h-[calc(100vh-5rem)] w-24 overflow-visible border-r border-white/70 bg-[rgba(248,250,252,0.74)] shadow-[10px_0_40px_rgba(15,23,42,0.07)] backdrop-blur-xl transform transition-transform duration-300 sm:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="px-3 pt-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-[0_18px_34px_rgba(29,78,216,0.2)]">
              MM
            </div>
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--mm-muted)]">
              Control
            </p>
          </div>

          <nav className="mt-6 flex-1 overflow-y-auto pb-6">
            <ul className="space-y-3">
            {renderMenuItem("/", faHome, "Home")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            {/* Manage */}
            <li className="relative">
              <button
                type="button"
                className={railItemClass(
                  isParentActive([
                    "/manage/products",
                    "/manage/categories",
                    "/manage/orders",
                  ])
                )}
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="h-5 w-5" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Manage
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 transition-transform duration-300 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <ul
                className={`absolute left-[calc(100%+0.9rem)] top-0 z-50 w-[min(16rem,calc(100vw-7rem))] rounded-[28px] border border-white/80 bg-white/92 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 ease-out ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-3 rounded-[24px] bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-4 py-3 text-sm font-semibold text-white shadow-sm">
                  Manage Section
                </div>
                <div className="space-y-1.5">
                  {renderSubMenu([
                    { href: "/manage/products", label: "Product List" },
                    { href: "/manage/categories", label: "Categories" },
                    { href: "/manage/orders", label: "Orders" },
                  ])}
                </div>
              </ul>
            </li>

            {/* Reporting */}
            <li className="relative">
              <button
                type="button"
                className={railItemClass(
                  isParentActive([
                    "/reporting/reporting",
                    "/reporting/completed-Transaction",
                  ])
                )}
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Reports
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 transition-transform duration-300 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <ul
                className={`absolute left-[calc(100%+0.9rem)] top-0 z-50 w-[min(16rem,calc(100vw-7rem))] rounded-[28px] border border-white/80 bg-white/92 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 ease-out ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-3 rounded-[24px] bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-4 py-3 text-sm font-semibold text-white shadow-sm">
                  Reports
                </div>
                <div className="space-y-1.5">
                  {renderSubMenu([
                    { href: "/reporting/reporting", label: "Reporting" },
                    {
                      href: "/reporting/completed-Transaction",
                      label: "Completed Transaction",
                    },
                  ])}
                </div>
              </ul>
            </li>

            {/* Expenses */}
            <li className="relative">
              <button
                type="button"
                className={railItemClass(
                  isParentActive([
                    "/expenses/expenses",
                    "/expenses/analysis",
                    "/expenses/tax-analysis",
                    "/expenses/tax-personal",
                  ])
                )}
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="h-5 w-5" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Expenses
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 transition-transform duration-300 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <ul
                className={`absolute left-[calc(100%+0.9rem)] top-0 z-50 w-[min(16rem,calc(100vw-7rem))] rounded-[28px] border border-white/80 bg-white/92 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 ease-out ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-3 rounded-[24px] bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-4 py-3 text-sm font-semibold text-white shadow-sm">
                  Expenses
                </div>
                <div className="space-y-1.5">
                  {renderSubMenu([
                    { href: "/expenses/expenses", label: "Expenses Entry" },
                    { href: "/expenses/analysis", label: "Expenses Analysis" },
                    { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                    {
                      href: "/expenses/tax-personal",
                      label: "Personal Tax Calculator",
                    },
                  ])}
                </div>
              </ul>
            </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm">
          <div className="rounded-[28px] border border-white/70 bg-white/78 px-8 py-7 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <div className="flex items-center gap-4 text-[var(--mm-navy)]">
              <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-[var(--mm-blue)] animate-spin"></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Navigating
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--mm-ink)]">
                  Loading workspace view
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
