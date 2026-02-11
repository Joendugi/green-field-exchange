import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MapPin, Search, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/contexts/AuthContext";

const Marketplace = () => {
  const { isAuthenticated } = useAuth();
  const profile = useQuery(api.users.getProfile);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Convex Queries
  const products = useQuery(api.products.list, {
    category: categoryFilter,
    search: searchQuery
  });
  const recommendations = useQuery(api.products.listRecommendations);

  // Convex Mutations
  const createOrder = useMutation(api.orders.create);

  const isLoadingProducts = products === undefined;
  const isLoadingRecommendations = recommendations === undefined;

  const handlePlaceOrder = async () => {
    try {
      if (!isAuthenticated) {
        toast.error("Please sign in to place an order");
        return;
      }

      const quantity = parseFloat(orderQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      if (quantity > selectedProduct.quantity) {
        toast.error(`Only ${selectedProduct.quantity} available`);
        return;
      }

      await createOrder({
        productId: selectedProduct._id,
        quantity: quantity,
        delivery_address: deliveryAddress,
        payment_type: "cash_on_delivery", // Default
      });

      toast.success("Order placed successfully!");
      setSelectedProduct(null);
      setOrderQuantity("");
      setDeliveryAddress("");

    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast.error(`Order failed: ${error.message}`);
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
      {!isLoadingRecommendations && recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommended For You
            </CardTitle>
            <CardDescription>Based on your browsing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendations.map((product) => (
                <Card key={product._id} className="min-w-[250px] hover:shadow-md transition-shadow">
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
          {products.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-[4/3] bg-secondary rounded-lg mb-4 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                  <span className="font-semibold">Farmer:</span> {product.profiles?.full_name || "Unknown"}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Available:</span> {product.quantity} {product.unit}
                </div>
              </CardContent>
              <CardFooter>
                {product.farmerId === profile?.userId ? (
                  <Button className="w-full" variant="outline" disabled>
                    Your Product
                  </Button>
                ) : (
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
                          Order {product.name} from {product.profiles?.full_name || "Unknown"}
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
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingProducts && products.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
