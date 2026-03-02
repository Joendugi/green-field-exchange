import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Id } from "../../../convex/_generated/dataModel";
import { EyeOff, Eye, Sparkles, Trash2, Star, ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ContentTabProps {
    posts: any[];
    products: any[];
    showHidden: boolean;
    onToggleShowHidden: () => void;
    onHidePost: (postId: Id<"posts">, hide: boolean) => Promise<void>;
    onHideProduct: (productId: Id<"products">, hide: boolean) => Promise<void>;
    onToggleFeatured: (productId: Id<"products">, featured: boolean) => Promise<void>;
}

export const ContentTab = ({
    posts,
    products,
    showHidden,
    onToggleShowHidden,
    onHidePost,
    onHideProduct,
    onToggleFeatured,
}: ContentTabProps) => {
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    // AI Shield
    const runModeration = useAction(api.admin.moderateContent);
    const [aiScanning, setAiScanning] = useState(false);
    const [flaggedItems, setFlaggedItems] = useState<Array<{ id: string; type: string; content: string; reason: string; confidence: string }> | null>(null);

    const handleAIScan = async () => {
        setAiScanning(true);
        setFlaggedItems(null);
        try {
            const result = await runModeration({});
            setFlaggedItems(result.flagged);
            if (result.flagged.length === 0) {
                toast.success("✅ AI Shield: No violations detected");
            } else {
                toast.warning(`⚠️ AI Shield flagged ${result.flagged.length} item(s) for review`);
            }
        } catch (e: any) {
            toast.error("AI Scan failed: " + e.message);
        } finally {
            setAiScanning(false);
        }
    };


    const visiblePosts = showHidden ? posts : posts.filter((p: any) => !p.is_hidden);
    const visibleProducts = showHidden ? products : products.filter((p: any) => !p.is_hidden);

    // ── Post bulk helpers ──────────────────────────────────────────────────
    const togglePostSelection = (id: string) => {
        setSelectedPosts(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAllPosts = () => {
        if (selectedPosts.size === visiblePosts.length) {
            setSelectedPosts(new Set());
        } else {
            setSelectedPosts(new Set(visiblePosts.map((p: any) => p._id)));
        }
    };

    const bulkHidePosts = async (hide: boolean) => {
        if (selectedPosts.size === 0) return;
        setBulkLoading(true);
        try {
            await Promise.all([...selectedPosts].map(id => onHidePost(id as Id<"posts">, hide)));
            toast.success(`${selectedPosts.size} post(s) ${hide ? "hidden" : "restored"}`);
            setSelectedPosts(new Set());
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBulkLoading(false);
        }
    };

    // ── Product bulk helpers ───────────────────────────────────────────────
    const toggleProductSelection = (id: string) => {
        setSelectedProducts(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAllProducts = () => {
        if (selectedProducts.size === visibleProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(visibleProducts.map((p: any) => p._id)));
        }
    };

    const bulkHideProducts = async (hide: boolean) => {
        if (selectedProducts.size === 0) return;
        setBulkLoading(true);
        try {
            await Promise.all([...selectedProducts].map(id => onHideProduct(id as Id<"products">, hide)));
            toast.success(`${selectedProducts.size} product(s) ${hide ? "hidden" : "restored"}`);
            setSelectedProducts(new Set());
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBulkLoading(false);
        }
    };

    const bulkFeatureProducts = async (featured: boolean) => {
        if (selectedProducts.size === 0) return;
        setBulkLoading(true);
        try {
            await Promise.all([...selectedProducts].map(id => onToggleFeatured(id as Id<"products">, featured)));
            toast.success(`${selectedProducts.size} product(s) ${featured ? "featured" : "unfeatured"}`);
            setSelectedProducts(new Set());
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Moderation</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAIScan}
                        disabled={aiScanning}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5"
                    >
                        {aiScanning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldAlert className="h-4 w-4" />
                        )}
                        {aiScanning ? "Scanning..." : "AI Shield"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToggleShowHidden}>
                        {showHidden ? (
                            <><EyeOff className="h-4 w-4 mr-1" /> Hide Hidden</>
                        ) : (
                            <><Eye className="h-4 w-4 mr-1" /> Show Hidden</>
                        )}
                    </Button>
                </div>
            </div>

            {/* AI Shield Results */}
            {flaggedItems !== null && (
                <Card className={`border-2 ${flaggedItems.length > 0 ? "border-orange-300 bg-orange-50/40" : "border-green-300 bg-green-50/40"}`}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className={`h-5 w-5 ${flaggedItems.length > 0 ? "text-orange-500" : "text-green-500"}`} />
                            <CardTitle className="text-base">
                                {flaggedItems.length === 0
                                    ? "✅ All Clear — No violations detected"
                                    : `⚠️ ${flaggedItems.length} item(s) flagged for review`}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    {flaggedItems.length > 0 && (
                        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                            {flaggedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-orange-200"
                                >
                                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                                            <Badge
                                                className={`text-[10px] ${item.confidence === "high" ? "bg-red-500" : item.confidence === "medium" ? "bg-orange-400" : "bg-yellow-400 text-yellow-900"}`}
                                            >
                                                {item.confidence} confidence
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{item.content}</p>
                                        <p className="text-xs font-medium text-orange-700">{item.reason}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-7 text-xs shrink-0"
                                        onClick={() => {
                                            if (item.type === "post") onHidePost(item.id as Id<"posts">, true);
                                            else onHideProduct(item.id as Id<"products">, true);
                                        }}
                                    >
                                        Hide
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    )}
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* ── POSTS ── */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle>Posts</CardTitle>
                            <Badge variant="secondary">{visiblePosts.length}</Badge>
                        </div>
                        {/* Bulk toolbar */}
                        {visiblePosts.length > 0 && (
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Checkbox
                                        checked={selectedPosts.size === visiblePosts.length && visiblePosts.length > 0}
                                        onCheckedChange={selectAllPosts}
                                        id="select-all-posts"
                                    />
                                    <label htmlFor="select-all-posts" className="text-xs text-muted-foreground cursor-pointer select-none">
                                        {selectedPosts.size > 0 ? `${selectedPosts.size} selected` : "Select all"}
                                    </label>
                                </div>
                                {selectedPosts.size > 0 && (
                                    <div className="flex gap-1 ml-auto">
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={bulkLoading} onClick={() => bulkHidePosts(true)}>
                                            <EyeOff className="h-3 w-3 mr-1" /> Hide
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={bulkLoading} onClick={() => bulkHidePosts(false)}>
                                            <Eye className="h-3 w-3 mr-1" /> Restore
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto space-y-2">
                        {visiblePosts.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">No posts</p>
                        )}
                        {visiblePosts.map((post: any) => (
                            <div
                                key={post._id}
                                className={`p-3 border rounded-lg flex items-start gap-3 transition-colors ${selectedPosts.has(post._id) ? "bg-primary/5 border-primary/30" : ""}`}
                            >
                                <Checkbox
                                    checked={selectedPosts.has(post._id)}
                                    onCheckedChange={() => togglePostSelection(post._id)}
                                    className="mt-0.5 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
                                    <div className="flex items-center gap-2">
                                        {post.is_hidden && <Badge variant="destructive" className="text-[10px] h-4">Hidden</Badge>}
                                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => onHidePost(post._id, !post.is_hidden)}>
                                            {post.is_hidden ? "Restore" : "Hide"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* ── PRODUCTS ── */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle>Products</CardTitle>
                            <Badge variant="secondary">{visibleProducts.length}</Badge>
                        </div>
                        {/* Bulk toolbar */}
                        {visibleProducts.length > 0 && (
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Checkbox
                                        checked={selectedProducts.size === visibleProducts.length && visibleProducts.length > 0}
                                        onCheckedChange={selectAllProducts}
                                        id="select-all-products"
                                    />
                                    <label htmlFor="select-all-products" className="text-xs text-muted-foreground cursor-pointer select-none">
                                        {selectedProducts.size > 0 ? `${selectedProducts.size} selected` : "Select all"}
                                    </label>
                                </div>
                                {selectedProducts.size > 0 && (
                                    <div className="flex gap-1 ml-auto flex-wrap">
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={bulkLoading} onClick={() => bulkHideProducts(true)}>
                                            <Trash2 className="h-3 w-3 mr-1" /> Hide
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={bulkLoading} onClick={() => bulkHideProducts(false)}>
                                            <Eye className="h-3 w-3 mr-1" /> Restore
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600" disabled={bulkLoading} onClick={() => bulkFeatureProducts(true)}>
                                            <Star className="h-3 w-3 mr-1" /> Feature
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto space-y-2">
                        {visibleProducts.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">No products</p>
                        )}
                        {visibleProducts.map((product: any) => (
                            <div
                                key={product._id}
                                className={`p-3 border rounded-lg flex items-start gap-3 transition-colors ${selectedProducts.has(product._id) ? "bg-primary/5 border-primary/30" : ""}`}
                            >
                                <Checkbox
                                    checked={selectedProducts.has(product._id)}
                                    onCheckedChange={() => toggleProductSelection(product._id)}
                                    className="mt-0.5 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-medium text-sm truncate">{product.name}</p>
                                        <span className="text-xs text-muted-foreground shrink-0">${product.price}</span>
                                        {product.is_hidden && <Badge variant="destructive" className="text-[10px] h-4">Hidden</Badge>}
                                        {product.is_featured && <Badge className="text-[10px] h-4 bg-amber-500"><Sparkles className="h-2 w-2 mr-0.5" />Featured</Badge>}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => onHideProduct(product._id, !product.is_hidden)}>
                                            {product.is_hidden ? "Restore" : "Hide"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={product.is_featured ? "default" : "outline"}
                                            className="h-6 text-xs px-2"
                                            onClick={() => onToggleFeatured(product._id, !product.is_featured)}
                                        >
                                            {product.is_featured ? "Unfeature" : "Feature"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
