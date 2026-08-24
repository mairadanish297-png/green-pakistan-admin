"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navItems = [
  { name: "Dashboard", path: "/", icon: "📊" },
  { name: "Users", path: "/users", icon: "👥" },
  { name: "Posts", path: "/posts", icon: "📝" },
  { name: "Trees", path: "/trees", icon: "🌳" },
  { name: "Notifications", path: "/notifications", icon: "🔔" },
  { name: "Challenges", path: "/challenges", icon: "🏆" },
  { name: "Events", path: "/events", icon: "📅" },
  { name: "Rewards", path: "/rewards", icon: "🎁" },
  { name: "Leaderboard", path: "/leaderboard", icon: "📈" },
  { name: "Settings", path: "/settings", icon: "⚙️" },
  { name: "Certificates", path: "/certificates", icon: "📜" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "var(--emerald)" }}
          >
            🌿
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Green Pakistan
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all animate-slide-in"
              style={{
                animationDelay: `${index * 0.05}s`,
                background: isActive ? "rgba(46,204,113,0.12)" : "transparent",
                color: isActive ? "var(--emerald)" : "var(--text-secondary)",
                borderLeft: isActive ? "3px solid var(--emerald)" : "3px solid transparent",
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--emerald)", color: "#000" }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Admin</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Super Admin</p>
          </div>
          <button className="logout-button" onClick={() => void signOut(auth)} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}