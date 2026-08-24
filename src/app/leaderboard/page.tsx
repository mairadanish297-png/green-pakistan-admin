"use client";

import { useEffect, useState } from "react";
import { fetchCollection } from "@/lib/firestore";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCollection("users");
        const sorted = (data as any[]).sort(
          (a: any, b: any) => (b.score || 0) - (a.score || 0)
        );
        setUsers(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--emerald)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Leaderboard
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          Global rankings by XP score
        </p>
      </div>

      <div
        className="rounded-xl border overflow-hidden animate-fade-in"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                Rank
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                Name
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                XP Score
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                Trees
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                Country
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any, index: number) => (
              <tr
                key={user.id}
                className="border-t transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="px-5 py-4 text-sm font-bold">
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}
                </td>
                <td
                  className="px-5 py-4 text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.fullName || "Unknown"}
                </td>
                <td className="px-5 py-4">
                  <span className="badge badge-gold">
                    {user.score || 0} XP
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="badge badge-green">
                    {user.treesPlanted || 0}
                  </span>
                </td>
                <td
                  className="px-5 py-4 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.country || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div
            className="p-12 text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            No users found
          </div>
        )}
      </div>
    </div>
  );
}