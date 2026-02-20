import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Id } from "../../../convex/_generated/dataModel";
import { EyeOff, Eye } from "lucide-react";

interface ContentTabProps {
    posts: any[];
    products: any[];
    showHidden: boolean;
    onToggleShowHidden: () => void;
    onHidePost: (postId: Id<"posts">, hide: boolean) => Promise<void>;
    onHideProduct: (productId: Id<"products">, hide: boolean) => Promise<void>;
}

export const ContentTab = ({
    posts,
    products,
    showHidden,
    onToggleShowHidden,
    onHidePost,
    onHideProduct,
}: ContentTabProps) => {
    const visiblePosts = showHidden ? posts : posts.filter((p: any) => !p.is_hidden);
    const visibleProducts = showHidden ? products : products.filter((p: any) => !p.is_hidden);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Moderation</h3>
                <Button variant="outline" size="sm" onClick={onToggleShowHidden}>
                    {showHidden ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hide Hidden</>
                    ) : (
                        <><Eye className="h-4 w-4 mr-1" /> Show Hidden</>
                    )}
                </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Posts</CardTitle></CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto space-y-3">
                        {visiblePosts.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">No posts</p>
                        )}
                        {visiblePosts.map((post: any) => (
                            <div key={post._id} className="p-3 border rounded-lg">
                                <p className="text-sm mb-2">{post.content}</p>
                                <Button size="sm" variant="ghost" onClick={() => onHidePost(post._id, !post.is_hidden)}>
                                    {post.is_hidden ? "Restore" : "Hide"}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto space-y-3">
                        {visibleProducts.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">No products</p>
                        )}
                        {visibleProducts.map((product: any) => (
                            <div key={product._id} className="p-3 border rounded-lg">
                                <p className="font-medium mb-2">{product.name} — ${product.price}</p>
                                <Button size="sm" variant="ghost" onClick={() => onHideProduct(product._id, !product.is_hidden)}>
                                    {product.is_hidden ? "Restore" : "Hide"}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
