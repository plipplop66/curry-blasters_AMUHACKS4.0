import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SendHorizontal, Flag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CommentListProps {
  suggestionId: number;
  onReportComment?: (commentId: number) => void;
}

export function CommentList({ suggestionId, onReportComment }: CommentListProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch comments for suggestion
  const { data: comments, isLoading } = useQuery({
    queryKey: ["/api/suggestions", suggestionId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      return res.json();
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/suggestions/${suggestionId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions", suggestionId, "comments"] });
      setNewComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    addCommentMutation.mutate(newComment);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Comments</h4>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{comment.user?.name || "Anonymous"}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  {onReportComment && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => onReportComment(comment.id)}
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No comments yet. Be the first to comment!</p>
      )}
      
      <form className="mt-4" onSubmit={handleSubmitComment}>
        <div className="flex">
          <Input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow px-4 py-2 rounded-l-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:ring-0"
            disabled={addCommentMutation.isPending || !user}
          />
          <Button 
            type="submit" 
            className="bg-primary text-white rounded-r-lg px-4 py-2 font-medium hover:bg-primary/90"
            disabled={addCommentMutation.isPending || !user}
          >
            {addCommentMutation.isPending ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-gray-500 mt-1">Please login to add comments</p>
        )}
      </form>
    </div>
  );
}
