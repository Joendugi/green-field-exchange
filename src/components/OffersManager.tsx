import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, MessageSquare, Check, X, ArrowRight, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const OffersManager = () => {
    const { role } = useAuth();
    const offers = useQuery(api.offers.listByRole, { role: role === "farmer" ? "farmer" : "buyer" });
    const respondMutation = useMutation(api.offers.respond);
    const checkoutMutation = useMutation(api.offers.finalizeCheckout);

    const [counterAmount, setCounterAmount] = useState("");
    const [counterMessage, setCounterMessage] = useState("");
    const [checkoutAddress, setCheckoutAddress] = useState("");
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);

    const handleRespond = async (offerId: any, status: string, amount?: number) => {
        try {
            await respondMutation({
                offerId,
                status,
                amount_per_unit: amount,
                message: status === "countered" ? counterMessage : undefined,
            });
            toast.success(`Offer ${status}!`);
            setCounterAmount("");
            setCounterMessage("");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCheckout = async () => {
        if (!selectedOffer || !checkoutAddress) return;
        try {
            await checkoutMutation({
                offerId: selectedOffer._id,
                delivery_address: checkoutAddress,
            });
            toast.success("Order finalized! Redirecting to orders...");
            setIsCheckoutOpen(false);
            setCheckoutAddress("");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (offers === undefined) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Negotiations</h2>
                    <p className="text-muted-foreground">Manage your price offers and agreed deals.</p>
                </div>
                <Badge variant="outline" className="px-4 py-1">
                    {offers.length} Active {offers.length === 1 ? 'deal' : 'deals'}
                </Badge>
            </div>

            <div className="grid gap-6">
                {offers.map((offer: any) => (
                    <Card key={offer._id} className={offer.status === 'accepted' ? "border-emerald-200 bg-emerald-50/20" : ""}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                        {offer.product?.image_url ? (
                                            <img src={offer.product.image_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{offer.product?.name}</CardTitle>
                                        <CardDescription>
                                            {role === 'farmer' ? `Buyer: ${offer.buyerName}` : `Farmer: ${offer.farmerName}`}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'} className="capitalize">
                                    {offer.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Negotiated Price</p>
                                    <p className="text-xl font-bold text-primary">${offer.amount_per_unit}/{offer.product?.unit}</p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                                    <p className="text-xl font-bold">{offer.quantity} {offer.product?.unit}</p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Total Agreed</p>
                                    <p className="text-xl font-bold text-emerald-600">${(offer.quantity * offer.amount_per_unit).toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Last Action</p>
                                    <p className="text-sm font-semibold capitalize">{offer.last_offered_by === offer.farmerId ? 'Farmer' : 'Buyer'} Update</p>
                                </div>
                            </div>

                            {offer.message && (
                                <div className="flex gap-2 items-start bg-background p-3 rounded-lg border">
                                    <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                                    <p className="text-sm italic text-muted-foreground">"{offer.message}"</p>
                                </div>
                            )}

                            {offer.status === 'pending' && (
                                <div className="pt-2 border-t flex flex-col md:flex-row gap-4 items-center">
                                    {/* Only show response buttons if they aren't the one who made the last offer */}
                                    {((role === 'farmer' && offer.last_offered_by !== offer.farmerId) ||
                                        (role === 'buyer' && offer.last_offered_by !== offer.buyerId)) ? (
                                        <>
                                            <Button size="sm" className="bg-emerald-600 w-full md:w-auto" onClick={() => handleRespond(offer._id, "accepted")}>
                                                <Check className="mr-2 h-4 w-4" /> Accept Price
                                            </Button>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="w-full md:w-auto">
                                                        <Handshake className="mr-2 h-4 w-4" /> Counter-Offer
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Make a Counter-Offer</DialogTitle>
                                                        <DialogDescription>Suggest a new price to {role === 'farmer' ? 'the buyer' : 'the farmer'}.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Counter Price (per {offer.product?.unit})</Label>
                                                            <Input
                                                                type="number"
                                                                value={counterAmount}
                                                                onChange={(e) => setCounterAmount(e.target.value)}
                                                                placeholder={offer.amount_per_unit.toString()}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Note</Label>
                                                            <Textarea
                                                                placeholder="Reason for your price suggest..."
                                                                value={counterMessage}
                                                                onChange={(e) => setCounterMessage(e.target.value)}
                                                            />
                                                        </div>
                                                        <Button
                                                            className="w-full"
                                                            onClick={() => handleRespond(offer._id, "countered", parseFloat(counterAmount))}
                                                            disabled={!counterAmount}
                                                        >
                                                            Send Counter
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button size="sm" variant="destructive" className="w-full md:w-auto" onClick={() => handleRespond(offer._id, "rejected")}>
                                                <X className="mr-2 h-4 w-4" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 italic">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Waiting for {role === 'farmer' ? 'Buyer' : 'Farmer'} to respond...
                                        </div>
                                    )}
                                </div>
                            )}

                            {offer.status === 'accepted' && role === 'buyer' && (
                                <div className="pt-2 border-t flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <div>
                                        <p className="text-emerald-800 font-bold flex items-center gap-2">
                                            <Check className="h-5 w-5" /> Price Agreed!
                                        </p>
                                        <p className="text-xs text-emerald-600">Finalize your order to lock in this stock.</p>
                                    </div>
                                    <Button size="sm" className="bg-emerald-600" onClick={() => { setSelectedOffer(offer); setIsCheckoutOpen(true); }}>
                                        Checkout Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {offer.status === 'accepted' && role === 'farmer' && (
                                <div className="pt-2 border-t text-sm text-emerald-600 font-medium italic">
                                    Price accepted! Waiting for buyer to finalize the checkout...
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {offers.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed rounded-2xl">
                        <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">No Active Negotiations</h3>
                        <p className="text-muted-foreground">Prices you've bargained for will appear here.</p>
                    </div>
                )}
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalize Your Deal</DialogTitle>
                        <DialogDescription>
                            Enter your delivery address to complete the order at the negotiated price.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/40 rounded-xl space-y-2">
                            <div className="flex justify-between">
                                <span>Agreed Price:</span>
                                <span className="font-bold">${selectedOffer?.amount_per_unit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Quantity:</span>
                                <span className="font-bold">{selectedOffer?.quantity} units</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-lg">
                                <span>Total:</span>
                                <span className="font-bold text-primary">${(selectedOffer?.quantity * selectedOffer?.amount_per_unit || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Delivery Address</Label>
                            <Textarea
                                placeholder="Where should we deliver?"
                                value={checkoutAddress}
                                onChange={(e) => setCheckoutAddress(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleCheckout} disabled={!checkoutAddress}>
                            Confirm & Create Order
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OffersManager;
