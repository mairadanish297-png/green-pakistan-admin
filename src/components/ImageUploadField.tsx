"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";

export default function ImageUploadField({ value, onChange, label = "Image" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function selectFile(file?: File) {
    if (!file) return;
    setUploading(true); setError("");
    try { onChange(await uploadImage(file)); } catch { setError("Image upload failed. Check Cloudinary settings."); } finally { setUploading(false); }
  }

  return <div className="upload-field"><label>{label}</label><div className="upload-row"><label className="upload-picker"><ImagePlus size={15} />{uploading ? <><LoaderCircle size={14} className="spin" /> Uploading...</> : "Choose image"}<input type="file" accept="image/*" onChange={(event) => void selectFile(event.target.files?.[0])} disabled={uploading} /></label>{value && <span className="upload-ready">Image ready</span>}</div>{error && <small className="form-error">{error}</small>}</div>;
}
