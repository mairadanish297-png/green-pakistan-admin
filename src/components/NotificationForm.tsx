"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  LoaderCircle,
  Megaphone,
  Search,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";
import { fetchUsers, sendNotification } from "@/lib/firestore";

type AudienceUser = {
  id: string;
  uid?: string;
  fullName?: string;
  email?: string;
};

const notificationTypes = ["Reminder", "Social", "Milestone"] as const;
type NotificationType = (typeof notificationTypes)[number];

export default function NotificationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<NotificationType>("Reminder");
  const [audience, setAudience] = useState<"all" | "single">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<AudienceUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetchUsers()
      .then((result) => {
        if (active) setUsers(result as AudienceUser[]);
      })
      .catch((loadError: unknown) => {
        console.error("Could not load users for notification targeting:", loadError);
        if (active) setUsersError("User list load nahi ho saki. Single-user selection ke liye page refresh karein.");
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users.slice(0, 8);
    return users.filter((user) => {
      const label = `${user.fullName || ""} ${user.email || ""} ${user.uid || user.id}`.toLowerCase();
      return label.includes(query);
    }).slice(0, 8);
  }, [userSearch, users]);

  const selectedUser = users.find((user) => (user.uid || user.id) === targetUserId);
  const typeColor = type === "Social" ? "#ff69b4" : type === "Milestone" ? "var(--warning)" : "var(--info)";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");

    try {
      const result = await sendNotification({
        title,
        description,
        type,
        audience,
        targetUserId: audience === "single" ? targetUserId : undefined,
      });

      if (result.sent > 0) setSuccess(result.message);
      else setError(result.message);
      setTitle("");
      setDescription("");
      setTargetUserId("");
      setUserSearch("");
      setConfirmBroadcast(false);
      onSuccess?.();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Notification send nahi ho saki.");
    } finally {
      setSending(false);
    }
  }

  const canSend = !sending
    && Boolean(title.trim())
    && Boolean(description.trim())
    && (audience === "single" ? Boolean(targetUserId) : confirmBroadcast);

  return (
    <form onSubmit={handleSubmit} className="notification-composer">
      <div className="composer-heading">
        <span className="composer-icon"><Megaphone size={19} /></span>
        <div>
          <p className="eyebrow">PUSH CAMPAIGN</p>
          <h2>Compose notification</h2>
          <p className="muted">Send a message straight to your community&apos;s devices.</p>
        </div>
      </div>

      <fieldset className="composer-section">
        <legend>Choose your audience</legend>
        <div className="audience-options">
          <button
            type="button"
            className={`audience-option ${audience === "all" ? "selected" : ""}`}
            onClick={() => { setAudience("all"); setTargetUserId(""); setConfirmBroadcast(false); }}
          >
            <span className="audience-option-icon"><UsersRound size={17} /></span>
            <span><strong>All users</strong><small>{usersLoading ? "Loading audience..." : `${users.length.toLocaleString()} registered users`}</small></span>
            {audience === "all" && <Check size={16} className="audience-check" />}
          </button>
          <button
            type="button"
            className={`audience-option ${audience === "single" ? "selected" : ""}`}
            onClick={() => { setAudience("single"); setConfirmBroadcast(false); }}
          >
            <span className="audience-option-icon"><UserRound size={17} /></span>
            <span><strong>One user</strong><small>Choose a community member</small></span>
            {audience === "single" && <Check size={16} className="audience-check" />}
          </button>
        </div>
      </fieldset>

      {audience === "all" ? (
        <label className="broadcast-confirm">
          <input
            type="checkbox"
            checked={confirmBroadcast}
            onChange={(event) => setConfirmBroadcast(event.target.checked)}
          />
          <span>
            <strong>Send this notification to everyone</strong>
            <small>This will push the message to every registered user with an FCM-enabled device.</small>
          </span>
        </label>
      ) : (
        <div className="composer-field">
          <label htmlFor="notification-user-search">Find a user</label>
          <div className="user-search-input">
            <Search size={16} />
            <input
              id="notification-user-search"
              type="search"
              autoComplete="off"
              value={selectedUser ? (selectedUser.fullName || selectedUser.email || selectedUser.uid || selectedUser.id) : userSearch}
              onChange={(event) => { setTargetUserId(""); setUserSearch(event.target.value); }}
              placeholder="Search by name, email or user ID"
              disabled={usersLoading || Boolean(usersError)}
            />
          </div>
          {selectedUser && <p className="selected-user-note"><CheckCircle2 size={14} /> {selectedUser.email || selectedUser.uid || selectedUser.id}</p>}
          {!selectedUser && userSearch && (
            <div className="user-search-results">
              {filteredUsers.length ? filteredUsers.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => { setTargetUserId(user.uid || user.id); setUserSearch(""); }}
                >
                  <span className="user-result-avatar">{(user.fullName || user.email || "U").slice(0, 1).toUpperCase()}</span>
                  <span><strong>{user.fullName || "Community member"}</strong><small>{user.email || user.uid || user.id}</small></span>
                </button>
              )) : <p>{usersLoading ? "Loading users..." : "No matching users found."}</p>}
            </div>
          )}
          {usersError && <p className="form-error" role="alert">{usersError}</p>}
        </div>
      )}

      <div className="composer-field">
        <label htmlFor="notification-title">Notification title</label>
        <input
          id="notification-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          required
          placeholder="e.g. Your next green milestone awaits"
        />
        <small className="field-counter">{title.length}/80</small>
      </div>

      <div className="composer-field">
        <label htmlFor="notification-message">Message</label>
        <textarea
          id="notification-message"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={240}
          required
          rows={4}
          placeholder="Write a short, helpful message for your community..."
        />
        <small className="field-counter">{description.length}/240</small>
      </div>

      <fieldset className="composer-section type-section">
        <legend>Notification category</legend>
        <div className="notification-type-options">
          {notificationTypes.map((option) => (
            <button
              key={option}
              type="button"
              className={type === option ? "selected" : ""}
              onClick={() => setType(option)}
              style={{ "--type-color": option === "Social" ? "#ff69b4" : option === "Milestone" ? "var(--warning)" : "var(--info)" } as React.CSSProperties}
            >
              <span />{option}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="push-preview">
        <div className="push-preview-top"><span><Bell size={13} /> GREEN PAKISTAN</span><small>now</small></div>
        <div className="push-preview-content">
          <span className="push-preview-bell" style={{ color: typeColor }}><Bell size={17} /></span>
          <div><strong>{title || "Your notification title"}</strong><p>{description || "Your message preview will appear here."}</p></div>
        </div>
      </div>

      {error && <p className="form-error notification-feedback" role="alert">{error}</p>}
      {success && <p className="form-success notification-feedback" role="status"><CheckCircle2 size={15} />{success}</p>}

      <button type="submit" disabled={!canSend} className="notification-send-button">
        {sending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
        {sending ? "Sending notification..." : audience === "all" ? "Send to all users" : "Send to selected user"}
      </button>
      <p className="composer-footnote">The message is saved to in-app notifications and sent as a push where a device token is available.</p>
    </form>
  );
}
