"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Menu,
  MoreHorizontal,
  Search,
  Sprout,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import AuthGuard from "@/components/AuthGuard";
import { fetchCollection } from "@/lib/firestore";

const emptyChart = Array.from({ length: 8 }, (_, index) => ({ month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][index], trees: 0 }));
type DashboardTree = Record<string, unknown>;
type DashboardChallenge = { id: string; expiryDate?: string };
type DashboardClaim = { id: string; status?: string };

function recordDate(record: Record<string, unknown>) {
  const value = record.createdAt || record.timestamp || record.registeredAt;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return null;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState({ users: 0, trees: 0, challenges: 0, claims: 0 });
  const [events, setEvents] = useState<{ id: string; title?: string; location?: string; date?: string; time?: string; attendeesCount?: number }[]>([]);
  const [plantingData, setPlantingData] = useState(emptyChart);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [users, trees, challenges, claims, eventRecords] = await Promise.all([
          fetchCollection("users"), fetchCollection("trees"), fetchCollection("challenges"), fetchCollection("reward_claims"),
          fetchCollection("events"),
        ]);
        setMetrics({
          users: users.length,
          trees: trees.length,
          challenges: (challenges as unknown as DashboardChallenge[]).filter((challenge) => !challenge.expiryDate || new Date(challenge.expiryDate) >= new Date()).length,
          claims: (claims as unknown as DashboardClaim[]).filter((claim) => claim.status === "pending").length,
        });
        setEvents(eventRecords as typeof events);
        const now = new Date();
        const months = Array.from({ length: 8 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (7 - index), 1));
        setPlantingData(months.map((month) => ({ month: month.toLocaleDateString("en", { month: "short" }), trees: (trees as unknown as DashboardTree[]).filter((tree) => { const date = recordDate(tree); return date && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).length })));
      } catch { setMetricsError(true); }
    }
    void loadMetrics();
  }, []);

  return (
    <AuthGuard><div className="admin-shell">
      <div className={`mobile-sidebar ${sidebarOpen ? "is-open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-wrap ${sidebarOpen ? "is-open" : ""}`}><Sidebar /></div>
      <main className="dashboard-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search"><Search size={19} /></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="profile-chip"><span className="avatar">AK</span><span className="profile-text"><strong>Admin Khan</strong><small>Super Admin</small></span><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div><p className="eyebrow">MONDAY, 24 AUGUST 2026</p><h1>Good morning, Admin.</h1><p className="muted">Here&apos;s what&apos;s happening across your green community.</p></div>
            <button className="primary-button"><ArrowUpRight size={17} /> View live activity</button>
          </section>

          <section className="stats-grid">
            <StatsCard title="Total users" value={metrics.users.toLocaleString()} icon="👥" change={metricsError ? "Could not load live data" : metrics.users === 0 ? "No users yet" : "Connected to Firestore"} changeType={metricsError ? "negative" : "positive"} delay={0} />
            <StatsCard title="Trees registered" value={metrics.trees.toLocaleString()} icon="🌱" change={metricsError ? "Could not load live data" : metrics.trees === 0 ? "No trees yet" : "Connected to Firestore"} changeType={metricsError ? "negative" : "positive"} delay={0.05} />
            <StatsCard title="Active challenges" value={metrics.challenges} icon="🏆" change={metricsError ? "Could not load live data" : "Connected to Firestore"} changeType={metricsError ? "negative" : "positive"} delay={0.1} />
            <StatsCard title="Pending claims" value={metrics.claims} icon="📦" change={metricsError ? "Could not load live data" : "Connected to Firestore"} changeType={metricsError ? "negative" : "positive"} delay={0.15} />
          </section>

          <section className="dashboard-grid">
            <div className="panel chart-panel">
              <div className="panel-heading"><div><h2>Planting activity</h2><p className="muted">Trees registered over the last 8 months</p></div><button className="select-button">This year <ChevronDown size={15} /></button></div>
              <div className="chart-legend"><span><i className="legend-dot" /> Trees registered</span><strong>{metrics.trees.toLocaleString()} <small>Live count</small></strong></div>
              <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={plantingData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38d47c" stopOpacity={0.32} /><stop offset="100%" stopColor="#38d47c" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#203241" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#8193a5", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#8193a5", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#172431", border: "1px solid #2a4050", borderRadius: 8, color: "#f0f4f8" }} /><Area type="monotone" dataKey="trees" stroke="#38d47c" strokeWidth={3} fill="url(#greenFill)" /></AreaChart></ResponsiveContainer></div>
            </div>

            <div className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p className="muted">Current records from the community</p></div><button className="more-button" aria-label="More activity options"><MoreHorizontal size={19} /></button></div><div className="activity-list">{metrics.trees > 0 && <div className="activity-item"><span className="activity-icon green"><Sprout size={17} /></span><div><strong>Trees registered</strong><p>{metrics.trees.toLocaleString()} trees in the registry</p></div><time>Live</time></div>}{metrics.users > 0 && <div className="activity-item"><span className="activity-icon blue"><Users size={17} /></span><div><strong>Community members</strong><p>{metrics.users.toLocaleString()} registered users</p></div><time>Live</time></div>}{metrics.challenges > 0 && <div className="activity-item"><span className="activity-icon gold"><CheckCircle2 size={17} /></span><div><strong>Active challenges</strong><p>{metrics.challenges} campaigns currently active</p></div><time>Live</time></div>}{metrics.users === 0 && metrics.trees === 0 && metrics.challenges === 0 && <div className="notification-empty">No activity yet</div>}</div><button className="text-button">View all activity <ArrowUpRight size={15} /></button></div>
          </section>

          <section className="bottom-grid"><div className="panel impact-panel"><div className="panel-heading"><div><h2>Impact snapshot</h2><p className="muted">Progress towards this year&apos;s target</p></div><button className="more-button" aria-label="More impact options"><MoreHorizontal size={19} /></button></div><div className="impact-row"><div className="impact-ring"><span>{Math.min(100, Math.round((metrics.trees / 120000) * 100))}%</span></div><div><strong>{metrics.trees ? "Impact is growing" : "No impact recorded yet"}</strong><p className="muted">Progress is calculated from registered trees.</p><div className="progress-track"><span style={{ width: `${Math.min(100, Math.round((metrics.trees / 120000) * 100))}%` }} /></div><small className="muted">{metrics.trees.toLocaleString()} of 120,000 trees</small></div></div></div><div className="panel events-panel"><div className="panel-heading"><div><h2>Upcoming events</h2><p className="muted">Scheduled community activities</p></div><CalendarDays size={19} className="panel-icon" /></div>{events.length ? events.slice(0, 2).map((event) => <div className="event-row" key={event.id}><span className="event-date"><b>{event.date ? new Date(event.date).getDate() : "-"}</b><small>{event.date ? new Date(event.date).toLocaleDateString("en", { month: "short" }).toUpperCase() : "DATE"}</small></span><div><strong>{event.title || "Untitled event"}</strong><p className="muted">{event.location || "Location not set"} · {event.time || "Time not set"}</p></div><span className="attendees">{event.attendeesCount || 0} joined</span></div>) : <div className="notification-empty">No upcoming events</div>}</div></section>
        </div>
      </main>
    </div></AuthGuard>
  );
}
