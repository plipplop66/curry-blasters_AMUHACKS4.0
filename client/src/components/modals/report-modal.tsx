import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestionId?: number;
  commentId?: number;
}

export function ReportModal({ isOpen, onClose, suggestionId, commentId }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async (data: { 
      reason: string; 
      description: string; 
      photoUrl?: string;
      suggestionId?: number; 
      commentId?: number 
    }) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Report submitted",
        description: "Thank you for helping to keep our community safe.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that either suggestionId or commentId is provided
    if (!suggestionId && !commentId) {
      toast({
        title: "Error",
        description: "Missing content to report.",
        variant: "destructive",
      });
      return;
    }
    
    reportMutation.mutate({
      reason,
      description,
      photoUrl,
      suggestionId,
      commentId,
    });
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    setPhotoUrl("");
    setPhotoPreview("");
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation for file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "Error",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create a URL for preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 for storage (or use another storage method in production)
    const reader2 = new FileReader();
    reader2.onload = () => {
      setPhotoUrl(reader2.result as string);
    };
    reader2.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl z-10 w-full max-w-md p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Report an Issue</h3>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type:
              </label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Content Issues</SelectLabel>
                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="misleading">Misleading Information</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="violent">Violence or Threats</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Urban Planning Issues</SelectLabel>
                    <SelectItem value="duplicate">Duplicate Suggestion</SelectItem>
                    <SelectItem value="unfeasible">Technically Unfeasible</SelectItem>
                    <SelectItem value="incorrect_location">Incorrect Location</SelectItem>
                    <SelectItem value="private_property">Private Property Concern</SelectItem>
                    <SelectItem value="legal_issue">Legal or Zoning Issue</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectItem value="other">Other Issue</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description:
              </label>
              <Textarea 
                id="report-description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4} 
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add Evidence (optional):
              </label>
              <Input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="mt-1 flex items-center">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                {photoPreview && (
                  <div className="ml-4 w-16 h-16 relative border rounded overflow-hidden">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              {!photoPreview && (
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Add a screenshot or photo as evidence (optional)
                </p>
              )}
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full bg-[#CC2121] hover:bg-[#AA0000] text-white rounded-lg py-3 font-medium"
                disabled={reportMutation.isPending}
              >
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
