import React, { useState, useMemo, useRef, useEffect } from 'react';
import { parseFinancialText } from './geminiService';
import { Transaction, TransactionType, ExchangeRates, CurrencySummary } from './types';
import LoginPage from './LoginPage';
import UserManagement from './UserManagement';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  Settings,
  Plus,
  Trash2,
  Calculator,
  MessageSquare,
  RefreshCcw,
  Edit2,
  Share2,
  Table,
  PlusCircle,
  TrendingUp,
  Download,
  MinusCircle,
  TrendingDown,
  Upload,
  AlertCircle,
  CircleEllipsis,
  Info,
  Database,
  Save,
  Phone,
  User,
  ShieldCheck,
  Coins,
  LayoutGrid,
  Menu,
  XCircle,
  FileText,
  Eraser,
  AlertTriangle,
  RotateCcw,
  Heart,
  LogOut,
  Users,
  Home
} from 'lucide-react';

interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState<'accounting' | 'users'>('accounting');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clearStep, setClearStep] = useState(0);
  const [verificationText, setVerificationText] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [iconSettings, setIconSettings] = useState({
    [TransactionType.INCOMING]: 'ArrowDownCircle',
    [TransactionType.OUTGOING]: 'ArrowUpCircle',
    [TransactionType.UNKNOWN]: 'HelpCircle',
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    'USD': 1,
    'TRY': 34.50,
    'SYP': 14500,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('smart_accountant_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error loading user', e);
      }
    }
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem('smart_accountant_data_v4');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.exchangeRates) setExchangeRates(parsed.exchangeRates);
        if (parsed.iconSettings) setIconSettings(parsed.iconSettings);
      } catch (e) { console.error("Error loading data", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_accountant_data_v4', JSON.stringify({ transactions, exchangeRates, iconSettings }));
  }, [transactions, exchangeRates, iconSettings]);

  const handleLogout = () => {
    localStorage.removeItem('smart_accountant_user');
    setCurrentUser(null);
    setCurrentView('accounting');
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  const iconOptions = {
    [TransactionType.INCOMING]: [
      { name: 'ArrowDownCircle', component: ArrowDownCircle },
      { name: 'PlusCircle', component: PlusCircle },
      { name: 'TrendingUp', component: TrendingUp },
      { name: 'Download', component: Download },
    ],
    [TransactionType.OUTGOING]: [
      { name: 'ArrowUpCircle', component: ArrowUpCircle },
      { name: 'MinusCircle', component: MinusCircle },
      { name: 'TrendingDown', component: TrendingDown },
      { name: 'Upload', component: Upload },
    ],
    [TransactionType.UNKNOWN]: [
      { name: 'HelpCircle', component: HelpCircle },
      { name: 'AlertCircle', component: AlertCircle },
      { name: 'CircleEllipsis', component: CircleEllipsis },
      { name: 'Info', component: Info },
    ],
  };

  const getIcon = (type: TransactionType) => {
    const selectedName = iconSettings[type];
    const option = iconOptions[type].find(opt => opt.name === selectedName);
    const IconComponent = option ? option.component : HelpCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const toggleTransactionType = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        let nextType: TransactionType;
        if (t.type === TransactionType.INCOMING) nextType = TransactionType.OUTGOING;
        else if (t.type === TransactionType.OUTGOING) nextType = TransactionType.UNKNOWN;
        else nextType = TransactionType.INCOMING;
        return { ...t, type: nextType };
      }
      return t;
    }));
  };

  const toggleCurrency = (id: string) => {
    const availableCurrencies = Object.keys(exchangeRates);
    if (availableCurrencies.length <= 1) return;
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const currentIndex = availableCurrencies.indexOf(t.currency);
        const nextIndex = (currentIndex + 1) % availableCurrencies.length;
        return { ...t, currency: availableCurrencies[nextIndex] };
      }
      return t;
    }));
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const startEdit = (t: Transaction) => {
    const amountStr = window.prompt('تعديل المبلغ:', t.amount.toString());
    const desc = window.prompt('تعديل الوصف:', t.description);

    if (amountStr !== null && desc !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        setTransactions(prev => prev.map(item =>
          item.id === t.id ? { ...item, amount, description: desc } : item
        ));
      } else {
        alert('المبلغ غير صالح');
      }
    }
  };

  const summaries = useMemo(() => {
    const map = new Map<string, CurrencySummary>();
    transactions.forEach(t => {
      const current = map.get(t.currency) || {
        currency: t.currency, totalIncoming: 0, totalOutgoing: 0, balance: 0, usdValue: 0
      };
      if (t.type === TransactionType.INCOMING) current.totalIncoming += t.amount;
      else if (t.type === TransactionType.OUTGOING) current.totalOutgoing += t.amount;
      current.balance = current.totalIncoming - current.totalOutgoing;
      const rate = exchangeRates[t.currency] || 0;
      current.usdValue = rate > 0 ? current.balance / rate : 0;
      map.set(t.currency, current);
    });
    return Array.from(map.values());
  }, [transactions, exchangeRates]);

  const totalUsdBalance = useMemo(() => summaries.reduce((acc, curr) => acc + curr.usdValue, 0), [summaries]);

  const handleProcessText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) {
        throw new Error("جهازك غير متصل بالإنترنت حالياً.");
      }
      const newTransactions = await parseFinancialText(inputText);
      setTransactions(prev => [...prev, ...newTransactions]);
      setInputText('');
    } catch (err: any) {
      console.error("Critical Processing Error:", err);
      setError(err.message || 'حدث خطأ في الاتصال. يرجى التأكد من جودة الإنترنت أو استخدام VPN في حال كانت الخدمة محجوبة.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllFinal = () => {
    setTransactions([]);
    setInputText('');
    setError(null);
    setClearStep(0);
    setVerificationText('');
    localStorage.removeItem('smart_accountant_data_v4');
    alert('تمت العملية بنجاح. السجل الآن فارغ تماماً.');
  };

  const handleShare = async () => {
    if (summaries.length === 0) {
      alert('لا توجد بيانات لمشاركتها حالياً');
      return;
    }
    const date = new Date().toLocaleDateString('ar-SA');
    let text = `ملخص كشف الحساب من المحاسب الذكي (${date})\n\n`;
    summaries.forEach(s => {
      text += `${s.currency}: ${s.balance.toLocaleString()} (≈ ${s.usdValue.toFixed(2)} $)\n`;
    });
    text += `\nإجمالي الرصيد: ${totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} $\n\n`;
    text += `نظام المحاسب الذكي - الأستاذ عبد الرزاق الموسى`;

    if (navigator.share) {
      try { await navigator.share({ title: 'تقرير مالي فاخر', text }); }
      catch (e) { console.error("Sharing failed", e); }
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ ملخص الحسابات إلى الحافظة بنجاح.');
    }
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `كشف_حساب_ذكي_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  const handleDownloadExcel = () => {
    if (transactions.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const transData = transactions.map(t => ({
      'الحالة': t.type === TransactionType.INCOMING ? 'له / وارد' : t.type === TransactionType.OUTGOING ? 'عليه / صادر' : 'غير معروف',
      'المبلغ': t.amount,
      'العملة': t.currency,
      'البيان': t.description
    }));

    const summaryData = summaries.map(s => ({
      'العملة': s.currency,
      'إجمالي الوارد': s.totalIncoming,
      'إجمالي الصادر': s.totalOutgoing,
      'الرصيد الصافي': s.balance,
      'المعادل بالدولار': s.usdValue.toFixed(2)
    }));

    // @ts-ignore
    const wb = XLSX.utils.book_new();
    // @ts-ignore
    const ws1 = XLSX.utils.json_to_sheet(transData);
    // @ts-ignore
    const ws2 = XLSX.utils.json_to_sheet(summaryData);

    // @ts-ignore
    XLSX.utils.book_append_sheet(wb, ws1, "الحركات التفصيلية");
    // @ts-ignore
    XLSX.utils.book_append_sheet(wb, ws2, "ملخص العملات");

    // @ts-ignore
    XLSX.writeFile(wb, `كشف_حساب_مفصل_${Date.now()}.xlsx`);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ transactions, exchangeRates, iconSettings });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_smart_accountant_${Date.now()}.json`;
    a.click();
  };

  const handleWhatsAppDonationMessage = () => {
    const message = "السلام عليكم أستاذ عبد الرزاق، يعطيك العافية على تطبيق المحاسب الذكي الرائع. حابب قدم دعم بسيط تقديراً لمجهودك، يا ريت ترسل لي حساب (شام كاش) أو رقم محفظة USDT لإرسال التبرع. شكراً لك.";
    const url = `https://wa.me/963992262993?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col font-medium bg-[#fcfdfe]">
      {/* Top Navbar */}
      <nav className="glass-card shadow-luxury sticky top-0 z-[100] border-b border-slate-200/50 no-print">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all text-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-emerald-900 rounded-2xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform group">
              <Calculator className="w-7 h-7 text-emerald-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">المحاسب الذكي</h1>
              <p className="text-[10px] text-emerald-700 font-black uppercase tracking-[0.2em] opacity-60">Elite Accounting</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentView === 'accounting' && (
              <button
                onClick={handleShare}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">مشاركة الكشف</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentView(currentView === 'accounting' ? 'users' : 'accounting')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-2xl transition-all active:scale-95 border border-slate-200"
                title={currentView === 'accounting' ? 'إدارة المستخدمين' : 'المحاسبة'}
              >
                {currentView === 'accounting' ? <Users className="w-5 h-5" /> : <Home className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white p-3 rounded-2xl transition-all active:scale-95 border border-rose-100 hover:border-rose-600"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* User Management View */}
      {currentView === 'users' && currentUser.role === 'admin' && (
        <div className="container mx-auto px-4 mt-12">
          <UserManagement currentUser={currentUser as any} />
        </div>
      )}

      {/* Accounting View */}
      {currentView === 'accounting' && (
        <>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] lg:hidden animate-fade-in"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="container mx-auto px-4 mt-8 lg:mt-12 flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start">
            <aside className={`
              fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[200] p-8 overflow-y-auto transform transition-transform duration-500 lg:relative lg:translate-x-0 lg:w-full lg:bg-transparent lg:shadow-none lg:p-0 lg:col-span-4 space-y-8 no-print
              ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              <div className="flex justify-between items-center mb-8 lg:hidden">
                <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase">الإعدادات الذكية</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <div className="bg-gradient-to-tr from-[#020617] via-[#0f172a] to-[#064e3b] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

                <div className="relative z-10">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    صافي المحفظة الكلي
                  </p>
                  <div className="text-5xl font-black mb-10 flex items-baseline gap-2 tabular-nums">
                    {totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-2xl text-emerald-400 font-bold">$</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleExportData}
                      className="bg-white/10 hover:bg-white/20 border border-white/5 py-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      نسخة احتياطية
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 border border-white/5 py-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95"
                    >
                      <Database className="w-4 h-4" />
                      استعادة
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-luxury border border-slate-200/50 hover:border-emerald-100 transition-all group">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5 text-slate-600" />
                    </div>
                    إدارة العملات
                  </h2>
                  <button
                    onClick={() => {
                      const s = prompt('أدخل رمز العملة الجديد (مثال: AED):');
                      if(s) setExchangeRates(prev => ({...prev, [s.toUpperCase()]: 1}));
                    }}
                    className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {Object.entries(exchangeRates).map(([curr, rate]) => (
                    <div key={curr} className="group/rate relative">
                      <div className="absolute inset-y-0 right-0 w-16 bg-slate-100 rounded-r-2xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 group-focus-within/rate:bg-slate-600 group-focus-within/rate:text-white transition-all">
                        {curr}
                      </div>
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => setExchangeRates(prev => ({...prev, [curr]: parseFloat(e.target.value) || 0}))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-20 pl-4 py-4 text-sm font-black focus:ring-4 focus:ring-slate-600/5 focus:bg-white focus:border-slate-600 outline-none transition-all"
                        placeholder="سعر الصرف لـ 1 دولار"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-luxury border border-slate-200/50 hover:border-slate-200 transition-all group relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors"></div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600 animate-pulse" />
                  </div>
                  دعم المطور وتطوير النظام
                </h2>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-center space-y-6 relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      لدعم استمرارية وتطوير هذا النظام المحاسبي الذكي وتغطية تكاليف التشغيل
                    </p>
                  </div>

                  <div className="w-full h-px bg-slate-200/50"></div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">لطلب تفاصيل (شام كاش) أو USDT</p>
                    <button
                      onClick={handleWhatsAppDonationMessage}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/20 active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      إرسال رسالة دعم وطلب حساب
                    </button>
                    <div className="flex justify-center gap-2">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">Sham Cash</span>
                      <span className="text-[9px] font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-tighter">USDT (TRC20)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-luxury border border-slate-200/50 hover:border-rose-100 transition-all group overflow-hidden">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Eraser className="w-5 h-5 text-rose-600" />
                  </div>
                  أدوات الصيانة
                </h2>

                {clearStep === 0 && (
                  <button
                    onClick={() => setClearStep(1)}
                    className="w-full py-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 border border-rose-100 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح قاعدة البيانات بالكامل
                  </button>
                )}

                {clearStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold leading-relaxed flex gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      هل أنت متأكد؟ هذا الإجراء سيقوم بحذف كافة المعاملات والعملات المسجلة نهائياً من هذا المتصفح.
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setClearStep(2)}
                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-rose-900/20 hover:bg-rose-700 transition-all active:scale-95"
                      >
                        نعم، استمرار
                      </button>
                      <button
                        onClick={() => setClearStep(0)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] hover:bg-slate-200 transition-all active:scale-95"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {clearStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">خطوة التحقق النهائية</p>
                    <p className="text-xs text-center font-bold text-slate-700">اكتب كلمة <span className="text-rose-600 font-black">"مسح"</span> للتأكيد:</p>
                    <input
                      type="text"
                      value={verificationText}
                      onChange={(e) => setVerificationText(e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-black text-slate-800 outline-none focus:border-rose-600 transition-all"
                      placeholder="كلمة التأكيد..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={clearAllFinal}
                        disabled={verificationText !== 'مسح'}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] transition-all active:scale-95 ${
                          verificationText === 'مسح'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        تأكيد المسح النهائي
                      </button>
                      <button
                        onClick={() => { setClearStep(0); setVerificationText(''); }}
                        className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-center relative overflow-hidden shadow-2xl animate-fade-in group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-slate-700"></div>
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[2.2rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                    <User className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                <h3 className="font-black text-xl mb-1 tracking-tight">الأستاذ عبد الرزاق الموسى</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Architectural UX Design</p>
                <a
                  href="https://wa.me/963992262993"
                  target="_blank"
                  className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 py-4.5 rounded-2xl font-black text-xs transition-all shadow-xl shadow-emerald-950/40 active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  تواصل محاسبي مباشر
                </a>
              </div>
            </aside>

            <div className="lg:col-span-8 w-full space-y-10" id="report-content-root">

              <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-luxury border border-slate-200/50 no-print animate-fade-in overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-slate-600 opacity-20"></div>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">تحليل المحادثات</h2>
                    <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">WhatsApp Smart Parser</p>
                  </div>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-64 bg-slate-50/50 border-2 border-slate-100 rounded-[3rem] p-10 text-xl font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-[12px] focus:ring-emerald-600/5 outline-none transition-all resize-none shadow-inner placeholder:text-slate-300"
                  placeholder="ألصق محادثات الحسابات هنا... مثلاً: جاني 200 دوﻻر، دفعت 50 ليرة..."
                />

                <button
                  onClick={handleProcessText}
                  disabled={loading || !inputText.trim()}
                  className={`w-full py-7 mt-10 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-5 transition-all shadow-2xl relative overflow-hidden group/process ${
                    loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-2 active:scale-[0.98] shadow-emerald-900/20'
                  }`}
                >
                  {loading ? <RefreshCcw className="w-10 h-10 animate-spin" /> : <TrendingUp className="w-10 h-10" />}
                  {loading ? 'جاري الفرز والتحليل...' : 'تحليل البيانات فورياً'}
                </button>

                {error && (
                  <div className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-sm font-bold flex items-center gap-4 animate-fade-in">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in [animation-delay:150ms]">
                {summaries.map((s) => (
                  <div key={s.currency} className="bg-white rounded-[3rem] p-8 shadow-luxury border border-slate-200/50 relative group transition-all hover:border-slate-400 overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mb-16 -mr-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="flex justify-between items-center mb-10">
                      <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg">{s.currency}</div>
                      <div className="text-[11px] font-black text-slate-600 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">≈ {s.usdValue.toFixed(2)} $</div>
                    </div>
                    <div className="space-y-5">
                      <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <span>وارد (+)</span>
                        <span className="text-emerald-600 font-black">+{s.totalIncoming.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <span>صادر (-)</span>
                        <span className="text-rose-600 font-black">-{s.totalOutgoing.toLocaleString()}</span>
                      </div>
                      <div className="pt-8 border-t border-slate-100 flex justify-between items-baseline">
                        <span className="text-slate-800 font-black text-xl">الصافي</span>
                        <span className={`text-4xl font-black tabular-nums ${s.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {s.balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-10" ref={reportRef}>
                <div className="hidden print:flex flex-col gap-8 mb-12 border-b-8 border-slate-950 pb-12">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                        <Calculator className="w-12 h-12 text-emerald-400" />
                      </div>
                      <div>
                        <h1 className="text-5xl font-black text-slate-900 leading-none">كشف حساب مالي</h1>
                        <p className="text-slate-400 mt-4 font-bold uppercase tracking-[0.3em]">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                    <div className="text-left bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 shadow-inner">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الرصيد الموحد</p>
                      <p className="text-5xl font-black text-slate-950 tabular-nums">{totalUsdBalance.toLocaleString()} $</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 text-white p-6 rounded-[1.5rem] flex justify-between items-center">
                     <p className="font-black text-lg">نظام المحاسب الذكي - الأستاذ عبد الرزاق الموسى</p>
                     <p className="text-sm opacity-60">كشف حساب إلكتروني موثق</p>
                  </div>
                </div>

                <div className="hidden print:block mb-10">
                  <h3 className="text-xl font-black text-slate-800 mb-4 border-r-4 border-slate-600 pr-4">ملخص الأرصدة التراكمي</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-2 border-slate-200">
                        <th className="border p-4 text-right font-black">العملة</th>
                        <th className="border p-4 text-right font-black">إجمالي الوارد (+)</th>
                        <th className="border p-4 text-right font-black">إجمالي الصادر (-)</th>
                        <th className="border p-4 text-right font-black">الرصيد الصافي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaries.map(s => (
                        <tr key={s.currency} className="border-b">
                          <td className="border p-4 font-black bg-slate-50">{s.currency}</td>
                          <td className="border p-4 text-emerald-700 font-bold">{s.totalIncoming.toLocaleString()}</td>
                          <td className="border p-4 text-rose-700 font-bold">{s.totalOutgoing.toLocaleString()}</td>
                          <td className={`border p-4 font-black ${s.balance >= 0 ? 'text-emerald-900 bg-emerald-50' : 'text-rose-900 bg-rose-50'}`}>
                            {s.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactions.length > 0 && (
                  <div className="bg-white rounded-[3.5rem] shadow-luxury border border-slate-200/50 overflow-hidden animate-fade-in [animation-delay:200ms]">
                    <div className="px-10 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 no-print">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-900/20">
                          <Table className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-black text-2xl text-slate-800">سجل المعاملات</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Managed Digital Ledger</p>
                        </div>
                      </div>
                      <div className="flex gap-3 no-print">
                        <button
                          onClick={handleDownloadExcel}
                          className="p-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-emerald-100"
                          title="تصدير Excel"
                        >
                          <Table className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="p-4 bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-slate-100"
                          title="تصدير PDF"
                        >
                          <FileText className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right ledger-table-pdf">
                        <thead>
                          <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-50 bg-slate-50/20">
                            <th className="px-10 py-8">الحالة</th>
                            <th className="px-10 py-8">المبلغ</th>
                            <th className="px-10 py-8">العملة</th>
                            <th className="px-10 py-8">البيان والتفاصيل</th>
                            <th className="px-10 py-8 text-center no-print border-l">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-slate-600">
                              <td className="px-10 py-8">
                                <div
                                  onClick={() => toggleTransactionType(t.id)}
                                  className={`flex items-center gap-3 cursor-pointer py-3 px-5 rounded-2xl transition-all active:scale-95 shadow-sm hover:shadow-md ${
                                    t.type === TransactionType.INCOMING ? 'bg-emerald-50 text-emerald-700' :
                                    t.type === TransactionType.OUTGOING ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500 font-bold italic'
                                  }`}
                                >
                                  <div className="p-1.5 bg-white rounded-xl shadow-sm no-print">{getIcon(t.type)}</div>
                                  <span className="font-black text-sm">{t.type === TransactionType.INCOMING ? 'له' : t.type === TransactionType.OUTGOING ? 'عليه' : 'مبهم'}</span>
                                </div>
                              </td>
                              <td className="px-10 py-8 font-black text-2xl text-slate-800 tabular-nums">
                                {t.amount.toLocaleString()}
                              </td>
                              <td className="px-10 py-8">
                                <div
                                  onClick={() => toggleCurrency(t.id)}
                                  className="inline-flex items-center gap-3 cursor-pointer bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[12px] font-black text-slate-500 hover:border-slate-600 hover:text-slate-600 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                                >
                                  <Coins className="w-4 h-4 opacity-40 text-slate-500 no-print" />
                                  {t.currency}
                                </div>
                              </td>
                              <td className="px-10 py-8 text-slate-600 text-sm font-bold max-w-[250px] truncate" title={t.description}>
                                {t.description}
                              </td>
                              <td className="px-10 py-8 text-center no-print border-l">
                                <div className="flex items-center justify-center gap-4">
                                  <button
                                    onClick={() => startEdit(t)}
                                    className="p-3 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-transparent hover:border-slate-100 opacity-100"
                                    title="تعديل يدوي"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => deleteTransaction(t.id)}
                                    className="p-3 text-slate-200 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all shadow-sm border border-transparent hover:border-rose-100 opacity-100"
                                    title="حذف المعاملة"
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
                )}

                <div className="hidden print:block text-center text-[10px] text-slate-400 mt-24 border-t-2 border-slate-100 pt-10">
                  هذا التقرير تم استخراجه بدقة بواسطة نظام "المحاسب الذكي" - تصميم الأستاذ عبد الرزاق الموسى.
                  <br />
                  للمزيد من الخدمات الرقمية والحلول المحاسبية المخصصة: +963 992 262 993
                </div>
              </div>

              {!transactions.length && !loading && (
                <div className="text-center py-48 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 animate-fade-in flex flex-col items-center group no-print">
                  <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner group-hover:bg-slate-50 transition-colors duration-700">
                    <LayoutGrid className="w-14 h-14 text-slate-200 group-hover:text-slate-200 transition-colors duration-700" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-300 mb-4 group-hover:text-slate-400 transition-colors">السجل فارغ</h3>
                  <p className="text-slate-200 font-black text-sm max-w-xs mx-auto leading-relaxed group-hover:text-slate-300 transition-colors">
                    ألصق محادثات واتساب المالية في الصندوق أعلاه لنبدأ فوراً بترتيب حساباتك بدقة متناهية
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <footer className="container mx-auto px-4 mt-20 no-print">
        <div className="bg-slate-900 rounded-[3.5rem] p-16 text-center relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-500/5 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000"></div>

          <div className="relative z-10 flex flex-col items-center gap-12">
            <div className="flex items-center gap-12 text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] flex-wrap justify-center">
              <div className="flex items-center gap-3 hover:text-emerald-500 transition-colors cursor-default"><ShieldCheck className="w-5 h-5" /> خصوصية مطلقة</div>
              <div className="flex items-center gap-3 hover:text-slate-500 transition-colors cursor-default"><Database className="w-5 h-5" /> تخزين محلي آمن</div>
              <div className="flex items-center gap-3 hover:text-emerald-500 transition-colors cursor-default"><RefreshCcw className="w-5 h-5" /> تصفير بضغطة واحدة</div>
            </div>

            <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 via-slate-500 to-emerald-500 rounded-full opacity-40"></div>

            <div className="flex flex-col gap-6">
              <p className="text-slate-400 text-sm font-bold flex flex-col md:flex-row items-center gap-6">
                جميع الحقوق محفوظة © {new Date().getFullYear()}
                <span className="text-white bg-white/10 px-10 py-4 rounded-[2rem] font-black border border-white/5 shadow-2xl hover:bg-white/20 transition-all cursor-default">
                  الأستاذ عبد الرزاق الموسى
                </span>
              </p>
              <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.8em] mt-2 opacity-50">ELITE DIGITAL ARCHITECTURE</p>
            </div>
          </div>
        </div>
      </footer>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if(!file) return;
          const r = new FileReader();
          r.onload = (ev) => {
            try {
              const j = JSON.parse(ev.target?.result as string);
              if (j.transactions) setTransactions(j.transactions);
              if (j.exchangeRates) setExchangeRates(j.exchangeRates);
              alert('تم استعادة النسخة الاحتياطية بنجاح.');
            } catch(err) { alert('خطأ: تنسيق الملف غير صحيح.'); }
          };
          r.readAsText(file);
        }}
        className="hidden"
      />
    </div>
  );
};

export default App;
