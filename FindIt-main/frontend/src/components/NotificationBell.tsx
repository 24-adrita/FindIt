"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
  Check,
  RefreshCw,
} from "lucide-react";
import { NotificationItem } from "../types/item";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(
    async (showLoadingSpinner = false) => {
      if (!token) return;
      if (showLoadingSpinner) setIsLoading(true);

      try {
        const res = await fetchNotifications(token);
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      } catch (err) {
        console.warn("Failed to fetch notifications:", err);
      } finally {
        if (showLoadingSpinner) setIsLoading(false);
      }
    },
    [token]
  );

  // Reset notifications if user logs out
  const [prevToken, setPrevToken] = useState(token);
  if (token !== prevToken) {
    setPrevToken(token);
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  // Initial load and periodic polling every 30 seconds
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    fetchNotifications(token)
      .then((res) => {
        if (isMounted) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch notifications:", err);
      });

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications(token)
          .then((res) => {
            if (isMounted) {
              setNotifications(res.data || []);
              setUnreadCount(res.unreadCount || 0);
            }
          })
          .catch((err) => {
            console.warn("Failed to fetch notifications:", err);
          });
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && token) {
      loadNotifications(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!token) return;

    // Optimistically mark as read in local state
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Call API
      try {
        await markNotificationAsRead(notif._id, token);
      } catch (err) {
        console.warn("Failed to mark notification as read on server:", err);
      }
    }

    setIsOpen(false);

    // Context-sensitive navigation
    if (notif.type === "claim_approved" || notif.type === "claim_rejected") {
      router.push("/my-claims");
    } else if (notif.type === "match_alert") {
      router.push("/#recent-items");
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all notifications as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-600 rounded-full shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <span className="text-xs">Loading updates...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <button
                    key={notif._id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-slate-50 ${
                      isUnread ? "bg-indigo-50/50" : "bg-white"
                    }`}
                  >
                    {/* Icon based on type */}
                    <div className="shrink-0 mt-0.5">
                      {notif.type === "match_alert" ? (
                        <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      ) : notif.type === "claim_approved" ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : notif.type === "claim_rejected" ? (
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs truncate ${
                            isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>

                      {notif.matchScore && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-100 text-violet-800">
                            <Sparkles className="w-2.5 h-2.5" />
                            {notif.matchScore}% Match
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
