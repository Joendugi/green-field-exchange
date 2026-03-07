import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkInventoryManagerProps {
    selectedIds: string[];
    onComplete: () => void;
}

const BulkInventoryManager = ({ selectedIds, onComplete }: BulkInventoryManagerProps) => {
    const bulkUpdate = useMutation(api.products.bulkUpdate);
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [changes, setChanges] = useState({
        price: "",
        quantity: "",
        is_available: "keep" as "keep" | "active" | "inactive",
        location: ""
    });

    const handleBulkUpdate = async () => {
        if (selectedIds.length === 0) return;

        setIsUpdating(true);
        try {
            const updatePayload: any = {};
            if (changes.price) updatePayload.price = parseFloat(changes.price);
            if (changes.quantity) updatePayload.quantity = parseFloat(changes.quantity);
            if (changes.is_available !== "keep") updatePayload.is_available = changes.is_available === "active";
            if (changes.location) updatePayload.location = changes.location;

            if (Object.keys(updatePayload).length === 0) {
                toast.error("No changes selected");
                setIsUpdating(false);
                return;
            }

            await bulkUpdate({
                ids: selectedIds as Id<"products">[],
                changes: updatePayload
            });

            toast.success(`Successfully updated ${selectedIds.length} products`);
            setIsOpen(false);
            onComplete();
        } catch (error: any) {
            toast.error(error.message || "Failed to update products");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                    <Layers className="h-4 w-4" />
                    Bulk Edit ({selectedIds.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Bulk Inventory Management
                    </DialogTitle>
                    <DialogDescription>
                        Apply changes to {selectedIds.length} selected items. Leave fields blank to keep existing values.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="e.g. 5.99"
                                className="col-span-3"
                                value={changes.price}
                                onChange={(e) => setChanges({ ...changes, price: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Stock</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="New quantity"
                                className="col-span-3"
                                value={changes.quantity}
                                onChange={(e) => setChanges({ ...changes, quantity: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <Select 
                                value={changes.is_available} 
                                onValueChange={(val: any) => setChanges({ ...changes, is_available: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="keep">Keep Current</SelectItem>
                                    <SelectItem value="active">Set Active</SelectItem>
                                    <SelectItem value="inactive">Set Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input
                                id="location"
                                placeholder="New location"
                                className="col-span-3"
                                value={changes.location}
                                onChange={(e) => setChanges({ ...changes, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-xs text-amber-800">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>This will overwrite the current values for all {selectedIds.length} items. This action cannot be easily undone.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUpdating}>
                        Cancel
                    </Button>
                    <Button onClick={handleBulkUpdate} disabled={isUpdating}>
                        {isUpdating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Apply Changes
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkInventoryManager;
