"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import { fetchUsers, banUser, verifyUser, deleteUser } from "@/lib/firestore";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleBan(uid: string, currentStatus: boolean) {
    await banUser(uid, !currentStatus);
    loadUsers();
  }

  async function handleVerify(uid: string, currentStatus: boolean) {
    await verifyUser(uid, !currentStatus);
    loadUsers();
  }

  async function handleDelete(uid: string) {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser(uid);
      loadUsers();
    }
  }

  const columns = [
    { key: "fullName", label: "Name" },
    {
      key: "uid",
      label: "UID",
      render: (v: any) => (
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {String(v || "").slice(0, 12)}...
        </span>
      ),
    },
    {
      key: "score",
      label: "XP Score",
      render: (v: any) => (
        <span className="badge badge-gold">{v || 0} XP</span>
      ),
    },
    {
      key: "treesPlanted",
      label: "Trees",
      render: (v: any) => (
        <span className="badge badge-green">{v || 0}</span>
      ),
    },
    { key: "country", label: "Country" },
    {
      key: "isBanned",
      label: "Status",
      render: (v: any) =>
        v ? (
          <span className="badge badge-red">Banned</span>
        ) : (
          <span className="badge badge-green">Active</span>
        ),
    },
    {
      key: "isVerified",
      label: "Verified",
      render: (v: any) =>
        v ? (
          <span className="badge badge-blue">Yes</span>
        ) : (
          <span style={{ color: "var(--text-secondary)" }}>No</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          User Management
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          Manage all registered users
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--emerald)",
            }}
          />
        </div>
      ) : (
        <DataTable
          title="All Users"
          columns={columns}
          data={users}
          actions={(row: any) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleBan(row.id, row.isBanned)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: row.isBanned
                    ? "rgba(46,204,113,0.15)"
                    : "rgba(231,76,60,0.15)",
                  color: row.isBanned ? "var(--emerald)" : "var(--danger)",
                }}
              >
                {row.isBanned ? "Unban" : "Ban"}
              </button>
              <button
                onClick={() => handleVerify(row.id, row.isVerified)}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{
                  background: "rgba(52,152,219,0.15)",
                  color: "var(--info)",
                }}
              >
                {row.isVerified ? "Unverify" : "Verify"}
              </button>
              <button
                onClick={() => handleDelete(row.id)}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{
                  background: "rgba(231,76,60,0.15)",
                  color: "var(--danger)",
                }}
              >
                Delete
              </button>
            </div>
          )}
        />
      )}
    </div>
  );
}