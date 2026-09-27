import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle, Package, Plus,
  ShoppingCart, UserPlus, ArrowRight, Receipt,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/auth';
import { useProductStore } from '@/store/productStore';
import { useSaleStore } from '@/store/saleStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useSettingsStore, getCurrencySymbol } from '@/store/settingsStore';
import { Skeleton } from '@/components/Skeleton';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function DashboardPage() {
  const { profile } = useAuth();
  const { products, loading: productsLoading, fetchProducts } = useProductStore();
  const { sales, loading: salesLoading, fetchSales } = useSaleStore();
  const { expenses, loading: expensesLoading, fetchExpenses } = useExpenseStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchSales(), fetchExpenses()]).finally(() => setDashLoading(false));
  }, [fetchProducts, fetchSales, fetchExpenses]);

  const currencySymbol = getCurrencySymbol(settings?.currency ?? 'USD');
  const formatPrice = (n: number) => `${currencySymbol}${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;

  const kpiCards = [
    { label: 'Total Sales', value: totalSales > 0 ? `${currencySymbol}${totalSales.toFixed(2)}` : `${currencySymbol}0`, sub: sales.length > 0 ? `${sales.length} ${sales.length === 1 ? 'sale' : 'sales'}` : 'No sales data yet', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Total Expenses', value: totalExpenses > 0 ? `${currencySymbol}${totalExpenses.toFixed(2)}` : `${currencySymbol}0`, sub: expenses.length > 0 ? `${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}` : 'No expense data yet', icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Profit', value: profit !== 0 ? `${currencySymbol}${profit.toFixed(2)}` : `${currencySymbol}0`, sub: sales.length > 0 || expenses.length > 0 ? 'Sales minus expenses' : 'No data yet', icon: TrendingUp, color: profit >= 0 ? 'text-emerald-500' : 'text-red-500', bg: profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Low Stock Alerts', value: String(lowStockProducts.length), sub: lowStockProducts.length > 0 ? `${lowStockProducts.length} items need restocking` : 'All items in stock', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const recentSales = sales.slice(0, 5);

  const quickActions = [
    { label: 'Add Product', icon: Plus, path: '/products?action=add' },
    { label: 'New Sale', icon: ShoppingCart, path: '/sales/new' },
    { label: 'Add Customer', icon: UserPlus, path: '/customers' },
  ];

  // Sales trend data (last 7 days)
  const salesTrendData = useMemo(() => {
    const days = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.set(key, 0);
    }
    for (const sale of sales) {
      const key = sale.created_at.slice(0, 10);
      if (days.has(key)) days.set(key, (days.get(key) ?? 0) + sale.total);
    }
    return Array.from(days.entries()).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: Number(total.toFixed(2)),
    }));
  }, [sales]);

  // Top 5 products by quantity sold
  const topProductsData = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = map.get(item.product_id) ?? { name: item.name, qty: 0 };
        existing.qty += item.qty;
        map.set(item.product_id, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5).map((p) => ({
      name: p.name.length > 10 ? p.name.slice(0, 8) + '...' : p.name, qty: p.qty,
    }));
  }, [sales]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={settings.business_name ?? 'Business'} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : null}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back, {firstName}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {settings?.business_name ? `${settings.business_name} — ` : ''}Here's your business at a glance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                <Skeleton className="w-10 h-10 rounded-lg mb-3" /><Skeleton className="w-20 h-3 mb-2" /><Skeleton className="w-16 h-7 mb-2" /><Skeleton className="w-24 h-3" />
              </div>
            ))
          : kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${card.color}`} /></div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{card.sub}</p>
                </div>
              );
            })}
      </div>

      {/* Sales trend chart + Top products chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Sales Trend</h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Last 7 days</span>
          </div>
          <div className="h-64">
            {dashLoading ? <Skeleton className="w-full h-full" /> : sales.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No sales data yet</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Top 5 Products</h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">By quantity sold</span>
          </div>
          <div className="h-64">
            {dashLoading ? <Skeleton className="w-full h-full" /> : topProductsData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><Package className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No sales data yet</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="qty" radius={[8, 8, 0, 0]}>
                    {topProductsData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent transactions + Low stock items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Recent Transactions</h2>
            {recentSales.length > 0 && <button onClick={() => navigate('/sales')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">View all</button>}
          </div>
          {dashLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-12" />)}</div>
          ) : recentSales.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><ShoppingCart className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">No transactions yet</p>
              <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">Sales will show up here once recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <button key={sale.id} onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-neutral-400" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{sale.invoice_number}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(sale.created_at)} · {sale.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(sale.total)}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">{sale.payment_method}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Low Stock Items</h2>
            {lowStockProducts.length > 0 && <button onClick={() => navigate('/products')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">View all</button>}
          </div>
          {dashLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-12" />)}</div>
          ) : lowStockProducts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><Package className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">{products.length === 0 ? 'No products yet' : 'All items in stock'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{product.sku ? `SKU: ${product.sku} · ` : ''}In stock: {product.stock_quantity}</p>
                  </div>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400 flex-shrink-0 ml-2">Low stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
