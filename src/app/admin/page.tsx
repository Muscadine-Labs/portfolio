"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type AdminAccount = {
  username: string;
  password: string;
};

type AdminUser = {
  tenant: string;
  name: string;
  email: string;
  password: string;
};

type EditDraft = {
  kind: "admin" | "user";
  originalTenant: string;
  username: string;
  name: string;
  email: string;
  password: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [form, setForm] = useState({
    tenant: "",
    name: "",
    email: "",
    password: "",
  });

  const fetchAccountsData = useCallback(async () => {
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (res.status === 401) {
      return { unauthorized: true as const };
    }
    if (!res.ok) throw new Error("Failed to load users");
    const body = (await res.json()) as {
      admin?: AdminAccount;
      users: AdminUser[];
    };
    return {
      unauthorized: false as const,
      admin: body.admin ?? null,
      users: body.users,
    };
  }, []);

  const applyAccounts = useCallback(
    (data: { admin: AdminAccount | null; users: AdminUser[] }) => {
      setAdminAccount(data.admin);
      setUsers(data.users);
    },
    [],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccountsData();
      if (data.unauthorized) {
        router.replace("/login");
        return;
      }
      applyAccounts(data);
    } catch {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }, [applyAccounts, fetchAccountsData, router]);

  useEffect(() => {
    let active = true;
    fetchAccountsData()
      .then((data) => {
        if (!active) return;
        if (data.unauthorized) {
          router.replace("/login");
          return;
        }
        applyAccounts(data);
      })
      .catch(() => {
        if (active) toast.error("Could not load users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyAccounts, fetchAccountsData, router]);

  const createUser = async () => {
    if (!form.tenant.trim() || !form.password) {
      toast.error("Username and password are required");
      return;
    }
    if (form.tenant.trim().toLowerCase() === "admin") {
      toast.error("That username is reserved");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: form.tenant.trim().toLowerCase(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Could not create user");
        return;
      }
      toast.success("User created");
      setForm({ tenant: "", name: "", email: "", password: "" });
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const startEditAdmin = () => {
    if (!adminAccount) return;
    setEditing({
      kind: "admin",
      originalTenant: "admin",
      username: adminAccount.username,
      name: "",
      email: "",
      password: adminAccount.password,
    });
  };

  const startEditUser = (user: AdminUser) => {
    setEditing({
      kind: "user",
      originalTenant: user.tenant,
      username: user.tenant,
      name: user.name,
      email: user.email,
      password: user.password,
    });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;

    if (!editing.username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);
    try {
      const body =
        editing.kind === "admin"
          ? {
              role: "admin" as const,
              username: editing.username.trim(),
              password: editing.password || undefined,
            }
          : {
              role: "user" as const,
              tenant: editing.originalTenant,
              newTenant:
                editing.username.trim().toLowerCase() !== editing.originalTenant
                  ? editing.username.trim().toLowerCase()
                  : undefined,
              name: editing.name,
              email: editing.email,
              password: editing.password || undefined,
            };

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Could not save changes");
        return;
      }

      toast.success("Saved");
      setEditing(null);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (tenant: string) => {
    if (!confirm(`Delete user "${tenant}" and all their portfolio data?`)) return;
    const res = await fetch(`/api/admin/users?tenant=${encodeURIComponent(tenant)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Could not delete user");
      return;
    }
    toast.success(`Deleted "${tenant}"`);
    if (editing?.originalTenant === tenant) setEditing(null);
    await loadUsers();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  };

  const isEditingAdmin = editing?.kind === "admin";
  const editingUserTenant = editing?.kind === "user" ? editing.originalTenant : null;

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Manage portfolio users and credentials
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadUsers()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add user</CardTitle>
            <CardDescription>
              Username becomes the login id. Password is stored for admin
              recovery only — keep this page private.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tenant">Username</Label>
              <Input
                id="tenant"
                placeholder="username"
                value={form.tenant}
                onChange={(e) => setForm((f) => ({ ...f, tenant: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Display name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                placeholder="Set initial password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void createUser()}>
              <Plus className="mr-2 h-4 w-4" />
              Create user
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Click edit to change username, name, email, or password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminAccount ? (
                    <TableRow className="bg-muted/40">
                      {isEditingAdmin && editing ? (
                        <>
                          <TableCell>
                            <Input
                              value={editing.username}
                              onChange={(e) =>
                                setEditing({ ...editing, username: e.target.value })
                              }
                              className="font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>
                            <Input
                              value={editing.password}
                              onChange={(e) =>
                                setEditing({ ...editing, password: e.target.value })
                              }
                              className="font-mono text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={saving}
                                onClick={() => void saveEdit()}
                                aria-label="Save admin"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEdit}
                                aria-label="Cancel edit"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5 text-violet-400" />
                              {adminAccount.username}
                              <Badge variant="secondary" className="text-[10px]">
                                Admin
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell className="font-mono text-xs">
                            {adminAccount.password || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={startEditAdmin}
                              disabled={Boolean(editing)}
                              aria-label="Edit admin"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ) : null}
                  {users.map((user) =>
                    editingUserTenant === user.tenant && editing ? (
                      <TableRow key={user.tenant}>
                        <TableCell>
                          <Input
                            value={editing.username}
                            onChange={(e) =>
                              setEditing({ ...editing, username: e.target.value })
                            }
                            className="font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="email"
                            value={editing.email}
                            onChange={(e) =>
                              setEditing({ ...editing, email: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editing.password}
                            onChange={(e) =>
                              setEditing({ ...editing, password: e.target.value })
                            }
                            className="font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={saving}
                              onClick={() => void saveEdit()}
                              aria-label="Save user"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelEdit}
                              aria-label="Cancel edit"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={user.tenant}>
                        <TableCell className="font-mono">{user.tenant}</TableCell>
                        <TableCell>{user.name || "—"}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {user.password || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditUser(user)}
                              disabled={Boolean(editing)}
                              aria-label={`Edit ${user.tenant}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void deleteUser(user.tenant)}
                              disabled={Boolean(editing)}
                              aria-label={`Delete ${user.tenant}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
