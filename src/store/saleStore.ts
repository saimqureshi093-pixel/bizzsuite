import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/store/productStore';

export type SaleItem = {
  product_id: string;
  name: string;
  sku: string | null;
  qty: number;
  unit_price: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  user_id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'online' | 'credit';
  status: 'paid' | 'unpaid';
  created_at: string;
};

type SaleInput = {
  customer_id: string | null;
  customer_name: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'online' | 'credit';
  status: 'paid' | 'unpaid';
};

type SaleStore = {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  fetchSales: () => Promise<void>;
  createSale: (input: SaleInput, products: Product[]) => Promise<{ error: string | null; sale?: Sale }>;
  deleteSale: (sale: Sale) => Promise<{ error: string | null }>;
};

export const useSaleStore = create<SaleStore>((set) => ({
  sales: [],
  loading: false,
  error: null,

  fetchSales: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ sales: (data || []) as Sale[], loading: false });
  },

  createSale: async (input, products) => {
    // Validate stock availability
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return { error: `Product "${item.name}" not found` };
      if (product.stock_quantity < item.qty) {
        return { error: `Insufficient stock for "${item.name}". Available: ${product.stock_quantity}, requested: ${item.qty}` };
      }
    }

    // Generate invoice number
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });

    const invoiceNumber = `INV-${String((count ?? 0) + 1).padStart(4, '0')}`;

    // Insert sale
    const { data, error } = await supabase
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: input.customer_id,
        customer_name: input.customer_name,
        items: input.items,
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        total: input.total,
        payment_method: input.payment_method,
        status: input.status,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    const sale = data as Sale;

    // Deduct stock from products
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const newStock = product.stock_quantity - item.qty;
        await supabase
          .from('products')
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    // If credit payment, add to customer's balance
    if (input.payment_method === 'credit' && input.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', input.customer_id)
        .maybeSingle();

      if (customer) {
        const newBalance = (customer.balance || 0) + input.total;
        await supabase
          .from('customers')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', input.customer_id);
      }
    }

    set((state) => ({ sales: [sale, ...state.sales] }));
    return { error: null, sale };
  },

  deleteSale: async (sale) => {
    // Restore stock for each item
    for (const item of sale.items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .maybeSingle();

      if (product) {
        const newStock = product.stock_quantity + item.qty;
        await supabase
          .from('products')
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    // If it was a credit sale, reduce customer's balance
    if (sale.payment_method === 'credit' && sale.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', sale.customer_id)
        .maybeSingle();

      if (customer) {
        const newBalance = Math.max(0, (customer.balance || 0) - sale.total);
        await supabase
          .from('customers')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', sale.customer_id);
      }
    }

    const { error } = await supabase.from('sales').delete().eq('id', sale.id);
    if (error) return { error: error.message };

    set((state) => ({ sales: state.sales.filter((s) => s.id !== sale.id) }));
    return { error: null };
  },
}));
