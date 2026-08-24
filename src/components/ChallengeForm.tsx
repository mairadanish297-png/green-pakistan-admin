"use client";

import { useState } from "react";
import { addChallenge } from "@/lib/firestore";

export default function ChallengeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    xpReward: 0,
    coinReward: 0,
    totalRequired: 1,
    expiryDate: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["xpReward", "coinReward", "totalRequired"].includes(name) ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addChallenge(form);
      setForm({ title: "", description: "", xpReward: 0, coinReward: 0, totalRequired: 1, expiryDate: "" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-6 space-y-4 animate-fade-in"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Create Challenge</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            placeholder="Challenge title..." />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Expiry Date</label>
          <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required rows={2}
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          placeholder="Challenge description..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>XP Reward</label>
          <input name="xpReward" type="number" value={form.xpReward} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Coin Reward</label>
          <input name="coinReward" type="number" value={form.coinReward} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Trees Required</label>
          <input name="totalRequired" type="number" value={form.totalRequired} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Creating..." : "Create Challenge"}
      </button>
    </form>
  );
}