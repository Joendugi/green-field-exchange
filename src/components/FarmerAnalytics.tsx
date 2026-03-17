import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Map, Search, Package, ArrowUpRight, Loader2, Sparkles, Lightbulb, AlertCircle, CheckCircle2, Calendar, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getFarmerAnalytics, getAIInsights, toggleLoyaltyReward } from "@/integrations/supabase/analytics";

const FarmerAnalytics = () => {
    const { user } = useAuth();
    
    // Supabase query
    const { data: analytics, isLoading } = useSupabaseQuery<any>(
      ["farmerAnalytics", user?.id || ""],
      () => getFarmerAnalytics(user?.id!),
      { enabled: !!user?.id }
    );
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (analytics && !aiInsights && !isGenerating) {
            const fetchInsights = async () => {
                setIsGenerating(true);
                try {
                    const result = await getAIInsights({ stats: analytics });
                    setAiInsights(result);
                } catch (e) {
                    console.error("AI Insights failed:", e);
                } finally {
                    setIsGenerating(false);
                }
            };
            fetchInsights();
        }
    }, [analytics, aiInsights, isGenerating]);

    if (isLoading || !analytics) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { totalRevenue, totalOrders, productPerformance, marketTrends, priceBenchmarks } = analytics;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="p-4 md:pb-2">
                        <CardDescription className="text-primary font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <DollarSign className="h-3 w-3 md:h-4 md:h-4" /> Revenue
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold truncate">${totalRevenue.toFixed(0)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="p-4 md:pb-2">
                        <CardDescription className="text-emerald-700 font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <Package className="h-3 w-3 md:h-4 md:h-4" /> Orders
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold">{totalOrders}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="p-4 md:pb-2">
                        <CardDescription className="text-blue-700 font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <ArrowUpRight className="h-3 w-3 md:h-4 md:h-4" /> Growth
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold">+12%</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="p-4 md:pb-2">
                        <CardDescription className="text-purple-700 font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <TrendingUp className="h-3 w-3 md:h-4 md:h-4" /> Best Seller
                        </CardDescription>
                        <CardTitle className="text-sm sm:text-base md:text-lg font-bold truncate">
                            {productPerformance[0]?.name || "N/A"}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Insights Card */}
                <div className="lg:col-span-2">
                    <Card className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 border-indigo-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Sparkles className="h-32 w-32 text-indigo-500 animate-pulse" />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    AI Smart Insights
                                </CardTitle>
                                <Badge className="bg-indigo-600 animate-pulse">
                                    <Sparkles className="h-3 w-3 mr-1" /> Precision Agri
                                </Badge>
                            </div>
                            <CardDescription className="text-indigo-700/70">Tailored recommendations to maximize your harvest revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <p className="text-sm text-indigo-600 font-medium animate-pulse">Analyzing your marketplace footprint...</p>
                                </div>
                            ) : (
                                <div className="prose prose-indigo max-w-none">
                                    <div className="whitespace-pre-wrap text-indigo-900 leading-relaxed font-medium">
                                        {aiInsights || "No insights available yet. Keep selling to unlock AI wisdom!"}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Price Benchmarks Card */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500 bg-amber-50/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-600" />
                            Regional Price Benchmarks
                        </CardTitle>
                        <CardDescription>Comparison with other farmers in your region</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(priceBenchmarks || []).length > 0 ? (
                            priceBenchmarks.map((bench: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white border border-amber-100 rounded-lg shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{bench.productName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{bench.category} • {bench.location}</p>
                                        </div>
                                        <Badge variant={bench.diffPercentage > 10 ? "destructive" : bench.diffPercentage < -10 ? "secondary" : "default"} className="text-[10px]">
                                            {bench.diffPercentage > 0 ? '+' : ''}{bench.diffPercentage.toFixed(0)}% vs Market
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-medium">
                                            <span>Your Price: <span className="text-foreground">${bench.yourPrice}</span></span>
                                            <span className="text-muted-foreground">Market Avg: ${bench.marketAverage.toFixed(1)}</span>
                                        </div>
                                        <Progress 
                                            value={50 + (bench.diffPercentage / 2)} 
                                            className="h-1.5 bg-muted"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">
                                Not enough regional data for benchmarks yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Sales Breakdown */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Inventory Revenue Share
                        </CardTitle>
                        <CardDescription>Which crops are paying the bills?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {productPerformance.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-sm">{idx + 1}</Badge>
                                        {item.name}
                                    </span>
                                    <span>${item.revenue.toFixed(2)}</span>
                                </div>
                                <Progress value={(item.revenue / (totalRevenue || 1)) * 100} className="h-2 bg-muted overflow-hidden">
                                    <div className={`h-full ${idx === 0 ? 'bg-primary' : 'bg-primary/60'}`} />
                                </Progress>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Customer Loyalty Report */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500 bg-indigo-50/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                            Top Loyal Customers
                        </CardTitle>
                        <CardDescription>Buyers who keep coming back for more</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(analytics.customerLoyalty || []).length > 0 ? (
                            analytics.customerLoyalty.map((loyalty: any, idx: number) => (
                                <div key={idx} className="group p-3 bg-white border border-indigo-100 rounded-lg shadow-sm space-y-3 transition-all hover:border-indigo-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                                                {loyalty.avatar ? (
                                                    <img src={loyalty.avatar} alt={loyalty.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 font-bold underline decoration-indigo-300">{loyalty.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{loyalty.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{loyalty.count} successful orders</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm underline decoration-indigo-200">${loyalty.spent.toFixed(0)}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Lifetime Value</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-indigo-50">
                                        <Badge variant={loyalty.isRewarded ? "default" : "outline"} className={loyalty.isRewarded ? "bg-indigo-600" : "text-indigo-600 border-indigo-200"}>
                                            {loyalty.isRewarded ? "10% Reward Active" : "No active reward"}
                                        </Badge>
                                        <Button 
                                            size="sm" 
                                            variant={loyalty.isRewarded ? "outline" : "default"}
                                            className="h-7 text-[10px] px-2"
                                            onClick={async () => {
                                                try {
                                                    await toggleLoyaltyReward({
                                                        farmerId: user?.id!,
                                                        buyerId: loyalty.buyerId,
                                                        active: !loyalty.isRewarded
                                                    });
                                                    toast.success(loyalty.isRewarded ? "Reward removed" : "10% Loyalty reward activated!");
                                                } catch (e) {
                                                    toast.error("Failed to update reward");
                                                }
                                            }}
                                        >
                                            <Gift className="h-3 w-3 mr-1" />
                                            {loyalty.isRewarded ? "Deactivate" : "Activate Reward"}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">
                                No recurring buyers found yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-rose-500 bg-rose-50/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                            Low Stock Alerts
                        </CardTitle>
                        <CardDescription>Critical inventory levels requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(analytics.lowStockAlerts || []).length > 0 ? (
                            analytics.lowStockAlerts.map((alert: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-5 items-center gap-4 p-3 bg-white border border-rose-100 rounded-lg shadow-sm">
                                    <div className="col-span-3 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm truncate">{alert.name}</p>
                                            {alert.isBestSeller && (
                                                <Badge variant="outline" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-200">Best Seller</Badge>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Threshold: 10 {alert.unit}</p>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <Badge variant="destructive" className="font-mono text-xs">
                                            {alert.quantity} {alert.unit} left
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-emerald-600 flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-8 w-8" />
                                <p className="text-sm font-medium">All inventory levels are healthy!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Seasonal Harvest Forecast */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-sky-500 bg-sky-50/5 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-sky-600" />
                            Seasonal Harvest Forecast
                        </CardTitle>
                        <CardDescription>Historical demand patterns for upcoming months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(analytics.seasonalForecast || []).map((forecast: any, idx: number) => (
                                <div key={idx} className="p-4 bg-white border border-sky-100 rounded-xl shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-sky-900">{forecast.month}</h4>
                                        <Badge variant="outline" className="text-sky-600 border-sky-200">
                                            Score: {forecast.opportunityScore.toFixed(0)}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projected High Demand</p>
                                        <div className="flex flex-wrap gap-2">
                                            {forecast.topDemand.length > 0 ? (
                                                forecast.topDemand.map((cat: string) => (
                                                    <Badge key={cat} className="bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100 capitalize">
                                                        {cat}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground">No historical data for this period</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-muted-foreground">Market Intensity</span>
                                            <span className="text-sky-700 font-medium">Predicted High</span>
                                        </div>
                                        <Progress value={forecast.opportunityScore} className="h-1 bg-sky-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Market Intelligence / Trends */}
                <div className="space-y-8 lg:col-span-2 grid md:grid-cols-2 gap-8">
                    <Card className="border-l-4 border-l-emerald-500 h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <Search className="h-5 w-5" />
                                Trending Demands
                            </CardTitle>
                            <CardDescription>What buyers are searching for right now</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {marketTrends.categories.map(([cat, count]) => (
                                <Badge key={cat} variant="secondary" className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-800 border-emerald-200 capitalize">
                                    {cat} ({count} searches)
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                <Map className="h-5 w-5" />
                                Regional Hotspots
                            </CardTitle>
                            <CardDescription>Top regions looking for produce</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {marketTrends.locations.map(([loc, count]) => (
                                <Badge key={loc} variant="outline" className="px-4 py-1.5 text-sm border-blue-200 text-blue-800 hover:bg-blue-50 capitalize">
                                    <Map className="h-3 w-3 mr-2" /> {loc}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FarmerAnalytics;
