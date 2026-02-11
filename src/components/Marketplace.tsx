import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MapPin, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";
import { Skeleton } from "@/components/ui/skeleton";

const Marketplace = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchRecommendations();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);

    // Try to get from cache first
    const cacheKey = categoryFilter === "all" 
      ? CACHE_KEYS.PRODUCTS 
      : CACHE_KEYS.PRODUCT_CATEGORY(categoryFilter);
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      setProducts(cached);
      setIsLoadingProducts(false);
      return;
    }

    // Fetch from database
    let query = supabase
      .from("products")
      .select(`
        *,
        profiles:farmer_id (full_name, location)
      `)
      .eq("is_available", true);

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter as any);
    }

    const { data } = await query;
    const products = data || [];
    
    // Store in cache
    cache.set(cacheKey, products);
    setProducts(products);
    setIsLoadingProducts(false);
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check cache first
      const cacheKey = CACHE_KEYS.RECOMMENDATIONS(session.user.id);
      const cached = cache.get<any[]>(cacheKey);
      if (cached) {
        setRecommendations(cached);
        return;
      }

      const { data, error } = await supabase.functions.invoke('product-recommendations', {
        body: { userId: session.user.id }
      });

      if (error) throw error;

      const recs = data?.recommendations || [];
      cache.set(cacheKey, recs, 10 * 60 * 1000); // Cache for 10 minutes
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceOrder = async () => {
    try {
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession) {
        toast.error("Please sign in to place an order");
        return;
      }

      const quantity = parseFloat(orderQuantity);
      const totalPrice = quantity * selectedProduct.price;

      const { error } = await supabase.from("orders").insert({
        product_id: selectedProduct.id,
        buyer_id: userSession.user.id,
        farmer_id: selectedProduct.farmer_id,
        quantity,
        total_price: totalPrice,
        delivery_address: deliveryAddress,
        payment_type: "traditional",
      });

      if (error) throw error;

      // Create notification for farmer
      await supabase.from("notifications").insert({
        user_id: selectedProduct.farmer_id,
        type: "order",
        title: "New Order Received",
        message: `You have a new order for ${selectedProduct.name}`,
        link: "/dashboard?tab=orders",
      });

      toast.success("Order placed successfully!");
      setSelectedProduct(null);
      setOrderQuantity("");
      setDeliveryAddress("");
      
      // Invalidate cache to refresh recommendations
      cache.invalidate(CACHE_KEYS.RECOMMENDATIONS(userSession.user.id));
      fetchRecommendations();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderProductSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="p-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="space-y-3 mt-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommended For You
            </CardTitle>
            <CardDescription>Based on your purchase history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendations.map((product) => (
                <Card key={product.id} className="min-w-[250px] hover:shadow-md transition-shadow">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{product.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{product.category}</Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-lg font-bold text-primary">${product.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="vegetables">Vegetables</SelectItem>
            <SelectItem value="fruits">Fruits</SelectItem>
            <SelectItem value="grains">Grains</SelectItem>
            <SelectItem value="dairy">Dairy</SelectItem>
            <SelectItem value="livestock">Livestock</SelectItem>
            <SelectItem value="poultry">Poultry</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingProducts ? (
        renderProductSkeletons()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  ${product.price}/{product.unit}
                </span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.location}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Farmer:</span> {product.profiles?.full_name}
              </div>
              <div className="text-sm">
                <span className="font-semibold">Available:</span> {product.quantity} {product.unit}
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => setSelectedProduct(product)}>
                    Place Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Place Order</DialogTitle>
                    <DialogDescription>
                      Order {product.name} from {product.profiles?.full_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Quantity ({product.unit})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max={product.quantity}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label>Delivery Address</Label>
                      <Textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                      />
                    </div>
                    {orderQuantity && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Price:</span>
                          <span className="text-2xl font-bold text-primary">
                            ${(parseFloat(orderQuantity) * product.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handlePlaceOrder}
                      disabled={!orderQuantity || !deliveryAddress}
                    >
                      Confirm Order
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          ))}
        </div>
      )}

      {!isLoadingProducts && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
