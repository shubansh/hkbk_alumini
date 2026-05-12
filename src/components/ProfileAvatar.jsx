import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

/**
 * ProfileAvatar — Circular avatar with click-to-upload.
 * Uploads to `avatars` bucket and saves URL to profiles table.
 *
 * Props:
 *  userId    — auth user id (used for DB update + fallback initial)
 *  url       — existing avatar_url from DB
 *  name      — user's name (for initial fallback)
 *  onUpload  — callback(newUrl) after successful upload
 *  size      — 'sm' | 'md' | 'lg' | 'xl'
 *  editable  — show upload on hover (default true)
 */
export default function ProfileAvatar({
  userId,
  url,
  name,
  onUpload,
  size = 'md',
  editable = true,
}) {
  const [avatarUrl, setAvatarUrl] = useState(url ?? null);

  useEffect(() => { setAvatarUrl(url ?? null); }, [url]);

  const sizeMap = {
    sm: 'w-8  h-8  text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-3xl',
  };
  const cls = sizeMap[size] ?? sizeMap.md;
  const initial = name?.charAt(0)?.toUpperCase() ?? (userId ? 'U' : '?');

  const handleUploadDone = async (publicUrl) => {
    if (!publicUrl || !userId) return;
    setAvatarUrl(publicUrl);

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to save avatar: ' + error.message);
    } else {
      toast.success('Profile photo updated!');
      if (onUpload) onUpload(publicUrl);
    }
  };

  // Non-editable display (e.g. directory cards, sidebar)
  if (!editable) {
    return (
      <div className={`${cls} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-800 shadow-md`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name ?? 'Avatar'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span className="font-bold text-white">{initial}</span>
        )}
      </div>
    );
  }

  // Editable mode — wraps ImageUpload in circle shape
  return (
    <div className={`${cls} relative shrink-0`}>
      {/* Background fallback circle */}
      {!avatarUrl && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="font-bold text-white">{initial}</span>
        </div>
      )}
      <div className="w-full h-full">
        <ImageUpload
          bucket="avatars"
          folder={userId ?? 'public'}
          currentUrl={avatarUrl}
          onUpload={handleUploadDone}
          shape="circle"
          label=""
          maxSizeMB={2}
        />
      </div>
    </div>
  );
}
