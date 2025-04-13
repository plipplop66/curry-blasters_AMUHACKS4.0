import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    async function getLocation() {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        // Optionally get address from coordinates using Google Maps Geocoding API
        // This would require an API key, so we'll just use coordinates for now
        
        const newLocation: Location = {
          lat: latitude,
          lng: longitude
        };
        
        setLocation(newLocation);
        
        // Update user's location on the server
        await fetch("/api/profile/location", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newLocation),
          credentials: "include"
        });
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get location";
        setError(message);
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
        
        // Fallback location (center of map)
        setLocation({
          lat: 40.7128,
          lng: -74.0060,
          address: "Default Location"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    getLocation();
  }, [toast]);
  
  return { location, isLoading, error };
}
