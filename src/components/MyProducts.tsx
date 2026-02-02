import { useEffect, useState } from "react";
import { account, databases, functions, storage } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Package, Lightbulb, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cache, CACHE_KEYS } from "@/lib/cache";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MyProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [pricePrediction, setPricePrediction] = useState<any>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "vegetables",
    price: "",
    quantity: "",
    unit: "",
    location: "",
    image_url: "",
  });

  useEffect(() => {
    fetchMyProducts();
    checkVerification();
  }, []);

  const checkVerification = async () => {
    const user = await account.get().catch(() => null);
    if (!user) return;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "user_roles",
      [Query.equal("user_id", user.$id)]
    );

    setIsVerified(documents[0]?.is_verified || false);
  };

  const fetchMyProducts = async () => {
    const user = await account.get().catch(() => null);
    if (!user) return;

    // Try cache first
    const cacheKey = CACHE_KEYS.MY_PRODUCTS(user.$id);
    const cached = cache.get<any[]>(cacheKey);

    if (cached) {
      setProducts(cached);
      // We return here but could also fetch background update if needed
      // For now, simple cache-first strategy
    }

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "products",
      [
        Query.equal("farmer_id", user.$id),
        Query.orderDesc("$createdAt")
      ]
    );

    setProducts(documents || []);
    // Update cache
    cache.set(cacheKey, documents || []);
  };

  const uploadMedia = async (file: File) => {
    const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;
    if (!bucketId) {
      throw new Error("Storage Bucket ID not configured");
    }

    try {
      const fileUpload = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );

      // Get view URL
      const result = storage.getFileView(bucketId, fileUpload.$id);
      return result.href;
    } catch (error) {
      console.error("Upload error", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      // Check product limit for unverified users
      if (!editingProduct && !isVerified && products.length >= 5) {
        setVerificationDialogOpen(true);
        return;
      }

      setIsUploading(true);
      let imageUrl = formData.image_url;

      if (mediaFile) {
        imageUrl = await uploadMedia(mediaFile);
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        farmer_id: user.$id,
        category: formData.category as any,
      };

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      if (editingProduct) {
        await databases.updateDocument(
          dbId,
          "products",
          editingProduct.$id,
          productData
        );
        toast.success("Product updated successfully!");
      } else {
        await databases.createDocument(
          dbId,
          "products",
          ID.unique(),
          {
            ...productData,
            is_available: true,
          }
        );
        toast.success("Product added successfully!");
      }

      // Invalidate specific user products cache
      cache.invalidate(CACHE_KEYS.MY_PRODUCTS(user.$id));

      // Invalidate product cache
      cache.invalidatePattern('products');

      setIsAddDialogOpen(false);
      setEditingProduct(null);
      setPricePrediction(null);
      setMediaFile(null);
      setMediaPreview("");
      setFormData({
        name: "",
        description: "",
        category: "vegetables",
        price: "",
        quantity: "",
        unit: "",
        location: "",
        image_url: "",
      });
      fetchMyProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getPricePrediction = async () => {
    if (!formData.category || !formData.location) {
      toast.error("Please select category and location first");
      return;
    }

    try {
      setIsLoadingPrediction(true);

      // Check cache first
      const cacheKey = CACHE_KEYS.PRICE_PREDICTION(formData.category, formData.location);
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        setPricePrediction(cached);
        return;
      }

      const execution = await functions.createExecution(
        'price-prediction',
        JSON.stringify({
          category: formData.category,
          location: formData.location
        })
      );

      if (execution.status === 'completed') {
        const data = JSON.parse(execution.responseBody);
        // Cache the prediction
        cache.set(cacheKey, data, 30 * 60 * 1000); // 30 minutes
        setPricePrediction(data);
      } else {
        throw new Error("Prediction failed");
      }
    } catch (error: any) {
      toast.error("Failed to get price prediction");
      console.error(error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.deleteDocument(
        dbId,
        "products",
        id
      );

      toast.success("Product deleted successfully!");

      const user = await account.get().catch(() => null);
      if (user) {
        cache.invalidate(CACHE_KEYS.MY_PRODUCTS(user.$id));
      }

      fetchMyProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.updateDocument(
        dbId,
        "products",
        product.$id,
        { is_available: !product.is_available }
      );

      toast.success(`Product ${!product.is_available ? "enabled" : "disabled"}`);

      const user = await account.get().catch(() => null);
      if (user) {
        cache.invalidate(CACHE_KEYS.MY_PRODUCTS(user.$id));
      }

      fetchMyProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRequestVerification = async () => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.createDocument(
        dbId,
        "verification_requests",
        ID.unique(),
        {
          user_id: user.$id,
        }
      );

      toast.success("Verification request submitted!");
      setVerificationDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">My Products</h2>
          {!isVerified && (
            <p className="text-sm text-muted-foreground mt-1">
              Unverified users can add up to 5 products. {products.length}/5 products added.
            </p>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update your product details" : "Create a new product listing"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="poultry">Poultry</SelectItem>
                      <SelectItem value="machinery">Machinery</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kg, lbs, etc"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              {/* AI Price Prediction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Price Suggestion</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getPricePrediction}
                    disabled={isLoadingPrediction || !formData.category || !formData.location}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {isLoadingPrediction ? "Analyzing..." : "Get Suggestion"}
                  </Button>
                </div>
                {pricePrediction && (
                  <Alert className="bg-primary/5 border-primary/20">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Suggested Price: ${pricePrediction.suggested_price?.toFixed(2) || "N/A"}
                        </p>
                        <p className="text-sm">
                          Confidence: <Badge variant="outline">{pricePrediction.confidence}</Badge>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pricePrediction.reasoning}
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => {
                            if (pricePrediction.suggested_price) {
                              setFormData({ ...formData, price: pricePrediction.suggested_price.toFixed(2) });
                            }
                          }}
                        >
                          Use this price
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex flex-col gap-4">
                  {mediaPreview ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : formData.image_url ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary border">
                      <img src={formData.image_url} alt="Current" className="w-full h-full object-cover" />
                      <p className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">Using URL</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-2">
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="product-image-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMediaFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setMediaPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('product-image-upload')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Local Image
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground text-xs font-bold uppercase">URL</div>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Or paste external image link..."
                        className="pl-12"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "Processing..." : (editingProduct ? "Update Product" : "Add Product")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.$id}>
            <CardHeader>
              <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardTitle className="flex items-center justify-between">
                {product.name}
                <Badge variant={product.is_available ? "default" : "secondary"}>
                  {product.is_available ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">${product.price}/{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{product.quantity} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{product.location}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setEditingProduct(product);
                  setFormData({
                    name: product.name,
                    description: product.description || "",
                    category: product.category,
                    price: product.price.toString(),
                    quantity: product.quantity.toString(),
                    unit: product.unit,
                    location: product.location,
                    image_url: product.image_url || "",
                  });
                  setIsAddDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleAvailability(product)}
              >
                <Switch checked={product.is_available} />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.$id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}

      <AlertDialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You've reached the limit of 5 products for unverified users.
              Request verification to add unlimited products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestVerification}>
              Request Verification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyProducts;
