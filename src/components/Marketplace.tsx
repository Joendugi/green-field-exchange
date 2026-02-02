import { useEffect, useState } from "react";
import { account, databases, functions } from "@/lib/appwrite";
import { ID, Query, Permission, Role } from "appwrite";
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

import { useAuth } from "@/contexts/AuthContext";

const Marketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRecommendations();
  }, [categoryFilter, user]);

  const fetchProducts = async () => {
    // Try to get from cache first
    const cacheKey = categoryFilter === "all"
      ? CACHE_KEYS.PRODUCTS
      : CACHE_KEYS.PRODUCT_CATEGORY(categoryFilter);

    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      setProducts(cached);
      return;
    }

    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const queries = [
        Query.equal("is_available", true),
        Query.notEqual("is_hidden", true), // Filter out hidden products (admin moderation)
      ];

      if (categoryFilter !== "all") {
        queries.push(Query.equal("category", categoryFilter));
      }

      // Fetch products
      const response = await databases.listDocuments(
        dbId,
        "products",
        queries
      );

      let products = response.documents;

      // Manually fetch farmer profiles (relations)
      const farmerIds = [...new Set(products.map(p => p.farmer_id))];

      if (farmerIds.length > 0) {
        // Appwrite Query.equal supports array for "IN" operator
        const profilesResponse = await databases.listDocuments(
          dbId,
          "profiles",
          [Query.equal("$id", farmerIds)]
        );

        const profilesMap = profilesResponse.documents.reduce((acc: any, profile: any) => {
          acc[profile.$id] = profile;
          return acc;
        }, {});

        // Attach profiles to products
        products = products.map(p => ({
          ...p,
          profiles: profilesMap[p.farmer_id] || { full_name: 'Unknown', location: 'Unknown' }
        }));
      }

      // Store in cache
      cache.set(cacheKey, products);
      setProducts(products);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      if (!user) {
        setRecommendations([]);
        return;
      }

      // Check cache first
      const cacheKey = CACHE_KEYS.RECOMMENDATIONS(user.$id);
      const cached = cache.get<any[]>(cacheKey);
      if (cached) {
        setRecommendations(cached);
        return;
      }

      const execution = await functions.createExecution(
        'product-recommendations', // Function ID
        JSON.stringify({ userId: user.$id })
      );

      if (execution.status === 'completed') {
        const data = JSON.parse(execution.responseBody);
        const recs = data?.recommendations || [];
        cache.set(cacheKey, recs, 10 * 60 * 1000); // Cache for 10 minutes
        setRecommendations(recs);
      }
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
      if (!user) {
        toast.error("Please sign in to place an order");
        return;
      }

      const quantity = parseFloat(orderQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      const totalPrice = quantity * selectedProduct.price;
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (!selectedProduct.farmer_id) {
        toast.error("Invalid product: Missing farmer information");
        console.error("Product invalid:", selectedProduct);
        return;
      }

      // Call Server-Side Function to place order (Handles permissions safely)
      const execution = await functions.createExecution(
        'place-order',
        JSON.stringify({
          buyerId: user.$id,
          product: selectedProduct,
          quantity: quantity,
          deliveryAddress: deliveryAddress
        })
      );

      const response = JSON.parse(execution.responseBody);

      if (!response.success && execution.status === 'completed') {
        // Function executed but returned application error
        throw new Error(response.message);
      }

      if (execution.status === 'failed') {
        throw new Error("Server function failed to execute");
      }

      toast.success("Order placed successfully!");
      setSelectedProduct(null);
      setOrderQuantity("");
      setDeliveryAddress("");

      // Invalidate cache to refresh recommendations
      cache.invalidate(CACHE_KEYS.RECOMMENDATIONS(user.$id));
      fetchRecommendations();
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast.error(`Order failed: ${error.message}`);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {/* Fixed aspect ratio to prevent CLS */}
              <div className="aspect-[4/3] bg-secondary rounded-lg mb-4 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
