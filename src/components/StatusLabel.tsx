import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

export function AttendanceStatusText({
  status,
}: {
  status: 'hadir' | 'izin' | 'sakit' | 'alpa';
}) {
  switch (status) {
    case 'hadir':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Hadir
        </span>
      );
    case 'izin':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          Izin
        </span>
      );
    case 'sakit':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Sakit
        </span>
      );
    case 'alpa':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          Alpa
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {status}
        </span>
      );
  }
}
