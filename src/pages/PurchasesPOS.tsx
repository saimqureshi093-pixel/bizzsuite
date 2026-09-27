import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, X, CheckCircle2, Package, Truck, Calendar } from 'lucide-react';
import { useProductStore, type Product } from '@/store/productStore';
import { useSupplierStore } from '@/store/supplierStore';
import { usePurchaseStore, type PurchaseItem } from '@/store/purchaseStore';
import { useUIStore } from '@/store/uiStore';
import { Skeleton } from '@/components/Skeleton';

type CartItem = { product: Product; qty: number; unitCost: number };
type PaymentMethod = 'cash' | 'card' | 'online' | 'credit';

export function PurchasesPOSPage() {
  const navigate = useNavigate();
  const { products, loading: productsLoading, fetchProducts } = useProductStore();
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { createPurchase } = usePurchaseStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [supplierId, setSupplierId] = useState('walk-in');
  const [billNumber, setBillNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [completing, setCompleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); fetchSuppliers(); }, [fetchProducts, fetchSuppliers]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
  }, [products, search]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.unitCost * item.qty, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) return prev.map((item) => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { product, qty: 1, unitCost: product.cost_price }];
    });
  };

  const updateQty = (pid: string, delta: number) => setCart((prev) => prev.map((item) => item.product.id === pid ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  const updateCost = (pid: string, cost: number) => setCart((prev) => prev.map((item) => item.product.id === pid ? { ...item, unitCost: Math.max(0, cost) } : item));
  const removeFromCart = (pid: string) => setCart((prev) => prev.filter((item) => item.product.id !== pid));
  const clearCart = () => { setCart([]); setBillNumber(''); setSupplierId('walk-in'); setPaymentMethod('cash'); };

  const handleComplete = async () => {
    if (cart.length === 0) { addToast('Add products to make a purchase', 'error'); return; }
    if (paymentMethod === 'credit' && supplierId === 'walk-in') { addToast('Credit purchase needs a supplier. Please select a supplier.', 'error'); return; }
    setCompleting(true);

    const supplier = suppliers.find((s) => s.id === supplierId);
    const items: PurchaseItem[] = cart.map((item) => ({ product_id: item.product.id, name: item.product.name, qty: item.qty, unit_cost: item.unitCost, subtotal: item.unitCost * item.qty }));

    // Auto-generate bill number if empty
    const finalBill = billNumber.trim() || `BILL-${Date.now().toString().slice(-6)}`;

    const { error, purchase } = await createPurchase({
      bill_number: finalBill, supplier_id: supplierId === 'walk-in' ? null : supplierId,
      supplier_name: supplier?.name ?? 'Walk-in Supplier', items, total,
      payment_method: paymentMethod, status: paymentMethod === 'credit' ? 'unpaid' : 'paid', purchase_date: purchaseDate,
    }, products);

    setCompleting(false);
    if (error) addToast(error, 'error');
    else if (purchase) { addToast(`Purchase completed! Bill ${purchase.bill_number}`, 'success'); setSuccess(purchase.id); clearCart(); fetchProducts(); }
  };

  const formatPrice = (n: number) => `$${n.toFixed(2)}`;

  if (success) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Purchase Completed!</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Stock has been updated.</p>
        <button onClick={() => setSuccess(null)} className="px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">New Purchase</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5"><h1 className="text-2xl font-bold text-neutral-900 dark:text-white">New Purchase</h1><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Select products and record stock-in</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" /></div>
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full h-28 rounded-xl" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center"><div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600" /></div><p className="text-sm text-neutral-500 dark:text-neutral-400">{products.length === 0 ? 'No products available. Add products first.' : 'No products match your search.'}</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <button key={product.id} onClick={() => addToCart(product)} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-left hover:border-emerald-500 hover:shadow-sm transition-all">
                  <div className="w-full h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2"><Package className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate mb-1">{product.name}</p>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">{formatPrice(product.cost_price)}</span><span className="text-xs text-neutral-400 dark:text-neutral-500">Stock: {product.stock_quantity}</span></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col sticky top-20 max-h-[calc(100vh-6rem)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800"><div className="flex items-center gap-2"><Truck className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Purchase Cart</h2><span className="text-xs text-neutral-400 dark:text-neutral-500">({cart.length})</span></div>{cart.length > 0 && <button onClick={clearCart} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">Clear all</button>}</div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? <div className="py-8 text-center"><div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><Truck className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div><p className="text-sm text-neutral-400 dark:text-neutral-500">Cart is empty</p></div> : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center gap-2 mb-1.5"><p className="text-sm font-medium text-neutral-900 dark:text-white truncate flex-1">{item.product.name}</p><button onClick={() => removeFromCart(item.product.id)} className="text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button></div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1"><button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><Minus className="w-3 h-3" /></button><span className="text-sm font-medium text-neutral-900 dark:text-white w-8 text-center">{item.qty}</span><button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><Plus className="w-3 h-3" /></button></div>
                        <div className="relative flex-1"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">$</span><input type="number" step="0.01" min="0" value={item.unitCost} onChange={(e) => updateCost(item.product.id, parseFloat(e.target.value) || 0)} className="w-full pl-5 pr-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white w-16 text-right">{formatPrice(item.unitCost * item.qty)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-3">
                <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Supplier</label><select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="walk-in">Walk-in Supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Bill #</label><input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="Auto" className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
                  <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Date</label><input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-2 gap-1">
                    {([{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'online', label: 'Online' }, { value: 'credit', label: 'Credit (Payable)' }] as { value: PaymentMethod; label: string }[]).map((m) => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${paymentMethod === m.value ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{m.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800"><span className="text-base font-bold text-neutral-900 dark:text-white">Total</span><span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span></div>
                <button onClick={handleComplete} disabled={completing || cart.length === 0} className="w-full py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">{completing ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Complete Purchase — {formatPrice(total)}</>}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
