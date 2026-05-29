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
  const todayLabel = new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

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
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-white/70 bg-[rgba(244,247,252,0.78)] shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/88 text-[var(--mm-navy)] shadow-sm sm:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] text-white shadow-[0_16px_32px_rgba(29,78,216,0.22)]">
            <FontAwesomeIcon icon={faStore} className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--mm-muted)]">
              Operations cockpit
            </p>
            <h2 className="truncate text-lg font-semibold tracking-[0.02em] text-[var(--mm-ink)] sm:text-xl">
              M&amp;M Store Manager
            </h2>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/88 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.16)]" />
            {todayLabel}
          </div>

        {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/88 text-[var(--mm-navy)] shadow-sm transition hover:shadow-lg"
            >
            <FontAwesomeIcon
              icon={faBell}
              className="h-5 w-5 transition group-hover:text-[var(--mm-blue)]"
            />
            {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[1.35rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  {unreadCount}
                </span>
            )}
            </button>

          {/* Dropdown for Notifications */}
          {isNotifOpen && (
              <div className="shell-panel absolute right-0 top-[calc(100%+0.9rem)] z-50 w-80 max-w-[calc(100vw-2rem)] p-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-4 py-3 text-white shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100/80">
                    Live activity
                  </p>
                  <h4 className="mt-2 text-base font-semibold text-white">
                    New Orders
                  </h4>
                </div>

              {notifications.length > 0 ? (
                  <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
                    {notifications.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push(`/manage/orders`);
                        }}
                        className="w-full rounded-2xl border border-slate-100 bg-white/88 px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <p className="font-semibold text-[var(--mm-navy)]">
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
                    No new orders in the queue right now.
                  </p>
              )}
              </div>
          )}
          </div>

        {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 rounded-full border border-white/80 bg-white/88 py-1.5 pl-2 pr-4 shadow-sm transition hover:shadow-lg"
            >
            {user?.image ? (
              <Image
                src={user.image}
                alt="Profile"
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-full object-cover border border-white shadow-sm"
              />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mm-blue),var(--mm-navy))] text-lg font-semibold text-white shadow-md">
                {initials}
              </div>
            )}
              <div className="hidden text-left sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Signed in
                </p>
                <span className="block text-sm font-semibold text-[var(--mm-ink)]">
                  {displayName}
                </span>
              </div>
            </button>

          {/* Profile Menu */}
          {isProfileOpen && (
              <div className="shell-panel absolute right-0 top-[calc(100%+0.9rem)] z-50 w-48 p-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--mm-navy)] transition hover:bg-blue-50"
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
