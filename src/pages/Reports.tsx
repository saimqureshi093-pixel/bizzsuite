import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BarChart3, ShoppingCart, TrendingUp, Package, Users, Receipt, Download,
  Calendar, Printer, DollarSign, AlertTriangle, Wallet,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useSaleStore, type Sale } from '@/store/saleStore';
import { useProductStore } from '@/store/productStore';
import { useCustomerStore } from '@/store/customerStore';
import { useExpenseStore } from '@/store/expenseStore';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useSettingsStore, getCurrencySymbol } from '@/store/settingsStore';
import { Skeleton } from '@/components/Skeleton';

type Tab = 'sales' | 'profit' | 'inventory' | 'products' | 'customers' | 'expenses';
type DateRange = 'today' | 'week' | 'month' | 'year' | 'all';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [range, setRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(true);

  const { sales, fetchSales } = useSaleStore();
  const { products, fetchProducts } = useProductStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { purchases, fetchPurchases } = usePurchaseStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    Promise.all([fetchSales(), fetchProducts(), fetchCustomers(), fetchExpenses(), fetchPurchases()])
      .finally(() => setLoading(false));
  }, [fetchSales, fetchProducts, fetchCustomers, fetchExpenses, fetchPurchases]);

  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (range === 'today') { /* start is already today 00:00 */ }
    else if (range === 'week') start.setDate(now.getDate() - 6);
    else if (range === 'month') start.setMonth(now.getMonth() - 1);
    else if (range === 'year') start.setFullYear(now.getFullYear() - 1);
    else if (range === 'all') { start.setFullYear(2000, 0, 1); }
    return { start, end };
  }, [range]);

  const filterByDate = useCallback(<T extends { created_at?: string; expense_date?: string; purchase_date?: string }>(items: T[], dateKey: keyof T): T[] => {
    return items.filter((item) => {
      const d = new Date(String(item[dateKey]));
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [dateRange]);

  const filteredSales = useMemo(() => filterByDate(sales, 'created_at'), [sales, filterByDate]);
  const filteredExpenses = useMemo(() => filterByDate(expenses, 'expense_date'), [expenses, filterByDate]);
  const filteredPurchases = useMemo(() => filterByDate(purchases, 'purchase_date'), [purchases, filterByDate]);

  const currencySymbol = getCurrencySymbol(settings?.currency ?? 'USD');
  const formatPrice = (n: number) => `${currencySymbol}${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'profit', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'products', label: 'Top Products', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Analyze your business performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Date range picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-neutral-400" />
        {(['today', 'week', 'month', 'year', 'all'] as DateRange[]).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === r ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}>
            {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : r === 'year' ? 'This Year' : 'All Time'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-28 rounded-xl" />)}
          </div>
          <Skeleton className="w-full h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {tab === 'sales' && <SalesReport sales={filteredSales} formatPrice={formatPrice} formatDate={formatDate} exportCSV={exportCSV} />}
          {tab === 'profit' && <ProfitLossReport sales={filteredSales} expenses={filteredExpenses} purchases={filteredPurchases} formatPrice={formatPrice} exportCSV={exportCSV} />}
          {tab === 'inventory' && <InventoryReport products={products} formatPrice={formatPrice} exportCSV={exportCSV} />}
          {tab === 'products' && <TopProductsReport sales={filteredSales} formatPrice={formatPrice} exportCSV={exportCSV} />}
          {tab === 'customers' && <CustomerReport sales={filteredSales} customers={customers} formatPrice={formatPrice} exportCSV={exportCSV} />}
          {tab === 'expenses' && <ExpenseReport expenses={filteredExpenses} formatPrice={formatPrice} formatDate={formatDate} exportCSV={exportCSV} />}
        </>
      )}
    </div>
  );
}

/* ── Sales Report ── */
function SalesReport({ sales, formatPrice, formatDate, exportCSV }: {
  sales: Sale[]; formatPrice: (n: number) => string; formatDate: (d: string) => string;
  exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalOrders = sales.length;
  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      const key = s.created_at.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + s.total);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), total: Number(total.toFixed(2)),
    }));
  }, [sales]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Sales" value={formatPrice(totalSales)} icon={DollarSign} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard label="Total Orders" value={String(totalOrders)} icon={ShoppingCart} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KpiCard label="Avg Order Value" value={formatPrice(avgOrder)} icon={TrendingUp} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
      </div>
      <ChartCard title="Sales Over Time" hasData={chartData.length > 0}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <TableCard title="Sales Details" onExport={() => exportCSV('sales_report', ['Date', 'Invoice', 'Customer', 'Total', 'Payment Method'],
        sales.map((s) => [formatDate(s.created_at), s.invoice_number, s.customer_name, s.total, s.payment_method]))}>
        {sales.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>Date</Th><Th>Invoice</Th><Th>Customer</Th><Th right>Total</Th><Th>Payment</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Td>{formatDate(s.created_at)}</Td><Td>{s.invoice_number}</Td><Td>{s.customer_name}</Td>
                    <Td right>{formatPrice(s.total)}</Td><Td><span className="capitalize text-xs">{s.payment_method}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Profit & Loss Report ── */
function ProfitLossReport({ sales, expenses, purchases, formatPrice, exportCSV }: {
  sales: Sale[]; expenses: { category: string; amount: number; expense_date: string }[]; purchases: { total: number; supplier_name: string }[];
  formatPrice: (n: number) => string; exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const netProfit = totalSales - totalExpenses;

  const chartData = useMemo(() => [{ name: 'Sales', value: Number(totalSales.toFixed(2)) }, { name: 'Expenses', value: Number(totalExpenses.toFixed(2)) }, { name: 'Purchases', value: Number(totalPurchases.toFixed(2)) }], [totalSales, totalExpenses, totalPurchases]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }));
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Sales" value={formatPrice(totalSales)} icon={DollarSign} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard label="Total Expenses" value={formatPrice(totalExpenses)} icon={Receipt} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
        <KpiCard label="Total Purchases" value={formatPrice(totalPurchases)} icon={Package} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" />
        <KpiCard label="Net Profit" value={formatPrice(netProfit)} icon={TrendingUp} color={netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} bg={netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'} />
      </div>
      <ChartCard title="Sales vs Expenses vs Purchases" hasData={totalSales > 0 || totalExpenses > 0 || totalPurchases > 0}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              <Cell fill="#3b82f6" /><Cell fill="#f59e0b" /><Cell fill="#8b5cf6" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <TableCard title="Expense Breakdown by Category" onExport={() => exportCSV('expense_breakdown', ['Category', 'Amount'],
        expenseByCategory.map((e) => [e.category, e.amount]))}>
        {expenseByCategory.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>Category</Th><Th right>Amount</Th><Th right>% of Total</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {expenseByCategory.map((e) => (
                  <tr key={e.category} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Td>{e.category}</Td><Td right>{formatPrice(e.amount)}</Td>
                    <Td right>{totalExpenses > 0 ? `${((e.amount / totalExpenses) * 100).toFixed(1)}%` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Inventory Report ── */
function InventoryReport({ products, formatPrice, exportCSV }: {
  products: { id: string; name: string; sku: string | null; cost_price: number; selling_price: number; stock_quantity: number; low_stock_threshold: number; category: string }[];
  formatPrice: (n: number) => string; exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const stockValue = products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0);
  const sellingValue = products.reduce((sum, p) => sum + p.selling_price * p.stock_quantity, 0);
  const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
  const outOfStock = products.filter((p) => p.stock_quantity === 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Stock Value (Cost)" value={formatPrice(stockValue)} icon={Package} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard label="Stock Value (Retail)" value={formatPrice(sellingValue)} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KpiCard label="Low Stock" value={String(lowStock.length)} icon={AlertTriangle} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
        <KpiCard label="Out of Stock" value={String(outOfStock.length)} icon={AlertTriangle} color="text-red-500" bg="bg-red-50 dark:bg-red-500/10" />
      </div>
      <TableCard title="Inventory Details" onExport={() => exportCSV('inventory_report', ['Product', 'SKU', 'Category', 'Stock', 'Cost Value', 'Selling Value'],
        products.map((p) => [p.name, p.sku ?? '', p.category, p.stock_quantity, (p.cost_price * p.stock_quantity).toFixed(2), (p.selling_price * p.stock_quantity).toFixed(2)]))}>
        {products.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>Product</Th><Th>Category</Th><Th right>Stock</Th><Th right>Cost Value</Th><Th right>Selling Value</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {products.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  const isOut = p.stock_quantity === 0;
                  return (
                    <tr key={p.id} className={`transition-colors ${isOut ? 'bg-red-50 dark:bg-red-500/5' : isLow ? 'bg-amber-50 dark:bg-amber-500/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'}`}>
                      <Td>{p.name}{p.sku && <span className="text-xs text-neutral-400 ml-1">({p.sku})</span>}</Td>
                      <Td>{p.category}</Td>
                      <Td right><span className={isOut ? 'text-red-600 dark:text-red-400 font-medium' : isLow ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>{p.stock_quantity}</span></Td>
                      <Td right>{formatPrice(p.cost_price * p.stock_quantity)}</Td>
                      <Td right>{formatPrice(p.selling_price * p.stock_quantity)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Top Products Report ── */
function TopProductsReport({ sales, formatPrice, exportCSV }: {
  sales: Sale[]; formatPrice: (n: number) => string; exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const productStats = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of sales) {
      for (const item of s.items) {
        const existing = map.get(item.product_id) ?? { name: item.name, qty: 0, revenue: 0 };
        existing.qty += item.qty;
        existing.revenue += item.subtotal;
        map.set(item.product_id, existing);
      }
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats, revenue: Number(stats.revenue.toFixed(2)) }))
      .sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [sales]);

  const chartData = productStats.map((p) => ({ name: p.name.length > 12 ? p.name.slice(0, 10) + '...' : p.name, qty: p.qty, revenue: p.revenue }));

  return (
    <div className="space-y-4">
      <ChartCard title="Top 10 Products by Quantity Sold" hasData={productStats.length > 0}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={80} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="qty" radius={[0, 8, 8, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <TableCard title="Product Ranking" onExport={() => exportCSV('top_products', ['Product', 'Qty Sold', 'Revenue'],
        productStats.map((p) => [p.name, p.qty, p.revenue]))}>
        {productStats.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>#</Th><Th>Product</Th><Th right>Qty Sold</Th><Th right>Revenue</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {productStats.map((p, i) => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Td><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500">{i + 1}</span></Td>
                    <Td>{p.name}</Td><Td right>{p.qty}</Td><Td right>{formatPrice(p.revenue)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Customer Report ── */
function CustomerReport({ sales, customers, formatPrice, exportCSV }: {
  sales: Sale[]; customers: { id: string; name: string; phone: string; balance: number }[];
  formatPrice: (n: number) => string; exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const customerStats = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; totalPurchases: number; balance: number }>();
    for (const c of customers) map.set(c.id, { name: c.name, phone: c.phone, totalPurchases: 0, balance: c.balance });
    for (const s of sales) {
      if (s.customer_id) {
        const existing = map.get(s.customer_id);
        if (existing) existing.totalPurchases += s.total;
      }
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats, totalPurchases: Number(stats.totalPurchases.toFixed(2)) }))
      .sort((a, b) => b.totalPurchases - a.totalPurchases);
  }, [sales, customers]);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const chartData = customerStats.filter((c) => c.totalPurchases > 0).slice(0, 10).map((c) => ({ name: c.name.length > 12 ? c.name.slice(0, 10) + '...' : c.name, total: c.totalPurchases }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Customers" value={String(customers.length)} icon={Users} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard label="Total Outstanding" value={formatPrice(totalOutstanding)} icon={Wallet} color={totalOutstanding > 0 ? 'text-red-500' : 'text-emerald-500'} bg={totalOutstanding > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'} />
        <KpiCard label="Active Customers" value={String(customerStats.filter((c) => c.totalPurchases > 0).length)} icon={ShoppingCart} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
      </div>
      {chartData.length > 0 && (
        <ChartCard title="Top 10 Customers by Purchases" hasData>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      <TableCard title="Customer Summary" onExport={() => exportCSV('customer_report', ['Customer', 'Phone', 'Total Purchases', 'Outstanding Balance'],
        customerStats.map((c) => [c.name, c.phone, c.totalPurchases, c.balance]))}>
        {customerStats.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>Customer</Th><Th>Phone</Th><Th right>Total Purchases</Th><Th right>Outstanding</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {customerStats.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Td>{c.name}</Td><Td>{c.phone}</Td><Td right>{formatPrice(c.totalPurchases)}</Td>
                    <Td right><span className={c.balance > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-emerald-600 dark:text-emerald-400'}>{formatPrice(c.balance)}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Expense Report ── */
function ExpenseReport({ expenses, formatPrice, formatDate, exportCSV }: {
  expenses: { id: string; category: string; amount: number; expense_date: string; note: string | null; payment_method: string }[];
  formatPrice: (n: number) => string; formatDate: (d: string) => string; exportCSV: (fn: string, h: string[], r: (string | number)[][]) => void;
}) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries()).map(([category, amount]) => ({ name: category, value: Number(amount.toFixed(2)) }));
  }, [expenses]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const d = new Date(e.expense_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({
      month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), total: Number(total.toFixed(2)),
    }));
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label="Total Expenses" value={formatPrice(totalExpenses)} icon={Receipt} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
        <KpiCard label="Categories" value={String(pieData.length)} icon={BarChart3} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Expenses by Category" hasData={pieData.length > 0}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry: { name?: string; value?: number }) => `${entry.name ?? ''}: ${formatPrice(entry.value ?? 0)}`} labelLine={false} style={{ fontSize: 11 }}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Monthly Expense Trend" hasData={monthlyTrend.length > 0}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <TableCard title="Expense Details" onExport={() => exportCSV('expense_report', ['Date', 'Category', 'Amount', 'Payment Method', 'Note'],
        expenses.map((e) => [formatDate(e.expense_date), e.category, e.amount, e.payment_method, e.note ?? '']))}>
        {expenses.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <Th>Date</Th><Th>Category</Th><Th right>Amount</Th><Th>Payment</Th><Th>Note</Th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Td>{formatDate(e.expense_date)}</Td><Td><span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs">{e.category}</span></Td>
                    <Td right>{formatPrice(e.amount)}</Td><Td><span className="capitalize text-xs">{e.payment_method}</span></Td><Td>{e.note || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}

/* ── Shared UI Components ── */
function KpiCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: typeof DollarSign; color: string; bg: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, hasData, children }: { title: string; hasData: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">{title}</h2>
      {hasData ? <div className="h-72">{children}</div> : <EmptyState />}
    </div>
  );
}

function TableCard({ title, onExport, children }: { title: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <button onClick={onExport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
        <BarChart3 className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
      </div>
      <p className="text-sm text-neutral-400 dark:text-neutral-500">No data yet for this period</p>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={`px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 ${right ? 'text-right font-medium text-neutral-900 dark:text-white' : ''}`}>{children}</td>;
}
