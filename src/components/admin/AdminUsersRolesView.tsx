import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Edit3, Trash2, 
  CheckCircle2, X, Save, RefreshCw, Key
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types';
import { fetchAdminUsers, saveAdminUser, deleteAdminUser, ROLE_PERMISSIONS } from '../../services/admin/adminRolesService';
import { logAdminAction } from '../../services/admin/auditLogService';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin (Akses Penuh)',
  admin: 'Administrator',
  moderator: 'Moderator (Laporan & Review)',
  content_manager: 'Content Manager (Aplikasi & Kategori)',
  analyst: 'Analyst (Hanya Lihat Analisis)'
};

export default function AdminUsersRolesView() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setAdmins(data);
    } catch (err) {
      console.warn('Failed loading admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateNew = () => {
    setIsNew(true);
    setEditingUser({
      id: `admin_${Date.now()}`,
      email: '',
      displayName: '',
      role: 'admin',
      permissions: ROLE_PERMISSIONS.admin,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  };

  const handleRoleChange = (role: AdminRole) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      role,
      permissions: ROLE_PERMISSIONS[role]
    });
  };

  const handleSave = async (user: AdminUser) => {
    if (!user.email.trim() || !user.displayName.trim()) {
      setMessage({ text: 'Nama dan email administrator wajib diisi.', type: 'error' });
      return;
    }

    try {
      await saveAdminUser(user);
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'security',
        entityId: user.id,
        entityName: user.displayName,
        metadata: { role: user.role, email: user.email, isNew }
      });

      setMessage({ text: 'Data akun administrator berhasil disimpan.', type: 'success' });
      setEditingUser(null);
      loadAdmins();
    } catch (err) {
      setMessage({ text: 'Gagal menyimpan akun administrator.', type: 'error' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (admins.length <= 1) {
      setMessage({ text: 'Tidak dapat menghapus akun administrator terakhir.', type: 'error' });
      return;
    }

    try {
      await deleteAdminUser(id);
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'security',
        entityId: id,
        entityName: name,
        metadata: { deleted: true }
      });
      setMessage({ text: 'Akun administrator berhasil dihapus.', type: 'success' });
      loadAdmins();
    } catch (err) {
      setMessage({ text: 'Gagal menghapus akun administrator.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Manajemen Akun Administrator & Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola peran Super Admin, Admin, Moderator, Content Manager, serta matriks perizinan operasional sistem.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Administrator</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Admin Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Memuat data administrator...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Nama & Email</th>
                  <th className="px-5 py-3 font-bold">Peran (Role)</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Terakhir Masuk</th>
                  <th className="px-5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{admin.displayName}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{admin.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                        admin.role === 'super_admin'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : admin.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {ROLE_LABELS[admin.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Aktif
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(admin.lastLoginAt || admin.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setIsNew(false);
                            setEditingUser(admin);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id, admin.displayName)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Admin Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isNew ? 'Tambah Administrator Baru' : `Edit Akun: ${editingUser.displayName}`}
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Administrator *
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tingkat Peran (Role RBAC) *
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                  <option value="admin">Administrator</option>
                  <option value="moderator">Moderator</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hak Akses Terpetakan ({editingUser.permissions.length} Izin Aktif)
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 max-h-32 overflow-y-auto flex flex-wrap gap-1.5">
                  {editingUser.permissions.map(perm => (
                    <span key={perm} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSave(editingUser)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
