import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Mail, 
  CheckCircle2, 
  CircleDot,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SupportTicket, updateTicketStatus } from "@/integrations/supabase/tickets";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TicketsTabProps {
  tickets: SupportTicket[];
}

export const TicketsTab = ({ tickets }: TicketsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const filteredTickets = tickets.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTicketStatus(id, status);
      toast.success(`Ticket status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Open</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{filteredTickets.length} tickets found</span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No support tickets found.</p>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(ticket.status)}
                        <h3 className="font-bold text-lg">
                          {ticket.subject || "No Subject"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {ticket.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {ticket.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "open")}>
                          <CircleDot className="mr-2 h-4 w-4 text-blue-500" /> Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "in-progress")}>
                          <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "resolved")}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "closed")}>
                          <ChevronRight className="mr-2 h-4 w-4 text-gray-500" /> Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg border text-sm leading-relaxed text-muted-foreground">
                    {ticket.message}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
