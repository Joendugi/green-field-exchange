import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Map, Search, Package, ArrowUpRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const FarmerAnalytics = () => {
    const { user } = useAuth();
    const analytics = useQuery(api.analytics.getFarmerAnalytics, user?.userId ? { farmerId: user.userId } : "skip");

    if (!analytics) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { totalRevenue, totalOrders, productPerformance, marketTrends } = analytics;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-semibold flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Total Revenue
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold">${totalRevenue.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-700 font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" /> Orders Fulfilled
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold">{totalOrders}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-700 font-semibold flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" /> Growth
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold">+12%</CardTitle>
                        <CardDescription>From last month</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-purple-700 font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Best Selling
                        </CardDescription>
                        <CardTitle className="text-lg font-bold truncate">
                            {productPerformance[0]?.name || "N/A"}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                {/* Market Intelligence / Trends */}
                <div className="space-y-8">
                    <Card className="border-l-4 border-l-emerald-500">
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

                    <Card className="border-l-4 border-l-blue-500">
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
