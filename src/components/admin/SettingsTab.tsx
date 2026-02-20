import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type SettingsKey = "force_dark_mode" | "enable_beta_features" | "enable_ads_portal" | "enable_bulk_tools";

const SETTINGS = [
    { key: "force_dark_mode" as SettingsKey, title: "Force Dark Mode" },
    { key: "enable_beta_features" as SettingsKey, title: "Beta Features" },
    { key: "enable_ads_portal" as SettingsKey, title: "Ads Portal" },
    { key: "enable_bulk_tools" as SettingsKey, title: "Bulk Tools" },
];

interface SettingsTabProps {
    adminSettings: Record<SettingsKey, boolean>;
    onSettingChange: (key: SettingsKey, value: boolean) => Promise<void>;
    savingKey: string | null;
}

export const SettingsTab = ({ adminSettings, onSettingChange, savingKey }: SettingsTabProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {SETTINGS.map((setting) => (
                <div key={setting.key} className="flex justify-between items-center">
                    <Label>{setting.title}</Label>
                    <Switch
                        checked={adminSettings[setting.key]}
                        disabled={savingKey === setting.key}
                        onCheckedChange={(checked) => onSettingChange(setting.key, checked)}
                    />
                </div>
            ))}
        </CardContent>
    </Card>
);
