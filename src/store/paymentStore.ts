import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useCustomerStore } from '@/store/customerStore';

export type Payment = {
  id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
};

type PaymentInput = {
  customer_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
};

type PaymentStore = {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: (customerId: string) => Promise<void>;
  recordPayment: (input: PaymentInput) => Promise<{ error: string | null }>;
};

export const usePaymentStore = create<PaymentStore>((set) => ({
  payments: [],
  loading: false,
  error: null,

  fetchPayments: async (customerId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ payments: (data || []) as Payment[], loading: false });
  },

  recordPayment: async (input) => {
    // Insert payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        customer_id: input.customer_id,
        amount: input.amount,
        payment_date: input.payment_date,
        note: input.note,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    // Deduct from customer's balance
    const { data: customer } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', input.customer_id)
      .maybeSingle();

    if (customer) {
      const newBalance = Math.max(0, (customer.balance || 0) - input.amount);
      await supabase
        .from('customers')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', input.customer_id);

      // Update the customer store locally
      useCustomerStore.setState((state) => ({
        customers: state.customers.map((c) =>
          c.id === input.customer_id ? { ...c, balance: newBalance } : c
        ),
      }));
    }

    set((state) => ({ payments: [data as Payment, ...state.payments] }));
    return { error: null };
  },
}));
