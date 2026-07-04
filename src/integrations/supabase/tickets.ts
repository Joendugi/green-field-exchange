import { supabase } from "./client";
import { logAdminAction } from "./admin";

export type SupportTicket = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created_at: string;
};

export async function createTicket(input: {
  full_name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<SupportTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user?.id || null,
      full_name: input.full_name,
      email: input.email,
      subject: input.subject || null,
      message: input.message,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
  return data as SupportTicket;
}

export async function getTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    throw error;
  }
  return (data as SupportTicket[]) || [];
}

export async function updateTicketStatus(id: string, status: string): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating ticket status:", error);
    throw error;
  }

  // Log the ticket status change in admin audit trail
  try {
    await logAdminAction("update_ticket_status", "ticket", id, `Status changed to: ${status}`);
  } catch (logError) {
    // Don't fail the ticket update if audit logging fails
    console.error("Failed to log ticket status change:", logError);
  }

  return data as SupportTicket;
}
