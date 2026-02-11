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
<<<<<<< HEAD
import { Plus, Edit, Trash2, Package, Lightbulb, BarChart3, Layers, DollarSign, Grid, Check } from "lucide-react";
=======
import { Plus, Edit, Trash2, Package, Lightbulb, Upload, X } from "lucide-react";
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cache, CACHE_KEYS } from "@/lib/cache";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const MyProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [pricePrediction, setPricePrediction] = useState<any>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
<<<<<<< HEAD
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
=======
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);

  const steps = ["Details", "Pricing", "Media & Review"];

  useEffect(() => {
    fetchMyProducts();
    checkVerification();
    fetchAiAssistantSetting();
  }, []);

  const fetchAiAssistantSetting = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_settings")
      .select("ai_assistant_enabled")
      .eq("user_id", session.user.id)
      .single();

    setAiAssistantEnabled(data?.ai_assistant_enabled ?? true);
  };

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

<<<<<<< HEAD
    setProducts(data || []);
    setSelectedProducts([]);
  };

  const handleSubmit = async () => {
=======
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

>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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
<<<<<<< HEAD
      setImagePreview(null);
      setImageFileName(null);
      setFormErrors({});
      setCurrentStep(0);
=======
      setMediaFile(null);
      setMediaPreview("");
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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
    if (!aiAssistantEnabled) {
      toast.info("Enable the AI assistant in Settings to get price suggestions.");
      return;
    }

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

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    try {
      setBulkLoading(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProducts);

      if (error) throw error;
      toast.success("Selected products deleted");
      fetchMyProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkToggleAvailability = async () => {
    if (selectedProducts.length === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(
        selectedProducts.map((productId) => {
          const product = products.find((p) => p.id === productId);
          if (!product) return null;
          return supabase
            .from("products")
            .update({ is_available: !product.is_available })
            .eq("id", productId);
        })
      );

      toast.success("Availability updated for selected products");
      fetchMyProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBulkLoading(false);
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

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (stepIndex: number) => {
    const stepFieldMap: Record<number, string[]> = {
      0: ["name", "description", "category"],
      1: ["price", "quantity", "unit", "location"],
      2: [],
    };
    const fields = stepFieldMap[stepIndex] || [];
    const errors: Record<string, string> = {};

    if (fields.includes("name") && !formData.name.trim()) {
      errors.name = "Product name is required";
    }
    if (fields.includes("description") && formData.description.trim().length < 20) {
      errors.description = "Description should be at least 20 characters";
    }
    if (fields.includes("price") && (!formData.price || Number(formData.price) <= 0)) {
      errors.price = "Enter a valid price";
    }
    if (fields.includes("quantity") && (!formData.quantity || Number(formData.quantity) <= 0)) {
      errors.quantity = "Enter available quantity";
    }
    if (fields.includes("unit") && !formData.unit.trim()) {
      errors.unit = "Unit is required";
    }
    if (fields.includes("location") && !formData.location.trim()) {
      errors.location = "Location is required";
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return { ...next, ...errors };
    });

    if (stepIndex === 2 && !formData.image_url) {
      errors.image_url = "Add an image for better visibility";
      setFormErrors((prev) => ({ ...prev, ...errors }));
    }

    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    await handleSubmit();
  };

  const handlePreviousStep = () => {
    if (currentStep === 0) return;
    setCurrentStep(currentStep - 1);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to upload images");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `products/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("post-images")
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
      setFormErrors((prev) => {
        if (!prev.image_url) return prev;
        const next = { ...prev };
        delete next.image_url;
        return next;
      });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tell buyers what makes this product special. Listings with rich details convert up to 35% better.
            </p>
            <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  required
                />
                {formErrors.name ? (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                ) : (
                  formData.name.trim() && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Looks great!
                    </p>
                  )
                )}
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleFieldChange("category", value)}>
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
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={4}
                placeholder="Describe your product, harvesting practices, and selling points"
              />
              {formErrors.description ? (
                <p className="text-sm text-destructive mt-1">{formErrors.description}</p>
              ) : (
                formData.description.trim().length >= 20 && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Plenty of detail!
                  </p>
                )
              )}
            </div>
            <Alert>
              <AlertDescription>
                Detailed descriptions help buyers trust your listing. Mention quality, certifications, and freshness.
              </AlertDescription>
            </Alert>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pricing transparency builds trust. You can adjust later if inventory or demand changes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleFieldChange("price", e.target.value)}
                />
                {formErrors.price ? (
                  <p className="text-sm text-destructive mt-1">{formErrors.price}</p>
                ) : (
                  formData.price && Number(formData.price) > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Ready for buyers
                    </p>
                  )
                )}
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange("quantity", e.target.value)}
                />
                {formErrors.quantity ? (
                  <p className="text-sm text-destructive mt-1">{formErrors.quantity}</p>
                ) : (
                  formData.quantity && Number(formData.quantity) > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Inventory set
                    </p>
                  )
                )}
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => handleFieldChange("unit", e.target.value)}
                  placeholder="kg, lbs, crates, etc"
                />
                {formErrors.unit ? (
                  <p className="text-sm text-destructive mt-1">{formErrors.unit}</p>
                ) : (
                  formData.unit.trim() && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Clear measurement
                    </p>
                  )
                )}
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="City, Region"
              />
              {formErrors.location ? (
                <p className="text-sm text-destructive mt-1">{formErrors.location}</p>
              ) : (
                formData.location.trim() && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Buyers know where to pick up
                  </p>
                )
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>AI Price Suggestion</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getPricePrediction}
                  disabled={
                    isLoadingPrediction ||
                    !formData.category ||
                    !formData.location ||
                    !aiAssistantEnabled
                  }
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {isLoadingPrediction ? "Analyzing..." : "Get Suggestion"}
                </Button>
              </div>
              {!aiAssistantEnabled && (
                <p className="text-xs text-muted-foreground">
                  Turn on the AI assistant in Settings to enable price suggestions.
                </p>
              )}
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
                            handleFieldChange("price", pricePrediction.suggested_price.toFixed(2));
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
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Label className="cursor-pointer inline-flex flex-col gap-2">
                Drag & drop product images here or
                <Input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                <span className="text-primary text-sm font-semibold">Browse files</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">PNG or JPG up to 5MB.</p>
              {imageFileName && <p className="text-xs text-muted-foreground mt-1">Selected: {imageFileName}</p>}
              {formErrors.image_url && <p className="text-sm text-destructive mt-1">{formErrors.image_url}</p>}
              {uploadingImage && <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>}
            </div>
            {(imagePreview || formData.image_url) && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-semibold mb-2">Preview</p>
                <div className="w-full max-h-64 bg-background/60 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Product preview"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Or paste image URL</Label>
              <Input
                placeholder="https://example.com/your-product.jpg"
                value={formData.image_url}
                onChange={(e) => handleFieldChange("image_url", e.target.value)}
              />
            </div>
            <div className="rounded-lg border p-4 bg-card">
              <h4 className="text-lg font-semibold mb-2">Quick Review</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><span className="font-semibold">Name:</span> {formData.name || "-"}</li>
                <li><span className="font-semibold">Category:</span> {formData.category}</li>
                <li><span className="font-semibold">Price:</span> {formData.price ? `$${formData.price}/${formData.unit}` : "-"}</li>
                <li><span className="font-semibold">Location:</span> {formData.location || "-"}</li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setCurrentStep(0);
            setFormErrors({});
          }
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null);
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
                setCurrentStep(0);
                setImagePreview(null);
                setFormErrors({});
              }}
            >
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {steps.map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep === index ? "bg-primary text-primary-foreground" : "border"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-sm ${currentStep === index ? "font-semibold" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                    {index < steps.length - 1 && <div className="w-8 border-t" />}
                  </div>
                ))}
              </div>
