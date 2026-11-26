import React, { useEffect, useState } from 'react';
import { Check, Copy, Database, X } from 'lucide-react';

interface SchemaSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export function SchemaSetupModal({ open, onClose }: SchemaSetupModalProps) {
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || sql) return;
    setLoading(true);
    fetch('/api/schema-sql')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.sql === 'string') {
          setSql(data.sql);
        }
      })
      .catch(() => {
        setSql('-- Gagal memuat file supabase/schema.sql dari server.');
      })
      .finally(() => setLoading(false));
  }, [open, sql]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h2 id="schema-modal-title" className="text-base font-bold text-zinc-900">
                Skema Database Supabase (schema.sql)
              </h2>
              <p className="text-xs text-zinc-500">
                Salin dan jalankan script berikut di Supabase Dashboard → SQL Editor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
            aria-label="Tutup modal skema"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-xs text-zinc-700">
            <span>
              Script ini membuat tabel <code className="font-mono font-semibold">profiles</code>,{' '}
              <code className="font-mono font-semibold">students</code>,{' '}
              <code className="font-mono font-semibold">employee_attendances</code>,{' '}
              <code className="font-mono font-semibold">student_attendances</code>, kebijakan RLS, serta
              trigger otomatis agar pengguna pertama menjadi <strong>Admin</strong>.
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!sql || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Tersalin' : 'Salin SQL'}
            </button>
          </div>

          <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            {loading ? 'Memuat schema.sql...' : sql}
          </pre>
        </div>
      </div>
    </div>
  );
}
