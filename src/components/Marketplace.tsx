import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Marketplace = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
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
    setProducts(data || []);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceOrder = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const quantity = parseFloat(orderQuantity);
      const totalPrice = quantity * selectedProduct.price;

      const { error } = await supabase.from("orders").insert({
        product_id: selectedProduct.id,
        buyer_id: session.user.id,
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
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
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
