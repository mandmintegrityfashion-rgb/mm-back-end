import React, { useState, useEffect } from "react";
import Image from "next/image";
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
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-blue-100 bg-white shadow-sm">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md text-blue-700 sm:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <FontAwesomeIcon icon={faStore} className="h-5 w-5" />
          </div>

          <h2 className="truncate text-lg font-semibold text-blue-900 sm:text-xl">
            M&amp;M Store Manager
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700 transition hover:bg-blue-50"
            >
              <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[1.35rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-blue-100 bg-white py-2 shadow-lg">
                <h4 className="border-b border-blue-100 px-4 py-3 text-sm font-semibold text-blue-900">
                  New Orders
                </h4>
                {notifications.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push(`/manage/orders`);
                        }}
                        className="w-full border-b border-blue-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50 last:border-b-0"
                      >
                        <p className="font-semibold text-blue-800">
                          {order.customerName || "Guest"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Order #{order._id.slice(-6)} •{" "}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm text-slate-500">
                    No new orders
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full border border-blue-100 bg-white py-1 pl-1 pr-3 shadow-sm"
            >
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-9 w-9 rounded-full border border-blue-100 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {initials}
                </div>
              )}
              <span className="hidden text-sm font-semibold text-blue-900 sm:block">
                {displayName}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-44 rounded-md border border-blue-100 bg-white py-2 shadow-lg">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-50"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
