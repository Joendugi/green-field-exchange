import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Id } from "../../../convex/_generated/dataModel";

interface AdsTabProps {
    advertisements: any[];
    onSaveAd: (ad: NewAd) => Promise<void>;
    onToggleAd: (adId: Id<"advertisements">, active: boolean) => Promise<void>;
}

export type NewAd = {
    title: string;
    description: string;
    image_url: string;
    target_url: string;
    status: string;
    budget: number;
};

const defaultAd: NewAd = {
    title: "",
    description: "",
    image_url: "",
    target_url: "",
    status: "active",
    budget: 100,
};

export const AdsTab = ({ advertisements, onSaveAd, onToggleAd }: AdsTabProps) => {
    const [newAd, setNewAd] = useState<NewAd>(defaultAd);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSaveAd(newAd);
        setNewAd(defaultAd);
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create Ad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Title"
                        value={newAd.title}
                        onChange={(e) => setNewAd((p) => ({ ...p, title: e.target.value }))}
                    />
                    <Input
                        placeholder="Description"
                        value={newAd.description}
                        onChange={(e) => setNewAd((p) => ({ ...p, description: e.target.value }))}
                    />
                    <Input
                        placeholder="Image URL"
                        value={newAd.image_url}
                        onChange={(e) => setNewAd((p) => ({ ...p, image_url: e.target.value }))}
                    />
                    <Input
                        placeholder="Target URL"
                        value={newAd.target_url}
                        onChange={(e) => setNewAd((p) => ({ ...p, target_url: e.target.value }))}
                    />
                    <Button onClick={handleSave} disabled={saving || !newAd.title.trim()}>
                        {saving ? "Publishing..." : "Publish"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Ads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {advertisements.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">No ads yet</p>
                    )}
                    {advertisements.map((ad: any) => (
                        <div key={ad._id} className="p-3 border rounded-lg flex justify-between items-center">
                            <span className="font-medium">{ad.title}</span>
                            <Button size="sm" variant="outline" onClick={() => onToggleAd(ad._id, ad.status !== "active")}>
                                {ad.status === "active" ? "Pause" : "Activate"}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};
