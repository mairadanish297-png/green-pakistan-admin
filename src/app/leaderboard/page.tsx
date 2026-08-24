"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, LoaderCircle, Medal, RefreshCw, Search, Sprout } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchUsers } from "@/lib/firestore";
import type { User } from "@/types";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [province, setProvince] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true); setError("");
    try { setUsers((await fetchUsers()) as User[]); } catch { setError("Leaderboard load nahi ho saka. Firestore connection aur rules check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadUsers(); }, []);

  const provinces = useMemo(() => [...new Set(users.map((user) => user.country).filter(Boolean))].sort(), [users]);
  const rankedUsers = useMemo(() => users.filter((user) => province === "all" || user.country === province).filter((user) => user.fullName?.toLowerCase().includes(search.toLowerCase())).sort((first, second) => (second.score || 0) - (first.score || 0)), [province, search, users]);

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">COMMUNITY PERFORMANCE</p><h1>Leaderboard</h1><p className="muted">Recognise the members creating the biggest impact.</p></div><div className="user-count"><strong>{rankedUsers.length}</strong><span>Ranked members</span></div></div>{error && <div className="error-banner"><Crown size={16} />{error}</div>}<div className="leaderboard-top">{rankedUsers.slice(0, 3).map((user, index) => <div className={`top-performer rank-${index + 1}`} key={user.uid}><span className="rank-icon">{index === 0 ? <Crown size={19} /> : <Medal size={18} />}</span><span className="leader-avatar">{(user.fullName || "U").slice(0, 2).toUpperCase()}</span><strong>{user.fullName || "Unnamed user"}</strong><span>{(user.score || 0).toLocaleString()} XP</span><small>{user.treesPlanted || 0} trees planted</small></div>)}</div><div className="leaderboard-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member" /></div><select className="leaderboard-select" value={province} onChange={(event) => setProvince(event.target.value)}><option value="all">All provinces</option>{provinces.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="select-button" onClick={() => void loadUsers()}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button></div><div className="users-table-wrap"><table className="users-table leaderboard-table"><thead><tr><th>Rank</th><th>Member</th><th>Location</th><th>Trees planted</th><th>Total XP</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="empty-state"><LoaderCircle size={19} className="spin" /><br />Loading leaderboard...</td></tr> : rankedUsers.length === 0 ? <tr><td colSpan={5} className="empty-state">No ranked members found</td></tr> : rankedUsers.map((user, index) => <tr key={user.uid}><td><span className={`rank-number ${index < 3 ? "top-rank" : ""}`}>#{index + 1}</span></td><td><div className="user-cell"><span className="user-avatar">{(user.fullName || "U").slice(0, 2).toUpperCase()}</span><strong>{user.fullName || "Unnamed user"}</strong></div></td><td>{user.country || "Pakistan"}</td><td><span className="tree-count"><Sprout size={14} />{(user.treesPlanted || 0).toLocaleString()}</span></td><td><strong className="xp-value">{(user.score || 0).toLocaleString()} XP</strong></td></tr>)}</tbody></table></div></div></main></AuthGuard>;
}