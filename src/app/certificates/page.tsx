"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Download, FileText, Image as ImageIcon, LoaderCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { deleteCertificate, fetchCertificates } from "@/lib/firestore";
import type { Certificate } from "@/types";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadCertificates() {
    setLoading(true); setError("");
    try { setCertificates((await fetchCertificates()) as Certificate[]); } catch { setError("Certificates load nahi ho sake. Firestore connection aur rules check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadCertificates(); }, []);
  const visible = useMemo(() => certificates.filter((certificate) => `${certificate.userId} ${certificate.title || ""} ${certificate.certificateNumber || ""}`.toLowerCase().includes(search.toLowerCase())), [certificates, search]);

  async function removeCertificate(certificate: Certificate) {
    if (!window.confirm("Is certificate ko delete karna hai?")) return;
    setDeleting(certificate.id);
    try { await deleteCertificate(certificate.id); setCertificates((current) => current.filter((item) => item.id !== certificate.id)); } catch { setError("Certificate delete nahi ho saka."); } finally { setDeleting(null); }
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">USER ACHIEVEMENTS</p><h1>Certificates</h1><p className="muted">Review issued certificates and download the original files.</p></div><div className="user-count"><strong>{certificates.length}</strong><span>Issued certificates</span></div></div><div className="users-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by user, title or certificate number" /></div><button className="select-button" onClick={() => void loadCertificates()}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><Award size={16} />{error}</div>}<div className="certificate-grid">{loading ? <div className="challenge-empty">Loading certificates...</div> : visible.length === 0 ? <div className="challenge-empty"><Award size={26} /><span>No certificates found</span></div> : visible.map((certificate) => <article className="certificate-card" key={certificate.id}><div className="certificate-preview">{certificate.imageUrl ? <img src={certificate.imageUrl} alt={certificate.title || "Certificate preview"} /> : <ImageIcon size={34} />}</div><div className="certificate-body"><span className="certificate-number">{certificate.certificateNumber || "Certificate"}</span><h3>{certificate.title || "Green achievement certificate"}</h3><p><strong>User:</strong> {certificate.userId}</p><p><strong>Issued:</strong> {certificate.issuedAt?.toDate ? certificate.issuedAt.toDate().toLocaleDateString() : certificate.issuedAt || "Not recorded"}</p><div className="certificate-actions">{certificate.pdfUrl ? <a className="download-button" href={certificate.pdfUrl} target="_blank" rel="noreferrer"><FileText size={15} /> View PDF</a> : <span className="missing-file"><FileText size={14} /> No PDF link</span>}{certificate.imageUrl && <a className="download-button secondary" href={certificate.imageUrl} download target="_blank" rel="noreferrer"><Download size={15} /> Picture</a>}<button className="table-action delete" title="Delete certificate" onClick={() => void removeCertificate(certificate)} disabled={deleting === certificate.id}><Trash2 size={15} /></button></div></div></article>)}</div></div></main></AuthGuard>;
}
