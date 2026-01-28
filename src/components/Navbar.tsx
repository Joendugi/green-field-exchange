import { useState, useEffect } from "react";
import { account, databases, client } from "@/lib/appwrite";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      // Fetch Unread Notifications
      try {
        const notifications = await databases.listDocuments(
          dbId,
          "notifications",
          [
            Query.equal("user_id", user.$id),
            Query.equal("is_read", false),
            Query.limit(1)
          ]
        );
        setUnreadCount(notifications.total);
      } catch (error) {
        console.warn("Notifications count failed:", error);
      }

      // Fetch Unread Messages
      try {
        const messages = await databases.listDocuments(
          dbId,
          "messages",
          [
            Query.notEqual("sender_id", user.$id),
            Query.equal("is_read", false),
            Query.limit(1)
          ]
        );
        setUnreadMessagesCount(messages.total);
      } catch (error) {
        console.warn("Messages count failed:", error);
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

    return () => {
      unsubscribe();
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Marketplace", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessagesCount },
    { path: "/social", label: "Social", icon: Users },
    { path: "/ai", label: "AI Assistant", icon: Bot },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sprout className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">AgriLink</h1>
          </div>

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
              </Button>
            ))}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <DropdownMenu>
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
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 text-sm font-semibold">Notifications</div>
              <div className="p-4 text-sm text-muted-foreground">
                Check your profile to see all notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Button */}
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard?tab=profile")}>
            <User className="h-5 w-5" />
          </Button>

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
