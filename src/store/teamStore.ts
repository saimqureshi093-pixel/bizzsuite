import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  role: 'Owner' | 'Manager' | 'Staff';
  created_at: string;
};

type TeamStore = {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  updateRole: (id: string, role: TeamMember['role']) => Promise<{ error: string | null }>;
  removeMember: (id: string) => Promise<{ error: string | null }>;
};

export const useTeamStore = create<TeamStore>((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) { set({ loading: false, error: error.message }); return; }
    set({ members: (data || []) as TeamMember[], loading: false });
  },

  updateRole: async (id, role) => {
    const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    set((state) => ({ members: state.members.map((m) => (m.id === id ? { ...m, role } : m)) }));
    return { error: null };
  },

  removeMember: async (id) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) return { error: error.message };
    set((state) => ({ members: state.members.filter((m) => m.id !== id) }));
    return { error: null };
  },
}));
