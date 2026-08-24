"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Image as ImageIcon, LoaderCircle, Search, Trash2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { deletePost, fetchPosts } from "@/lib/firestore";
import type { Post } from "@/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      setPosts((await fetchPosts()) as Post[]);
    } catch {
      setError("Posts load nahi ho sake. Firestore connection aur rules check karein.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPosts(); }, []);

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const term = search.toLowerCase();
    return post.caption?.toLowerCase().includes(term) || post.country?.toLowerCase().includes(term) || post.userId?.toLowerCase().includes(term);
  }), [posts, search]);

  async function removePost(post: Post) {
    if (!window.confirm("Is post ko permanently delete karna hai?")) return;
    setDeleting(post.id);
    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setError("Post delete nahi ho saki. Firestore permissions check karein.");
    } finally {
      setDeleting(null);
    }
  }

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">CONTENT SAFETY</p><h1>Posts moderation</h1><p className="muted">Review community posts and remove content that breaks the rules.</p></div><div className="user-count"><strong>{posts.length}</strong><span>Total posts</span></div></div><div className="users-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by caption, user ID or country" /></div><button className="select-button" onClick={() => void loadPosts()}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><AlertTriangle size={17} />{error}</div>}<div className="posts-grid">{loading ? <div className="posts-empty">Loading posts...</div> : filteredPosts.length === 0 ? <div className="posts-empty">No posts found</div> : filteredPosts.map((post) => <article className="post-card" key={post.id}><div className="post-image" style={{ backgroundImage: post.imageUrl ? `url(${post.imageUrl})` : undefined }}>{!post.imageUrl && <ImageIcon size={28} />}</div><div className="post-body"><div className="post-meta"><span>{post.country || "Pakistan"}</span><small>{post.userId}</small></div><p>{post.caption || "No caption"}</p><div className="post-footer"><span>{post.latitude?.toFixed?.(3) || "-"}, {post.longitude?.toFixed?.(3) || "-"}</span><button className="table-action delete" onClick={() => void removePost(post)} disabled={deleting === post.id} title="Delete post"><Trash2 size={15} /></button></div></div></article>)}</div></div></main></AuthGuard>;
}