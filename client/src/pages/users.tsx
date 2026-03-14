import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import { Users as UsersIcon, Search, Shield, UserCog, UserCircle, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type RoleFilter = "all" | "admin" | "employee" | "client";

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-destructive", text: "text-destructive-foreground" },
  employee: { bg: "bg-primary", text: "text-primary-foreground" },
  client: { bg: "bg-secondary", text: "text-secondary-foreground" },
};

export default function Users() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "employee" | "client">("client");
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);

  const { data: users, isLoading: isUsersLoading, error: usersError } = useQuery<User[]>({
    queryKey: roleFilter !== "all" ? ["/api/users", `?role=${roleFilter}`] : ["/api/users"],
    retry: false,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const userStats = useMemo(() => {
    if (!users) return { admin: 0, employee: 0, client: 0, total: 0 };
    return {
      admin: users.filter(u => u.role === "admin").length,
      employee: users.filter(u => u.role === "employee").length,
      client: users.filter(u => u.role === "client").length,
      total: users.length,
    };
  }, [users]);

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setRoleChangeDialogOpen(false);
      setUserToUpdate(null);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update user roles",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleViewUser = (u: User) => {
    setSelectedUser(u);
    setViewDialogOpen(true);
  };

  const handleChangeRole = (u: User) => {
    setUserToUpdate(u);
    setNewRole(u.role as "admin" | "employee" | "client");
    setRoleChangeDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (userToUpdate && newRole !== userToUpdate.role) {
      updateUserRoleMutation.mutate({ id: userToUpdate.id, role: newRole });
    } else {
      setRoleChangeDialogOpen(false);
      setUserToUpdate(null);
    }
  };

  if (isAuthLoading || isUsersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-unauthorized-title">Unauthorized</CardTitle>
          <CardDescription data-testid="text-unauthorized-description">
            You don't have permission to access user management. This page is only available to administrators.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (usersError && isUnauthorizedError(usersError as Error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You don't have permission to view users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-users-title">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-total">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">All users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-admin">{userStats.admin}</div>
            <p className="text-xs text-muted-foreground">Admin access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-employee">{userStats.employee}</div>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-client">{userStats.client}</div>
            <p className="text-xs text-muted-foreground">Customer accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-filter-all">All Roles</SelectItem>
                <SelectItem value="admin" data-testid="option-filter-admin">Admin</SelectItem>
                <SelectItem value="employee" data-testid="option-filter-employee">Employee</SelectItem>
                <SelectItem value="client" data-testid="option-filter-client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleViewUser(u)}
                      data-testid={`row-user-${u.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-user-name-${u.id}`}>
                        {u.name}
                      </TableCell>
                      <TableCell data-testid={`text-user-email-${u.id}`}>
                        {u.email}
                      </TableCell>
                      <TableCell data-testid={`badge-user-role-${u.id}`}>
                        <Badge className={`${roleColors[u.role]?.bg || "bg-muted"} ${roleColors[u.role]?.text || "text-muted-foreground"} capitalize`}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-user-created-${u.id}`}>
                        {format(new Date(u.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewUser(u)}
                            data-testid={`button-view-${u.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeRole(u)}
                            data-testid={`button-change-role-${u.id}`}
                          >
                            Change Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-user-details">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View user information and account details</DialogDescription>
            </DialogHeader>
            <UserDetailView user={selectedUser} />
          </DialogContent>
        </Dialog>
      )}

      {userToUpdate && (
        <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
          <AlertDialogContent data-testid="dialog-change-role">
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Role</AlertDialogTitle>
              <AlertDialogDescription>
                Update the role for {userToUpdate.name}. This will change their permissions and access level.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Select New Role</label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as "admin" | "employee" | "client")}>
                <SelectTrigger data-testid="select-new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" data-testid="option-role-admin">Admin</SelectItem>
                  <SelectItem value="employee" data-testid="option-role-employee">Employee</SelectItem>
                  <SelectItem value="client" data-testid="option-role-client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-role-change">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRoleChange}
                disabled={updateUserRoleMutation.isPending}
                data-testid="button-confirm-role-change"
              >
                {updateUserRoleMutation.isPending ? "Updating..." : "Update Role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function UserDetailView({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium" data-testid="text-detail-name">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium" data-testid="text-detail-email">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Role</p>
          <Badge 
            className={`${roleColors[user.role]?.bg || "bg-muted"} ${roleColors[user.role]?.text || "text-muted-foreground"} capitalize mt-1`}
            data-testid="badge-detail-role"
          >
            {user.role}
          </Badge>
        </div>
        {user.phone && (
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium" data-testid="text-detail-phone">{user.phone}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Created Date</p>
          <p className="font-medium" data-testid="text-detail-created">
            {format(new Date(user.created_at), "MMMM dd, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-medium font-mono text-xs" data-testid="text-detail-id">{user.id}</p>
        </div>
      </div>

      {user.avatar_url && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Avatar</p>
          <img
            src={user.avatar_url}
            alt={`${user.name}'s avatar`}
            className="h-16 w-16 rounded-full"
            data-testid="img-detail-avatar"
          />
        </div>
      )}
    </div>
  );
}
