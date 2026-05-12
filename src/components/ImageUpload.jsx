import { useState, useRef, useCallback, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import {
  UploadCloud, X, Loader2, CheckCircle, AlertCircle, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COMPRESSED_MB = 4; // hard limit AFTER compression

// ─── Format bytes ─────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// ─── Exported compressImage function ─────────────────────────────────────────
/**
 * compressImage(file)
 *
 * Compresses any image to ≤1 MB, max 1200px, WebP output.
 * Uses browser-image-compression with Web Worker for non-blocking UI.
 *
 * @param   {File} file  — original File (any size, jpg/png/webp)
 * @returns {Promise<File>} compressed file
 */
export async function compressImage(file, { maxSizeMB = 1 } = {}) {
  const options = {
    maxSizeMB,
    maxWidthOrHeight:   1200,
    useWebWorker:       true,
    fileType:           'image/webp',
    initialQuality:     0.8,
    alwaysKeepResolution: false,
  };

  try {
    const compressed = await imageCompression(file, options);
    return new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, '.webp'),
      { type: 'image/webp' }
    );
  } catch (err) {
    console.warn('[compressImage] Falling back to original:', err);
    return file;
  }
}

// ─── ImageUpload Component ────────────────────────────────────────────────────
/**
 * Props:
 *  bucket     — Supabase storage bucket name
 *  folder     — Sub-folder inside bucket (e.g. 'images')
 *  currentUrl — Existing image URL (shown as initial preview)
 *  onUpload   — Callback(publicUrl: string | null)
 *  shape      — 'square' | 'circle'
 *  label      — Label above drop zone
 *  disabled   — Disable all interaction
 */
export default function ImageUpload({
  bucket,
  folder     = '',
  currentUrl = null,
  onUpload,
  maxSizeMB  = 1,    // ← now actually used
  shape      = 'square',
  label      = 'Upload Image',
  disabled   = false,
}) {
  const [preview,     setPreview]     = useState(currentUrl);
  const [compressing, setCompressing] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [sizeInfo,    setSizeInfo]    = useState(null);
  const [error,       setError]       = useState(null);
  const fileRef = useRef(null);

  // BUG FIX: sync preview when parent passes a new currentUrl (e.g. edit modal re-opens)
  useEffect(() => {
    setPreview(currentUrl ?? null);
    setSizeInfo(null);
    setError(null);
  }, [currentUrl]);

  const isCircle = shape === 'circle';
  const isBusy   = compressing || uploading;

  // ─── Main pipeline: compress FIRST, validate AFTER ───────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file || disabled || isBusy) return;

    setError(null);
    setSizeInfo(null);

    // ── Type check (only format check, NOT size) ──────────────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = `"${file.type}" not supported. Use JPG, PNG or WebP.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    // ── Show local preview immediately ────────────────────────────────────
    const localObjectUrl = URL.createObjectURL(file);
    setPreview(localObjectUrl);

    // ── Step 1: Compress (NO size rejection before this) ─────────────────
    setCompressing(true);
    let compressed;
    try {
      compressed = await compressImage(file, { maxSizeMB });  // ← pass prop
    } catch (err) {
      setCompressing(false);
      setPreview(currentUrl);
      toast.error('Compression failed: ' + err.message);
      return;
    }
    setCompressing(false);

    const beforeBytes = file.size;
    const afterBytes  = compressed.size;
    const savedPct    = Math.max(0, Math.round((1 - afterBytes / beforeBytes) * 100));
    setSizeInfo({ before: fmt(beforeBytes), after: fmt(afterBytes), saved: savedPct });

    // ── Step 2: Post-compression size guard ───────────────────────────────
    if (afterBytes > MAX_COMPRESSED_MB * 1024 * 1024) {
      const msg = `Even after compression the file is ${fmt(afterBytes)}. Please use a smaller image.`;
      setError(msg);
      toast.error(msg);
      setPreview(currentUrl);
      setSizeInfo(null);
      return;
    }

    // ── Step 3: Upload compressed file ────────────────────────────────────
    setUploading(true);
    try {
      const ext      = compressed.type === 'image/webp' ? 'webp' : 'jpg';
      const name     = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = folder ? `${folder.replace(/\/$/, '')}/${name}` : name;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressed, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      URL.revokeObjectURL(localObjectUrl);
      if (onUpload) onUpload(publicUrl);
      toast.success('Image uploaded!');
    } catch (err) {
      console.error('[ImageUpload] Upload error:', err);
      const msg = 'Upload failed: ' + err.message;
      setError(msg);
      toast.error(msg);
      setPreview(currentUrl);
      setSizeInfo(null);
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, currentUrl, onUpload, disabled, isBusy, maxSizeMB]);

  // ─── Drag handlers ────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); if (!disabled) setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setSizeInfo(null);
    setError(null);
    if (onUpload) onUpload(null);
  };

  // ─── Status line ──────────────────────────────────────────────────────────
  const Status = () => {
    if (compressing) return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compressing image…
      </span>
    );
    if (uploading) return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
      </span>
    );
    if (error) return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
      </span>
    );
    if (sizeInfo) return (
      <span className="flex items-center flex-wrap gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        {sizeInfo.before}
        <ArrowRight className="w-3 h-3 shrink-0" />
        {sizeInfo.after}
        {sizeInfo.saved > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            −{sizeInfo.saved}% saved
          </span>
        )}
      </span>
    );
    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col ${isCircle ? 'items-center' : ''} gap-2`}>
      {/* Label + status row */}
      {!isCircle && (
        <div className="flex items-center justify-between flex-wrap gap-2 min-h-[22px]">
          {label && <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>}
          <Status />
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !isBusy && fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && !isBusy && fileRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center overflow-hidden transition-all duration-200 select-none',
          isCircle
            ? 'w-24 h-24 rounded-full'
            : 'w-full h-36 rounded-2xl border-2 border-dashed',
          disabled || isBusy ? 'cursor-not-allowed' : 'cursor-pointer',
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
            : error
              ? 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10'
              : preview
                ? 'border-emerald-400/50 dark:border-emerald-700/50'
                : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
          disabled ? 'opacity-50' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay */}
        <div className={[
          'absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity rounded-[inherit]',
          preview && !isBusy ? 'opacity-0 hover:opacity-100 bg-black/50' : 'opacity-100',
        ].join(' ')}>
          {isBusy ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={`${isCircle ? 'w-6 h-6' : 'w-8 h-8'} text-white animate-spin`} />
              {!isCircle && (
                <span className="text-xs font-semibold text-white drop-shadow">
                  {compressing ? 'Compressing…' : 'Uploading…'}
                </span>
              )}
            </div>
          ) : preview ? (
            <>
              <UploadCloud className={`${isCircle ? 'w-5 h-5' : 'w-7 h-7'} text-white drop-shadow`} />
              {!isCircle && <span className="text-xs font-semibold text-white drop-shadow">Replace image</span>}
            </>
          ) : (
            <>
              <UploadCloud className={`${isCircle ? 'w-7 h-7' : 'w-10 h-10'} text-gray-400 dark:text-gray-500`} />
              {!isCircle && (
                <>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center px-4">
                    Drag &amp; drop or{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    JPG · PNG · WebP — auto-compressed to WebP
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Any size accepted
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* Clear button */}
        {preview && !isCircle && !isBusy && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Success tick */}
        {preview && !isCircle && !isBusy && !error && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Circle status */}
      {isCircle && (compressing || uploading) && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {compressing ? 'Compressing…' : 'Uploading…'}
        </span>
      )}

      {/* Hidden file input — no accept size restriction, type only */}
      <input
        type="file"
        ref={fileRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isBusy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
