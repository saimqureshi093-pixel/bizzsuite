import { useState, useEffect, useRef, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  WifiOff,
  Wifi,
  Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUIStore } from '@/store/uiStore';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/purchases', label: 'Purchases', icon: Package },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [manualInstallOpen, setManualInstallOpen] = useState(false);
  const online = useOnlineStatus();
  const { canInstall, promptInstall } = usePWAInstall();
  const { user, profile, signOut } = useAuth();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const prevOnline = useRef(online);

  useEffect(() => {
    if (prevOnline.current && !online) {
      addToast('You are offline. Data will save locally.', 'info');
    } else if (!prevOnline.current && online) {
      addToast('You are back online. Syncing...', 'success');
    }
    prevOnline.current = online;
  }, [online, addToast]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    addToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const handleInstallClick = () => {
    const installResult = promptInstall();
    if (!installResult) {
      setManualInstallOpen(true);
      return;
    }

    void installResult.then((outcome) => {
      if (outcome === 'accepted') {
        addToast('App installed successfully', 'success');
      }
    });
  };

  const displayName = profile?.full_name ?? user?.email ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const businessName = profile?.business_name ?? 'Your Business';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200 dark:border-neutral-800">
          <Logo size="sm" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 dark:text-neutral-600 cursor-not-allowed select-none"
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-neutral-300 dark:text-neutral-700">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 px-2">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-600 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Online/offline badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {online ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Install App button */}
            <button
              onClick={handleInstallClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                canInstall
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              aria-label="Install app"
            >
                <Download className="w-3.5 h-3.5" />
              <span className="text-xs font-medium hidden sm:inline">Install App</span>
            </button>

            <ThemeToggle />

            {/* Notifications */}
            <button
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-white dark:text-neutral-900 text-xs font-bold">
                  {initials}
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{businessName}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
      {manualInstallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setManualInstallOpen(false)}
            aria-label="Close install instructions"
          />
          <section
            className="relative w-full max-w-sm rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-install-title"
          >
            <button
              onClick={() => setManualInstallOpen(false)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="manual-install-title" className="text-lg font-semibold text-neutral-900 dark:text-white pr-8">
              Install BizzSuite
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              To install: tap the Chrome menu (3 dots), then choose Install app or Add to Home Screen.
            </p>
            <button
              onClick={() => setManualInstallOpen(false)}
              className="mt-5 w-full rounded-lg bg-neutral-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:opacity-90"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
