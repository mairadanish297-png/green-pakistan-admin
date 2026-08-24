"use client";

import { useState } from "react";
import { sendNotification } from "@/lib/firestore";

export default function NotificationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Reminder");
  const [targetUser, setTargetUser] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const typeColors: Record<string, string> = {
    Reminder: "var(--info)",
    Social: "#FF69B4",
    Milestone: "var(--warning)",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    if (!title.trim() || !description.trim()) {
      setError("Title aur message required hain.");
      setSending(false);
      return;
    }
    try {
      await sendNotification({ title, description, type: type as "Reminder" | "Social" | "Milestone", userId: targetUser });
      setTitle("");
      setDescription("");
      setTargetUser("");
      setSuccess("Notification Firestore mein save ho gayi.");
      onSuccess?.();
    } catch {
      setError("Notification send nahi ho saki. Firestore permissions check karein.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-6 space-y-4 animate-fade-in"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Send Notification
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            placeholder="Notification title..."
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Type</label>
          <div className="flex gap-2">
            {["Reminder", "Social", "Milestone"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all border"
                style={{
                  background: type === t ? `${typeColors[t]}20` : "var(--bg-secondary)",
                  borderColor: type === t ? typeColors[t] : "var(--border)",
                  color: type === t ? typeColors[t] : "var(--text-secondary)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
          Target User (empty = all users)
        </label>
        <input
          type="text"
          value={targetUser}
          onChange={(e) => setTargetUser(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          placeholder="User ID or leave empty for broadcast..."
        />
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Message</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          placeholder="Notification message..."
        />
      </div>

      <button type="submit" disabled={sending} className="btn-primary">
        {sending ? "Sending..." : "Send Notification"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}
    </form>
  );
}