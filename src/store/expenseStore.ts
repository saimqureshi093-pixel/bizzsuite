import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Expense = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  expense_date: string;
  note: string | null;
  payment_method: string;
  created_at: string;
};

type ExpenseInput = {
  category: string;
  amount: number;
  expense_date: string;
  note: string | null;
  payment_method: string;
};

type ExpenseStore = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<{ error: string | null }>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;
};

export const DEFAULT_EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Transport', 'Misc'];

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  loading: false,
  error: null,

  fetchExpenses: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ expenses: (data || []) as Expense[], loading: false });
  },

  addExpense: async (input) => {
    const { data, error } = await supabase.from('expenses').insert({
      category: input.category, amount: input.amount, expense_date: input.expense_date,
      note: input.note, payment_method: input.payment_method,
    }).select().single();
    if (error) return { error: error.message };
    set((state) => ({ expenses: [data as Expense, ...state.expenses] }));
    return { error: null };
  },

  updateExpense: async (id, input) => {
    const { data, error } = await supabase.from('expenses').update({
      category: input.category, amount: input.amount, expense_date: input.expense_date,
      note: input.note, payment_method: input.payment_method,
    }).eq('id', id).select().single();
    if (error) return { error: error.message };
    set((state) => ({ expenses: state.expenses.map((e) => (e.id === id ? (data as Expense) : e)) }));
    return { error: null };
  },

  deleteExpense: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return { error: error.message };
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
    return { error: null };
  },
}));
