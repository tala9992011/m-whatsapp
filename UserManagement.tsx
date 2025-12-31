import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  password: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface UserManagementProps {
  currentUser: User;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'user',
    is_active: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showMessage('error', 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'user',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('app_users')
          .update(formData)
          .eq('id', editingUser.id);

        if (error) throw error;
        showMessage('success', 'تم تحديث المستخدم بنجاح');
      } else {
        const { error } = await supabase
          .from('app_users')
          .insert([formData]);

        if (error) throw error;
        showMessage('success', 'تم إضافة المستخدم بنجاح');
      }

      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      showMessage('error', err.message || 'فشل حفظ المستخدم');
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      showMessage('error', 'لا يمكنك حذف حسابك الخاص');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.full_name}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;
      showMessage('success', 'تم حذف المستخدم بنجاح');
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showMessage('error', 'فشل حذف المستخدم');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">إدارة المستخدمين</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">User Management</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[2rem] font-black text-sm flex items-center gap-3 shadow-2xl shadow-emerald-900/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`rounded-[2.5rem] p-6 flex items-center gap-4 animate-fade-in border-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          )}
          <p className={`text-sm font-bold ${
            message.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">المستخدم</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">اسم الدخول</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">الدور</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">الحالة</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        <Shield className={`w-6 h-6 ${
                          user.role === 'admin' ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{user.full_name}</p>
                        <p className="text-xs text-slate-400 font-bold">{new Date(user.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
                      {user.username}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                      user.role === 'admin'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black border border-emerald-200">
                        <UserCheck className="w-4 h-4" />
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-black border border-rose-200">
                        <UserX className="w-4 h-4" />
                        معطل
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        title="تعديل"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="حذف"
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-slate-900 p-10 flex justify-between items-center rounded-t-[3.5rem]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-[2rem] flex items-center justify-center">
                  {editingUser ? <Edit2 className="w-7 h-7 text-emerald-400" /> : <UserPlus className="w-7 h-7 text-emerald-400" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                  </h3>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    required
                    disabled={!!editingUser}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                    الدور
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  >
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مسؤول</option>
                  </select>
                </div>

                {/* Active Status */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                    حالة الحساب
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  >
                    <option value="true">نشط</option>
                    <option value="false">معطل</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-1 active:scale-95"
                >
                  <Save className="w-6 h-6" />
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[2rem] font-black text-lg transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
