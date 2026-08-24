"use client";

import { useEffect, useState } from "react";
import { Bell, LoaderCircle, RefreshCw } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import NotificationForm from "@/components/NotificationForm";
import { fetchNotifications } from "@/lib/firestore";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try { setNotifications((await fetchNotifications()) as Notification[]); } catch { setError("Notifications load nahi ho sakin. Firestore connection aur rules check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadNotifications(); }, []);

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">ENGAGEMENT CENTER</p><h1>Notifications</h1><p className="muted">Send timely updates to your community and review delivery records.</p></div><div className="user-count"><strong>{notifications.length}</strong><span>Saved notifications</span></div></div><div className="notification-layout"><NotificationForm onSuccess={loadNotifications} /><section className="panel notification-history"><div className="panel-heading"><div><h2>Notification history</h2><p className="muted">Recent messages saved in Firestore</p></div><button className="select-button" onClick={() => void loadNotifications()}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><Bell size={16} />{error}</div>}{loading ? <div className="notification-empty"><LoaderCircle size={20} className="spin" />Loading...</div> : notifications.length === 0 ? <div className="notification-empty"><Bell size={22} /><span>No notifications yet</span></div> : <div className="notification-list">{notifications.map((notification) => <div className="notification-item" key={notification.id}><span className={`notification-type ${notification.type?.toLowerCase() || "reminder"}`}><Bell size={15} /></span><div><strong>{notification.title}</strong><p>{notification.description}</p><small>To: {notification.userId === "all" ? "All users" : notification.userId}</small></div><span className={`badge badge-${notification.type?.toLowerCase() === "milestone" ? "gold" : notification.type?.toLowerCase() === "social" ? "pink" : "blue"}`}>{notification.type || "Reminder"}</span></div>)}</div>}</section></div></div></main></AuthGuard>;
}