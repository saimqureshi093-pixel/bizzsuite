import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUIStore } from '@/store/uiStore';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      addToast(error, 'error');
    } else {
      setSent(true);
      addToast('Password reset link sent to your email', 'success');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Reset your password</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {sent
                ? 'Check your inbox for the reset link'
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                  We've sent a password reset link to <span className="font-medium text-neutral-900 dark:text-white">{email}</span>. Follow the link in the email to reset your password.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@business.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                        error
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!sent && (
              <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Remember your password?{' '}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
