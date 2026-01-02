import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredDepartment?: 'algemeen' | 'tifa' | 'panelen' | 'units' | 'mycuby';
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredDepartment 
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, hasDepartmentAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Geen toegang</h1>
          <p className="text-muted-foreground">Je hebt geen admin rechten voor deze pagina.</p>
        </div>
      </div>
    );
  }

  if (requiredDepartment && !hasDepartmentAccess(requiredDepartment)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Geen toegang</h1>
          <p className="text-muted-foreground">
            Je hebt geen toegang tot de afdeling: {requiredDepartment}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
