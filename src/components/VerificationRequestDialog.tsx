import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createVerificationRequest } from "@/integrations/supabase/admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, X, Upload, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VerificationRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const VerificationRequestDialog = ({ open, onOpenChange }: VerificationRequestDialogProps) => {

    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(file => {
                const isValid = file.type === "application/pdf" || file.type.startsWith("image/");
                if (!isValid) toast.error(`${file.name} is not a valid format (PDF or Image)`);
                return isValid;
            });
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            toast.error("Please upload at least one document");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const documentUrls = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Create a unique file name
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `verifications/${fileName}`;

                // Upload to Supabase Storage
                // We assume there's a bucket named `verification_documents` or general `uploads`
                // Let's use `verification_documents` for this example
                const { error: uploadError, data } = await supabase.storage
                    .from("verification_documents")
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Upload failed", uploadError);
                    toast.error(`Failed to upload ${file.name}`);
                    continue; // Skip failed uploads but continue with others
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from("verification_documents")
                    .getPublicUrl(filePath);

                documentUrls.push(publicUrl);

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }

            if (documentUrls.length === 0) {
               throw new Error("No files were successfully uploaded");
            }

            // 3. Create verification request
            await createVerificationRequest(documentUrls);

            toast.success("Verification request submitted successfully!");
            onOpenChange(false);
            setFiles([]);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Farmer Verification</DialogTitle>
                    <DialogDescription>
                        Upload your documents (ID, Farming Permit, or Business License) to unlock high-volume trading.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer relative">
                        <Input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click or drag to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG (max 5MB each)</p>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            <Label>Selected Documents ({files.length})</Label>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-xs truncate font-medium">{file.name}</span>
                                            <span className="text-[10px] text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFile(idx)}
                                            disabled={isUploading}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between text-xs">
                                <span>Uploading documents...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5" />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isUploading || files.length === 0}>
                        {isUploading ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VerificationRequestDialog;
