import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import {
  Search, Shield, UserCircle, Eye,
  Crown, HandshakeIcon, Anchor, Wrench, Bot, Sparkles, Package,
  LayoutGrid, List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ALL_ROLES = [
  "pirate_king", "admin", "partner", "staff_captain",
  "staff", "sparky_ai", "sparky", "client", "vendor",
] as const;
type AllRole = (typeof ALL_ROLES)[number];
type RoleFilter = "all" | AllRole;

const ROLE_META: Record<AllRole, { label: string; icon: React.FC<any>; badge: string; description: string }> = {
  pirate_king: { label: "Pirate King", icon: Crown, badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", description: "Supreme admin" },
  admin: { label: "Admin", icon: Shield, badge: "bg-red-500/20 text-red-400 border-red-500/30", description: "Administrator" },
  partner: { label: "Partner", icon: HandshakeIcon, badge: "bg-purple-500/20 text-purple-400 border-purple-500/30", description: "Business partner" },
  staff_captain: { label: "Staff Captain", icon: Anchor, badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", description: "Team lead" },
  staff: { label: "Staff", icon: Wrench, badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", description: "Crew member" },
  sparky_ai: { label: "Sparky AI", icon: Bot, badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", description: "AI assistant" },
  sparky: { label: "Sparky", icon: Sparkles, badge: "bg-sky-500/20 text-sky-400 border-sky-500/30", description: "Sparky user" },
  client: { label: "Client", icon: UserCircle, badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", description: "Customer" },
  vendor: { label: "Vendor", icon: Package, badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", description: "Supplier" },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role as AllRole];
  if (!meta) return <Badge variant="outline" className="capitalize">{role}</Badge>;
  return (
    <Badge variant="outline" className={cn("capitalize border", meta.badge)}>
      {meta.label}
    </Badge>
  );
}

function UserAvatar({ name, avatarUrl, role }: { name: string; avatarUrl?: string | null; role: string }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  }
  const meta = ROLE_META[role as AllRole];
  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border",
      meta?.badge ?? "bg-muted text-muted-foreground border-border"
    )}>
      {initials}
    </div>
  );
}

const ADMIN_ROLES = ["pirate_king", "admin", "partner", "staff_captain"];

export default function Users() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AllRole>("client");
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);

  const { data: users, isLoading: isUsersLoading, error: usersError } = useQuery<User[]>({
    queryKey: roleFilter !== "all" ? ["/api/users", `?role=${roleFilter}`] : ["/api/users"],
    retry: false,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = searchQuery.toLowerCase();
    return users.filter(
      u =>
        (u.name?.toLowerCase() ?? "").includes(query) ||
        (u.email?.toLowerCase() ?? "").includes(query)
    );
  }, [users, searchQuery]);

  const userStats = useMemo(() => {
    const base: Record<string, number> = { total: 0 };
    ALL_ROLES.forEach(r => { base[r] = 0; });
    if (!users) return base;
    users.forEach(u => {
      base.total = (base.total || 0) + 1;
      if (u.role in base) base[u.role]++;
    });
    return base;
  }, [users]);

  const currentUserRole = (user as any)?.role ?? "client";
  const canManage = ADMIN_ROLES.includes(currentUserRole);

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setRoleChangeDialogOpen(false);
      setUserToUpdate(null);
      toast({ title: "Success", description: "User role updated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "No permission to update roles", variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    },
  });

  const handleViewUser = (u: User) => { setSelectedUser(u); setViewDialogOpen(true); };
  const handleChangeRole = (u: User) => {
    setUserToUpdate(u);
    setNewRole((u.role as AllRole) ?? "client");
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
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !canManage) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle data-testid="text-unauthorized-title">Access Restricted</CardTitle>
          <CardDescription data-testid="text-unauthorized-description">
            User management requires Staff Captain or above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (usersError && isUnauthorizedError(usersError as Error)) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You don't have permission to view users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-users-title">Team Directory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{userStats.total} registered users across all roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={viewMode === "cards" ? "default" : "ghost"}
            onClick={() => setViewMode("cards")}
            title="Cards view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "table" ? "default" : "ghost"}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Role stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {(["pirate_king", "admin", "partner", "staff_captain", "staff"] as AllRole[]).map(role => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <Card
              key={role}
              className={cn("cursor-pointer transition-all border", meta.badge, roleFilter === role && "ring-2 ring-primary")}
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", meta.badge)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold leading-none">{userStats[role] ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{meta.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary role stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(["client", "vendor", "sparky_ai", "sparky"] as AllRole[]).map(role => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <Card
              key={role}
              className={cn("cursor-pointer transition-all border", meta.badge, roleFilter === role && "ring-2 ring-primary")}
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            >
              <CardContent className="p-2 flex items-center gap-2.5">
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", meta.badge)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-bold leading-none">{userStats[role] ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">{meta.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-muted/40 rounded-lg px-3 border border-border/50">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none bg-transparent shadow-none focus-visible:ring-0 h-9"
            data-testid="input-search-users"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-role-filter">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="option-filter-all">All Roles</SelectItem>
            {ALL_ROLES.map(r => (
              <SelectItem key={r} value={r} data-testid={`option-filter-${r}`}>
                {ROLE_META[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {roleFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setRoleFilter("all")} className="text-muted-foreground">
            Clear filter
          </Button>
        )}
      </div>

      {/* Users list */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">No users found</p>
          ) : (
            filteredUsers.map(u => (
              <Card
                key={u.id}
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => handleViewUser(u)}
                data-testid={`card-user-${u.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar name={u.name} avatarUrl={(u as any).avatar_url} role={u.role} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-user-email-${u.id}`}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <RoleBadge role={u.role} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={e => { e.stopPropagation(); handleChangeRole(u); }}
                      data-testid={`button-change-role-${u.id}`}
                    >
                      Change Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(u => (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer"
                        onClick={() => handleViewUser(u)}
                        data-testid={`row-user-${u.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={u.name} avatarUrl={(u as any).avatar_url} role={u.role} />
                            <span className="font-medium text-sm" data-testid={`text-user-name-${u.id}`}>{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`text-user-email-${u.id}`}>
                          {u.email}
                        </TableCell>
                        <TableCell data-testid={`badge-user-role-${u.id}`}>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`text-user-created-${u.id}`}>
                          {format(new Date(u.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={() => handleViewUser(u)} data-testid={`button-view-${u.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleChangeRole(u)} data-testid={`button-change-role-${u.id}`}>
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
      )}

      {selectedUser && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg" data-testid="dialog-user-details">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Account information and permissions</DialogDescription>
            </DialogHeader>
            <UserDetailView user={selectedUser} />
          </DialogContent>
        </Dialog>
      )}

      {userToUpdate && (
        <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
          <AlertDialogContent data-testid="dialog-change-role">
            <AlertDialogHeader>
              <AlertDialogTitle>Change Role — {userToUpdate.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Updating role changes their permissions and channel access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">New Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AllRole)}>
                <SelectTrigger data-testid="select-new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES
                    .filter(r => currentUserRole === "pirate_king" || r !== "pirate_king")
                    .map(r => (
                      <SelectItem key={r} value={r} data-testid={`option-role-${r}`}>
                        {ROLE_META[r].label}
                      </SelectItem>
                    ))
                  }
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
                {updateUserRoleMutation.isPending ? "Updating…" : "Update Role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function UserDetailView({ user }: { user: User }) {
  const meta = ROLE_META[user.role as AllRole];
  const Icon = meta?.icon ?? UserCircle;
  return (
    <div className="space-y-4">
      {/* Avatar + name hero */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
        <UserAvatar name={user.name} avatarUrl={(user as any).avatar_url} role={user.role} />
        <div>
          <p className="font-bold text-lg leading-tight" data-testid="text-detail-name">{user.name}</p>
          <RoleBadge role={user.role} />
        </div>
        <div className={cn("ml-auto w-12 h-12 rounded-xl flex items-center justify-center", meta?.badge ?? "bg-muted")}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium" data-testid="text-detail-email">{user.email}</p>
        </div>
        {(user as any).phone && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium" data-testid="text-detail-phone">{(user as any).phone}</p>
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Joined</p>
          <p className="text-sm font-medium" data-testid="text-detail-created">
            {format(new Date(user.created_at), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">User ID</p>
          <p className="text-xs font-mono text-muted-foreground" data-testid="text-detail-id">{user.id}</p>
        </div>
      </div>
    </div>
  );
}
