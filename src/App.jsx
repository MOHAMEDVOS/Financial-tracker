import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ListChecks,
  History,
  PlusCircle,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Calendar,
  Home,
  CheckCircle2,
  Clock,
  Info,
  BadgeAlert,
  Coins,
  Hourglass,
  CalendarClock,
  Plus,
  Trash2,
  XCircle
} from 'lucide-react';
import './index.css';
import { supabase } from './supabase';

const DATA_KEY = 'wedding_app_data';


// Standardized Initial Categories
const INITIAL_CATEGORIES = [
  { id: 'rent', name: 'إيجار الشقة', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: true, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'dress', name: 'الفستان', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'furniture', name: 'الأثاث والعفش', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'amazon', name: 'مشتريات أمازون', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'hall', name: 'القاعة', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'photosession', name: 'الفوتوسيشن', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'media', name: 'الميديا كفرج', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
  { id: 'other', name: 'مصاريف جانبية / أخرى', total: 0, paid: 0, dueDate: '', notes: '', isRecurring: false, monthlyRate: 0, monthsPaid: 0, monthsTotal: 0 },
];

function App() {
  // Financial Planning State
  const [monthlyIncome, setMonthlyIncome] = useState(() => Number(localStorage.getItem('monthlyIncome')) || 30000);
  const [monthlySavings, setMonthlySavings] = useState(() => Number(localStorage.getItem('monthlySavings')) || 25000);

  // Core State
  const [balance, setBalance] = useState(() => {
    const val = localStorage.getItem('balance');
    return val !== null ? Number(val) : 0;
  });
  const [totalBudget, setTotalBudget] = useState(() => {
    const val = localStorage.getItem('totalBudget');
    return val !== null ? Number(val) : 0;
  });
  const [categories, setCategories] = useState(() => {
    const val = localStorage.getItem('categories');
    return val ? JSON.parse(val) : INITIAL_CATEGORIES;
  });
  const [payments, setPayments] = useState(() => {
    const val = localStorage.getItem('payments');
    return val ? JSON.parse(val) : [];
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('offline'); // offline, syncing, online, error
  const [errorMessage, setErrorMessage] = useState('');

  // Data Fetch from Cloud
  useEffect(() => {
    const fetchCloudData = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || url === 'your_supabase_url_here') {
        setCloudStatus('offline');
        return;
      }

      setCloudStatus('syncing');
      try {
        const { data, error } = await supabase
          .from('wedding_data')
          .select('*')
          .limit(1);

        if (error) {
          console.error("Cloud fetch error:", error);
          setCloudStatus('error');
          // More detailed error string
          const errDetail = error.message || error.details || JSON.stringify(error);
          setErrorMessage(errDetail);
        } else if (data && data.length > 0) {
          const row = data[0];
          if (row.categories) setCategories(row.categories);
          if (row.payments) setPayments(row.payments);
          if (row.balance !== undefined) setBalance(row.balance);
          if (row.total_budget !== undefined) setTotalBudget(row.total_budget);
          if (row.monthly_income !== undefined) setMonthlyIncome(row.monthly_income);
          if (row.monthly_savings !== undefined) setMonthlySavings(row.monthly_savings);
          setCloudStatus('online');
          setErrorMessage('');
        } else {
          setCloudStatus('online');
          setErrorMessage('');
        }
      } catch (e) {
        console.error("Supabase catch error:", e);
        setCloudStatus('error');
        setErrorMessage("Catch: " + (e.message || "Unknown error occurred"));
      }
    };

    fetchCloudData();
  }, []);

  // Persistence (Local + Cloud)
  useEffect(() => {
    const saveData = async () => {
      try {
        // Local Save
        localStorage.setItem('monthlyIncome', monthlyIncome);
        localStorage.setItem('monthlySavings', monthlySavings);
        localStorage.setItem('balance', balance);
        localStorage.setItem('totalBudget', totalBudget);
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('payments', JSON.stringify(payments));

        // Cloud Save
        if (cloudStatus === 'online' || cloudStatus === 'syncing') {
          setIsCloudSyncing(true);
          const { error } = await supabase
            .from('wedding_data')
            .upsert({
              id: 1,
              monthly_income: monthlyIncome,
              monthly_savings: monthlySavings,
              balance,
              total_budget: totalBudget,
              categories,
              payments,
              updated_at: new Date()
            });

          if (error) {
            console.error("Cloud save error:", error);
            setCloudStatus('error');
            setErrorMessage("خطأ في الحفظ السحابي: " + (error.message || JSON.stringify(error)));
          } else {
            setCloudStatus('online');
            setErrorMessage('');
          }
          setIsCloudSyncing(false);
        }
      } catch (e) {
        console.error("Persistence error", e);
        setCloudStatus('error');
        setErrorMessage("Catch (Save): " + e.message);
      }
    };

    const timeout = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeout);
  }, [monthlyIncome, monthlySavings, balance, totalBudget, categories, payments, cloudStatus]);

  // Optimized Calculations
  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + Number(p.amount), 0), [payments]);
  const totalCostFromCategories = useMemo(() =>
    categories.reduce((acc, c) => acc + (c.isRecurring ? (c.monthlyRate * c.monthsTotal) : Number(c.total)), 0)
    , [categories]);

  const totalRemaining = useMemo(() => totalCostFromCategories - totalPaid, [totalCostFromCategories, totalPaid]);
  const isInsufficient = useMemo(() => balance < totalRemaining, [balance, totalRemaining]);
  const deficit = useMemo(() => Math.max(0, totalRemaining - balance), [totalRemaining, balance]);
  const budgetExceeded = useMemo(() => totalCostFromCategories > totalBudget, [totalCostFromCategories, totalBudget]);

  // Timeline Logic
  const monthsToGoal = useMemo(() => {
    if (monthlySavings <= 0 || totalRemaining <= 0) return 0;
    const netNeededToSave = Math.max(0, totalRemaining - balance);
    return Math.ceil(netNeededToSave / monthlySavings);
  }, [monthlySavings, totalRemaining, balance]);

  // Handlers
  const handleAddPayment = (payment) => {
    if (payment.amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }

    setPayments([payment, ...payments]);
    setBalance(prev => prev - Number(payment.amount));
    setCategories(categories.map(cat => {
      if (cat.id === payment.categoryId) {
        const newPaid = cat.paid + Number(payment.amount);
        let newMonthsPaid = cat.monthsPaid;
        if (cat.isRecurring && cat.monthlyRate > 0) {
          newMonthsPaid = Math.floor(newPaid / cat.monthlyRate);
        }
        return { ...cat, paid: newPaid, monthsPaid: newMonthsPaid };
      }
      return cat;
    }));
  };

  const handleDeletePayment = (paymentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ سيتم إعادة المبلغ للمتبقي وللرصيد المتاح.')) return;

    const paymentToDelete = payments.find(p => p.id === paymentId);
    if (!paymentToDelete) return;

    setPayments(payments.filter(p => p.id !== paymentId));
    setBalance(prev => prev + Number(paymentToDelete.amount));
    setCategories(categories.map(cat => {
      if (cat.id === paymentToDelete.categoryId) {
        const newPaid = Math.max(0, cat.paid - Number(paymentToDelete.amount));
        let newMonthsPaid = cat.monthsPaid;
        if (cat.isRecurring && cat.monthlyRate > 0) {
          newMonthsPaid = Math.floor(newPaid / cat.monthlyRate);
        }
        return { ...cat, paid: newPaid, monthsPaid: newMonthsPaid };
      }
      return cat;
    }));
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const isRec = formData.get('type') === 'recurring';

    const newCat = {
      id: 'cat-' + Date.now(),
      name: formData.get('name'),
      total: isRec ? 0 : Number(formData.get('total')),
      paid: 0,
      dueDate: '',
      notes: '',
      isRecurring: isRec,
      monthlyRate: isRec ? Number(formData.get('rate')) : 0,
      monthsTotal: isRec ? Number(formData.get('months')) : 0,
      monthsPaid: 0
    };

    setCategories([...categories, newCat]);
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذفها من الحسابات أيضاً.')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const getStatusInfo = (cat) => {
    const paid = cat.paid;
    const total = cat.isRecurring ? (cat.monthlyRate * cat.monthsTotal) : cat.total;
    if (paid <= 0) return { label: 'لم يتم الدفع', class: 'badge-danger', icon: <Clock size={14} /> };
    if (paid < total) return { label: 'دفع جزئي', class: 'badge-warning', icon: <TrendingUp size={14} /> };
    return { label: 'تم الدفع بالكامل', class: 'badge-success', icon: <CheckCircle2 size={14} /> };
  };

  return (
    <div className="app-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          إدارة الميزانية
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>لوحة التحكم</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <ListChecks size={20} />
            <span>الفئات</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <History size={20} />
            <span>سجل الدفعات</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cloudStatus === 'online' ? '#4ade80' : cloudStatus === 'error' ? '#f87171' : '#94a3b8' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
            <span>
              {cloudStatus === 'online' ? 'متصل بالسحابة ✅' :
                cloudStatus === 'syncing' ? 'جاري المزامنة...' :
                  cloudStatus === 'error' ? 'خطأ في الاتصال ❌' :
                    'وضع الحفظ المحلي 💾'}
            </span>
          </div>
          {isCloudSyncing && <p style={{ color: '#94a3b8', marginTop: '0.2rem' }}>جاري الحفظ...</p>}
        </div>
      </aside>

      {/* Main Content Section */}
      <main className="main-content">
        <header className="stats-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>إدارة العمليات المالية 💳</h1>
            <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الرصيد الحالي (كاش)</p>
              <h3 style={{ color: 'var(--success)' }}>{balance.toLocaleString()} ج.م</h3>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متبقي للسداد</p>
              <h3 style={{ color: 'var(--danger)' }}>{totalRemaining.toLocaleString()} ج.م</h3>
            </div>
            {isInsufficient && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>العجز المالي ⚠️</p>
                <h3 style={{ color: '#f97316' }}>{deficit.toLocaleString()} ج.م</h3>
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مدة الإنجاز المتوقعة</p>
              <h3 style={{ color: 'var(--secondary)' }}>{monthsToGoal} شهر</h3>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid">
            {/* Financial Planning Card */}
            <section className="card" style={{ gridColumn: 'span 1', borderTop: '4px solid var(--secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Coins size={22} color="var(--secondary)" />
                <h3>إعدادات التوفير الشهري</h3>
              </div>
              <div className="grid grid-2">
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>دخل شهري (ج.م)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>توفير شهري (ج.م)</label>
                  <input
                    type="number"
                    value={monthlySavings}
                    onChange={(e) => setMonthlySavings(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                  <Info size={16} />
                  <span>كيف يتم حساب المدة؟ (شرح الحسبة)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>إجمالي المتبقي للسداد:</span>
                    <span style={{ fontWeight: '600' }}>{totalRemaining.toLocaleString()} ج.م</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>يخصم منه الرصيد الحالي (الكاش):</span>
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>- {balance.toLocaleString()} ج.م</span>
                  </div>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.2rem 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700' }}>
                    <span>صافي المبلغ المطلوب توفيره:</span>
                    <span style={{ color: 'var(--primary)' }}>{deficit.toLocaleString()} ج.م</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>يقسم على الادخار الشهري:</span>
                    <span style={{ fontWeight: '600' }}>÷ {monthlySavings.toLocaleString()} ج.م</span>
                  </div>
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      النتيجة: <b>{monthsToGoal} شهور</b> تقريباً
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Summary Grid */}
            <div className="grid grid-3" style={{ gridColumn: 'span 1' }}>
              <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <Wallet size={18} />
                  <span>الرصيد المتاح (الكاش)</span>
                </div>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="form-control"
                  style={{ fontSize: '1.8rem', border: 'none', fontWeight: '800', padding: 0 }}
                />
              </div>
              <div className="card" style={{ borderTop: `4px solid ${budgetExceeded ? 'var(--danger)' : 'var(--secondary)'}` }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <CreditCard size={18} />
                  <span>سقف الميزانية</span>
                </div>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="form-control"
                  style={{ fontSize: '1.8rem', border: 'none', fontWeight: '800', padding: 0 }}
                />
              </div>
              <div className={`card ${isInsufficient ? 'badge-danger' : 'badge-success'}`} style={{ border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {isInsufficient ? <BadgeAlert size={24} /> : <CheckCircle2 size={24} />}
                  <h3 style={{ margin: 0 }}>{isInsufficient ? 'تنبيه مالي' : 'الوضع آمن'}</h3>
                </div>
                {isInsufficient ? (
                  <p style={{ fontSize: '0.85rem' }}>
                    الرصيد لا يغطي الالتزامات. <br />
                    <b>فاضلك {deficit.toLocaleString()} ج.م</b> عشان تغطي الباقي.
                  </p>
                ) : (
                  <p style={{ fontSize: '0.85rem' }}>الرصيد يغطي جميع ما تبقى.</p>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarClock size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>نسبة الإنجاز المالي</h3>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '1.2rem' }}>{Math.round((totalPaid / (totalCostFromCategories || 1)) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((totalPaid / (totalCostFromCategories || 1)) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  borderRadius: '10px',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>

            <section className="card">
              <div className="grid grid-3" style={{ textAlign: 'center' }}>
                <div style={{ borderLeft: '1px solid #eee' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المدفوع</p>
                  <h2 style={{ color: 'var(--success)' }}>{totalPaid.toLocaleString()}</h2>
                </div>
                <div style={{ borderLeft: '1px solid #eee' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المتبقي</p>
                  <h2 style={{ color: 'var(--danger)' }}>{totalRemaining.toLocaleString()}</h2>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي التكلفة</p>
                  <h2>{totalCostFromCategories.toLocaleString()}</h2>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>إدارة الفئات</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddCategory(!showAddCategory)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={20} />
                إضافة فئة جديدة
              </button>
            </div>

            {showAddCategory && (
              <section className="card" style={{ marginBottom: '2rem', border: '2px solid var(--secondary)' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>بيانات الفئة الجديدة</h3>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="grid grid-2">
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>اسم الفئة</label>
                      <input name="name" required className="form-control" placeholder="مثلاً: الشبكة، الملابس..." />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>نوع التكلفة</label>
                      <select name="type" className="form-control">
                        <option value="fixed">مبلغ ثابت واحد</option>
                        <option value="recurring">مبلغ دوري (شهري)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-3">
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>الميزانية (للنظام الثابت)</label>
                      <input type="number" name="total" defaultValue="0" className="form-control" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>القيمة الشهرية (للنظام الدوري)</label>
                      <input type="number" name="rate" defaultValue="0" className="form-control" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>عدد الشهور (للنظام الدوري)</label>
                      <input type="number" name="months" defaultValue="0" className="form-control" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>حفظ الفئة</button>
                    <button type="button" onClick={() => setShowAddCategory(false)} className="btn btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                  </div>
                </form>
              </section>
            )}

            <div className="grid grid-2">
              {categories.map(cat => {
                const status = getStatusInfo(cat);
                const total = cat.isRecurring ? (cat.monthlyRate * cat.monthsTotal) : cat.total;
                return (
                  <div key={cat.id} className="card" style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ position: 'absolute', top: '1rem', left: '1rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1' }}
                      title="حذف الفئة"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', marginLeft: '2rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {cat.isRecurring ? <Home size={20} color="var(--primary)" /> : <PlusCircle size={20} color="var(--primary)" />}
                        <h3 style={{ margin: 0 }}>{cat.name}</h3>
                      </div>
                      <span className={`badge ${status.class}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {status.icon} {status.label}
                      </span>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>التكلفة الإجمالية</label>
                        <input
                          type="number"
                          value={cat.isRecurring ? cat.monthlyRate * cat.monthsTotal : cat.total}
                          readOnly={cat.isRecurring}
                          onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, total: Number(e.target.value) } : c))}
                          className="form-control"
                          style={{ fontWeight: 'bold', background: cat.isRecurring ? '#f8fafc' : 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>المتبقي</label>
                        <div style={{ padding: '0.5rem', fontSize: '1rem', fontWeight: '800', color: 'var(--danger)' }}>{(total - cat.paid).toLocaleString()} ج.م</div>
                      </div>
                    </div>

                    {cat.isRecurring && (
                      <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <span>القيمة الشهرية: <b>{cat.monthlyRate}</b></span>
                          <span>الشهور: <b>{cat.monthsTotal}</b></span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          تم دفع حوالي {cat.monthsPaid} شهر من أصل {cat.monthsTotal}
                        </div>
                        <button className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => {
                          const rate = prompt('القيمة الشهرية:', cat.monthlyRate);
                          const count = prompt('عدد الشهور الإجمالي:', cat.monthsTotal);
                          if (rate !== null && count !== null)
                            setCategories(categories.map(c => c.id === cat.id ? { ...c, monthlyRate: Number(rate), monthsTotal: Number(count), monthsPaid: Number(rate) > 0 ? Math.floor(c.paid / Number(rate)) : 0 } : c));
                        }}>تعديل الحساب الدوري</button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.5rem' }}>
                      <Calendar size={16} color="var(--text-muted)" />
                      <input
                        type="date"
                        value={cat.dueDate}
                        onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, dueDate: e.target.value } : c))}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="grid">
            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <PlusCircle size={20} color="var(--primary)" />
                <h3>تسجيل دفعة جديدة</h3>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddPayment({
                  id: Date.now(),
                  date: formData.get('date'),
                  categoryId: formData.get('category'),
                  amount: Number(formData.get('amount')),
                  method: formData.get('method'),
                  notes: formData.get('notes')
                });
                e.target.reset();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="grid grid-2">
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="form-control" />
                  <select name="category" required className="form-control">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-2">
                  <input type="number" name="amount" required placeholder="المبلغ (ج.م)" className="form-control" />
                  <input type="text" name="method" placeholder="طريقة الدفع (كاش، فيزا...)" className="form-control" />
                </div>
                <textarea name="notes" placeholder="ملاحظات..." className="form-control"></textarea>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>حفظ الدفعة وتحديث الرصيد</button>
              </form>
            </section>

            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <History size={20} color="var(--primary)" />
                <h3>تاريخ الدفعات</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'right', borderBottom: '2px solid var(--bg-main)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>التاريخ</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>الفئة</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>طريقة الدفع</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>المبلغ</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>الملاحظات</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-main)', transition: 'background 0.2s' }} className="history-row">
                        <td style={{ padding: '1rem' }}>{p.date}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{categories.find(c => c.id === p.categoryId)?.name}</td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{p.method || '-'}</td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{Number(p.amount).toLocaleString()}</td>
                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', opacity: 0.6 }}
                            title="حذف الدفعة"
                          >
                            <XCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>لا توجد دفعات مسجلة حالياً</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
