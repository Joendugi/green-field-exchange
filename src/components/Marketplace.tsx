import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MapPin, Search, Sparkles, Loader2, Handshake, Gavel, TrendingUp, Package, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentityBridge } from "@/contexts/IdentityBridge";
import { listProductsWithProfiles, getSmartMatches } from "@/integrations/supabase/products";
import { createOrder } from "@/integrations/supabase/orders";
import { createOffer } from "@/integrations/supabase/offers";
import { ExternalLink, Tag, Megaphone, ShieldCheck, Zap } from "lucide-react";

const Marketplace = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Offer States
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const { isConvexAuthReady, convexUserId } = useIdentityBridge();

  useEffect(() => {
    if (isAuthenticated) {
      const getMatches = async () => {
        setIsMatching(true);
        try {
          const result = await getSmartMatches({ limit: 4 });
          setSmartMatches(result);
        } catch (e) {
          console.error("AI Matching failed:", e);
        } finally {
          setIsMatching(false);
        }
      };
      getMatches();
    }
  }, [isAuthenticated]);

  // Supabase products
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const result = await listProductsWithProfiles({
          category: categoryFilter === "all" ? undefined : categoryFilter,
          search: searchQuery || undefined,
          limit: 40,
        });
        setProducts(result);
      } catch (e) {
        console.error("Failed to load products", e);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    void load();
  }, [categoryFilter, searchQuery]);
  // Orders & Offers


  const handleMakeOffer = async (product: any) => {
    try {
      if (!isAuthenticated) {
        toast.error("Please sign in to make an offer");
        navigate("/auth");
        return;
      }

      const quantity = parseFloat(offerQuantity);
      const price = parseFloat(offerPrice);

      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }
      if (isNaN(price) || price <= 0) {
        toast.error("Please enter a valid price");
        return;
      }

      await createOffer({
        product_id: product.id,
        quantity,
        amount_per_unit: price,
        message: offerMessage,
      });

      toast.success("Offer sent successfully!");
      setOfferPrice("");
      setOfferQuantity("");
      setOfferMessage("");
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

  const isLoadingRecommendations = false; // stubbed for now
  const recommendations = [];
  const activeAds = [];

  const displayItems = products;

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
        product_id: selectedProduct.id,
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

  const SponsoredAdCard = ({ ad }: { ad: any }) => {
    return (
      <Card className="hover-lift overflow-hidden border-primary/30 bg-primary/5 relative">
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-primary/90 text-white border-0 flex items-center gap-1 shadow-sm">
            <Megaphone className="h-3 w-3" /> Sponsored
          </Badge>
        </div>
        <CardHeader className="p-0">
          <div className="aspect-[4/3] relative overflow-hidden bg-muted flex items-center justify-center">
            {ad.image_url ? (
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <Zap className="h-12 w-12 text-primary/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <CardTitle className="text-xl font-bold text-primary truncate">{ad.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed min-h-[40px]">
            {ad.description}
          </CardDescription>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs py-1 px-2 bg-primary/10 w-fit rounded-full">
            <Tag className="h-3 w-3" /> Promotion
          </div>
        </CardContent>
        <CardFooter className="px-5 pb-5 pt-0">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 shadow-lg" 
            onClick={() => {
              window.open(ad.target_url, "_blank");
            }}
          >
            Visit Website <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Match Section */}
      {isAuthenticated && (isMatching || smartMatches.length > 0) && (
        <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="h-32 w-32 text-indigo-500 rotate-12" />
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
              AI Smart Matches
            </CardTitle>
            <CardDescription className="text-indigo-700/70">
              Personalized picks based on your farm location and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {isMatching ? (
                [1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="min-w-[280px] h-[120px] rounded-xl bg-indigo-100/50" />
                ))
              ) : (
                smartMatches.map((product) => (
                  <Card
                    key={product.id}
                    className="min-w-[280px] border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => {
                      setSearchQuery(product.name);
                      setCategoryFilter(product.category);
                    }}
                  >
                    <CardContent className="p-4 flex gap-4">
                      <div className="h-16 w-16 rounded-lg bg-indigo-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <Package className="h-8 w-8 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-indigo-900 truncate">{product.name}</h4>
                        <p className="text-xs text-indigo-600 font-medium mb-1">{product.category}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-indigo-700">${product.price}</span>
                          <span className="text-[10px] text-indigo-500/70 flex items-center gap-1">
                            <MapPin className="h-2 w-2" /> {product.location}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Section */}
      {!isLoadingRecommendations && recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trending Near You
            </CardTitle>
            <CardDescription>Popular agricultural produce in your region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {recommendations.map((product: any) => (
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
          {displayItems.map((item: any, idx) => {
            if (item.isAd) {
              return <SponsoredAdCard key={item.id} ad={item} />;
            }

            const product = item;
            return (
              <Card key={product.id} className="hover-lift overflow-hidden">
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
                    {product.expiry_date && (product.expiry_date - Date.now() < 48 * 60 * 60 * 1000) && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white border-none animate-pulse">
                        Expiring Soon!
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.hasLoyaltyDiscount ? (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {product.currency || "$"}{product.discountedPrice.toFixed(2)}/{product.unit}
                            </span>
                            <span className="text-xs text-muted-foreground line-through decoration-rose-400">
                              Was {product.currency || "$"}{product.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {product.currency || "$"}{product.price}/{product.unit}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary">{product.category}</Badge>
                        {product.hasLoyaltyDiscount && (
                          <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 animate-pulse gap-1 text-[10px] h-5">
                            <Gift className="h-3 w-3" /> Loyalty Reward
                          </Badge>
                        )}
                        {product.is_featured && (
                          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 gap-1 text-[10px] h-5">
                            <Sparkles className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{product.location}</span>
                  </div>
                  <div className="text-sm flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold">Farmer:</span> 
                    {product.profiles?.full_name || "Unknown"}
                    {product.profiles?.verified && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] h-4 px-1.5 flex items-center gap-0.5">
                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Available:</span> {product.quantity} {product.unit}
                  </div>
                  {product.expiry_date && (
                    <div className="text-sm text-amber-600 flex items-center gap-1">
                      <span className="font-semibold">Best Before:</span> {new Date(product.expiry_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!isAuthenticated ? (
                    <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                      Login to Order
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      {/* Place Order Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="flex-1"
                            onClick={() => setSelectedProduct(product)}
                            disabled={convexUserId && product.farmer_id === convexUserId}
                          >
                            {convexUserId && product.farmer_id === convexUserId ? "Your Product" : "Place Order"}
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
                                    ${(parseFloat(orderQuantity) * (product.discountedPrice || product.price)).toFixed(2)}
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
  
                      {/* Bargain Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
                            <Handshake className="mr-2 h-4 w-4" /> Bargain
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Make a Price Offer</DialogTitle>
                            <DialogDescription>
                              Suggest a different price for {product.name}. The farmer can accept, reject, or counter.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Quantity ({product.unit})</Label>
                                <Input
                                  type="number"
                                  value={offerQuantity}
                                  onChange={(e) => setOfferQuantity(e.target.value)}
                                  placeholder="1"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Your Price (per {product.unit})</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{product.currency || "$"}</span>
                                  <Input
                                    type="number"
                                    className="pl-7"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    placeholder={product.price.toString()}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Message to Farmer (Optional)</Label>
                              <Textarea
                                placeholder="e.g. I'm buying in bulk, can we do a discount?"
                                value={offerMessage}
                                onChange={(e) => setOfferMessage(e.target.value)}
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handleMakeOffer(product)}
                              disabled={!offerPrice || !offerQuantity}
                            >
                              Send Offer
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
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
