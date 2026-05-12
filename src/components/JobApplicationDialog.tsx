import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, FileText, CheckCircle } from "lucide-react";
import { uploadFile } from "@/integrations/supabase/storage";
import { submitJobApplication } from "@/integrations/supabase/admin";

interface JobApplicationDialogProps {
  job: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobApplicationDialog = ({ job, open, onOpenChange }: JobApplicationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!job) return;
    if (!resumeFile) {
      toast.error("Please upload your resume");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // 1. Upload Resume
      const { publicUrl } = await uploadFile("resumes", resumeFile);
      
      // 2. Submit Application
      await submitJobApplication({
        job_id: job.id,
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        resume_url: publicUrl,
        cover_letter: formData.get("cover_letter") as string,
      });

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit application. Ensure 'resumes' bucket exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setIsSubmitted(false);
          setResumeFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Application Received!</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Thank you for applying for the <strong>{job?.title}</strong> position. 
              Our team will review your application and get back to you soon.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button onClick={() => onOpenChange(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            Please fill out the form below to submit your application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
          </div>

          <div className="space-y-2">
            <Label>Resume (PDF or DOCX)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${resumeFile ? "border-emerald-500 bg-emerald-50/50" : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"}`}
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              {resumeFile ? (
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-emerald-600 mb-2" />
                  <p className="font-medium text-emerald-800">{resumeFile.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Upload className="h-10 w-10 mb-2" />
                  <p className="font-medium">Click to upload resume</p>
                  <p className="text-xs">Supports PDF, DOCX (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_letter">Cover Letter / Why should we hire you?</Label>
            <Textarea 
              id="cover_letter" 
              name="cover_letter" 
              rows={4} 
              placeholder="Tell us a bit about yourself and why you're a great fit for this role..."
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