<<<<<<< HEAD
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderStepContent()}
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
                    Back
=======

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
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setCurrentStep(0);
                        setFormErrors({});
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
                        setImagePreview(null);
                        setImageFileName(null);
                      }}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={uploadingImage}>
                      {currentStep === steps.length - 1
                        ? editingProduct
                          ? "Save Product"
                          : "Create Product"
                        : "Next"}
                    </Button>
                  </div>
                </div>
<<<<<<< HEAD
              </form>
            </div>
=======
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
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <BarChart3 className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active listings</p>
              <p className="text-2xl font-bold">
                {products.filter((product) => product.is_available).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Layers className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total inventory</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, product) => sum + (product.quantity || 0), 0).toLocaleString()} {products[0]?.unit || "units"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <DollarSign className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Average price</p>
              <p className="text-2xl font-bold">
                ${
                  products.length
                    ? (products.reduce((sum, product) => sum + (product.price || 0), 0) / products.length).toFixed(2)
                    : "0.00"
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Grid className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Categories covered</p>
              <p className="text-2xl font-bold">
                {new Set(products.map((product) => product.category)).size || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {products.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all-products"
              />
              <Label htmlFor="select-all-products" className="text-sm font-semibold">
                Select all ({selectedProducts.length} selected)
              </Label>
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkToggleAvailability}
                  disabled={bulkLoading}
                >
                  Toggle availability
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                >
                  Delete selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProducts([])} disabled={bulkLoading}>
                  Clear selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.$id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  aria-label={`Select ${product.name}`}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <Badge variant={product.is_available ? "default" : "secondary"}>
                  {product.is_available ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardTitle>{product.name}</CardTitle>
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
                  setCurrentStep(0);
                  setImagePreview(product.image_url || null);
                  setImageFileName(product.image_url ? "Existing image" : null);
                  setFormErrors({});
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
