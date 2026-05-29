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
    `flex flex-col items-center justify-center rounded-md px-2 py-4 text-center text-xs transition-colors duration-200 ${
      isActive
        ? "bg-blue-600 font-semibold text-white shadow-sm"
        : "text-blue-800 hover:bg-blue-50 hover:text-blue-600"
    }`;

  const subMenuItemClass = (isActive) =>
    `flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-blue-800 hover:bg-blue-50 hover:text-blue-600"
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
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
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
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-blue-600" : "bg-slate-300"}`} />
          </Link>
        </li>
      );
    });

  const isParentActive = (routes) => routes.some((r) => pathname.startsWith(r));

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 sm:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef} // ✅ Reference to detect outside clicks
        className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-20 overflow-visible border-r border-blue-100 bg-white shadow-sm transform transition-transform duration-300 sm:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          <nav className="mt-4 flex-1 overflow-visible pb-6 pt-2">
            <ul className="space-y-4 px-2">
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
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
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
                className={`absolute left-full top-0 z-50 ml-3 w-52 rounded-md border border-blue-100 bg-white p-2 shadow-md transition-all duration-200 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-2 border-b border-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
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
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
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
                className={`absolute left-full top-0 z-50 ml-3 w-52 rounded-md border border-blue-100 bg-white p-2 shadow-md transition-all duration-200 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-2 border-b border-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
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
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
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
                className={`absolute left-full top-0 z-50 ml-3 w-52 rounded-md border border-blue-100 bg-white p-2 shadow-md transition-all duration-200 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0 pointer-events-none"
                }`}
              >
                <div className="mb-2 border-b border-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-16 w-16 rounded-full border-4 border-white border-t-blue-500 animate-spin"></div>
        </div>
      )}
    </>
  );
}
