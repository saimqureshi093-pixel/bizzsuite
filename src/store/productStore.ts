import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProductInput = {
  name: string;
  sku: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
};

type ProductStore = {
  products: Product[];
  loading: boolean;
  error: string | null;
  categories: string[];
  fetchProducts: () => Promise<void>;
  addProduct: (input: ProductInput) => Promise<{ error: string | null }>;
  updateProduct: (id: string, input: ProductInput) => Promise<{ error: string | null }>;
  deleteProduct: (id: string) => Promise<{ error: string | null }>;
};

const DEFAULT_CATEGORIES = ['Uncategorized', 'Electronics', 'Clothing', 'Food & Beverage', 'Office Supplies', 'Other'];

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  categories: DEFAULT_CATEGORIES,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const products = (data || []) as Product[];
    const userCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCategories]));

    set({ products, loading: false, categories: allCategories });
  },

  addProduct: async (input) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: input.name,
        sku: input.sku || null,
        category: input.category || 'Uncategorized',
        cost_price: input.cost_price,
        selling_price: input.selling_price,
        stock_quantity: input.stock_quantity,
        low_stock_threshold: input.low_stock_threshold,
        image_url: input.image_url || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    set((state) => ({
      products: [data as Product, ...state.products],
      categories: Array.from(new Set([...state.categories, input.category])),
    }));

    return { error: null };
  },

  updateProduct: async (id, input) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: input.name,
        sku: input.sku || null,
        category: input.category || 'Uncategorized',
        cost_price: input.cost_price,
        selling_price: input.selling_price,
        stock_quantity: input.stock_quantity,
        low_stock_threshold: input.low_stock_threshold,
        image_url: input.image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message };

    set((state) => ({
      products: state.products.map((p) => (p.id === id ? (data as Product) : p)),
      categories: Array.from(new Set([...state.categories, input.category])),
    }));

    return { error: null };
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { error: error.message };

    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    return { error: null };
  },
}));
