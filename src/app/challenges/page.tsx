"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LoaderCircle, Trash2, Trophy } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ChallengeForm from "@/components/ChallengeForm";
import { deleteChallenge, fetchChallenges } from "@/lib/firestore";
import type { Challenge } from "@/types";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadChallenges() {
    setLoading(true);
    setError("");
    try { setChallenges((await fetchChallenges()) as Challenge[]); } catch { setError("Challenges load nahi ho sake. Firestore connection aur rules check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadChallenges(); }, []);

  const activeChallenges = useMemo(() => challenges.filter((challenge) => !challenge.expiryDate || new Date(challenge.expiryDate) >= new Date()), [challenges]);
  const expiredChallenges = challenges.length - activeChallenges.length;

  async function removeChallenge(challenge: Challenge) {
    if (!window.confirm(`Delete ${challenge.title || "this challenge"}?`)) return;
    setDeleting(challenge.id);
    try { await deleteChallenge(challenge.id); setChallenges((current) => current.filter((item) => item.id !== challenge.id)); } catch { setError("Challenge delete nahi ho saka. Firestore permissions check karein."); } finally { setDeleting(null); }
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">CAMPAIGN MANAGER</p><h1>Challenges</h1><p className="muted">Create missions that turn community energy into measurable impact.</p></div><div className="challenge-summary"><div><strong>{activeChallenges.length}</strong><span>Active</span></div><div><strong>{expiredChallenges}</strong><span>Expired</span></div></div></div><div className="challenge-layout"><ChallengeForm onSuccess={loadChallenges} /><section><div className="challenge-list-heading"><div><h2>All challenges</h2><p className="muted">{challenges.length} campaigns in Firestore</p></div><button className="select-button" onClick={() => void loadChallenges()}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><Trophy size={16} />{error}</div>}{loading ? <div className="challenge-empty">Loading challenges...</div> : challenges.length === 0 ? <div className="challenge-empty"><Trophy size={26} /><span>No challenges yet</span></div> : <div className="challenge-cards">{challenges.map((challenge) => { const expired = challenge.expiryDate && new Date(challenge.expiryDate) < new Date(); return <article className="challenge-card" key={challenge.id}><div className="challenge-card-top"><span className={`challenge-icon ${expired ? "expired" : "active"}`}><Trophy size={18} /></span><span className={`status-pill ${expired ? "banned" : "active"}`}>{expired ? "Expired" : "Active"}</span></div><h3>{challenge.title || "Untitled challenge"}</h3><p>{challenge.description || "No description"}</p><div className="challenge-rewards"><span><b>{challenge.xpReward || 0}</b> XP</span><span><b>{challenge.coinReward || 0}</b> coins</span><span><b>{challenge.totalRequired || 0}</b> trees</span></div><div className="challenge-card-footer"><span><CalendarClock size={14} /> Ends {challenge.expiryDate || "No date"}</span><button className="table-action delete" title="Delete challenge" onClick={() => void removeChallenge(challenge)} disabled={deleting === challenge.id}><Trash2 size={15} /></button></div></article>; })}</div>}</section></div></div></main></AuthGuard>;
}