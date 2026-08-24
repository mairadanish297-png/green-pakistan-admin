"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/firestore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser); setChecking(false);
    if (!nextUser) router.replace("/login");
    else isAdminUser(nextUser.uid).then((admin) => { if (!admin) { void signOut(auth); router.replace("/login"); } }).catch(() => { void signOut(auth); router.replace("/login"); });
  }), [router]);

  if (checking || !user) return <div className="auth-loading">Checking admin access...</div>;
  return children;
}