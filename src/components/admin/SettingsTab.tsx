import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

type SettingsKey = "force_dark_mode" | "enable_beta_features" | "enable_ads_portal" | "enable_bulk_tools";

const SETTINGS = [
    { key: "force_dark_mode" as SettingsKey, title: "Force Dark Mode", description: "Override all users to dark mode site-wide" },
    { key: "enable_beta_features" as SettingsKey, title: "Beta Features", description: "Expose experimental features to all users" },
    { key: "enable_ads_portal" as SettingsKey, title: "Ads Portal", description: "Enable the advertisements management portal" },
    { key: "enable_bulk_tools" as SettingsKey, title: "Bulk Tools", description: "Enable multi-select bulk moderation tools" },
];

const PRESET_COLORS = [
    { label: "Agri Green", value: "142 71% 45%", hex: "#22c55e" },
    { label: "Ocean Blue", value: "217 91% 60%", hex: "#3b82f6" },
    { label: "Sunset Orange", value: "25 95% 53%", hex: "#f97316" },
    { label: "Royal Purple", value: "263 70% 50%", hex: "#7c3aed" },
    { label: "Earth Brown", value: "30 50% 40%", hex: "#92400e" },
    { label: "Teal", value: "174 72% 40%", hex: "#0d9488" },
];

const STORAGE_KEY = "wakulima_admin_primary_color";

interface SettingsTabProps {
    adminSettings: Record<SettingsKey, boolean>;
    onSettingChange: (key: SettingsKey, value: boolean) => Promise<void>;
    savingKey: string | null;
}

export const SettingsTab = ({ adminSettings, onSettingChange, savingKey }: SettingsTabProps) => {
    const [selectedColor, setSelectedColor] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || "142 71% 45%";
    });
    const [customHex, setCustomHex] = useState<string>("#22c55e");
    const [saved, setSaved] = useState(false);

    // Apply the stored color on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) applyColor(stored);
    }, []);

    const applyColor = (hsl: string) => {
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
    };

    const handlePresetSelect = (hsl: string, hex: string) => {
        setSelectedColor(hsl);
        setCustomHex(hex);
        applyColor(hsl);
    };

    const handleCustomHex = (hex: string) => {
        setCustomHex(hex);
        // Convert hex → rough HSL for CSS var (simplified — just apply as-is via a filter workaround)
        // For MVP, we just store the preset equivalent if it matches, else keep custom
        const matched = PRESET_COLORS.find(p => p.hex.toLowerCase() === hex.toLowerCase());
        if (matched) {
            setSelectedColor(matched.value);
            applyColor(matched.value);
        }
    };

    const handleSaveBranding = () => {
        localStorage.setItem(STORAGE_KEY, selectedColor);
        applyColor(selectedColor);
        setSaved(true);
        toast.success("Brand color applied! Refresh to confirm.");
        setTimeout(() => setSaved(false), 2000);
    };

    const handleResetBranding = () => {
        const defaultColor = "142 71% 45%";
        setSelectedColor(defaultColor);
        setCustomHex("#22c55e");
        localStorage.removeItem(STORAGE_KEY);
        applyColor(defaultColor);
        toast.success("Brand color reset to default Wakulima green");
    };

    return (
        <div className="space-y-4">
            {/* Platform Toggles */}
            <Card>
                <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                    <CardDescription>Control platform-wide feature flags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {SETTINGS.map((setting) => (
                        <div key={setting.key} className="flex justify-between items-center gap-4">
                            <div>
                                <Label className="font-medium">{setting.title}</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                            </div>
                            <Switch
                                checked={adminSettings[setting.key]}
                                disabled={savingKey === setting.key}
                                onCheckedChange={(checked) => onSettingChange(setting.key, checked)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Branding / Theme Color Override */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <CardTitle>Brand Color</CardTitle>
                    </div>
                    <CardDescription>Override the primary site color across all pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Presets */}
                    <div>
                        <Label className="text-sm mb-3 block">Color Presets</Label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => handlePresetSelect(color.value, color.hex)}
                                    className="group relative flex flex-col items-center gap-1.5"
                                    title={color.label}
                                >
                                    <div
                                        className="h-9 w-9 rounded-full border-2 transition-all duration-200 group-hover:scale-110"
                                        style={{
                                            backgroundColor: color.hex,
                                            borderColor: selectedColor === color.value ? color.hex : "transparent",
                                            boxShadow: selectedColor === color.value ? `0 0 0 3px ${color.hex}40` : "none",
                                        }}
                                    >
                                        {selectedColor === color.value && (
                                            <Check className="h-4 w-4 text-white m-auto mt-2" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom hex input */}
                    <div className="flex items-center gap-3">
                        <div
                            className="h-8 w-8 rounded-md border shrink-0"
                            style={{ backgroundColor: customHex }}
                        />
                        <Input
                            value={customHex}
                            onChange={(e) => handleCustomHex(e.target.value)}
                            placeholder="#22c55e"
                            className="font-mono text-sm w-36"
                            maxLength={7}
                        />
                        <span className="text-xs text-muted-foreground">(Hex code)</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={handleSaveBranding} size="sm" className="gap-2">
                            {saved ? <Check className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                            {saved ? "Applied!" : "Apply Color"}
                        </Button>
                        <Button onClick={handleResetBranding} size="sm" variant="outline" className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reset to Default
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
