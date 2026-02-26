import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, MessageSquare, Calendar, User, MapPin, Shield, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const VerificationRequestManager = () => {
  const verificationRequests = useQuery(api.admin.listVerificationRequests) || [];
  const handleVerification = useMutation(api.admin.handleVerification);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  const processVerification = async (requestId: Id<"verification_requests">, userId: Id<"users">, approve: boolean) => {
    try {
      await handleVerification({ requestId, approve, notes: notes.trim() || undefined });
      toast.success(approve ? "Verification request approved" : "Verification request rejected");
      setNotesDialogOpen(false);
      setNotes("");
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = verificationRequests.filter(req => req.status === "pending");
  const processedRequests = verificationRequests.filter(req => req.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verification Requests</h2>
          <p className="text-muted-foreground">Review and process user verification requests</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Calendar className="h-3 w-3 mr-1" /> Pending: {pendingRequests.length}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved: {processedRequests.filter(r => r.status === "approved").length}
          </Badge>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              Pending Verification Requests
            </CardTitle>
            <CardDescription>
              Users waiting for verification approval to unlock full platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request._id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{request.profiles?.full_name || "Unknown User"}</h3>
                    <p className="text-sm text-muted-foreground">@{request.profiles?.username || "no-username"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(request._creationTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">User ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">{request.userId}</code>
                    </div>
                    {request.profiles?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>{request.profiles.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Requested:</span>
                      <span>{new Date(request._creationTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Current Status:</span>
                      <span>{request.profiles?.verified ? "Verified" : "Not Verified"}</span>
                    </div>
                  </div>
                </div>

                {(request.documentUrls && request.documentUrls.length > 0) || request.documents ? (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Supporting Documents</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {request.documentUrls?.map((url: string, idx: number) => {
                        const isImage = url.match(/\.(jpg|jpeg|png|webp|gif|svg)$|storage/i);
                        return (
                          <div key={idx} className="group relative rounded-lg border bg-card overflow-hidden transition-all hover:ring-2 hover:ring-primary">
                            <AspectRatio ratio={1 / 1}>
                              {isImage ? (
                                <img src={url} alt={`Doc ${idx + 1}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </AspectRatio>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button size="icon" variant="ghost" className="text-white" asChild>
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        );
                      }) || (
                          <div className="p-3 bg-muted rounded-md text-sm italic col-span-full">
                            {request.documents ? "Legacy document text: " + request.documents : "No documents provided"}
                          </div>
                        )}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Dialog open={notesDialogOpen && selectedRequest?._id === request._id} onOpenChange={(open) => {
                    setNotesDialogOpen(open);
                    if (!open) {
                      setSelectedRequest(null);
                      setNotes("");
                      setAction("approve");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAction("approve");
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Verification Request</DialogTitle>
                        <DialogDescription>
                          Approve verification for {request.profiles?.full_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                        <Textarea
                          id="approval-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes about this approval..."
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => processVerification(request._id, request.userId, true)}
                        >
                          Approve Verification
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={notesDialogOpen && selectedRequest?._id === request._id} onOpenChange={(open) => {
                    setNotesDialogOpen(open);
                    if (!open) {
                      setSelectedRequest(null);
                      setNotes("");
                      setAction("reject");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAction("reject");
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Verification Request</DialogTitle>
                        <DialogDescription>
                          Reject verification for {request.profiles?.full_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="rejection-notes">Rejection Reason *</Label>
                        <Textarea
                          id="rejection-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Please provide a reason for rejection..."
                          className="mt-2"
                          rows={3}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => processVerification(request._id, request.userId, false)}
                          disabled={!notes.trim()}
                        >
                          Reject Verification
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(request);
                      setNotesDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Processed Requests
            </CardTitle>
            <CardDescription>
              Previously processed verification requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedRequests.map((request: any) => (
              <div key={request._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{request.profiles?.full_name || "Unknown User"}</h3>
                    <p className="text-sm text-muted-foreground">@{request.profiles?.username || "no-username"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.updated_at || request._creationTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {request.admin_notes && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-medium">Admin Notes:</span>
                    </div>
                    <p className="text-muted-foreground">{request.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {verificationRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No verification requests found.</p>
          </CardContent>
        </Card>
      )}

      {/* Verification Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Approval Criteria:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete and accurate user profile</li>
                <li>• Valid identification documents</li>
                <li>• Legitimate farming/business information</li>
                <li>• No history of policy violations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Benefits of Verification:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlimited product listings</li>
                <li>• Verified badge on profile</li>
                <li>• Higher visibility in marketplace</li>
                <li>• Access to premium features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationRequestManager;
