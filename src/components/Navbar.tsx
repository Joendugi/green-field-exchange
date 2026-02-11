<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, User, Sprout, Home, LayoutDashboard, Users, Bot, Menu } from "lucide-react";
=======
import { useState, useEffect } from "react";
import { databases, client } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Bell,
  User,
  Sprout,
  Home,
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
<<<<<<< HEAD
  DropdownMenuLabel,
  DropdownMenuSeparator,
=======
  DropdownMenuSeparator,
  DropdownMenuLabel,
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const navLinks = [
  { label: "Marketplace", path: "/", icon: Home },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Social", path: "/social", icon: Users },
  { label: "AI Assistant", path: "/ai", icon: Bot },
];

// ... imports ...

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
<<<<<<< HEAD
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchUnreadNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setNotifications(data || []);
    setNotificationsLoading(false);
  }, []);

  useEffect(() => {
    fetchUnreadNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchUnreadNotifications();
          if (isNotificationsOpen) {
            fetchNotifications();
          }
        }
      )
      .subscribe();
=======
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      // Fetch Unread Notifications
      try {
        const notifications = await databases.listDocuments(
          dbId,
          "notifications",
          [
            Query.equal("user_id", user.$id),
            // Query.equal("is_read", false), // Attribute missing in schema
            Query.limit(10)
          ]
        );
        // Filter locally if attribute exists, else assume 0
        const unreadInfo = notifications.documents.filter((n: any) => n.is_read === false);
        setUnreadCount(unreadInfo.length);
      } catch (error: any) {
        // Suppress 401/400 errors during polling
        if (error.code !== 401 && error.code !== 400) {
          console.warn("Notifications count failed:", error);
        }
      }

      // Fetch Unread Messages
      try {
        const messages = await databases.listDocuments(
          dbId,
          "messages",
          [
            Query.notEqual("sender_id", user.$id),
            // Query.equal("is_read", false), // Attribute missing in schema
            Query.limit(10)
          ]
        );
        const unreadMsgs = messages.documents.filter((m: any) => m.is_read === false);
        setUnreadMessagesCount(unreadMsgs.length);
      } catch (error: any) {
        if (error.code !== 401 && error.code !== 400) {
          console.warn("Messages count failed:", error);
        }
      }
    };

    fetchUnreadCounts();

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const unsubscribe = client.subscribe(
      [
        `databases.${dbId}.collections.notifications.documents`,
        `databases.${dbId}.collections.messages.documents`
      ],
      () => {
        fetchUnreadCounts();
      }
    );
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

    return () => {
      unsubscribe();
    };
<<<<<<< HEAD
  }, [fetchUnreadNotifications, fetchNotifications, isNotificationsOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
      fetchUnreadNotifications();
    }

    setIsNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    fetchUnreadNotifications();
    fetchNotifications();
  };

=======
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  // ... navItems ...

  const navItems = [
    { path: "/", label: "Marketplace", icon: Home },
    { path: "/messages", label: "Message", icon: MessageSquare, badge: unreadMessagesCount },
    { path: "/social", label: "Social", icon: Users },
    { path: "/ai", label: "AI Assistant", icon: Bot },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sprout className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">AgriLink</h1>
          </div>

<<<<<<< HEAD
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-80">
              <div className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    variant={isActive(link.path) ? "secondary" : "ghost"}
                    className="justify-start gap-3 text-lg"
                    onClick={() => handleNavigation(link.path)}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="justify-start gap-3 text-lg"
                  onClick={() => handleNavigation("/dashboard?tab=profile")}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "secondary" : "ghost"}
                onClick={() => navigate(link.path)}
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
=======
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "secondary" : "ghost"}
                onClick={() => navigate(item.path)}
                className="gap-2 relative"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary">
                    {item.badge}
                  </Badge>
                )}
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
              </Button>
            ))}
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu
            open={isNotificationsOpen}
            onOpenChange={(open) => {
              setIsNotificationsOpen(open);
              if (open) {
                fetchNotifications();
              }
            }}
          >
=======
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <DropdownMenu>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleMarkAllRead();
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-80">
                {notificationsLoading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="animate-pulse space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-full bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    You're all caught up!
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/60 ${notification.is_read ? "opacity-80" : ""}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{notification.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile?tab=settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-primary" />
                  AgriLink
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    onClick={() => handleNavigation(item.path)}
                    className="justify-start gap-3 h-12"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <Badge className="ml-auto" variant="destructive">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
