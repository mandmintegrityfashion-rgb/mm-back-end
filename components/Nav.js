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

  const navItemClass = (isActive) =>
    `flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const subMenuItemClass = (isActive) =>
    `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
      isActive
        ? "bg-blue-50 font-semibold text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const renderMenuItem = (href, icon, label) => (
    <li key={href}>
      <Link
        href={href}
        onClick={() => {
          closeMenu();
          onClose();
        }}
        className={navItemClass(pathname === href)}
      >
        <FontAwesomeIcon icon={icon} className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
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
  const isManageActive = isParentActive([
    "/manage/products",
    "/manage/categories",
    "/manage/orders",
  ]);
  const isReportingActive = isParentActive([
    "/reporting/reporting",
    "/reporting/completed-Transaction",
  ]);
  const isExpensesActive = isParentActive([
    "/expenses/expenses",
    "/expenses/analysis",
    "/expenses/tax-analysis",
    "/expenses/tax-personal",
  ]);

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
        className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-72 border-r border-slate-200 bg-white shadow-sm transform transition-transform duration-300 sm:w-64 sm:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Navigation
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Move between inventory, reporting, and operating tools.
            </p>
          </div>

          <nav className="mt-5 flex-1">
            <ul className="space-y-2">
            {renderMenuItem("/", faHome, "Home Dashboard")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            <li>
              <button
                type="button"
                aria-expanded={openMenu === "manage"}
                aria-controls="manage-submenu"
                className={navItemClass(isManageActive || openMenu === "manage")}
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Manage</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="manage-submenu"
                className={`overflow-hidden transition-all duration-200 ${
                  openMenu === "manage" ? "max-h-64 pt-2" : "max-h-0"
                }`}
              >
                <ul className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {renderSubMenu([
                    { href: "/manage/products", label: "Products" },
                    { href: "/manage/categories", label: "Categories" },
                    { href: "/manage/orders", label: "Orders" },
                  ])}
                </ul>
              </div>
            </li>

            <li>
              <button
                type="button"
                aria-expanded={openMenu === "reporting"}
                aria-controls="reporting-submenu"
                className={navItemClass(isReportingActive || openMenu === "reporting")}
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Reporting</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="reporting-submenu"
                className={`overflow-hidden transition-all duration-200 ${
                  openMenu === "reporting" ? "max-h-52 pt-2" : "max-h-0"
                }`}
              >
                <ul className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {renderSubMenu([
                    { href: "/reporting/reporting", label: "Reporting" },
                    {
                      href: "/reporting/completed-Transaction",
                      label: "Completed Transactions",
                    },
                  ])}
                </ul>
              </div>
            </li>

            <li>
              <button
                type="button"
                aria-expanded={openMenu === "expenses"}
                aria-controls="expenses-submenu"
                className={navItemClass(isExpensesActive || openMenu === "expenses")}
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Expenses</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="expenses-submenu"
                className={`overflow-hidden transition-all duration-200 ${
                  openMenu === "expenses" ? "max-h-80 pt-2" : "max-h-0"
                }`}
              >
                <ul className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {renderSubMenu([
                    { href: "/expenses/expenses", label: "Expenses Entry" },
                    { href: "/expenses/analysis", label: "Expenses Analysis" },
                    { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                    {
                      href: "/expenses/tax-personal",
                      label: "Personal Tax Calculator",
                    },
                  ])}
                </ul>
              </div>
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
