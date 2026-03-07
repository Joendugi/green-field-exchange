import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Zap, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BroadcastTabProps {
    broadcastTitle: string;
    setBroadcastTitle: (v: string) => void;
    broadcastMessage: string;
    setBroadcastMessage: (v: string) => void;
    sendEmail: boolean;
    setSendEmail: (v: boolean) => void;
    onSend: () => Promise<void>;
}

export const BroadcastTab = ({
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
    sendEmail,
    setSendEmail,
    onSend,
}: BroadcastTabProps) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold">Compose Broadcast</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Reaching all users instantly via in-app notifications and optional email.</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject / Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Welcome to the Dry Season 2026 🌽"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="bg-muted/30 border-primary/20 focus-visible:ring-primary/40 h-12 text-lg font-medium"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message Content</Label>
                    <Textarea
                        id="message"
                        placeholder="What would you like to share with the community?"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="min-h-[200px] bg-muted/30 border-primary/20 focus-visible:ring-primary/40 text-base leading-relaxed resize-none"
                    />
                </div>

                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="sendEmail" className="text-sm font-bold flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                Email Synchronization
                            </Label>
                            <p className="text-xs text-muted-foreground">Also deliver this message to every user's inbox.</p>
                        </div>
                        <Checkbox
                            id="sendEmail"
                            checked={sendEmail}
                            onCheckedChange={(checked) => setSendEmail(!!checked)}
                            className="h-6 w-6 rounded-md data-[state=checked]:bg-primary"
                        />
                    </div>
                </div>

                <Button 
                    onClick={onSend} 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 rounded-xl"
                >
                    <Zap className="h-5 w-5 mr-2" />
                    Dispatch Global Broadcast
                </Button>
            </CardContent>
        </Card>

        {/* Live Preview Card */}
        <Card className="border-dashed border-primary/20 bg-muted/20 flex flex-col rounded-2xl">
            <CardHeader className="opacity-50">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Live Preview
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm space-y-4">
                    <div className="bg-background border border-primary/10 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] uppercase font-black">Notification</Badge>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <p className="font-bold text-sm truncate">{broadcastTitle || "Update Title"}</p>
                                <p className="text-xs text-muted-foreground line-clamp-3">{broadcastMessage || "Your message will appear here for all users to see..."}</p>
                                <p className="text-[10px] text-muted-foreground pt-2">Just now • Wakulima Official</p>
                            </div>
                        </div>
                    </div>

                    {sendEmail && (
                        <div className="bg-background/80 border border-primary/10 rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                           <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                               <Mail className="h-4 w-4 text-emerald-600" />
                           </div>
                           <p className="text-[11px] font-medium text-muted-foreground tracking-tight">Email delivery is active for this broadcast.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
);
