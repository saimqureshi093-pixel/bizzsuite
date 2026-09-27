import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { DashboardSkeleton } from '@/components/Skeleton';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <DashboardSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <DashboardSkeleton />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
