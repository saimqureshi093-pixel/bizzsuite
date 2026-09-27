import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
};

type CustomerInput = {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

type CustomerStore = {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (input: CustomerInput) => Promise<{ error: string | null }>;
  updateCustomer: (id: string, input: CustomerInput) => Promise<{ error: string | null }>;
  deleteCustomer: (id: string) => Promise<{ error: string | null }>;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ customers: (data || []) as Customer[], loading: false });
  },

  addCustomer: async (input) => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    set((state) => ({ customers: [data as Customer, ...state.customers] }));
    return { error: null };
  },

  updateCustomer: async (id, input) => {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message };

    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? (data as Customer) : c)),
    }));
    return { error: null };
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return { error: error.message };

    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
    return { error: null };
  },
}));
