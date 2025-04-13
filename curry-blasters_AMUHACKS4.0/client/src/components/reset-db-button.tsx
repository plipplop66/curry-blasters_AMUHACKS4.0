import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function ResetDbButton() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the database? This will clear all data and reload with demo data.")) {
      return;
    }
    
    setIsResetting(true);
    try {
      const response = await fetch("/api/reset-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset the database");
      }
      
      // Reload the page after reset
      toast({
        title: "Database reset successful",
        description: "The page will reload in 2 seconds...",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error resetting database:", error);
      toast({
        title: "Error",
        description: "Failed to reset the database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="text-xs"
    >
      {isResetting ? "Resetting..." : "Reset Demo Data"}
    </Button>
  );
}