import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/store/productStore';

export type PurchaseItem = {
  product_id: string;
  name: string;
  qty: number;
  unit_cost: number;
  subtotal: number;
};

export type Purchase = {
  id: string;
  user_id: string;
  bill_number: string;
  supplier_id: string | null;
  supplier_name: string;
  items: PurchaseItem[];
  total: number;
  payment_method: 'cash' | 'card' | 'online' | 'credit';
  status: 'paid' | 'unpaid';
  purchase_date: string;
  created_at: string;
};

type PurchaseInput = {
  bill_number: string;
  supplier_id: string | null;
  supplier_name: string;
  items: PurchaseItem[];
  total: number;
  payment_method: 'cash' | 'card' | 'online' | 'credit';
  status: 'paid' | 'unpaid';
  purchase_date: string;
};

type PurchaseStore = {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  fetchPurchases: () => Promise<void>;
  createPurchase: (input: PurchaseInput, products: Product[]) => Promise<{ error: string | null; purchase?: Purchase }>;
};

export const usePurchaseStore = create<PurchaseStore>((set) => ({
  purchases: [],
  loading: false,
  error: null,

  fetchPurchases: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ purchases: (data || []) as Purchase[], loading: false });
  },

  createPurchase: async (input, products) => {
    const { data, error } = await supabase.from('purchases').insert({
      bill_number: input.bill_number,
      supplier_id: input.supplier_id,
      supplier_name: input.supplier_name,
      items: input.items,
      total: input.total,
      payment_method: input.payment_method,
      status: input.status,
      purchase_date: input.purchase_date,
    }).select().single();

    if (error) return { error: error.message };
    const purchase = data as Purchase;

    // Increment stock
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const newStock = product.stock_quantity + item.qty;
        await supabase.from('products')
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    // Credit → add to supplier payable_balance
    if (input.payment_method === 'credit' && input.supplier_id) {
      const { data: supplier } = await supabase.from('suppliers').select('payable_balance').eq('id', input.supplier_id).maybeSingle();
      if (supplier) {
        const newBalance = (supplier.payable_balance || 0) + input.total;
        await supabase.from('suppliers').update({ payable_balance: newBalance, updated_at: new Date().toISOString() }).eq('id', input.supplier_id);
      }
    }

    set((state) => ({ purchases: [purchase, ...state.purchases] }));
    return { error: null, purchase };
  },
}));
