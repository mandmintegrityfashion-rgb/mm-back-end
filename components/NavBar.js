// components/NavBar.js
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faRightFromBracket,
  faBell,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useUser } from "@/lib/useUser";

export default function NavBar({ onMenuToggle, user }) {
  const router = useRouter();
  const { logout } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (text) =>
    text?.split(" ").map((n) => n[0]).join("").toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const displayName = user?.name || user?.username || "Guest";
  const initials = getInitials(displayName) || "G";

  return (
    <div className="fixed top-0 w-full z-50 flex justify-between items-center py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-50 via-white to-blue-100 shadow-sm border-b border-blue-200 backdrop-blur-md">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="sm:hidden focus:outline-none"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={faBars} className="w-6 h-6 text-blue-700" />
        </button>
        <FontAwesomeIcon
          icon={faStore}
          className="w-6 h-6 text-blue-700 drop-shadow-sm"
        />
        <h2 className="text-blue-900 text-lg sm:text-xl font-semibold tracking-wide">
          M&M Store Manager
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-2 sm:space-x-6">
        {/* Notifications */}
        <button className="relative hover:scale-105 transition-transform duration-200">
          <FontAwesomeIcon
            icon={faBell}
            className="w-6 h-6 text-blue-600 hover:text-blue-800 transition"
          />
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 shadow-sm"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-blue-200 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-md text-lg font-semibold">
                {initials}
              </div>
            )}
            <span className="hidden sm:block text-sm text-blue-900 font-semibold">
              {displayName}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-blue-100 shadow-lg rounded-md py-2 z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-800 hover:bg-blue-50 transition"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
