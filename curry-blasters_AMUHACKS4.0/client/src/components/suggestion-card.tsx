import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ThumbsUp, MessageSquare, Flag, AlertCircle, Edit, Trash2, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CommentList } from "@/components/comment-list";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SuggestionCardProps {
  suggestion: {
    id: number;
    title: string;
    description: string;
    userId: number;
    status: string;
    upvotes: number;
    downvotes: number;
    location: {
      lat: number;
      lng: number;
      address?: string;
    };
    createdAt: string;
    photoUrl?: string | null;
    rejectionReason?: string | null;
    user?: {
      id: number;
      username: string;
      name: string;
    };
    distance?: number;
  };
  onReport: (suggestionId: number) => void;
  isAdmin?: boolean;
}

export function SuggestionCard({ suggestion, onReport, isAdmin = false }: SuggestionCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get user vote for this suggestion
  const { data: voteData } = useQuery({
    queryKey: ["/api/suggestions", suggestion.id, "vote"],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/suggestions/${suggestion.id}/vote?userId=${user.id}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });
  
  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ isUpvote }: { isUpvote: boolean }) => {
      const res = await apiRequest("POST", `/api/suggestions/${suggestion.id}/vote`, { isUpvote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions", suggestion.id, "vote"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to vote on suggestion",
        variant: "destructive",
      });
    },
  });
  
  // Status update mutation (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, rejectionReason }: { status: string; rejectionReason?: string }) => {
      const res = await apiRequest("PATCH", `/api/suggestions/${suggestion.id}/status`, { status, rejectionReason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Status updated",
        description: "The suggestion status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update suggestion status",
        variant: "destructive",
      });
    },
  });
  
  // Delete suggestion mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/suggestions/${suggestion.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Suggestion deleted",
        description: "Your suggestion has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete suggestion",
        variant: "destructive",
      });
    },
  });
  
  const handleVote = (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate({ isUpvote });
  };
  
  const handleStatusChange = (status: string) => {
    let rejectionReason: string | undefined;
    
    if (status === "REJECTED") {
      rejectionReason = prompt("Please provide a reason for rejection:");
      if (rejectionReason === null) return; // User canceled
    }
    
    updateStatusMutation.mutate({ status, rejectionReason });
  };
  
  const getStatusBadge = () => {
    switch (suggestion.status) {
      case "ACTIVE":
        return <Badge className="bg-blue-500">Active</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "DONE":
        return <Badge className="bg-green-500">Done</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return null;
    }
  };
  
  const formatDistance = (distance?: number) => {
    if (!distance) return "Unknown distance";
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m Away`;
    }
    return `${Math.round(distance)}km Away`;
  };
  
  const isOwner = user?.id === suggestion.userId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-4 relative overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-xl font-semibold text-[#FF5252] dark:text-[#FF7F7F]">
              {suggestion.user?.name || "Anonymous"}
            </h3>
            {getStatusBadge()}
          </div>
          
          {(isAdmin || isOwner) && (
            <div className="flex space-x-2">
              {isOwner && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#FFB4A2] text-white text-sm font-medium rounded-full"
                  >
                    <Edit className="h-3 w-3 mr-1" /> EDIT
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-red-500 text-white text-sm font-medium rounded-full"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> DELETE
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your suggestion. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate()} 
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              
              {isAdmin && (
                <div className="relative group">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#FFB4A2] text-white text-sm font-medium rounded-full"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" /> STATUS CONTROL
                  </Button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1 flex flex-col">
                      <Button 
                        variant="ghost" 
                        className="justify-start" 
                        onClick={() => handleStatusChange("ACTIVE")}
                      >
                        Set to Active
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start" 
                        onClick={() => handleStatusChange("IN_PROGRESS")}
                      >
                        Set to In Progress
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start" 
                        onClick={() => handleStatusChange("DONE")}
                      >
                        Set to Done
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="justify-start" 
                        onClick={() => handleStatusChange("REJECTED")}
                      >
                        Set to Rejected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-3">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">{suggestion.title}</h4>
            <p className="text-gray-600 dark:text-gray-300">{suggestion.description}</p>
            
            {suggestion.photoUrl && (
              <div className="mt-3 max-h-[300px] overflow-hidden rounded-lg">
                <img 
                  src={suggestion.photoUrl} 
                  alt={suggestion.title}
                  className="w-full object-cover"
                />
              </div>
            )}
            
            {suggestion.status === "REJECTED" && suggestion.rejectionReason && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-semibold">Rejected reason:</span> {suggestion.rejectionReason}
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-64 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <iframe
              title={`Location for ${suggestion.title}`}
              width="100%"
              height="100%"
              frameBorder="0" 
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${suggestion.location.lat},${suggestion.location.lng}&z=15&output=embed`}
              allowFullScreen
            ></iframe>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-gray-500 ${voteData?.vote?.isUpvote ? "text-[#FF5252]" : ""}`}
              onClick={() => handleVote(true)}
            >
              <ThumbsUp className="h-5 w-5" />
              {suggestion.upvotes > 0 && (
                <span className="ml-1">{suggestion.upvotes}</span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-gray-500 ${voteData?.vote?.isUpvote === false ? "text-blue-500" : ""}`}
              onClick={() => handleVote(false)}
            >
              <ThumbsDown className="h-5 w-5" />
              {suggestion.downvotes > 0 && (
                <span className="ml-1">{suggestion.downvotes}</span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-red-500"
              onClick={() => onReport(suggestion.id)}
            >
              <Flag className="h-5 w-5" />
            </Button>
          </div>
          
          <span className="text-sm text-gray-500">{formatDistance(suggestion.distance)}</span>
        </div>
        
        {showComments && (
          <CommentList suggestionId={suggestion.id} />
        )}
      </div>
    </div>
  );
}
