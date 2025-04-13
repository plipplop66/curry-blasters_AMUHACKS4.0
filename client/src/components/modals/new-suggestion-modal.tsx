import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/use-location";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface NewSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewSuggestionModal({ isOpen, onClose }: NewSuggestionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { location, isLoading: locationLoading } = useLocation();

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; location: any; photoUrl?: string }) => {
      const res = await apiRequest("POST", "/api/suggestions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Success!",
        description: "Your suggestion has been submitted.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Error",
        description: "Location is required. Please enable location services.",
        variant: "destructive",
      });
      return;
    }
    
    createSuggestionMutation.mutate({
      title,
      description,
      location,
      photoUrl: photoPreview || undefined,
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPhoto(null);
    setPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl z-10 w-full max-w-md p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">New Suggestion</h3>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title:
              </label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary" 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description:
              </label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4} 
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Photo (optional):
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input 
                  type="file" 
                  id="photo" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                />
                
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2" 
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="photo" className="cursor-pointer block">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click to upload an image</p>
                  </label>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location:
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  {locationLoading 
                    ? "Detecting your location..." 
                    : location 
                      ? (location.address || `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`) 
                      : "Enable location services"}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 font-medium"
                disabled={createSuggestionMutation.isPending || locationLoading}
              >
                {createSuggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
