import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Building2, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserWithDetails {
  user_id: string;
  email: string | null;
  full_name: string | null;
  roles: ('admin' | 'user')[];
  departments: ('algemeen' | 'tifa' | 'panelen' | 'units' | 'mycuby')[];
}

const DEPARTMENTS = ['algemeen', 'tifa', 'panelen', 'units', 'mycuby'] as const;
const DEPARTMENT_LABELS: Record<typeof DEPARTMENTS[number], string> = {
  algemeen: 'Algemeen',
  tifa: 'TIFA',
  panelen: 'Panelen',
  units: 'Units',
  mycuby: 'MyCuby',
};

export default function GebruikersBeheer() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch all departments
      const { data: departments, error: depsError } = await supabase
        .from('user_departments')
        .select('*');

      if (depsError) throw depsError;

      // Combine data
      const combinedUsers: UserWithDetails[] = (profiles || []).map(profile => ({
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as 'admin' | 'user'),
        departments: (departments || [])
          .filter(d => d.user_id === profile.user_id)
          .map(d => d.department as typeof DEPARTMENTS[number]),
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Fout',
        description: 'Kon gebruikers niet laden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast({
        title: 'Niet toegestaan',
        description: 'Je kunt je eigen admin rol niet wijzigen.',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(userId);

    try {
      if (currentlyAdmin) {
        // Remove admin role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      } else {
        // Add admin role
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
      }

      await fetchUsers();
      toast({
        title: 'Rol gewijzigd',
        description: currentlyAdmin ? 'Admin rol verwijderd.' : 'Admin rol toegevoegd.',
      });
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        title: 'Fout',
        description: 'Kon rol niet wijzigen.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleDepartment = async (
    userId: string, 
    department: typeof DEPARTMENTS[number], 
    hasAccess: boolean
  ) => {
    setUpdating(userId);

    try {
      if (hasAccess) {
        // Remove department access
        await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', userId)
          .eq('department', department);
      } else {
        // Add department access
        await supabase
          .from('user_departments')
          .insert({ user_id: userId, department });
      }

      await fetchUsers();
      toast({
        title: 'Afdeling gewijzigd',
        description: hasAccess 
          ? `Toegang tot ${DEPARTMENT_LABELS[department]} verwijderd.`
          : `Toegang tot ${DEPARTMENT_LABELS[department]} toegevoegd.`,
      });
    } catch (error) {
      console.error('Error toggling department:', error);
      toast({
        title: 'Fout',
        description: 'Kon afdeling toegang niet wijzigen.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Geen toegang</h1>
          <p className="text-muted-foreground">Je hebt geen admin rechten voor deze pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gebruikersbeheer
            </h1>
            <p className="text-muted-foreground">
              Beheer gebruikers, rollen en afdelingsrechten
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('admin')).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Afdelingen</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DEPARTMENTS.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gebruikers</CardTitle>
            <CardDescription>
              Beheer gebruikersrollen en afdelingstoegang. Admins hebben toegang tot alle afdelingen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Admin</TableHead>
                    {DEPARTMENTS.map(dept => (
                      <TableHead key={dept} className="text-center">
                        {DEPARTMENT_LABELS[dept]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isUserAdmin = u.roles.includes('admin');
                    const isCurrentUser = u.user_id === user?.id;
                    const isUpdatingUser = updating === u.user_id;

                    return (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{u.full_name || 'Geen naam'}</div>
                            <div className="text-sm text-muted-foreground">{u.email}</div>
                            {isCurrentUser && (
                              <Badge variant="outline" className="mt-1">Jij</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isUserAdmin}
                              disabled={isCurrentUser || isUpdatingUser}
                              onCheckedChange={() => toggleAdminRole(u.user_id, isUserAdmin)}
                            />
                            {isUserAdmin && (
                              <Badge variant="default">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {DEPARTMENTS.map(dept => {
                          const hasAccess = u.departments.includes(dept);
                          return (
                            <TableCell key={dept} className="text-center">
                              <Checkbox
                                checked={isUserAdmin || hasAccess}
                                disabled={isUserAdmin || isUpdatingUser}
                                onCheckedChange={() => toggleDepartment(u.user_id, dept, hasAccess)}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
