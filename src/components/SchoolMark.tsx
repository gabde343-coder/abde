import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export function SchoolMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  return (
    <div
      className={`${dim} shrink-0 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L3 8l9 5 9-5-9-5z" strokeLinejoin="round" />
        <path d="M5 11.5v5.25C5 18.5 8.1 20 12 20s7-1.5 7-3.25V11.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-red-50 border border-zinc-200 text-zinc-600 p-6 ${className}`}
      >
        <Building2 className="h-8 w-8 text-red-600 mb-2" />
        <span className="text-sm font-semibold text-zinc-800 text-center">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
