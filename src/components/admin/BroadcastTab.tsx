import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BroadcastTabProps {
    broadcastTitle: string;
    setBroadcastTitle: (v: string) => void;
    broadcastMessage: string;
    setBroadcastMessage: (v: string) => void;
    onSend: () => Promise<void>;
}

export const BroadcastTab = ({
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
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
            />
            <Button onClick={onSend}>Send to All Users</Button>
        </CardContent>
    </Card>
);
