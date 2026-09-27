import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Sliders, Save, Image as ImageIcon, AlertCircle, Palette, Sun, Moon,
  Monitor, PanelLeftClose, PanelLeftOpen, Users, Plus, Pencil, Trash2, UserPlus,
  Download, Upload, AlertTriangle, Info, LogOut, Shield, X,
} from 'lucide-react';
import { useSettingsStore, CURRENCY_OPTIONS, CURRENCY_SYMBOLS } from '@/store/settingsStore';
import { useUIStore, type ThemeMode } from '@/store/uiStore';
import { useTeamStore, type TeamMember } from '@/store/teamStore';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/Skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Role = 'Owner' | 'Manager' | 'Staff';

export function SettingsPage() {
  const { settings, loading, fetchSettings, saveSettings } = useSettingsStore();
  const { addToast } = useUIStore();
  const { profile } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('0');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name ?? '');
      setLogoUrl(settings.logo_url ?? '');
      setAddress(settings.address ?? '');
      setPhone(settings.phone ?? '');
      setEmail(settings.email ?? '');
      setCurrency(settings.currency ?? 'USD');
      setTaxRate(String(settings.tax_rate ?? 0));
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    const { error: saveError } = await saveSettings({
      business_name: businessName.trim() || null,
      logo_url: logoUrl.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setSavingProfile(false);
    if (saveError) setError(saveError);
    else addToast('Settings saved', 'success');
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    setError(null);
    const { error: saveError } = await saveSettings({ currency, tax_rate: parseFloat(taxRate) || 0 });
    setSavingPrefs(false);
    if (saveError) setError(saveError);
    else addToast('Settings saved', 'success');
  };

  if (loading && !settings) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="w-40 h-8" />
        <Skeleton className="w-full h-64 rounded-xl" />
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your business profile and preferences</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" /><span>{error}</span>
        </div>
      )}

      <BusinessProfileSection
        businessName={businessName} setBusinessName={setBusinessName}
        logoUrl={logoUrl} setLogoUrl={setLogoUrl}
        address={address} setAddress={setAddress}
        phone={phone} setPhone={setPhone}
        email={email} setEmail={setEmail}
        saving={savingProfile} onSave={handleSaveProfile}
      />

      <PreferencesSection
        currency={currency} setCurrency={setCurrency}
        taxRate={taxRate} setTaxRate={setTaxRate}
        saving={savingPrefs} onSave={handleSavePrefs}
      />

      <AppearanceSection />

      <UsersAndRolesSection currentUserId={profile?.id ?? ''} currentUserRole={profile?.role as Role ?? 'Owner'} />

      <BackupRestoreSection />

      <AboutSection />
    </div>
  );
}

