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
    `group mx-auto flex w-[4.5rem] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition-colors duration-200 ${
      isActive
        ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
        : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const subMenuItemClass = (isActive) =>
    `flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors duration-200 ${
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
        className={railItemClass(pathname === href)}
      >
        <FontAwesomeIcon icon={icon} className="h-5 w-5 shrink-0" />
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
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

  const submenuPanelClass = (menu) =>
    `absolute left-[calc(100%+0.9rem)] top-0 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.1)] transition-all duration-200 ${
      openMenu === menu
        ? "translate-x-0 opacity-100"
        : "translate-x-4 opacity-0 pointer-events-none"
    }`;

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
        className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-24 overflow-visible border-r border-slate-200 bg-white shadow-sm transform transition-transform duration-300 sm:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col px-3 py-5">
          <nav className="flex-1 overflow-visible">
            <ul className="space-y-3">
            {renderMenuItem("/", faHome, "Home")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            <li className="relative">
              <button
                type="button"
                aria-expanded={openMenu === "manage"}
                aria-controls="manage-submenu"
                className={railItemClass(isManageActive || openMenu === "manage")}
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="h-5 w-5 shrink-0" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Manage
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="manage-submenu"
                className={submenuPanelClass("manage")}
              >
                <div className="mb-3 border-b border-slate-100 px-2 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Manage
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Products, categories, and order operations.
                  </p>
                </div>
                <ul className="space-y-1">
                  {renderSubMenu([
                    { href: "/manage/products", label: "Products" },
                    { href: "/manage/categories", label: "Categories" },
                    { href: "/manage/orders", label: "Orders" },
                  ])}
                </ul>
              </div>
            </li>

            <li className="relative">
              <button
                type="button"
                aria-expanded={openMenu === "reporting"}
                aria-controls="reporting-submenu"
                className={railItemClass(isReportingActive || openMenu === "reporting")}
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 shrink-0" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Reports
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="reporting-submenu"
                className={submenuPanelClass("reporting")}
              >
                <div className="mb-3 border-b border-slate-100 px-2 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Reporting
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Performance insights and completed transactions.
                  </p>
                </div>
                <ul className="space-y-1">
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

            <li className="relative">
              <button
                type="button"
                aria-expanded={openMenu === "expenses"}
                aria-controls="expenses-submenu"
                className={railItemClass(isExpensesActive || openMenu === "expenses")}
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="h-5 w-5 shrink-0" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Expenses
                </span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`mt-2 h-3 w-3 shrink-0 transition-transform duration-200 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div
                id="expenses-submenu"
                className={submenuPanelClass("expenses")}
              >
                <div className="mb-3 border-b border-slate-100 px-2 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Expenses
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Entries, analysis, and tax tools.
                  </p>
                </div>
                <ul className="space-y-1">
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
