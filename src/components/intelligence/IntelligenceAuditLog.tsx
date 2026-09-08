import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  Clock, 
  User, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { IntelligenceAuditEntry } from '../../types/intelligence';

interface IntelligenceAuditLogProps {
  id?: string;
  logs: IntelligenceAuditEntry[];
  loading?: boolean;
}

export const IntelligenceAuditLog: React.FC<IntelligenceAuditLogProps> = ({
  id = 'intelligence-audit-log',
  logs = [],
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 w-full bg-gray-50 dark:bg-gray-800/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Audit Trail & Log Tindakan Administratif (Immutable)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Setiap aksi sensitif, perubahan status keamanan, pembaruan rilis, dan kontrol darurat tercatat secara permanen
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari log atau aktor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Waktu & Request ID</th>
                <th className="py-3.5 px-4 font-semibold">Aktor</th>
                <th className="py-3.5 px-4 font-semibold">Aksi</th>
                <th className="py-3.5 px-4 font-semibold">Entitas Target</th>
                <th className="py-3.5 px-4 font-semibold">Alasan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400 truncate max-w-[140px]">
                        {log.requestId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-medium">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {log.actorName || log.actorId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        {log.entityType}:{log.entityId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
