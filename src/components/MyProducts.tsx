import { useState, useEffect } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "@/integrations/supabase/profiles";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Package, Lightbulb, BarChart3, Layers, DollarSign, Grid, X, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProducts, createProduct, updateProduct, deleteProduct, predictPrice } from "@/integrations/supabase/products";
import VerificationRequestDialog from "./VerificationRequestDialog";
import BulkInventoryManager from "./BulkInventoryManager";
import { Checkbox } from "@/components/ui/checkbox";

type PricePrediction = {
  suggested_price?: number;
  confidence?: string;
};

const MyProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Supabase products
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const result = await getMyProducts();
        setProducts(result);
      } catch (e) {
        console.error("Failed to load my products", e);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    void load();
  }, []);

  const isSupabaseOnly = import.meta.env.MODE === "supabase-only";

  // Supabase Data
  const { data: profile } = useSupabaseQuery<any>(
    ["profile", user?.id],
    () => getUserProfile(user?.id as string),
    { enabled: !!user?.id }
  );

  const isVerified = profile?.verified || false;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
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
    image_storage_id: "",
    expiry_date: "",
    currency: "$",
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDragActive, setIsDragActive] = useState(false);

  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAiAssistantEnabled(parsed.ai_assistant_enabled ?? true);
      } catch (e) {
        // use default
      }
    }
  }, []);

  const steps = ["Details", "Pricing", "Media & Review"];

  const handleUploadMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
       .from("product_images")
       .upload(filePath, file);

    if (uploadError) {
       console.error("Upload failed", uploadError);
       throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from("product_images")
        .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!profile) return;

    // Check limits
    if (!editingProduct && !isVerified && products.length >= 5) {
      setVerificationDialogOpen(true);
      return;
    }

    setIsUploading(true);
    let imageUrl = formData.image_url;
    
    if (mediaFile) {
        try {
            imageUrl = await handleUploadMedia(mediaFile);
        } catch (error: any) {
            toast.error("Failed to upload image.");
            setIsUploading(false);
            return;
        }
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        location: formData.location,
        category: formData.category,
        image_url: imageUrl || null,
        expiry_date: formData.expiry_date || null,
        currency: formData.currency,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success("Product updated successfully!");
        // Refresh list
        const updated = await getMyProducts();
        setProducts(updated);
      } else {
        await createProduct(productData);
        toast.success("Product added successfully!");
        // Refresh list
        const updated = await getMyProducts();
        setProducts(updated);
      }

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
        image_storage_id: "",
        expiry_date: "",
        currency: "$",
      });
      setFormErrors({});
      setCurrentStep(0);
    } catch (error: unknown) {
      toast.error(`Error saving product: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getPricePrediction = async () => {
    // if (!aiAssistantEnabled) { ... } // Re-enable check if setting exists

    if (!formData.category || !formData.location) {
      toast.error("Please select category and location first");
      return;
    }

    try {
      setIsLoadingPrediction(true);

      const prediction = await predictPrice({
        category: formData.category,
        location: formData.location
      });

      setPricePrediction(prediction);
    } catch (error: unknown) {
      toast.error("Failed to get price prediction");
      console.error(error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully!");
      // Refresh list
      const updated = await getMyProducts();
      setProducts(updated);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      await updateProduct(product.id, { is_available: !product.is_available });
      toast.success(`Product ${!product.is_available ? 'activated' : 'deactivated'} successfully!`);
      // Refresh list
      const updated = await getMyProducts();
      setProducts(updated);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Skip bulk actions for now to simplify

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
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

    if (stepIndex === 2 && !formData.image_url && !mediaFile && !mediaPreview) {
      errors.image_url = "Add an image for better visibility";
      setFormErrors((prev) => ({ ...prev, ...errors }));
    }

    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    await handleSubmit();
  };

  const handlePreviousStep = () => {
    if (currentStep === 0) return;
    setCurrentStep((prev) => prev - 1);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
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

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Clear URL if file selected
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tell buyers what makes this product special. Listings with rich details convert up to 35% better.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  required
                />
                {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
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
              {formErrors.description && <p className="text-sm text-destructive mt-1">{formErrors.description}</p>}
            </div>
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
                {formErrors.price && <p className="text-sm text-destructive mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleFieldChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="€">€ (EUR)</SelectItem>
                    <SelectItem value="£">£ (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange("quantity", e.target.value)}
                />
                {formErrors.quantity && <p className="text-sm text-destructive mt-1">{formErrors.quantity}</p>}
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => handleFieldChange("unit", e.target.value)}
                  placeholder="kg, lbs, crates, etc"
                />
                {formErrors.unit && <p className="text-sm text-destructive mt-1">{formErrors.unit}</p>}
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="City, Region"
              />
              {formErrors.location && <p className="text-sm text-destructive mt-1">{formErrors.location}</p>}
            </div>
            <div>
              <Label>Expiry Date (Best Before/End of Sale)</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleFieldChange("expiry_date", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">This product will be hidden from the marketplace after this date.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>AI Price Suggestion</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getPricePrediction}
                  disabled={isLoadingPrediction || !formData.category || !formData.location || !aiAssistantEnabled}
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
          </div >
        );
      case 2:
        return (
          <div className="space-y-4">
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Label className="cursor-pointer inline-flex flex-col gap-2">
                Drag & drop product images here or
                <Input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploading} />
                <span className="text-primary text-sm font-semibold">Browse files</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">PNG or JPG up to 5MB.</p>
              {mediaFile && <p className="text-xs text-muted-foreground mt-1">Selected: {mediaFile.name}</p>}
            </div>

            {(mediaPreview || formData.image_url) && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-semibold mb-2">Preview</p>
                <div className="relative w-full max-h-64 bg-background/60 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={mediaPreview || formData.image_url}
                    alt={formData.name ? `Preview of ${formData.name}` : "Product preview"}
                    className="max-h-64 w-full object-contain"
                  />
                  {mediaPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      aria-label="Remove selected image"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label>Or paste image URL</Label>
              <Input
                placeholder="https://example.com/your-product.jpg"
                value={formData.image_url}
                onChange={(e) => handleFieldChange("image_url", e.target.value)}
                disabled={!!mediaFile}
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to manage your products</h2>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">My Products</h2>
          {!isVerified && (
            <p className="text-sm text-muted-foreground mt-1">
              Unverified: {products.length}/5 products added.
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
          <div className="flex gap-2 w-full sm:w-auto">
            {products.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <Checkbox 
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts(products.map(p => p.id));
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">Select All</span>
              </div>
            )}
            {selectedProducts.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedProducts([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
            <BulkInventoryManager 
              selectedIds={selectedProducts} 
              onComplete={() => setSelectedProducts([])} 
            />
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto"
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
                    image_storage_id: "",
                    expiry_date: "",
                    currency: "$",
                  });
                  setCurrentStep(0);
                  setMediaFile(null);
                  setMediaPreview("");
                  setFormErrors({});
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update your product details" : "Create a new product listing"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="flex items-center gap-3 justify-center mb-6">
                {steps.map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === index ? "bg-primary text-primary-foreground" : "border"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-xs ${currentStep === index ? "font-semibold" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                    {index < steps.length - 1 && <div className="w-8 border-t" />}
                  </div>
                ))}
              </div>

              {renderStepContent()}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
                  Back
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {currentStep === steps.length - 1
                    ? isUploading ? "Saving..." : (editingProduct ? "Update Product" : "Create Product")
                    : "Next"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statistics Cards */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active</p>
              <p className="text-xl font-bold">
                {products.filter((product) => product.is_available).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <Layers className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inventory</p>
              <p className="text-xl font-bold truncate">
                {products.reduce((sum, product) => sum + (product.quantity || 0), 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{products[0]?.unit || "units"}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Avg Price</p>
              <p className="text-xl font-bold">
                ${
                  products.length
                    ? (products.reduce((sum, product) => sum + (product.price || 0), 0) / products.length).toFixed(2)
                    : "0.00"
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-indigo-500/10">
              <Grid className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Categories</p>
              <p className="text-xl font-bold">
                {new Set(products.map((product) => product.category)).size || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedProducts.includes(product.id)} 
                    onCheckedChange={() => toggleProductSelection(product.id)}
                  />
                  <Badge variant={product.is_available ? "default" : "secondary"}>
                    {product.is_available ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
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
                {product.expiry_date && (
                  <div className="flex justify-between text-destructive">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium underline decoration-dotted">
                      {new Date(product.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
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
                    image_storage_id: product.image_storage_id || "",
                    expiry_date: product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : "",
                    currency: product.currency || "$",
                  });
                  setCurrentStep(0);
                  setMediaFile(null);
                  setMediaPreview(product.image_url || "");
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
                className={product.is_available ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-600"}
              >
                {product.is_available ? "Active" : "Inactive"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                aria-label={`Delete ${product.name}`}
                onClick={() => handleDelete(product.id)}
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
          <p className="text-lg text-muted-foreground">
            {!profile
              ? "Sign in to manage your products and start selling!"
              : "No products yet. Add your first product!"}
          </p>
          {!profile && (
            <Button className="mt-4">
              Sign In to Start Selling
            </Button>
          )}
        </div>
      )}

      <VerificationRequestDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
      />
    </div>
  );
};

export default MyProducts;
