import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faRightFromBracket,
  faBell,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useUser } from "@/lib/useUser";
import axios from "axios";

export default function NavBar({ onMenuToggle, user }) {
  const router = useRouter();
  const { logout } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getInitials = (text) =>
    text?.split(" ").map((n) => n[0]).join("").toUpperCase();

  const displayName = user?.name || user?.username || "Guest";
  const initials = getInitials(displayName) || "G";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  // ✅ Fetch new orders periodically (e.g., every 30s)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/orders/new");
        setNotifications(res.data || []);
        setUnreadCount(res.data?.length || 0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
    setUnreadCount(0); // mark all as read
  };

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
        <div className="relative">
          <button
            onClick={handleNotifClick}
            className="relative hover:scale-105 transition-transform duration-200"
          >
            <FontAwesomeIcon
              icon={faBell}
              className="w-6 h-6 text-blue-600 hover:text-blue-800 transition"
            />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 shadow-sm"></span>
            )}
          </button>

          {/* Dropdown for Notifications */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-blue-100 shadow-lg rounded-md py-2 z-50 max-h-96 overflow-y-auto">
              <h4 className="px-3 py-2 text-sm font-semibold text-blue-900 border-b">
                New Orders
              </h4>

              {notifications.length > 0 ? (
                notifications.map((order) => (
                  <button
                    key={order._id}
                    onClick={() => router.push(`/manage/orders`)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b last:border-none"
                  >
                    <p className="font-medium text-blue-800">
                      {order.customerName || "Guest"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order #{order._id.slice(-6)} •{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No new orders
                </p>
              )}
            </div>
          )}
        </div>

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

          {/* Profile Menu */}
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
