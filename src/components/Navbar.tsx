import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  User,
  Sprout,
  Home,
  Users,
  Bot,
  MessageSquare,
  Menu,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ThemeToggle from "./ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import AIFloatingBubble from "./AIFloatingBubble";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/integrations/supabase/notifications";
import { getUnreadMessagesCount } from "@/integrations/supabase/messages";
import { useQueryClient } from "@tanstack/react-query";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificationsData } = useSupabaseQuery<any>(
    ["notifications"],
    () => getMyNotifications(),
    { enabled: isAuthenticated }
  );
  const notifications: any[] = (notificationsData as any[]) || [];

  const { data: unreadMessagesCountData } = useSupabaseQuery<any>(
    ["unreadMessagesCount"],
    () => getUnreadMessagesCount(),
    { enabled: isAuthenticated }
  );
  const unreadMessagesCount: number = (unreadMessagesCountData as number) || 0;

  // Derived state
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);
  const prevMessagesCountRef = useRef(unreadMessagesCount);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current || unreadMessagesCount > prevMessagesCountRef.current) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.play().catch(e => console.error("Audio play failed (maybe user interaction required):", e));
    }
    prevUnreadCountRef.current = unreadCount;
    prevMessagesCountRef.current = unreadMessagesCount;
  }, [unreadCount, unreadMessagesCount]);

  const navItems = [
    { path: "/", label: "Marketplace", icon: Home },
    ...(isAuthenticated ? [
      { path: "/messages", label: "Message", icon: MessageSquare, badge: unreadMessagesCount },
      { path: "/social", label: "Social", icon: Users },
      { path: "/ai", label: "AI Assistant", icon: Bot },
      ...(role === "admin" ? [{ path: "/meta-ads", label: "Meta Ads", icon: BarChart3 }] : []),
    ] : [
      { path: "/social", label: "Social", icon: Users }, // Social is public
    ]),
  ];

  const isActive = (path: string) => location.pathname === path;

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

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (e) {
        console.error(e);
      }
    }

    setIsNotificationsOpen(false);
    if (notification.link) {
      if (notification.link.startsWith("http")) {
        window.open(notification.link, "_blank");
      } else {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sprout className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Wakulima</h1>
          </div>

          {/* Desktop Nav */}
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
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Notifications */}
          {isAuthenticated && (
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
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
              <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAllRead();
                      }}
                    >
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      You're all caught up!
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors ${notification.is_read ? "opacity-60" : "bg-primary/5"}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-semibold">{notification.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Profile / Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user && user.full_name ? user.full_name : "My Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard?tab=settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                {role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="text-primary focus:text-primary font-medium">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/auth")}>Sign Up</Button>
            </div>
          )}

          {/* Mobile Menu */}
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
                  Wakulima
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
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className="ml-auto" variant="destructive">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
                <div className="border-t my-2" />
                {isAuthenticated ? (
                  <Button variant="ghost" onClick={handleLogout} className="justify-start gap-3 h-12 text-destructive">
                    <LogOut className="h-5 w-5" />
                    Log out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 p-1">
                    <Button variant="outline" onClick={() => handleNavigation("/auth")} className="justify-start gap-3 h-12">
                      <User className="h-5 w-5" />
                      Login
                    </Button>
                    <Button onClick={() => handleNavigation("/auth")} className="justify-start gap-3 h-12">
                      <Plus className="h-5 w-5" />
                      Create Account
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <AIFloatingBubble />
    </nav>
  );
};

export default Navbar;
