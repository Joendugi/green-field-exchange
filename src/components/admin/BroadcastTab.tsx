import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

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
    <Card>
        <CardHeader>
            <CardTitle>Broadcast Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input
                placeholder="Title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <Textarea
                placeholder="Message"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="min-h-[150px]"
            />
            <div className="flex items-center space-x-2 py-2">
                <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4 text-forest-600" />
                    Also send this as an email to all registered users
                </Label>
            </div>
            <Button onClick={onSend} className="w-full bg-forest-600 hover:bg-forest-700">
                Send Broadcast
            </Button>
        </CardContent>
    </Card>
);
