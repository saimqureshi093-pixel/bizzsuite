import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Truck, Phone, Mail, Building2, ChevronRight } from 'lucide-react';
import { useSupplierStore, type Supplier } from '@/store/supplierStore';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useUIStore } from '@/store/uiStore';
import { SupplierFormModal } from '@/components/SupplierFormModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

export function SuppliersPage() {
  const navigate = useNavigate();
  const { suppliers, loading, fetchSuppliers, deleteSupplier } = useSupplierStore();
  const { purchases, fetchPurchases } = usePurchaseStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchSuppliers(); fetchPurchases(); }, [fetchSuppliers, fetchPurchases]);

  const supplierPurchases = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of purchases) { if (p.supplier_id) map.set(p.supplier_id, (map.get(p.supplier_id) ?? 0) + p.total); }
    return map;
  }, [purchases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q));
  }, [suppliers, search]);

  const handleAdd = () => { setEditingSupplier(null); setModalOpen(true); };
  const handleEdit = (s: Supplier) => { setEditingSupplier(s); setModalOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteSupplier(deleteTarget.id);
    setDeleting(false);
    if (error) addToast(error, 'error'); else addToast(`"${deleteTarget.name}" deleted`, 'success');
    setDeleteTarget(null);
  };

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} total</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
      </div>
      {loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-14" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8 text-neutral-300 dark:text-neutral-600" /></div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">{suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers found'}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{suppliers.length === 0 ? 'Add your first supplier to start tracking purchases and payables.' : 'Try adjusting your search.'}</p>
            {suppliers.length === 0 && <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"><Plus className="w-4 h-4" />Add your first supplier</button>}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Company</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Purchases</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Payable Balance</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filtered.map((s) => {
                    const totalP = supplierPurchases.get(s.id) ?? 0;
                    const hasPayable = s.payable_balance > 0;
                    return (
                      <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer" onClick={() => navigate(`/suppliers/${s.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-400">{s.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">{s.name}</p>
                              {s.email && <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-neutral-400" />{s.phone}</span></td>
                        <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{s.company || '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-white">{totalP > 0 ? formatPrice(totalP) : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {hasPayable ? <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/15 text-xs font-medium text-red-700 dark:text-red-400">{formatPrice(s.payable_balance)}</span>
                          : <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-xs font-medium text-emerald-700 dark:text-emerald-400">$0.00</span>}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={() => navigate(`/suppliers/${s.id}`)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((s) => {
              const totalP = supplierPurchases.get(s.id) ?? 0;
              const hasPayable = s.payable_balance > 0;
              return (
                <div key={s.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{s.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>
                      {s.company && <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{s.company}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={() => navigate(`/suppliers/${s.id}`)} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">View details</button>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-xs text-neutral-400 dark:text-neutral-500">Purchases</p><p className="text-sm font-semibold text-neutral-900 dark:text-white">{totalP > 0 ? formatPrice(totalP) : '—'}</p></div>
                      <div className="text-right"><p className="text-xs text-neutral-400 dark:text-neutral-500">Payable</p>{hasPayable ? <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatPrice(s.payable_balance)}</span> : <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">$0.00</span>}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <SupplierFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingSupplier(null); }} supplier={editingSupplier} />
      <ConfirmDialog open={!!deleteTarget} title="Delete Supplier" message={`Are you sure you want to delete "${deleteTarget?.name}"? Their purchase records will remain but will no longer be linked.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
