import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Package } from "lucide-react";

export default function GlobalNotifications() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Listen to new messages
    const messageChannel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const newMessage = payload.new;
          // Only notify if we are not the sender
          // With RLS, if we receive the event, we are participant in the conversation.
          if (newMessage.sender_id !== user.id) {
            toast('New Message', {
              description: 'You received a new message.',
              icon: <MessageSquare className="h-4 w-4" />,
              action: {
                label: 'View',
                onClick: () => navigate(`/messages?with=${newMessage.sender_id}`)
              },
            });
            // Update UI counts (navbar badge, message list)
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
          }
        }
      )
      .subscribe();

    // Listen to ordered items
    const ordersChannel = supabase
      .channel('global-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const order = payload.new;
          if (!order) return;
          
          // Double check it belongs to us
          if (order.buyer_id === user.id || order.farmer_id === user.id) {
            let msg = '';
            let title = 'Order Update';
            let shouldToast = false;

            if (payload.eventType === 'INSERT') {
                shouldToast = true;
                if (order.farmer_id === user.id) {
                    title = 'New Order Received! 🎉';
                    msg = `You have a new order for $${order.total_price}`;
                } else {
                    title = 'Order Placed';
                    msg = `Your order has been placed successfully.`;
                }
            } else if (payload.eventType === 'UPDATE') {
                // Only notify if status changed to prevent spamming
                if (payload.old.status !== order.status) {
                    shouldToast = true;
                    msg = `Status updated to: ${order.status?.replace('_', ' ') || 'updated'}`;
                } else if (payload.old.escrow_status !== order.escrow_status) {
                    shouldToast = true;
                    msg = `Payment status updated: ${order.escrow_status?.replace('_', ' ')}`;
                }
            }
            
            if (shouldToast) {
                toast(title, {
                    description: msg,
                    icon: <Package className="h-4 w-4" />,
                    action: {
                        label: 'View Orders',
                        onClick: () => navigate('/dashboard?tab=orders')
                    }
                });
                queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, isAuthenticated, navigate, queryClient]);

  return null; // Logic-only component
}
