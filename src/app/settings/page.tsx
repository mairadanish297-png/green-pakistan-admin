"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, LoaderCircle, Save, Settings2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchXPConfig, updateXPConfig } from "@/lib/firestore";

const defaults = { registerTree: 100, joinEvent: 50, dailyCheckIn: 10, completeChallenge: 250 };
type XPConfig = typeof defaults;

export default function SettingsPage() {
  const [config, setConfig] = useState<XPConfig>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try { const remote = await fetchXPConfig(); setConfig({ ...defaults, ...Object.fromEntries(Object.keys(defaults).map((key) => [key, Number(remote[key] ?? defaults[key as keyof XPConfig])])) } as XPConfig); } catch { setError("XP settings load nahi ho sakin. Defaults edit karke save kar sakte hain."); } finally { setLoading(false); }
    }
    void loadConfig();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setSaved(false); setError("");
    try { await updateXPConfig(config); setSaved(true); } catch { setError("Settings save nahi ho sakin. Firestore permissions check karein."); } finally { setSaving(false); }
  }

  const labels: Record<keyof XPConfig, { title: string; description: string }> = { registerTree: { title: "Register a tree", description: "Awarded when a user registers a new tree." }, joinEvent: { title: "Join an event", description: "Awarded when a user joins an eco-event." }, dailyCheckIn: { title: "Daily check-in", description: "Awarded once per day for returning to the app." }, completeChallenge: { title: "Complete a challenge", description: "Awarded when a user completes a campaign." } };

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">SYSTEM CONFIGURATION</p><h1>Settings</h1><p className="muted">Tune the XP economy that powers community participation.</p></div><Settings2 size={25} className="panel-icon" /></div>{error && <div className="error-banner"><Settings2 size={16} />{error}</div>}<form className="settings-form" onSubmit={handleSubmit}><div className="settings-section-heading"><div><h2>XP values</h2><p className="muted">Changes apply to new activity after saving.</p></div><span className="config-path">system_config / xp</span></div>{loading ? <div className="challenge-empty"><LoaderCircle size={20} className="spin" />Loading settings...</div> : <div className="settings-grid">{(Object.keys(defaults) as (keyof XPConfig)[]).map((key) => <label className="setting-row" key={key}><span><strong>{labels[key].title}</strong><small>{labels[key].description}</small></span><div className="xp-input"><input type="number" min="0" value={config[key]} onChange={(event) => setConfig({ ...config, [key]: Math.max(0, Number(event.target.value)) })} /><b>XP</b></div></label>)}</div>}<div className="settings-footer"><span>{saved && <><Check size={15} /> Saved successfully</>}</span><button className="primary-button" disabled={loading || saving}><Save size={16} />{saving ? "Saving..." : "Save settings"}</button></div></form></div></main></AuthGuard>;
}