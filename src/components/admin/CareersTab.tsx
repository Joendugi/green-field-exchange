import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, MapPin, 
  Briefcase, DollarSign, Star, Loader2, User, Mail, 
  Phone, FileText, ExternalLink, Clock 
} from "lucide-react";
import { toast } from "sonner";
import { 
  listJobOpenings, createJobOpening, updateJobOpening, 
  deleteJobOpening, toggleJobOpeningActive, JobOpeningRow,
  listJobApplications, updateJobApplicationStatus, deleteJobApplication,
  JobApplicationRow 
} from "@/integrations/supabase/admin";

export const CareersTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpeningRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: jobOpenings = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["admin", "jobOpenings"],
    queryFn: () => listJobOpenings(),
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["admin", "jobApplications"],
    queryFn: () => listJobApplications(),
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const jobData = {
      title: formData.get("title") as string,
      department: formData.get("department") as string,
      location: formData.get("location") as string,
      type: formData.get("type") as string,
      experience: formData.get("experience") as string,
      salary: formData.get("salary") as string,
      description: formData.get("description") as string,
      requirements: (formData.get("requirements") as string).split("\n").filter(r => r.trim()),
      benefits: (formData.get("benefits") as string).split("\n").filter(b => b.trim()),
      is_featured: formData.get("is_featured") === "on",
      is_active: editingJob ? editingJob.is_active : true,
    };

    try {
      if (editingJob) {
        await updateJobOpening(editingJob.id, jobData);
        toast.success("Job opening updated");
      } else {
        await createJobOpening(jobData);
        toast.success("Job opening created");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "jobOpenings"] });
      setIsDialogOpen(false);
      setEditingJob(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save job opening");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job opening?")) return;
    try {
      await deleteJobOpening(id);
      toast.success("Job opening deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "jobOpenings"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete job opening");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleJobOpeningActive(id, !currentStatus);
      toast.success(`Job opening ${!currentStatus ? "activated" : "deactivated"}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "jobOpenings"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleStatusUpdate = async (id: string, status: JobApplicationRow["status"]) => {
    try {
      await updateJobApplicationStatus(id, status);
      toast.success("Application status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "jobApplications"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteJobApplication(id);
      toast.success("Application deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "jobApplications"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete application");
    }
  };

  if (jobsLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="postings">
        <TabsList className="mb-4">
          <TabsTrigger value="postings">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-emerald-500">{applications.filter(a => a.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="postings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Career Management</CardTitle>
                  <CardDescription>Create and manage job openings for the platform</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) setEditingJob(null);
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" /> Add New Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingJob ? "Edit Job Opening" : "Create New Job Opening"}</DialogTitle>
                      <DialogDescription>
                        Fill in the details for the position. Requirements and benefits should be one per line.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Job Title</Label>
                          <Input id="title" name="title" defaultValue={editingJob?.title} required placeholder="e.g. Senior Full Stack Engineer" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Select name="department" defaultValue={editingJob?.department || "Engineering"}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Engineering">Engineering</SelectItem>
                              <SelectItem value="Product">Product</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Customer Success">Customer Success</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" name="location" defaultValue={editingJob?.location} required placeholder="e.g. San Jose, CA or Remote" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salary">Salary Range (Optional)</Label>
                          <Input id="salary" name="salary" defaultValue={editingJob?.salary} placeholder="e.g. $150k - $200k" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Employment Type</Label>
                          <Select name="type" defaultValue={editingJob?.type || "Full-time"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">Experience Level</Label>
                          <Select name="experience" defaultValue={editingJob?.experience || "Mid"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Entry">Entry Level</SelectItem>
                              <SelectItem value="Mid">Mid Level</SelectItem>
                              <SelectItem value="Senior">Senior Level</SelectItem>
                              <SelectItem value="Lead">Lead / Staff</SelectItem>
                              <SelectItem value="Executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Job Description</Label>
                        <Textarea id="description" name="description" defaultValue={editingJob?.description} required rows={3} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="requirements">Requirements (One per line)</Label>
                          <Textarea id="requirements" name="requirements" defaultValue={editingJob?.requirements.join("\n")} required rows={5} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="benefits">Benefits (One per line)</Label>
                          <Textarea id="benefits" name="benefits" defaultValue={editingJob?.benefits.join("\n")} required rows={5} />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={editingJob?.is_featured} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                        <Label htmlFor="is_featured" className="cursor-pointer">Feature this job on top of the list</Label>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingJob ? "Update Position" : "Create Position"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobOpenings.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                    <p className="text-muted-foreground">No job openings found. Create your first listing!</p>
                  </div>
                ) : (
                  jobOpenings.map((job) => (
                    <div key={job.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow ${!job.is_active ? "bg-muted/50 grayscale-[0.5]" : ""}`}>
                      <div className="flex-1 space-y-1 mb-4 md:mb-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-lg">{job.title}</h4>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{job.department}</Badge>
                          {job.is_featured && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              <Star className="h-3 w-3 mr-1 fill-amber-500" /> Featured
                            </Badge>
                          )}
                          {!job.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {job.type}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" /> {job.salary}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleActive(job.id, job.is_active)}
                          title={job.is_active ? "Deactivate" : "Activate"}
                        >
                          {job.is_active ? (
                            <><XCircle className="h-4 w-4 mr-1 text-orange-500" /> Disable</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1 text-emerald-500" /> Enable</>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingJob(job);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>Review resumes and manage candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <User className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                    <p className="text-muted-foreground">No applications received yet.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-lg">{app.full_name}</h4>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Applied for: {app.job_title}</Badge>
                            <Badge className={
                              app.status === 'pending' ? 'bg-yellow-500' :
                              app.status === 'reviewed' ? 'bg-blue-500' :
                              app.status === 'shortlisted' ? 'bg-purple-500' :
                              app.status === 'hired' ? 'bg-emerald-500' : 'bg-red-500'
                            }>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" /> {app.email}
                            </div>
                            {app.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" /> {app.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {new Date(app.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select 
                            value={app.status} 
                            onValueChange={(val) => handleStatusUpdate(app.id, val as any)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteApplication(app.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resume</Label>
                          <a 
                            href={app.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 border rounded-md bg-muted/30 hover:bg-muted transition-colors group"
                          >
                            <FileText className="h-8 w-8 text-emerald-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">View Resume</p>
                              <p className="text-xs text-muted-foreground">Click to open in new tab</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                          </a>
                        </div>
                        {app.cover_letter && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cover Letter / Note</Label>
                            <div className="p-3 border rounded-md bg-muted/10 text-sm max-h-32 overflow-y-auto">
                              {app.cover_letter}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
