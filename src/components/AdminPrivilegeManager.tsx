import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserPlus, Shield, Crown, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { listUsers, updateRole, banUser } from "@/integrations/supabase/admin";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AdminPrivilegeManager = () => {
  const queryClient = useQueryClient();
  const { data: usersData } = useSupabaseQuery<any[]>(["admin", "users"], listUsers);
  const users = usersData || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [addRoleEmail, setAddRoleEmail] = useState("");
  const [addRoleType, setAddRoleType] = useState("admin");
  const [isAddingRole, setIsAddingRole] = useState(false);

  const filteredUsers = users.filter((user: any) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateRole(userId, role);
      toast.success(`Role updated to ${role} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      await banUser(userId, ban, banReason);
      toast.success(ban ? "User banned successfully" : "User unbanned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddRoleByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingRole(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", addRoleEmail)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error("User with this email not found. They must have a profile first.");
      }

      await handleRoleChange(userData.id, addRoleType);
      setAddRoleDialogOpen(false);
      setAddRoleEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingRole(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "farmer": return "default";
      default: return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-3 w-3" />;
      case "farmer": return <Shield className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Privilege Manager</h2>
          <p className="text-muted-foreground">Manage user roles and administrative access</p>
        </div>
        <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="mr-2 h-4 w-4" /> Add Role by Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role to User</DialogTitle>
              <DialogDescription>
                Assign a role to a user by entering their email address.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRoleByEmail} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={addRoleEmail} 
                  onChange={(e) => setAddRoleEmail(e.target.value)}
                  placeholder="user@example.com" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={addRoleType} onValueChange={setAddRoleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddRoleDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAddingRole} className="bg-emerald-600 hover:bg-emerald-700">
                  {isAddingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, username, or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <Crown className="h-3 w-3 mr-1" /> Admin: {users.filter((u: any) => u.user_roles?.some((r: any) => r.role === "admin")).length}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="h-3 w-3 mr-1" /> Farmer: {users.filter((u: any) => u.user_roles?.some((r: any) => r.role === "farmer")).length}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> Banned: {users.filter((u: any) => u.is_banned).length}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.map((user: any) => {
          const currentRole = user.user_roles?.[0]?.role || "user";
          const isAdmin = currentRole === "admin";
          const isBanned = user.is_banned;

          return (
            <Card key={user.id} className={`${isBanned ? "bg-red-50 border-red-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{user.full_name || "Unknown"}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username || "no-username"}</p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(currentRole)} className="flex items-center gap-1">
                        {getRoleIcon(currentRole)}
                        {currentRole}
                        {user.verified && <CheckCircle className="h-3 w-3" />}
                      </Badge>
                      {isBanned && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Banned
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Email: {user.email || "No email"}</p>
                      <p>Location: {user.location || "No location"}</p>
                      <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                      {isBanned && user.ban_reason && (
                        <p className="text-red-600">Ban reason: {user.ban_reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={currentRole}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={isBanned}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="farmer">Farmer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    {isBanned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBanUser(user.id, false)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    ) : (
                      <Dialog open={banDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setBanDialogOpen(open);
                        if (!open) {
                          setSelectedUser(null);
                          setBanReason("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedUser(user)}
                            disabled={isAdmin}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ban User</DialogTitle>
                            <DialogDescription>
                              This will prevent {user.full_name} from accessing the platform.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="ban-reason">Reason for ban</Label>
                            <Input
                              id="ban-reason"
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="Enter reason for banning this user..."
                              className="mt-2"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleBanUser(user.id, true)}
                              disabled={!banReason.trim()}
                            >
                              Confirm Ban
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No users found matching your search." : "No users found."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Role Permissions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Admin:</strong> Full system access, user management, content moderation</li>
                <li><strong>Farmer:</strong> Can add products, manage listings, purhcase products, leave reviews</li>
                <li><strong>User:</strong> Basic platform access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Best Practices:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Only grant admin privileges to trusted users</li>
                <li>• Verify farmer accounts to remove product limits</li>
                <li>• Document reasons for banning users</li>
                <li>• Regularly review user roles and permissions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrivilegeManager;
