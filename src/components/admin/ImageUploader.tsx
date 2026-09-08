import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  type: 'icon' | 'screenshot' | 'banner';
  onUpload: (url: string) => void;
  currentUrl?: string;
  label: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  type,
  onUpload,
  currentUrl,
  label
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    
    // Check extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setError('Format file tidak didukung. Gunakan JPG, JPEG, PNG, WebP, atau AVIF.');
      return;
    }

    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedMimeTypes.includes(file.type)) {
      setError('Tipe file tidak didukung. Gunakan JPG, JPEG, PNG, WebP, atau AVIF.');
      return;
    }

    // Check size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Ukuran gambar melebihi batas maksimal 10MB.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      // If there is an existing image, delete it from Cloudinary before uploading the replacement
      if (currentUrl) {
        try {
          await fetch('/api/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: currentUrl }),
          });
        } catch (delErr) {
          console.error('[Cloudinary] Failed to delete old image during replacement:', delErr);
        }
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengunggah gambar.');
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunggah gambar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (currentUrl) {
      try {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl }),
        });
      } catch (delErr) {
        console.error('[Cloudinary] Failed to delete image during removal:', delErr);
      }
    }
    onUpload('');
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label} <span className="text-red-500">*</span>
        </label>
        {currentUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] text-red-500 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      {currentUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex items-center justify-center p-2">
          {type === 'icon' ? (
            <img
              src={currentUrl}
              alt="Uploaded Icon"
              className="w-16 h-16 rounded-xl object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : type === 'banner' ? (
            <img
              src={currentUrl}
              alt="Uploaded Banner"
              className="w-full h-32 rounded-xl object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img
              src={currentUrl}
              alt="Uploaded Screenshot"
              className="max-h-48 rounded-xl object-contain shadow-sm"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
            <button
              type="button"
              onClick={onButtonClick}
              className="px-3 py-1.5 bg-white text-slate-950 font-black rounded-lg text-[10px] shadow-md hover:bg-slate-100 cursor-pointer"
            >
              Ganti Gambar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-24 ${
            dragActive
              ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
              : 'border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-slate-450">Mengunggah...</span>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 text-slate-400 mb-1" />
              <p className="text-[10.5px] font-black text-slate-700 dark:text-slate-300">
                Pilih atau seret gambar ke sini
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Maks. 10MB (JPG, PNG, WebP, AVIF)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept=".jpg,.jpeg,.png,.webp,.avif"
        className="hidden"
      />
    </div>
  );
};
