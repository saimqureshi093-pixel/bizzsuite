import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Settings = {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED',
  SAR: 'SAR',
};

export const CURRENCY_OPTIONS = ['USD', 'PKR', 'EUR', 'GBP', 'INR', 'AED', 'SAR'];

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? '$';
}

type SettingsStore = {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  saveSettings: (input: Partial<Settings>) => Promise<{ error: string | null }>;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('settings').select('*').maybeSingle();
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ settings: data as Settings | null, loading: false });
  },

  saveSettings: async (input) => {
    const existing = get().settings;
    if (existing) {
      const { data, error } = await supabase.from('settings').update({
        ...input, updated_at: new Date().toISOString(),
      }).eq('id', existing.id).select().single();
      if (error) return { error: error.message };
      set({ settings: data as Settings });
    } else {
      const { data, error } = await supabase.from('settings').insert(input).select().single();
      if (error) return { error: error.message };
      set({ settings: data as Settings });
    }
    return { error: null };
  },
}));
