"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { fetchCollection } from "@/lib/firestore";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    trees: 0,
    posts: 0,
    challenges: 0,
    events: 0,
    notifications: 0,
    rewards: 0,
    pendingRewards: 0,
    activeChallenges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, trees, posts, challenges, events, notifications, rewards] =
          await Promise.all([
            fetchCollection("users"),
            fetchCollection("trees"),
            fetchCollection("posts"),
            fetchCollection("challenges"),
            fetchCollection("events"),
            fetchCollection("notifications"),
            fetchCollection("reward_claims"),
          ]);

        const activeChallenges = challenges.filter((c: any) => {
          const exp = c.expiryDate;
          if (!exp) return true;
          return new Date(exp) > new Date();
        }).length;

        const pendingRewards = rewards.filter(
          (r: any) => r.status === "pending"
        ).length;

        setStats({
          users: users.length,
          trees: trees.length,
          posts: posts.length,
          challenges: challenges.length,
          events: events.length,
          notifications: notifications.length,
          rewards: rewards.length,
          pendingRewards,
          activeChallenges,
        });
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
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          Green Pakistan (Plantera) - Overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Users"
          value={stats.users}
          icon="👥"
          change="+12% this month"
          changeType="positive"
          delay={0.1}
        />
        <StatsCard
          title="Trees Planted"
          value={stats.trees}
          icon="🌳"
          change="+8% this week"
          changeType="positive"
          delay={0.15}
        />
        <StatsCard
          title="Social Posts"
          value={stats.posts}
          icon="📝"
          change="Active community"
          changeType="neutral"
          delay={0.2}
        />
        <StatsCard
          title="Active Challenges"
          value={stats.activeChallenges}
          icon="🏆"
          change={`${stats.challenges} total`}
          changeType="neutral"
          delay={0.25}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatsCard
          title="Upcoming Events"
          value={stats.events}
          icon="📅"
          delay={0.3}
        />
        <StatsCard
          title="Notifications Sent"
          value={stats.notifications}
          icon="🔔"
          delay={0.35}
        />
        <StatsCard
          title="Reward Claims"
          value={stats.rewards}
          icon="🎁"
          change={`${stats.pendingRewards} pending shipment`}
          changeType="neutral"
          delay={0.4}
        />
      </div>

      <div
        className="rounded-xl border p-6 animate-fade-in"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          animationDelay: "0.5s",
        }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Send Notification", href: "/notifications", icon: "🔔" },
            { label: "Create Challenge", href: "/challenges", icon: "🏆" },
            { label: "Create Event", href: "/events", icon: "📅" },
            { label: "View Map", href: "/trees", icon: "🗺️" },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-lg border transition-all card-hover"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-xl">{action.icon}</span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {action.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}