/* ── Business Profile ── */
function BusinessProfileSection(props: {
  businessName: string; setBusinessName: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  saving: boolean; onSave: () => void;
}) {
  return (
    <SectionCard icon={Building2} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-500" title="Business Profile">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {props.logoUrl ? (
              <img src={props.logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <ImageIcon className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Logo URL</label>
            <input type="url" value={props.logoUrl} onChange={(e) => props.setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Paste an image URL for your business logo</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Business Name</label>
          <input type="text" value={props.businessName} onChange={(e) => props.setBusinessName(e.target.value)} placeholder="e.g. My Store"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Address</label>
          <textarea value={props.address} onChange={(e) => props.setAddress(e.target.value)} placeholder="123 Main St, City, Country" rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone</label>
            <input type="tel" value={props.phone} onChange={(e) => props.setPhone(e.target.value)} placeholder="+1 555 0100"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
            <input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="business@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
        </div>
        <SaveButton saving={props.saving} onClick={props.onSave} label="Save Profile" />
      </div>
    </SectionCard>
  );
}

/* ── Preferences ── */
function PreferencesSection(props: {
  currency: string; setCurrency: (v: string) => void;
  taxRate: string; setTaxRate: (v: string) => void;
  saving: boolean; onSave: () => void;
}) {
  return (
    <SectionCard icon={Sliders} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-500" title="Preferences">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Currency</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCY_OPTIONS.map((code) => (
              <button key={code} type="button" onClick={() => props.setCurrency(code)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  props.currency === code
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}>
                <span className="font-bold mr-1">{CURRENCY_SYMBOLS[code]}</span>{code}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">This symbol will appear on dashboard, POS, invoices, and reports</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Default Tax Rate (%)</label>
          <div className="relative max-w-xs">
            <input type="number" step="0.01" min="0" max="100" value={props.taxRate} onChange={(e) => props.setTaxRate(e.target.value)} placeholder="0"
              className="w-full px-3.5 py-2.5 pr-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">This rate will auto-fill when creating a new sale</p>
        </div>
        <SaveButton saving={props.saving} onClick={props.onSave} label="Save Preferences" />
      </div>
    </SectionCard>
  );
}

/* ── Appearance ── */
function AppearanceSection() {
  const { themeMode, setThemeMode, sidebarCollapsed, toggleSidebar } = useUIStore();

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <SectionCard icon={Palette} iconBg="bg-purple-50 dark:bg-purple-500/10" iconColor="text-purple-500" title="Appearance">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Theme</label>
          <div className="grid grid-cols-3 gap-2 max-w-sm">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button key={opt.value} onClick={() => setThemeMode(opt.value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    themeMode === opt.value
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}>
                  <Icon className="w-4 h-4" />{opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">Changes apply instantly across the whole app</p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-neutral-500" /> : <PanelLeftClose className="w-4 h-4 text-neutral-500" />}
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Collapse sidebar by default</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Toggle the sidebar collapsed state</p>
            </div>
          </div>
          <button onClick={toggleSidebar}
            className={`relative w-11 h-6 rounded-full transition-colors ${sidebarCollapsed ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sidebarCollapsed ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

/* ── Users & Roles ── */
function UsersAndRolesSection({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole: Role }) {
  const { members, loading, fetchMembers, updateRole, removeMember } = useTeamStore();
  const { addToast } = useUIStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const isOwner = currentUserRole === 'Owner';

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await removeMember(removeTarget.id);
    setRemoving(false);
    if (error) addToast(error, 'error');
    else { addToast(`"${removeTarget.full_name}" removed`, 'success'); setRemoveTarget(null); }
  };

  const roleBadge = (role: Role) => {
    const styles: Record<Role, string> = {
      Owner: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      Manager: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      Staff: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    };
    return <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${styles[role]}`}>{role}</span>;
  };

  return (
    <SectionCard icon={Users} iconBg="bg-amber-50 dark:bg-amber-500/10" iconColor="text-amber-500" title="Users & Roles">
      {!isOwner && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          <Shield className="w-4 h-4 flex-shrink-0" /><span>Only the Owner can manage users.</span>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-14" />)}</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-300 flex-shrink-0">{m.full_name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{m.full_name}{m.id === currentUserId && <span className="text-xs text-neutral-400 ml-1">(You)</span>}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {roleBadge(m.role)}
                {isOwner && m.id !== currentUserId && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditMember(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setRemoveTarget(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {isOwner && (
        <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors mt-4">
          <UserPlus className="w-4 h-4" />Add New User
        </button>
      )}
      <AddUserModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdded={() => { fetchMembers(); }} />
      <EditRoleModal member={editMember} onClose={() => setEditMember(null)} onUpdate={async (role) => { const { error } = await updateRole(editMember!.id, role); if (error) addToast(error, 'error'); else { addToast('Role updated', 'success'); setEditMember(null); } }} />
      <ConfirmDialog open={!!removeTarget} title="Remove User" message={`Are you sure you want to remove "${removeTarget?.full_name}"? They will lose access to this business.`} onConfirm={handleRemove} onCancel={() => setRemoveTarget(null)} loading={removing} confirmLabel="Remove" />
    </SectionCard>
  );
}

/* ── Add User Modal ── */
function AddUserModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const { addToast } = useUIStore();
  const { profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setFullName(''); setEmail(''); setRole('Staff'); setError(null); } }, [open]);
  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) { setError('Name and email are required'); return; }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      email: email.trim(),
      full_name: fullName.trim(),
      business_name: profile?.business_name ?? null,
      role,
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    addToast('User added successfully', 'success');
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><UserPlus className="w-4 h-4 text-neutral-500" /></div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add New User</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Owner', 'Manager', 'Staff'] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${role === r ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Role Modal ── */
function EditRoleModal({ member, onClose, onUpdate }: { member: TeamMember | null; onClose: () => void; onUpdate: (role: Role) => void }) {
  const [role, setRole] = useState<Role>('Staff');
  useEffect(() => { if (member) setRole(member.role); }, [member]);
  if (!member) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Edit Role</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Change role for <span className="font-medium text-neutral-900 dark:text-white">{member.full_name}</span></p>
          <div className="grid grid-cols-3 gap-2">
            {(['Owner', 'Manager', 'Staff'] as Role[]).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${role === r ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{r}</button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button onClick={() => onUpdate(role)} className="flex-1 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Backup & Restore ── */
function BackupRestoreSection() {
  const { addToast } = useUIStore();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [importData, setImportData] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const tables = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'expenses', 'payments'];
      const data: Record<string, unknown> = {};
      for (const table of tables) {
        const { data: rows, error } = await supabase.from(table).select('*');
        if (error) throw error;
        data[table] = rows || [];
      }
      const blob = new Blob([JSON.stringify({ app: 'BizzSuite', version: '1.0.0', exported_at: new Date().toISOString(), data })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bizzsuite-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      addToast('Data exported successfully', 'success');
    } catch (err) {
      addToast('Export failed', 'error');
    }
    setExporting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.data) { addToast('Invalid backup file', 'error'); return; }
        setImportData(parsed.data);
        setConfirmRestore(true);
      } catch {
        addToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      const tables = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'expenses', 'payments'];
      for (const table of tables) {
        const rows = (importData as Record<string, unknown[]>)[table];
        if (rows && rows.length > 0) {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          const cleanRows = rows.map((r) => { const { id, user_id, created_at, updated_at, ...rest } = r as Record<string, unknown>; return rest; });
          await supabase.from(table).insert(cleanRows);
        }
      }
      addToast('Data restored successfully', 'success');
      setConfirmRestore(false);
      setImportData(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      addToast('Restore failed', 'error');
    }
    setImporting(false);
  };

  return (
    <SectionCard icon={Download} iconBg="bg-cyan-50 dark:bg-cyan-500/10" iconColor="text-cyan-500" title="Backup & Restore">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Export Data</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Download all data as JSON file</p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors">
            {exporting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Import Data</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Upload JSON to restore</p>
            </div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Importing data will replace all current data. Make sure to export a backup first.</span>
        </div>
      </div>
      <ConfirmDialog open={confirmRestore} title="Restore Data" message="This will replace all current data. Continue?" onConfirm={handleRestore} onCancel={() => { setConfirmRestore(false); setImportData(null); }} loading={importing} confirmLabel="Restore" />
    </SectionCard>
  );
}

/* ── About ── */
function AboutSection() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { addToast } = useUIStore();

  const handleLogout = async () => {
    await signOut();
    addToast('Signed out successfully', 'info');
    navigate('/login');
  };

  return (
    <SectionCard icon={Info} iconBg="bg-neutral-100 dark:bg-neutral-800" iconColor="text-neutral-500" title="About">
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-white dark:text-neutral-900">B</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">BizzSuite</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Everything Your Business Needs, In One Suite</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">Version 1.0.0</p>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <LogOut className="w-4 h-4" />Logout
        </button>
      </div>
    </SectionCard>
  );
}

/* ── Shared Components ── */
function SectionCard({ icon: Icon, iconBg, iconColor, title, children }: {
  icon: typeof Building2; iconBg: string; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors">
        {saving ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        {label}
      </button>
    </div>
  );
}
