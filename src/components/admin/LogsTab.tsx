import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, History, Clock } from "lucide-react";

interface LogsTabProps {
    auditLogs: any[];
}

export const LogsTab = ({ auditLogs }: LogsTabProps) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Administrative Audit Logs</CardTitle>
            </div>
            <CardDescription>Security trail of all actions performed by administrators</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">No audit logs found</div>
                    ) : (
                        auditLogs.map((log: any) => (
                            <div
                                key={log._id}
                                className="flex gap-4 p-3 border-b border-muted last:border-0 hover:bg-muted/30 transition-colors rounded-md group"
                            >
                                <div className="mt-1">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                            {log.adminName}
                                        </p>
                                        <div className="flex items-center text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground">
                                        <span className="font-semibold uppercase text-[10px] tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded mr-2">
                                            {log.action.replace("_", " ")}
                                        </span>
                                        {log.details && <span className="text-muted-foreground italic">"{log.details}"</span>}
                                    </p>
                                    {log.targetId && (
                                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center">
                                            Target {log.targetType}:{" "}
                                            <code className="ml-1 bg-muted px-1 rounded text-[10px]">{log.targetId}</code>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
);
