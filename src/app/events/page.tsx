"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { FormEvent, useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { CalendarDays, ImagePlus, LoaderCircle, MapPin, Plus, Trash2, Users } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { addEvent, deleteEvent, fetchEvents } from "@/lib/firestore";
import { uploadImage } from "@/lib/cloudinary";
import type { Event } from "@/types";

const initialForm = { title: "", location: "", date: "", time: "", imageUrl: "" };
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadEvents() { setLoading(true); setError(""); try { setEvents((await fetchEvents()) as Event[]); } catch { setError("Events load nahi ho sake. Firestore connection aur rules check karein."); } finally { setLoading(false); } }
  useEffect(() => { void loadEvents(); }, []);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); try { await addEvent({ ...form, attendeesCount: 0 }); setForm(initialForm); await loadEvents(); } catch { setError("Event save nahi ho saka. Firestore permissions check karein."); } finally { setSaving(false); } }
  async function handleImageUpload(file: File) { setUploading(true); setError(""); try { const imageUrl = await uploadImage(file); setForm((current) => ({ ...current, imageUrl })); } catch { setError("Image upload nahi ho saki. Cloudinary settings check karein."); } finally { setUploading(false); } }
  async function removeEvent(event: Event) { if (!window.confirm(`Delete ${event.title || "this event"}?`)) return; setDeleting(event.id); try { await deleteEvent(event.id); setEvents((current) => current.filter((item) => item.id !== event.id)); } catch { setError("Event delete nahi ho saka."); } finally { setDeleting(null); } }
  function chooseLocation(event: { lngLat: { lng: number; lat: number } }) { setForm((current) => ({ ...current, location: `${event.lngLat.lat.toFixed(5)}, ${event.lngLat.lng.toFixed(5)}` })); }
  const coordinates = form.location.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  const marker = coordinates ? { latitude: Number(coordinates[1]), longitude: Number(coordinates[2]) } : null;

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">CAMPAIGN MANAGER</p><h1>Events</h1><p className="muted">Coordinate planting drives and keep the community moving together.</p></div><div className="user-count"><strong>{events.length}</strong><span>Published events</span></div></div><div className="event-layout"><form onSubmit={handleSubmit} className="event-form"><div className="panel-heading"><div><h2>Create event</h2><p className="muted">Add a new community planting drive.</p></div><CalendarDays size={19} className="panel-icon" /></div><label>Event title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="e.g. Islamabad Green Drive" /></label><label>Location<div className="event-input"><MapPin size={15} /><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required placeholder="Enter city or click map" /></div></label>{mapboxToken && <div className="event-picker"><Map mapboxAccessToken={mapboxToken} initialViewState={{ latitude: 30.3753, longitude: 69.3451, zoom: 4 }} mapStyle="mapbox://styles/mapbox/outdoors-v12" onClick={chooseLocation}><NavigationControl position="bottom-right" />{marker && <Marker {...marker} anchor="bottom"><MapPin size={25} color="#e74c3c" fill="#e74c3c" /></Marker>}</Map></div>}<div className="form-two-col"><label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label><label>Time<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required /></label></div><label>Event image <span className="optional">optional</span><input className="file-input" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImageUpload(file); }} disabled={uploading} />{uploading && <small className="upload-status">Uploading image...</small>}{form.imageUrl && <small className="upload-status">Image ready</small>}</label><label>Image URL <span className="optional">or paste URL</span><div className="event-input"><ImagePlus size={15} /><input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." /></div></label><button className="primary-button" disabled={saving || uploading}><Plus size={16} />{saving ? "Publishing..." : "Publish event"}</button></form><section><div className="challenge-list-heading"><div><h2>Upcoming events</h2><p className="muted">{events.length} events in Firestore</p></div><button className="select-button" onClick={() => void loadEvents()}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{error && <div className="error-banner"><CalendarDays size={16} />{error}</div>}{loading ? <div className="challenge-empty">Loading events...</div> : events.length === 0 ? <div className="challenge-empty"><CalendarDays size={26} /><span>No events yet</span></div> : <div className="event-cards">{events.map((item) => <article className="event-card" key={item.id}>{item.imageUrl ? <div className="event-image" style={{ backgroundImage: `url(${item.imageUrl})` }} /> : <div className="event-image event-image-fallback"><CalendarDays size={28} /></div>}<div className="event-card-body"><div className="event-card-date">{item.date || "Date not set"} · {item.time || "Time not set"}</div><h3>{item.title || "Untitled event"}</h3><p><MapPin size={13} />{item.location || "Location not set"}</p><div className="event-card-footer"><span><Users size={14} />{item.attendeesCount || 0} joined</span><button className="table-action delete" title="Delete event" onClick={() => void removeEvent(item)} disabled={deleting === item.id}><Trash2 size={15} /></button></div></div></article>)}</div>}</section></div></div></main></AuthGuard>;
}
