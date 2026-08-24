"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import { Leaf, LoaderCircle, MapPin, Search, TreePine } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchTrees } from "@/lib/firestore";
import type { Tree } from "@/types";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TreesPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTrees() {
    setLoading(true);
    setError("");
    try { setTrees((await fetchTrees()) as unknown as Tree[]); } catch { setError("Trees load nahi ho sake. Firestore connection check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadTrees(); }, []);

  const filteredTrees = useMemo(() => trees.filter((tree) => {
    const term = search.toLowerCase();
    return tree.treeName?.toLowerCase().includes(term) || tree.species?.toLowerCase().includes(term) || tree.ownerId?.toLowerCase().includes(term) || tree.healthStatus?.toLowerCase().includes(term);
  }), [search, trees]);

  const locatedTrees = filteredTrees.filter((tree) => Number.isFinite(tree.lat) && Number.isFinite(tree.lng));
  const mapCenter = locatedTrees.length ? { latitude: locatedTrees[0].lat, longitude: locatedTrees[0].lng, zoom: 5.5 } : { latitude: 30.3753, longitude: 69.3451, zoom: 4.5 };

  return <AuthGuard><main className="admin-shell"><div className="users-page"><div className="users-header"><div><p className="eyebrow">GREEN COVER</p><h1>Tree registry</h1><p className="muted">Explore every registered tree and its planting location.</p></div><div className="user-count"><strong>{trees.length}</strong><span>Registered trees</span></div></div>{error && <div className="error-banner"><MapPin size={17} />{error}</div>}<section className="tree-map-panel"><div className="panel-heading"><div><h2>Planting locations</h2><p className="muted">{locatedTrees.length} of {trees.length} trees have GPS coordinates</p></div><button className="select-button" onClick={() => void loadTrees()}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{mapboxToken ? <div className="tree-map"><Map mapboxAccessToken={mapboxToken} initialViewState={mapCenter} mapStyle="mapbox://styles/mapbox/outdoors-v12" onClick={() => setSelectedTree(null)}><NavigationControl position="bottom-right" />{locatedTrees.map((tree) => <Marker key={tree.id} latitude={tree.lat} longitude={tree.lng} anchor="bottom" onClick={(event) => { event.originalEvent.stopPropagation(); setSelectedTree(tree); }}><button className="tree-marker" aria-label={`View ${tree.treeName || "tree"}`}><Leaf size={16} /></button></Marker>)}{selectedTree && <Popup latitude={selectedTree.lat} longitude={selectedTree.lng} anchor="bottom" closeButton onClose={() => setSelectedTree(null)}><strong>{selectedTree.treeName || "Registered tree"}</strong><br />{selectedTree.species || "Species not recorded"}<br /><small>{selectedTree.healthStatus || "Health status unknown"}</small></Popup>}</Map></div> : <div className="map-missing"><MapPin size={25} /><strong>Mapbox token missing</strong><p>Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to view locations.</p></div>}</section><div className="tree-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tree, species, owner or health" /></div></div><div className="users-table-wrap"><table className="users-table"><thead><tr><th>Tree</th><th>Species</th><th>Health</th><th>Owner</th><th>Coordinates</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="empty-state">Loading trees...</td></tr> : filteredTrees.length === 0 ? <tr><td colSpan={5} className="empty-state"><TreePine size={25} /><br />No registered trees found</td></tr> : filteredTrees.map((tree) => <tr key={tree.id}><td><div className="user-cell"><span className="tree-avatar"><TreePine size={16} /></span><strong>{tree.treeName || "Unnamed tree"}</strong></div></td><td>{tree.species || "Not recorded"}</td><td><span className={`status-pill ${tree.healthStatus?.toLowerCase() === "healthy" ? "active" : "banned"}`}>{tree.healthStatus || "Unknown"}</span></td><td>{tree.ownerId || "Unknown owner"}</td><td>{Number.isFinite(tree.lat) && Number.isFinite(tree.lng) ? `${tree.lat.toFixed(4)}, ${tree.lng.toFixed(4)}` : "No GPS data"}</td></tr>)}</tbody></table></div></div></main></AuthGuard>;
}