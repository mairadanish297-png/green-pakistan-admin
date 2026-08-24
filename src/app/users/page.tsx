"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Search, ShieldAlert, Trash2, UserCheck, X } from "lucide-react";
import { banUser, deleteUser, fetchUsers, verifyUser } from "@/lib/firestore";
import type { User } from "@/types";
import AuthGuard from "@/components/AuthGuard";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const result = await Promise.race([
        fetchUsers(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      setUsers(result as User[]);
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code === "permission-denied"
        ? "Data service permission denied. Backend connection configure karein."
        : code === "failed-precondition"
          ? "Data service setup incomplete hai. Backend configuration check karein."
          : code === "unavailable"
            ? "Data service unavailable hai. Internet connection check karein."
            : "Users load nahi ho sake. Backend configuration check karein.";
      const detail = error instanceof Error ? error.message : "No additional details";
      setError(`${message} (${code || "unknown-error"}) ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const term = search.toLowerCase();
    return user.fullName?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term) || user.country?.toLowerCase().includes(term);
  }), [search, users]);

  async function updateUser(action: "ban" | "verify" | "delete", user: User) {
    if (action === "delete" && !window.confirm(`Delete ${user.fullName || "this user"}?`)) return;
    setActionId(user.uid);
    try {
      if (action === "ban") await banUser(user.uid, !user.isBanned);
      if (action === "verify") await verifyUser(user.uid, !user.isVerified);
      if (action === "delete") await deleteUser(user.uid);
      await loadUsers();
    } catch {
      setError("Action complete nahi ho saka. Firestore permissions check karein.");
    } finally {
      setActionId(null);
    }
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">GOVERNANCE</p><h1>User management</h1><p className="muted">Review community members, verification and account access.</p></div><div className="user-count"><strong>{users.length}</strong><span>Total users</span></div></div><div className="users-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by name, email or country" /></div><button className="select-button" onClick={() => void loadUsers()}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><ShieldAlert size={17} />{error}</div>}<div className="users-table-wrap"><table className="users-table"><thead><tr><th>User</th><th>Location</th><th>Impact</th><th>Status</th><th>Role</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="empty-state">Loading users...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={6} className="empty-state">No users found</td></tr> : filteredUsers.map((user) => <tr key={user.uid}><td><div className="user-cell"><span className="user-avatar">{(user.fullName || "U").slice(0, 2).toUpperCase()}</span><div><strong>{user.fullName || "Unnamed user"}</strong><small>{user.email || user.uid}</small></div></div></td><td>{user.country || "Pakistan"}</td><td><strong>{user.treesPlanted || 0}</strong> trees <small className="score">{user.score || 0} XP</small></td><td><span className={`status-pill ${user.isBanned ? "banned" : "active"}`}>{user.isBanned ? "Banned" : "Active"}</span></td><td><span className="role-label">{user.role || "Member"}</span>{user.isVerified && <Check size={14} className="verified-icon" />}</td><td><div className="action-buttons"><button title={user.isVerified ? "Remove verification" : "Verify user"} onClick={() => void updateUser("verify", user)} disabled={actionId === user.uid} className="table-action verify">{user.isVerified ? <X size={15} /> : <UserCheck size={15} />}</button><button title={user.isBanned ? "Unban user" : "Ban user"} onClick={() => void updateUser("ban", user)} disabled={actionId === user.uid} className="table-action ban">{user.isBanned ? <Check size={15} /> : <ShieldAlert size={15} />}</button><button title="Delete user" onClick={() => void updateUser("delete", user)} disabled={actionId === user.uid} className="table-action delete"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></div></main></AuthGuard>;
}