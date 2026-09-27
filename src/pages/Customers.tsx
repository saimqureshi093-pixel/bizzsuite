import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { useCustomerStore, type Customer } from '@/store/customerStore';
import { useSaleStore } from '@/store/saleStore';
import { useUIStore } from '@/store/uiStore';
import { CustomerFormModal } from '@/components/CustomerFormModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

export function CustomersPage() {
  const navigate = useNavigate();
  const { customers, loading, fetchCustomers, deleteCustomer } = useCustomerStore();
  const { sales, fetchSales } = useSaleStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchSales();
  }, [fetchCustomers, fetchSales]);

  const customerPurchases = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      if (sale.customer_id) {
        map.set(sale.customer_id, (map.get(sale.customer_id) ?? 0) + sale.total);
      }
    }
    return map;
  }, [sales]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteCustomer(deleteTarget.id);
    setDeleting(false);
    if (error) {
      addToast(error, 'error');
    } else {
      addToast(`"${deleteTarget.name}" deleted`, 'success');
    }
    setDeleteTarget(null);
  };

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'} total
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
              {customers.length === 0 ? 'No customers yet' : 'No customers found'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {customers.length === 0 ? 'Add your first customer to start tracking sales and balances.' : 'Try adjusting your search.'}
            </p>
            {customers.length === 0 && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first customer
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Phone</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Purchases</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Balance (Udhaar)</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filtered.map((customer) => {
                    const totalPurchases = customerPurchases.get(customer.id) ?? 0;
                    const hasBalance = customer.balance > 0;
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-400">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">{customer.name}</p>
                              {customer.email && (
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            {customer.phone}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-white">
                          {totalPurchases > 0 ? formatPrice(totalPurchases) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasBalance ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/15 text-xs font-medium text-red-700 dark:text-red-400">
                              {formatPrice(customer.balance)}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              $0.00
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              aria-label="Edit customer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(customer)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              aria-label="Delete customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/customers/${customer.id}`)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              aria-label="View customer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((customer) => {
              const totalPurchases = customerPurchases.get(customer.id) ?? 0;
              const hasBalance = customer.balance > 0;
              return (
                <div
                  key={customer.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{customer.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(customer)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      View details
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">Purchases</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{totalPurchases > 0 ? formatPrice(totalPurchases) : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">Balance</p>
                        {hasBalance ? (
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatPrice(customer.balance)}</span>
                        ) : (
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">$0.00</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <CustomerFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCustomer(null); }}
        customer={editingCustomer}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Their sales records will remain but will no longer be linked to this customer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
