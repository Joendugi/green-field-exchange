import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

interface EmailLog {
    _id: string;
    to: string;
    subject: string;
    type: string;
    status: string;
    resendId?: string;
    error?: string;
    timestamp: number;
}

interface EmailLogsTabProps {
    logs: EmailLog[] | undefined;
}

export const EmailLogsTab = ({ logs }: EmailLogsTabProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLogs = logs?.filter(log =>
        log.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (logs === undefined) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-forest-100 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Mail className="h-5 w-5 text-forest-600" />
                                Email History
                            </CardTitle>
                            <CardDescription>
                                Track status and delivery for all system outgoing emails
                            </CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search recipient or subject..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-forest-50 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-forest-50/50 text-forest-900 font-medium">
                                <tr>
                                    <th className="px-4 py-3 text-left">Recipient</th>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-forest-50">
                                {filteredLogs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No email logs found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs?.map((log) => (
                                        <tr key={log._id} className="hover:bg-forest-50/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">{log.to}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="capitalize bg-white shadow-sm border-forest-100">
                                                    {log.type.replace(/_/g, " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={log.subject}>
                                                {log.subject}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.status === "sent" ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span>Sent</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-red-600 font-medium" title={log.error}>
                                                        <XCircle className="h-4 w-4" />
                                                        <span>Failed</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {format(log.timestamp, "MMM d, HH:mm")}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
