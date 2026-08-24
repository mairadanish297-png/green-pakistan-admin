"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, PackageCheck, RefreshCw, Truck } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchRewardClaims, updateClaimStatus } from "@/lib/firestore";
import type { RewardClaim } from "@/types";

type ClaimFilter = "all" | RewardClaim["status"];

export default function RewardsPage() {
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [filter, setFilter] = useState<ClaimFilter>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadClaims() {
    setLoading(true); setError("");
    try { setClaims((await fetchRewardClaims()) as unknown as RewardClaim[]); } catch { setError("Reward claims load nahi ho sakin. Firestore connection aur rules check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadClaims(); }, []);

  const visibleClaims = useMemo(() => filter === "all" ? claims : claims.filter((claim) => claim.status === filter), [claims, filter]);
  const count = (status: RewardClaim["status"]) => claims.filter((claim) => claim.status === status).length;

  async function changeStatus(claim: RewardClaim, status: RewardClaim["status"]) {
    setUpdating(claim.id); setError("");
    try { await updateClaimStatus(claim.id, status); setClaims((current) => current.map((item) => item.id === claim.id ? { ...item, status } : item)); } catch { setError("Claim status update nahi ho saka. Firestore permissions check karein."); } finally { setUpdating(null); }
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">LOGISTICS & REWARDS</p><h1>Reward claims</h1><p className="muted">Keep physical rewards moving from request to delivery.</p></div><div className="claim-summary"><div><strong>{count("pending")}</strong><span>Pending</span></div><div><strong>{count("shipped")}</strong><span>Shipped</span></div><div><strong>{count("delivered")}</strong><span>Delivered</span></div></div></div><div className="claims-toolbar"><div className="filter-tabs">{(["all", "pending", "shipped", "delivered"] as ClaimFilter[]).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All claims" : item}</button>)}</div><button className="select-button" onClick={() => void loadClaims()}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><PackageCheck size={16} />{error}</div>}<div className="claims-table-wrap"><table className="users-table claims-table"><thead><tr><th>Recipient</th><th>Reward</th><th>Shipping address</th><th>Requested</th><th>Status</th><th>Update</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="empty-state">Loading claims...</td></tr> : visibleClaims.length === 0 ? <tr><td colSpan={6} className="empty-state"><PackageCheck size={25} /><br />No reward claims found</td></tr> : visibleClaims.map((claim) => <tr key={claim.id}><td><div className="user-cell"><span className="user-avatar">{claim.userId.slice(0, 2).toUpperCase()}</span><div><strong>{claim.userId}</strong><small>User ID</small></div></div></td><td><span className="reward-label">{claim.rewardId}</span></td><td className="address-cell">{claim.address || "Address not provided"}</td><td>{claim.timestamp?.toDate ? claim.timestamp.toDate().toLocaleDateString() : "Not recorded"}</td><td><span className={`status-pill ${claim.status === "delivered" ? "active" : claim.status === "shipped" ? "blue-status" : "pending-status"}`}>{claim.status}</span></td><td><div className="claim-actions">{claim.status === "pending" && <button title="Mark shipped" onClick={() => void changeStatus(claim, "shipped")} disabled={updating === claim.id}><Truck size={15} /></button>}{claim.status === "shipped" && <button title="Mark delivered" onClick={() => void changeStatus(claim, "delivered")} disabled={updating === claim.id}><CheckCircle2 size={15} /></button>}{claim.status === "delivered" && <span className="delivered-check"><CheckCircle2 size={16} /></span>}{updating === claim.id && <LoaderCircle size={14} className="spin" />}</div></td></tr>)}</tbody></table></div></div></main></AuthGuard>;
}