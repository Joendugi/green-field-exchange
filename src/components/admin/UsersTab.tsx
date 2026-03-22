import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Ban, CheckCircle } from "lucide-react";

interface UsersTabProps {
    users: any[];
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    banDialogOpen: boolean;
    setBanDialogOpen: (v: boolean) => void;
    selectedUser: any;
    setSelectedUser: (u: any) => void;
    banReason: string;
    setBanReason: (v: string) => void;
    onChangeRole: (userId: string, role: string) => Promise<void>;
    onBanUser: (userId: string, ban: boolean) => Promise<void>;
}

export const UsersTab = ({
    users,
    searchQuery,
    setSearchQuery,
    banDialogOpen,
    setBanDialogOpen,
    selectedUser,
    setSelectedUser,
    banReason,
    setBanReason,
    onChangeRole,
    onBanUser,
}: UsersTabProps) => {
    const filtered = users.filter(
        (u: any) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage platform users, roles, and access</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filtered.map((user: any) => (
                        <div
                            key={user.id}
                            className={`flex items-center justify-between p-4 border rounded-lg ${user.is_banned ? "bg-destructive/10 border-destructive/50" : ""}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold">{user.full_name}</p>
                                    {user.is_banned && (
                                        <Badge variant="destructive">
                                            <Ban className="h-3 w-3 mr-1" /> Banned
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{user.location || "No location"}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {user.user_roles?.map((role: any, idx: number) => (
                                        <Badge key={idx} variant="secondary">
                                            {role.role} {role.is_verified && "✓"}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    defaultValue={user.user_roles?.[0]?.role || "user"}
                                    onValueChange={(value) => onChangeRole(user.id, value)}
                                >
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="farmer">Farmer</SelectItem>
                                        <SelectItem value="buyer">Buyer</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>

                                {user.is_banned ? (
                                    <Button size="sm" variant="outline" onClick={() => onBanUser(user.id, false)}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Unban
                                    </Button>
                                ) : (
                                    <Dialog
                                        open={banDialogOpen && selectedUser?.id === user.id}
                                        onOpenChange={(open) => {
                                            setBanDialogOpen(open);
                                            if (!open) setSelectedUser(null);
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="destructive" onClick={() => setSelectedUser(user)}>
                                                <Ban className="h-4 w-4 mr-1" /> Ban
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Ban User</DialogTitle>
                                                <DialogDescription>Prevent access to the platform.</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label>Reason</Label>
                                                <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                                                <Button variant="destructive" onClick={() => onBanUser(user.id, true)}>Confirm Ban</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

