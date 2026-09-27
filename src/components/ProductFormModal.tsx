import { useState, useEffect, type FormEvent } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { useProductStore, type Product } from '@/store/productStore';

type ProductFormModalProps = {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
};

type FormErrors = {
  name?: string;
  cost_price?: string;
  selling_price?: string;
  stock_quantity?: string;
  low_stock_threshold?: string;
  image_url?: string;
};

export function ProductFormModal({ open, onClose, product }: ProductFormModalProps) {
  const { categories, addProduct, updateProduct } = useProductStore();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku ?? '');
      setCategory(product.category || 'Uncategorized');
      setCostPrice(String(product.cost_price));
      setSellingPrice(String(product.selling_price));
      setStockQuantity(String(product.stock_quantity));
      setLowStockThreshold(String(product.low_stock_threshold));
      setImageUrl(product.image_url ?? '');
    } else {
      setName('');
      setSku('');
      setCategory('Uncategorized');
      setCostPrice('');
      setSellingPrice('');
      setStockQuantity('');
      setLowStockThreshold('10');
      setImageUrl('');
    }
    setErrors({});
    setCustomCategory('');
    setIsCustomCategory(false);
  }, [product, open]);

  if (!open) return null;

  const validate = () => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Product name is required';
    if (costPrice !== '' && isNaN(Number(costPrice))) e.cost_price = 'Must be a valid number';
    if (costPrice !== '' && Number(costPrice) < 0) e.cost_price = 'Cost price must be 0 or greater';
    if (sellingPrice !== '' && isNaN(Number(sellingPrice))) e.selling_price = 'Must be a valid number';
    if (sellingPrice !== '' && Number(sellingPrice) < 0) e.selling_price = 'Selling price must be 0 or greater';
    if (stockQuantity !== '' && isNaN(Number(stockQuantity))) e.stock_quantity = 'Must be a valid number';
    if (stockQuantity !== '' && Number(stockQuantity) < 0) e.stock_quantity = 'Stock must be 0 or greater';
    if (lowStockThreshold !== '' && isNaN(Number(lowStockThreshold))) e.low_stock_threshold = 'Must be a valid number';
    if (lowStockThreshold !== '' && Number(lowStockThreshold) < 0) e.low_stock_threshold = 'Threshold must be 0 or greater';
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) e.image_url = 'Enter a valid URL (http:// or https://)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const finalCategory = isCustomCategory ? customCategory.trim() || 'Uncategorized' : category;

    const input = {
      name: name.trim(),
      sku: sku.trim() || null,
      category: finalCategory,
      cost_price: costPrice === '' ? 0 : Number(costPrice),
      selling_price: sellingPrice === '' ? 0 : Number(sellingPrice),
      stock_quantity: stockQuantity === '' ? 0 : Number(stockQuantity),
      low_stock_threshold: lowStockThreshold === '' ? 10 : Number(lowStockThreshold),
      image_url: imageUrl.trim() || null,
    };

    const { error } = product
      ? await updateProduct(product.id, input)
      : await addProduct(input);

    setSubmitting(false);

    if (error) {
      setErrors({ name: error });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Package className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {product ? 'Edit Product' : 'Add Product'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.name && errors.name.includes('duplicate key') && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>A product with this SKU already exists. Use a different SKU.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Mouse"
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                errors.name && !errors.name.includes('duplicate')
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
              }`}
            />
            {errors.name && !errors.name.includes('duplicate') && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                SKU <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. WM-001"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Category
              </label>
              {isCustomCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="New category"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomCategory(false); setCustomCategory(''); }}
                    className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm transition-colors"
                  >
                    List
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(true)}
                    className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm transition-colors whitespace-nowrap"
                  >
                    + New
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Cost Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.cost_price
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.cost_price && <p className="mt-1 text-xs text-red-500">{errors.cost_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Selling Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.selling_price
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.selling_price && <p className="mt-1 text-xs text-red-500">{errors.selling_price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.stock_quantity
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                }`}
              />
              {errors.stock_quantity && <p className="mt-1 text-xs text-red-500">{errors.stock_quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="10"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.low_stock_threshold
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                }`}
              />
              {errors.low_stock_threshold && <p className="mt-1 text-xs text-red-500">{errors.low_stock_threshold}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Image URL <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                errors.image_url
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
              }`}
            />
            {errors.image_url && <p className="mt-1 text-xs text-red-500">{errors.image_url}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                product ? 'Save Changes' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
