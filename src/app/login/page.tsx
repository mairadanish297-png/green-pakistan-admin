"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { claimFirstAdmin, isAdminUser } from "@/lib/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password) { setError("Email aur password required hain."); return; }
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!await isAdminUser(result.user.uid)) await claimFirstAdmin(result.user.uid, result.user.email || email.trim());
      router.replace("/");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setError(code === "auth/invalid-credential" ? "Email ya password incorrect hai." : `Login failed (${code || "unknown-error"}).`);
    } finally { setLoading(false); }
  }

  async function handleFirstAdmin() {
    setError(""); setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await claimFirstAdmin(result.user.uid, result.user.email || email.trim());
      router.replace("/");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setError(code === "auth/email-already-in-use" ? "Yeh account already mojood hai. Sign in use karein." : `Super Admin create nahi ho saka (${code || "unknown-error"}).`);
    } finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><span><Leaf size={21} /></span><div><strong>Green Pakistan</strong><small>Plantera admin workspace</small></div></div>
        <div className="login-heading"><p className="eyebrow">SECURE ACCESS</p><h1>Welcome back.</h1><p className="muted">Sign in to manage your green community.</p></div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>Email address<div className="input-wrap"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required /></div></label>
          <label>Password<div className="input-wrap"><LockKeyhole size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="primary-button login-button" disabled={loading}>{loading ? "Signing in..." : "Sign in to dashboard"}</button>
          <button type="button" className="bootstrap-button" onClick={() => void handleFirstAdmin()} disabled={loading}>Create first Super Admin</button>
        </form>
      </section>
    </main>
  );
}