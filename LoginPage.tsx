import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }

      localStorage.setItem('smart_accountant_user', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 relative overflow-hidden p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-900/5 rounded-full blur-[150px]"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-200/50 overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>

            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
                <User className="w-12 h-12 text-emerald-400" />
              </div>

              <h1 className="text-4xl font-black text-white mb-3 tracking-tight">تسجيل الدخول</h1>
              <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.4em]">Secure Access Portal</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-12">
            <form onSubmit={handleLogin} className="space-y-8">
              {/* Username Input */}
              <div className="relative group">
                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-14 pl-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[2rem] text-lg font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-[6px] focus:ring-emerald-600/10 transition-all"
                    placeholder="أدخل اسم المستخدم"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-14 pl-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[2rem] text-lg font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-[6px] focus:ring-emerald-600/10 transition-all"
                    placeholder="أدخل كلمة المرور"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-5 flex items-center gap-4 animate-fade-in">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <p className="text-sm font-bold text-rose-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl relative overflow-hidden group/btn ${
                  loading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1 active:scale-[0.98] shadow-emerald-900/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <LogIn className="w-7 h-7" />
                    تسجيل الدخول
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-12 pb-10 text-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              نظام المحاسب الذكي
              <br />
              <span className="text-[10px] uppercase tracking-widest text-slate-300">Protected System</span>
            </p>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600 font-bold">
            الأستاذ عبد الرزاق الموسى
          </p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">
            Elite Security Design
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
