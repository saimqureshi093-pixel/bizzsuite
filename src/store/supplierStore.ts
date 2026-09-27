import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  payable_balance: number;
  created_at: string;
  updated_at: string;
};

type SupplierInput = {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
};

type SupplierStore = {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (input: SupplierInput) => Promise<{ error: string | null }>;
  updateSupplier: (id: string, input: SupplierInput) => Promise<{ error: string | null }>;
  deleteSupplier: (id: string) => Promise<{ error: string | null }>;
};

export const useSupplierStore = create<SupplierStore>((set) => ({
  suppliers: [],
  loading: false,
  error: null,

  fetchSuppliers: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ suppliers: (data || []) as Supplier[], loading: false });
  },

  addSupplier: async (input) => {
    const { data, error } = await supabase.from('suppliers').insert({
      name: input.name, phone: input.phone, email: input.email || null,
      address: input.address || null, company: input.company || null, notes: input.notes || null,
    }).select().single();
    if (error) return { error: error.message };
    set((state) => ({ suppliers: [data as Supplier, ...state.suppliers] }));
    return { error: null };
  },

  updateSupplier: async (id, input) => {
    const { data, error } = await supabase.from('suppliers').update({
      name: input.name, phone: input.phone, email: input.email || null,
      address: input.address || null, company: input.company || null, notes: input.notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) return { error: error.message };
    set((state) => ({ suppliers: state.suppliers.map((s) => (s.id === id ? (data as Supplier) : s)) }));
    return { error: null };
  },

  deleteSupplier: async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return { error: error.message };
    set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
    return { error: null };
  },
}));
