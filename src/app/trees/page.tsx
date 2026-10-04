"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import { Download, FileText, Leaf, LoaderCircle, MapPin, Search, TreePine } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchTrees } from "@/lib/firestore";
import type { Tree } from "@/types";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function coordinate(tree: Record<string, unknown>, primary: string, alternate: string) {
  const raw = tree[primary] ?? tree[alternate];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) ? value : null;
}

function normalizeTree(value: Record<string, unknown>): Tree {
  const lat = coordinate(value, "latitude", "lat");
  const lng = coordinate(value, "longitude", "lng");
  return {
    ...value,
    id: String(value.id || ""),
    treeName: String(value.treeName || value.name || ""),
    species: String(value.species || ""),
    healthStatus: String(value.healthStatus || ""),
    imageUrl: String(value.imageUrl || ""),
    ownerId: String(value.ownerId || value.userId || ""),
    lat: lat !== null && lat >= -90 && lat <= 90 ? lat : Number.NaN,
    lng: lng !== null && lng >= -180 && lng <= 180 ? lng : Number.NaN,
  } as Tree;
}

function exportValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function downloadFile(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TreesPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTrees() {
    setLoading(true);
    setError("");
    try { setTrees((await fetchTrees() as Record<string, unknown>[]).map(normalizeTree)); } catch { setError("Trees load nahi ho sake. Firestore connection check karein."); } finally { setLoading(false); }
  }

  useEffect(() => { void loadTrees(); }, []);

  const filteredTrees = useMemo(() => trees.filter((tree) => {
    const term = search.toLowerCase();
    return tree.treeName?.toLowerCase().includes(term) || tree.species?.toLowerCase().includes(term) || tree.ownerId?.toLowerCase().includes(term) || tree.healthStatus?.toLowerCase().includes(term);
  }), [search, trees]);

  const locatedTrees = filteredTrees.filter((tree) => Number.isFinite(tree.lat) && Number.isFinite(tree.lng));
  const mapCenter = locatedTrees.length ? { latitude: locatedTrees[0].lat, longitude: locatedTrees[0].lng, zoom: 5.5 } : { latitude: 30.3753, longitude: 69.3451, zoom: 4.5 };

  async function downloadTrees(format: "xlsx" | "docx") {
    const fields = Array.from(new Set(trees.flatMap((tree) => Object.keys({ ...(tree as unknown as Record<string, unknown>) }))));
    const headers = Array.from(new Set([...fields, "latitude", "longitude"]));
    const rows = trees.map((tree) => {
      const row: Record<string, unknown> = { ...(tree as unknown as Record<string, unknown>) };
      return Object.fromEntries(headers.map((field) => [
        field,
        field === "latitude" ? (Number.isFinite(tree.lat) ? tree.lat : "")
          : field === "longitude" ? (Number.isFinite(tree.lng) ? tree.lng : "")
            : exportValue(row[field]),
      ]));
    });
    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Trees");
      const file = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      downloadFile(new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "registered-trees.xlsx");
      return;
    }
    const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } = await import("docx");
    const document = new Document({ sections: [{ children: [
      new Paragraph({ text: "Registered tree registry", heading: "Heading1" }),
      new Paragraph({ text: `${trees.length} registered trees · coordinates are latitude, longitude` }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headers, ...rows.map((row) => headers.map((header) => exportValue(row[header])))].map((row) => new TableRow({
          children: row.map((cell) => new TableCell({ children: [new Paragraph(String(cell))] })),
        })),
      }),
    ] }] });
    downloadFile(await Packer.toBlob(document), "registered-trees.docx");
  }

  return (
    <AuthGuard>
      <main className="admin-shell">
        <div className="users-page">
          <div className="users-header">
            <div>
              <p className="eyebrow">GREEN COVER</p>
              <h1>Tree registry</h1>
              <p className="muted">Explore registered trees, locations and download the complete registry.</p>
            </div>
            <div className="user-count"><strong>{trees.length}</strong><span>Registered trees</span></div>
          </div>
          {error && <div className="error-banner"><MapPin size={17} />{error}</div>}

          <section className="tree-map-panel">
            <div className="panel-heading">
              <div><h2>Planting locations</h2><p className="muted">{locatedTrees.length} of {filteredTrees.length} filtered trees have valid GPS coordinates</p></div>
              <button className="select-button" onClick={() => void loadTrees()} disabled={loading}><LoaderCircle size={15} className={loading ? "spin" : ""} /> Refresh</button>
            </div>
            {mapboxToken ? (
              <div className="tree-map">
                <Map key={`${mapCenter.latitude}-${mapCenter.longitude}-${locatedTrees.length}`} mapboxAccessToken={mapboxToken} initialViewState={mapCenter} mapStyle="mapbox://styles/mapbox/outdoors-v12" onClick={() => setSelectedTree(null)}>
                  <NavigationControl position="bottom-right" />
                  {locatedTrees.map((tree) => <Marker key={tree.id} latitude={tree.lat} longitude={tree.lng} anchor="bottom" onClick={(event) => { event.originalEvent.stopPropagation(); setSelectedTree(tree); }}><button className="tree-marker" aria-label={`View ${tree.treeName || "tree"}`}><Leaf size={16} /></button></Marker>)}
                  {selectedTree && <Popup latitude={selectedTree.lat} longitude={selectedTree.lng} anchor="bottom" closeButton onClose={() => setSelectedTree(null)}><strong>{selectedTree.treeName || "Registered tree"}</strong><br />{selectedTree.species || "Species not recorded"}<br /><small>{selectedTree.healthStatus || "Health status unknown"}</small><br /><small>{selectedTree.lat}, {selectedTree.lng}</small></Popup>}
                </Map>
              </div>
            ) : <div className="map-missing"><MapPin size={25} /><strong>Mapbox token missing</strong><p>Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to view locations.</p></div>}
          </section>

          <div className="tree-toolbar">
            <div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tree, species, owner or health" /></div>
            <div className="tree-export-actions">
              <button className="select-button" onClick={() => void downloadTrees("xlsx")} disabled={loading || trees.length === 0}><Download size={15} /> Excel .xlsx</button>
              <button className="select-button" onClick={() => void downloadTrees("docx")} disabled={loading || trees.length === 0}><FileText size={15} /> Word .docx</button>
            </div>
          </div>
          <section>
            <div className="tree-list-heading"><div><h2>Registered trees</h2><p className="muted">{filteredTrees.length} trees shown · coordinates are latitude, longitude</p></div></div>
            <div className="users-table-wrap"><table className="users-table"><thead><tr><th>Tree</th><th>Species</th><th>Health</th><th>Owner</th><th>Coordinates (lat, lng)</th></tr></thead><tbody>
              {loading ? <tr><td colSpan={5} className="empty-state">Loading trees...</td></tr> : filteredTrees.length === 0 ? <tr><td colSpan={5} className="empty-state"><TreePine size={25} /><br />No registered trees found</td></tr> : filteredTrees.map((tree) => <tr key={tree.id}><td><div className="user-cell"><span className="tree-avatar"><TreePine size={16} /></span><strong>{tree.treeName || "Unnamed tree"}</strong></div></td><td>{tree.species || "Not recorded"}</td><td><span className={`status-pill ${tree.healthStatus?.toLowerCase() === "healthy" ? "active" : "banned"}`}>{tree.healthStatus || "Unknown"}</span></td><td>{tree.ownerId || "Unknown owner"}</td><td>{Number.isFinite(tree.lat) && Number.isFinite(tree.lng) ? `${tree.lat.toFixed(6)}, ${tree.lng.toFixed(6)}` : "No GPS data"}</td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}