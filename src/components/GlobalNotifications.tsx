import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Package } from "lucide-react";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export default function GlobalNotifications() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { sendNotification, permission } = useBrowserNotifications();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // ── Messages ──────────────────────────────────────────────────────────
    const messageChannel = supabase
      .channel("global-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== user.id) {
            const title = "New Message";
            const body = "You received a new message.";

            toast(title, {
              description: body,
              icon: <MessageSquare className="h-4 w-4" />,
              action: {
                label: "Open",
                onClick: () => navigate(`/messages?with=${newMessage.sender_id}`),
              },
            });

            if (permission === "granted") {
              sendNotification(title, {
                body,
                tag: `message-${newMessage.sender_id}`,
                autoCloseMs: 6000,
                onClick: () => navigate(`/messages?with=${newMessage.sender_id}`),
              });
            }

            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
            queryClient.invalidateQueries({ queryKey: ["unreadMessagesCount"] });
          }
        }
      )
      .subscribe();

    // ── Orders ────────────────────────────────────────────────────────────
    const ordersChannel = supabase
      .channel("global-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          const order = payload.new;
          if (!order) return;

          if (order.buyer_id === user.id || order.farmer_id === user.id) {
            let msg = "";
            let title = "Order Update";
            let shouldNotify = false;

            if (payload.eventType === "INSERT") {
              shouldNotify = true;
              if (order.farmer_id === user.id) {
                title = "New Order Received! 🎉";
                msg = `You have a new order worth KSh ${order.total_price?.toLocaleString() ?? "--"}.`;
              } else {
                title = "Order Placed ✅";
                msg = "Your order has been placed. The farmer will confirm soon.";
              }
            } else if (payload.eventType === "UPDATE") {
              if (payload.old?.status !== order.status) {
                shouldNotify = true;
                const readable = (order.status as string)?.replace(/_/g, " ") ?? "updated";
                title = "Order Status Changed";
                msg = `Your order is now: ${readable.charAt(0).toUpperCase() + readable.slice(1)}.`;
              } else if (payload.old?.escrow_status !== order.escrow_status) {
                shouldNotify = true;
                const readable = (order.escrow_status as string)?.replace(/_/g, " ") ?? "updated";
                title = "Payment Status Updated";
                msg = `Payment status: ${readable.charAt(0).toUpperCase() + readable.slice(1)}.`;
              }
            }

            if (shouldNotify) {
              toast(title, {
                description: msg,
                icon: <Package className="h-4 w-4" />,
                action: {
                  label: "View Orders",
                  onClick: () => navigate("/dashboard?tab=orders"),
                },
              });

              if (permission === "granted") {
                sendNotification(title, {
                  body: msg,
                  tag: `order-${order.id}`,
                  autoCloseMs: 8000,
                  onClick: () => navigate("/dashboard?tab=orders"),
                });
              }

              queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
          }
        }
      )
      .subscribe();

    // ── Notifications table (server alerts, offers, social, admin) ────────
    const notificationsChannel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const notif = payload.new;
          if (!notif) return;

          const title: string = notif.title ?? "New Notification";
          const body: string = notif.message ?? "";
          const link: string | undefined = notif.link;

          const goTo = () => {
            if (!link) return;
            if (link.startsWith("http")) window.open(link, "_blank");
            else navigate(link);
          };

          toast(title, {
            description: body,
            ...(link ? { action: { label: "View", onClick: goTo } } : {}),
          });

          if (permission === "granted") {
            sendNotification(title, {
              body,
              tag: `notif-${notif.id}`,
              autoCloseMs: 7000,
              ...(link ? { onClick: goTo } : {}),
            });
          }

          // Refresh navbar bell badge
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, isAuthenticated, navigate, queryClient, permission, sendNotification]);

  return null;
}
