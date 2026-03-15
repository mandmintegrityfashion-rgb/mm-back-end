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

  const baseLink =
    "px-2 py-4 text-blue-800 transition-all duration-300 flex items-center justify-center flex-col text-xs cursor-pointer hover:text-blue-600 hover:bg-blue-50";
  const activeLink =
    "px-2 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md flex items-center justify-center flex-col text-xs";

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={onClose}>
        <div className="flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-6 h-6 mb-1" />
          <span className="text-xs">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items, parentKey) =>
    items.map(({ href, label }) => {
      const isActive = pathname === href;
      return (
        <li
          key={href}
          className={`h-[6%] flex items-center px-4 border-b border-blue-100 transition-colors cursor-pointer ${
            isActive
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-blue-800 hover:bg-blue-50 hover:text-blue-600"
          }`}
          onClick={() => {
            closeMenu();
            onClose();
          }}
        >
          <Link href={href} className="w-full h-full flex items-center">
            {label}
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
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-blue-100 shadow-sm z-20 transform transition-transform duration-300 sm:translate-x-0 w-20 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <nav className="mt-8">
          <ul className="space-y-4">
            {renderMenuItem("/", faHome, "Home")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            {/* Manage */}
            <li
              className={
                isParentActive([
                  "/manage/products",
                  "/manage/categories",
                  "/manage/orders",
                ])
                  ? activeLink
                  : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="w-6 h-6 mb-1" />
                <span className="text-xs">Manage</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </div>

              <ul
                className={`absolute left-full pt-10 top-0 w-52 bg-white border border-blue-100 h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                <div className="text-blue-700 font-semibold px-4 py-3 border-b border-blue-200 bg-blue-50">
                  Manage Section
                </div>
                {renderSubMenu(
                  [
                    { href: "/manage/products", label: "Product List" },
                    { href: "/manage/categories", label: "Categories" },
                    { href: "/manage/orders", label: "Orders" },
                  ],
                  "manage"
                )}
              </ul>
            </li>

            {/* Reporting */}
            <li
              className={
                isParentActive([
                  "/reporting/reporting",
                  "/reporting/completed-Transaction",
                ])
                  ? activeLink
                  : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 mb-1" />
                <span className="text-xs">Reports</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </div>

              <ul
                className={`absolute left-full pt-10 top-0 w-52 bg-white border border-blue-100 h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                <div className="text-blue-700 font-semibold px-4 py-3 border-b border-blue-200 bg-blue-50">
                  Reports
                </div>
                {renderSubMenu(
                  [
                    { href: "/reporting/reporting", label: "Reporting" },
                    {
                      href: "/reporting/completed-Transaction",
                      label: "Completed Transaction",
                    },
                  ],
                  "reporting"
                )}
              </ul>
            </li>

            {/* Expenses */}
            <li
              className={
                isParentActive([
                  "/expenses/expenses",
                  "/expenses/analysis",
                  "/expenses/tax-analysis",
                  "/expenses/tax-personal",
                ])
                  ? activeLink
                  : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="w-6 h-6 mb-1" />
                <span className="text-xs">Expenses</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </div>

              <ul
                className={`absolute left-full pt-10 top-0 w-52 bg-white border border-blue-100 h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                <div className="text-blue-700 font-semibold px-4 py-3 border-b border-blue-200 bg-blue-50">
                  Expenses
                </div>
                {renderSubMenu(
                  [
                    { href: "/expenses/expenses", label: "Expenses Entry" },
                    { href: "/expenses/analysis", label: "Expenses Analysis" },
                    { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                    {
                      href: "/expenses/tax-personal",
                      label: "Personal Tax Calculator",
                    },
                  ],
                  "expenses"
                )}
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
