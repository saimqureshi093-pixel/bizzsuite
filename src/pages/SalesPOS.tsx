import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  CheckCircle2,
  Package,
  User as UserIcon,
  CreditCard,
} from 'lucide-react';
import { useProductStore, type Product } from '@/store/productStore';
import { useCustomerStore } from '@/store/customerStore';
import { useSaleStore, type SaleItem } from '@/store/saleStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore, getCurrencySymbol } from '@/store/settingsStore';
import { Skeleton } from '@/components/Skeleton';

type CartItem = {
  product: Product;
  qty: number;
};

type PaymentMethod = 'cash' | 'card' | 'online' | 'credit';

export function SalesPOSPage() {
  const navigate = useNavigate();
  const { products, loading: productsLoading, fetchProducts } = useProductStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { createSale } = useSaleStore();
  const { addToast } = useUIStore();
  const { settings } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('walk-in');
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [taxInput, setTaxInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [completing, setCompleting] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [fetchProducts, fetchCustomers]);

  useEffect(() => {
    if (settings?.tax_rate != null && taxInput === '') {
      setTaxInput(String(settings.tax_rate));
    }
  }, [settings, taxInput]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.filter((p) => p.stock_quantity > 0);
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.stock_quantity > 0 &&
        (p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
    );
  }, [products, search]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.selling_price * item.qty, 0), [cart]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    if (discountType === 'percent') return (subtotal * val) / 100;
    return Math.min(val, subtotal);
  }, [discountInput, discountType, subtotal]);

  const taxAmount = useMemo(() => {
    const val = parseFloat(taxInput) || 0;
    return ((subtotal - discountAmount) * val) / 100;
  }, [taxInput, subtotal, discountAmount]);

  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock_quantity) {
          addToast(`Only ${product.stock_quantity} in stock`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const newQty = item.qty + delta;
        if (newQty < 1) return item;
        if (newQty > item.product.stock_quantity) {
          addToast(`Only ${item.product.stock_quantity} in stock`, 'error');
          return item;
        }
        return { ...item, qty: newQty };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountInput('');
    setTaxInput('');
    setCustomerId('walk-in');
    setPaymentMethod('cash');
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add products to make a sale.', 'error');
      return;
    }

    if (paymentMethod === 'credit' && customerId === 'walk-in') {
      addToast('Credit sale needs a customer. Please select a customer.', 'error');
      return;
    }

    setCompleting(true);

    const customer = customers.find((c) => c.id === customerId);
    const items: SaleItem[] = cart.map((item) => ({
      product_id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      qty: item.qty,
      unit_price: item.product.selling_price,
      subtotal: item.product.selling_price * item.qty,
    }));

    const { error, sale } = await createSale(
      {
        customer_id: customerId === 'walk-in' ? null : customerId,
        customer_name: customer?.name ?? 'Walk-in Customer',
        items,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        payment_method: paymentMethod,
        status: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      },
      products
    );

    setCompleting(false);

    if (error) {
      addToast(error, 'error');
    } else if (sale) {
      addToast(`Sale completed! Invoice ${sale.invoice_number}`, 'success');
      setSuccessInvoice(sale.id);
      clearCart();
      // Refresh products to update stock
      fetchProducts();
    }
  };

  const currencySymbol = getCurrencySymbol(settings?.currency ?? 'USD');
  const formatPrice = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  if (successInvoice) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Sale Completed!</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Your invoice has been generated.</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/sales/invoice/${successInvoice}`)}
            className="px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            View Invoice
          </button>
          <button
            onClick={() => setSuccessInvoice(null)}
            className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">New Sale</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Select products and complete the transaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product selection — left side */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-full h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {products.length === 0 ? 'No products available. Add products first.' : 'No products match your search or all are out of stock.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-left hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm transition-all group"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-16 rounded-lg object-cover mb-2"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
                      <Package className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate mb-1">{product.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(product.selling_price)}</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">Stock: {product.stock_quantity}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart — right side */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col sticky top-20 max-h-[calc(100vh-6rem)]">
            {/* Cart header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Cart</h2>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">({cart.length})</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                  </div>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">Cart is empty</p>
                  <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">Click products to add them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          {formatPrice(item.product.selling_price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-6 h-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-6 h-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white w-16 text-right flex-shrink-0">
                        {formatPrice(item.product.selling_price * item.qty)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer — totals and actions */}
            {cart.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-3">
                {/* Customer selector */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                    <UserIcon className="w-3 h-3 inline mr-1" />
                    Customer
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="walk-in">Walk-in Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount + Tax */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Discount</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="0"
                        className="flex-1 w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        onClick={() => setDiscountType(discountType === 'amount' ? 'percent' : 'amount')}
                        className="px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        {discountType === 'amount' ? currencySymbol : '%'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Tax (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxInput}
                      onChange={(e) => setTaxInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                    <CreditCard className="w-3 h-3 inline mr-1" />
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { value: 'cash', label: 'Cash' },
                      { value: 'card', label: 'Card' },
                      { value: 'online', label: 'Online' },
                      { value: 'credit', label: 'Credit (Udhaar)' },
                    ] as { value: PaymentMethod; label: string }[]).map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          paymentMethod === method.value
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                    <span className="text-neutral-900 dark:text-white font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
                      <span className="text-red-500 font-medium">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Tax</span>
                      <span className="text-neutral-900 dark:text-white font-medium">+{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-base font-bold text-neutral-900 dark:text-white">Total</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Complete sale button */}
                <button
                  onClick={handleCompleteSale}
                  disabled={completing || cart.length === 0}
                  className="w-full py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {completing ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Sale — {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
