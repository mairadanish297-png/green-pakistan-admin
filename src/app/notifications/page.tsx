"use client";

import { useEffect, useState } from "react";
import { Bell, LoaderCircle, RefreshCw } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import NotificationForm from "@/components/NotificationForm";
import { fetchNotifications } from "@/lib/firestore";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  return <AuthGuard><NotificationsContent /></AuthGuard>;
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      setNotifications((await fetchNotifications()) as unknown as Notification[]);
    } catch (loadError) {
      console.error("Could not load notification history:", loadError);
      setError("Notifications load nahi ho sakin. Firestore connection aur rules check karein.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchNotifications()
      .then((result) => {
        if (active) setNotifications(result as unknown as Notification[]);
      })
      .catch((loadError: unknown) => {
        console.error("Could not load notification history:", loadError);
        if (active) setError("Notifications load nahi ho sakin. Firestore connection aur rules check karein.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="admin-shell">
      <div className="users-page">
        <div className="users-header">
          <div>
            <p className="eyebrow">ENGAGEMENT CENTER</p>
            <h1>Notifications</h1>
            <p className="muted">Create a push campaign and reach one person or your whole community.</p>
          </div>
          <div className="user-count">
            <strong>{notifications.length}</strong>
            <span>Notification records</span>
          </div>
        </div>

        <div className="notification-layout">
          <NotificationForm onSuccess={() => void loadNotifications()} />
          <section className="panel notification-history">
            <div className="panel-heading">
              <div>
                <h2>Notification history</h2>
                <p className="muted">In-app messages and FCM send results</p>
              </div>
              <button className="select-button" onClick={() => void loadNotifications()} disabled={loading}>
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
            {error && <div className="error-banner"><Bell size={16} />{error}</div>}
            {loading ? (
              <div className="notification-empty"><LoaderCircle size={20} className="spin" />Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty"><Bell size={22} /><span>No notifications yet</span></div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div className="notification-item" key={notification.id}>
                    <span className={`notification-type ${notification.type?.toLowerCase() || "reminder"}`}>
                      <Bell size={15} />
                    </span>
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.description}</p>
                      <small>
                        To: {notification.userId === "all" ? "All users" : notification.userId}
                        {typeof notification.sentCount === "number" && ` · Firebase accepted for ${notification.sentCount} device(s)`}
                      </small>
                    </div>
                    <span className={`delivery-status ${notification.deliveryStatus || "saved"}`}>
                      {(notification.deliveryStatus || "saved").replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
