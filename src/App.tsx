import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { useUIStore } from '@/store/uiStore';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/AppLayout';
import { ToastContainer } from '@/components/Toast';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { ForgotPasswordPage } from '@/pages/ForgotPassword';
import { DashboardPage } from '@/pages/Dashboard';
import { ProductsPage } from '@/pages/Products';
import { CustomersPage } from '@/pages/Customers';
import { CustomerDetailPage } from '@/pages/CustomerDetail';
import { SalesPOSPage } from '@/pages/SalesPOS';
import { SalesListPage } from '@/pages/SalesList';
import { InvoicePage } from '@/pages/Invoice';
import { SuppliersPage } from '@/pages/Suppliers';
import { SupplierDetailPage } from '@/pages/SupplierDetail';
import { PurchasesPOSPage } from '@/pages/PurchasesPOS';
import { PurchasesListPage } from '@/pages/PurchasesList';
import { ExpensesPage } from '@/pages/Expenses';
import { ReportsPage } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';

function AppRoutes() {
  const { initDarkMode } = useUIStore();

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><AppLayout><ProductsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><AppLayout><CustomersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><AppLayout><CustomerDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><AppLayout><SalesListPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sales/new" element={<ProtectedRoute><AppLayout><SalesPOSPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sales/invoice/:id" element={<ProtectedRoute><AppLayout><InvoicePage /></AppLayout></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><AppLayout><SuppliersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/suppliers/:id" element={<ProtectedRoute><AppLayout><SupplierDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><AppLayout><PurchasesListPage /></AppLayout></ProtectedRoute>} />
        <Route path="/purchases/new" element={<ProtectedRoute><AppLayout><PurchasesPOSPage /></AppLayout></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><AppLayout><ExpensesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

        {/* Default */}
        <Route path="/" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="*" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
