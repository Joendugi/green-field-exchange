import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ShoppingBag, TrendingUp, DollarSign, Globe, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const MarketHeatmap = () => {
    const heatmapData = useQuery(api.analytics.getGlobalHeatmap);

    if (!heatmapData) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const maxRevenue = Math.max(...heatmapData.map(h => h.revenue), 1);
    const totalGlobalRevenue = heatmapData.reduce((sum, h) => sum + h.revenue, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-xl border-primary/10">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Regional Market Concentration
                                </CardTitle>
                                <CardDescription>Intensity of trade and listings by location</CardDescription>
                            </div>
                            <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary">Live Data</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8">
                            {heatmapData.map((region, idx) => (
                                <div key={region.location} className="space-y-3 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                                                idx === 0 ? 'bg-primary scale-110' : 
                                                idx === 1 ? 'bg-emerald-500 scale-105' : 
                                                idx === 2 ? 'bg-blue-500' : 'bg-muted-foreground/40'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg capitalize">{region.location}</h4>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {region.products} Listings</span>
                                                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {region.orders} Orders</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-xl font-mono text-primary">${region.revenue.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                                                {((region.revenue / (totalGlobalRevenue || 1)) * 100).toFixed(1)}% of Global
                                            </p>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={(region.revenue / maxRevenue) * 100} 
                                        className="h-3 bg-muted rounded-full overflow-hidden" 
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-primary text-primary-foreground shadow-2xl border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                            <DollarSign className="h-40 w-40" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg opacity-90">Global GTV</CardTitle>
                            <CardDescription className="text-primary-foreground/70">Total marketplace volume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">${totalGlobalRevenue.toLocaleString()}</div>
                            <div className="mt-4 flex items-center gap-2">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                                    +12.4% vs last mo
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Hottest Region</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-2xl font-bold capitalize">{heatmapData[0]?.location || "N/A"}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Driving most of your marketplace liquidity right now.</p>
                            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-emerald-600">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    Efficiency: 98%
                                </div>
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    Churn: 1.2%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
