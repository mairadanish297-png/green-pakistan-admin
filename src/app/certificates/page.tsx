"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, LoaderCircle, Printer, RefreshCw, Send } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchCertificates, fetchUsers, issueCertificate } from "@/lib/firestore";
import type { Certificate } from "@/types";

type Recipient = { id: string; uid: string; fullName: string; email?: string };

function displayDate(value: unknown) {
  if (!value) return "Date not recorded";
  const date = typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate() as Date
    : new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? "Date not recorded" : date.toLocaleDateString();
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export default function CertificatesPage() {
  const [users, setUsers] = useState<Recipient[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("Tree Planting Achievement");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [userRecords, certificateRecords] = await Promise.all([fetchUsers(), fetchCertificates()]);
      setUsers(userRecords.map((value) => {
        const user = value as Record<string, unknown>;
        const id = String(user.id || user.uid || "");
        return { id, uid: String(user.uid || id), fullName: String(user.fullName || user.name || "Green Pakistan member"), email: typeof user.email === "string" ? user.email : undefined };
      }).filter((user) => user.uid));
      setCertificates(certificateRecords as unknown as Certificate[]);
    } catch {
      setError("Users/certificates load nahi ho sake. Firestore connection aur permissions check karein.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const sortedCertificates = useMemo(() => [...certificates].sort((a, b) => {
    const time = (value: unknown) => {
      if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return (value.toDate() as Date).getTime();
      return new Date(value as string | number | Date).getTime() || 0;
    };
    return time(b.issuedAt) - time(a.issuedAt);
  }), [certificates]);

  async function handleIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const recipient = users.find((user) => user.uid === selectedUser);
    if (!recipient) {
      setError("Certificate ke liye registered user select karein.");
      return;
    }
    setSending(true);
    const certificateNumber = `GP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      const certificate = await issueCertificate({ userId: recipient.uid, userName: recipient.fullName, title: title.trim(), certificateNumber });
      setCertificates((current) => [certificate as Certificate, ...current]);
      setSuccess(`Certificate ${recipient.fullName} ko issue karke app notification bhej di gayi.`);
    } catch {
      setError("Certificate issue nahi ho saka. Firestore admin permissions check karein.");
    } finally {
      setSending(false);
    }
  }

  function printCertificate(certificate: Certificate) {
    const popup = window.open("", "_blank", "width=960,height=720");
    if (!popup) {
      setError("Print window block ho gayi. Browser pop-ups allow karke dobara try karein.");
      return;
    }
    const recipientName = escapeHtml(certificate.userName || users.find((user) => user.uid === certificate.userId)?.fullName || "Green Pakistan member");
    const certificateTitle = escapeHtml(certificate.title || "Achievement Certificate");
    const certificateNumber = escapeHtml(certificate.certificateNumber || certificate.id);
    const issuedDate = escapeHtml(displayDate(certificate.issuedAt));
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${certificateTitle}</title><style>body{margin:0;padding:36px;font-family:Arial,sans-serif;color:#183629}.certificate{min-height:590px;box-sizing:border-box;border:12px double #23945b;padding:60px 48px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.brand{letter-spacing:4px;color:#23945b;font-size:14px;font-weight:bold}.label{margin-top:45px;color:#648074;text-transform:uppercase;letter-spacing:5px;font-size:13px}.name{font-family:Georgia,serif;font-size:48px;margin:20px 0;color:#183629}.title{font-size:21px;color:#38644e}.rule{width:140px;border-top:2px solid #23945b;margin:28px}.meta{display:flex;justify-content:space-between;gap:120px;margin-top:56px;text-align:left;color:#52705f;font-size:13px}.meta strong{display:block;color:#183629;margin-top:7px}@media print{body{padding:0}.certificate{min-height:100vh}}</style></head><body><main class="certificate"><div class="brand">GREEN PAKISTAN</div><div class="label">Certificate of Achievement</div><h1 class="name">${recipientName}</h1><div class="title">${certificateTitle}</div><div class="rule"></div><p>In recognition of your valuable contribution to a greener Pakistan.</p><div class="meta"><div>Certificate number<strong>${certificateNumber}</strong></div><div>Date issued<strong>${issuedDate}</strong></div></div></main><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
    popup.opener = null;
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page">
    <div className="users-header"><div><p className="eyebrow">COMMUNITY RECOGNITION</p><h1>Certificates</h1><p className="muted">Issue a certificate, notify its recipient in the app, and print or save a PDF copy.</p></div><div className="user-count"><strong>{certificates.length}</strong><span>Issued certificates</span></div></div>
    {error && <div className="error-banner"><Award size={17} />{error}</div>}
    <div className="certificate-layout">
      <form className="certificate-issue-form" onSubmit={(event) => void handleIssue(event)}>
        <div className="panel-heading"><div><h2>Issue certificate</h2><p className="muted">The certificate record and recipient notification are saved together.</p></div><Award size={20} className="panel-icon" /></div>
        <label>Registered user<select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} required disabled={loading}><option value="">Select a user...</option>{users.map((user) => <option key={user.uid} value={user.uid}>{user.fullName}{user.email ? ` — ${user.email}` : ""}</option>)}</select></label>
        <label>Certificate title<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} placeholder="e.g. Tree Planting Achievement" /></label>
        <p className="muted">Recipient ko in-app notification milegi. Unki app ke Certificates section mein record available hoga; yahan se printable copy bhi bana sakte hain.</p>
        <button className="primary-button" type="submit" disabled={sending || loading || users.length === 0}><Send size={15} />{sending ? "Issuing..." : "Issue & notify recipient"}</button>
        {success && <p className="form-success" role="status">{success}</p>}
      </form>
      <section className="panel certificate-records"><div className="panel-heading"><div><h2>Issued certificates</h2><p className="muted">Saved certificate records and their recipients</p></div><button className="select-button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button></div>
        {loading ? <div className="notification-empty"><LoaderCircle size={20} className="spin" />Loading certificates...</div> : sortedCertificates.length === 0 ? <div className="notification-empty"><Award size={23} /><span>No certificates issued yet</span></div> : <div className="certificate-list">{sortedCertificates.map((certificate) => <article className="certificate-record" key={certificate.id}><span className="certificate-record-icon"><Award size={17} /></span><div className="certificate-record-details"><strong>{certificate.title || "Achievement Certificate"}</strong><p>{certificate.userName || users.find((user) => user.uid === certificate.userId)?.fullName || certificate.userId}</p><small>{certificate.certificateNumber || certificate.id} · {displayDate(certificate.issuedAt)}</small></div><button className="select-button" onClick={() => printCertificate(certificate)}><Printer size={14} /> Print / Save PDF</button></article>)}</div>}
      </section>
    </div>
  </div></main></AuthGuard>;
}