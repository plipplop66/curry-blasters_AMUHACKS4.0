import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Flame, Clock, Filter, Phone, Mail, RefreshCw } from "lucide-react";
import { ResetDbButton } from "@/components/reset-db-button";
import { Header } from "@/components/layout/header";
import { SuggestionCard } from "@/components/suggestion-card";
import { NewSuggestionModal } from "@/components/modals/new-suggestion-modal";
import { ReportModal } from "@/components/modals/report-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/hooks/use-location";
import { useAuth } from "@/hooks/use-auth";
import { WaveBackground } from "@/components/ui/wave-background";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SortOption = "newest" | "hot" | "distance";

interface Suggestion {
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
  user?: {
    id: number;
    username: string;
    name: string;
  };
  distance?: number;
}

export default function HomePage() {
  const [isNewSuggestionModalOpen, setIsNewSuggestionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [radiusKm, setRadiusKm] = useState(50);
  
  const { user } = useAuth();
  const { location } = useLocation();
  
  // Fetch suggestions
  const { data: suggestions, isLoading, refetch } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions", location?.lat, location?.lng, radiusKm],
    queryFn: async () => {
      let url = "/api/suggestions";
      if (location?.lat && location?.lng) {
        url += `?lat=${location.lat}&lng=${location.lng}&radius=${radiusKm}`;
      }
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      return res.json();
    },
    enabled: !!location,
  });
  
  // Refetch when sort option changes
  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [radiusKm, location, refetch]);
  
  const handleReportClick = (suggestionId: number) => {
    setSelectedSuggestionId(suggestionId);
    setIsReportModalOpen(true);
  };
  
  // Sort suggestions
  const getSortedSuggestions = (suggestions?: Suggestion[]): Suggestion[] => {
    if (!suggestions) return [];
    
    const filtered = suggestions.filter((suggestion) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        suggestion.title?.toLowerCase().includes(searchLower) ||
        suggestion.description?.toLowerCase().includes(searchLower) ||
        suggestion.user?.name?.toLowerCase().includes(searchLower)
      );
    });
    
    return [...filtered].sort((a, b) => {
      if (sortOption === "hot") {
        // Sort by votes (upvotes - downvotes)
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      } else if (sortOption === "distance" && a.distance !== undefined && b.distance !== undefined) {
        // Sort by distance
        return a.distance - b.distance;
      } else {
        // Default: sort by newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };
  
  const filteredSuggestions = getSortedSuggestions(suggestions);
  
  return (
    <WaveBackground>
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row">
          {/* Suggestions Feed */}
          <div className="w-full lg:w-2/3 lg:pr-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion: any) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onReport={handleReportClick}
                  isAdmin={user?.isAdmin}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No suggestions found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {searchQuery
                    ? "No suggestions match your search criteria."
                    : "Be the first to suggest an improvement for your area!"}
                </p>
                <Button
                  className="mt-4 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => setIsNewSuggestionModalOpen(true)}
                >
                  Post a Suggestion
                </Button>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="w-full lg:w-1/3 lg:pl-6 mt-6 lg:mt-0">
            {/* Search & Filter */}
            <div className="bg-[#FFB4A2]/20 dark:bg-[#FFB4A2]/10 rounded-xl p-4 mb-6">
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-full bg-white dark:bg-gray-800 border-transparent focus:border-primary"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={sortOption === "newest" ? "default" : "outline"}
                    className={`flex items-center justify-center ${sortOption === "newest" ? "bg-primary text-white" : ""}`}
                    onClick={() => setSortOption("newest")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xs">Newest</span>
                  </Button>
                  <Button 
                    variant={sortOption === "hot" ? "default" : "outline"}
                    className={`flex items-center justify-center ${sortOption === "hot" ? "bg-[#FF7F7F] text-white" : ""}`}
                    onClick={() => setSortOption("hot")}
                  >
                    <Flame className="h-4 w-4 mr-1" />
                    <span className="text-xs">Hot</span>
                  </Button>
                </div>
              </div>
              
              {/* Location Radius Slider */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Radius: {radiusKm} km
                  </label>
                </div>
                <Slider
                  value={[radiusKm]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => setRadiusKm(value[0])}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 font-medium"
                onClick={() => setIsNewSuggestionModalOpen(true)}
              >
                Post a Suggestion
              </Button>
              
              <Button
                className="w-full bg-[#FF7F7F] hover:bg-[#FF5252] text-white rounded-xl py-3 font-medium"
                onClick={() => setIsReportModalOpen(true)}
              >
                Report Issue
              </Button>
            </div>
            
            {/* Location Map */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Your Location</h3>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48 overflow-hidden relative">
                {location ? (
                  <iframe
                    title="Your location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=14&output=embed`}
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {location?.address || 'Getting your location...'}
              </p>
            </div>
            
            {/* Contact Us */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Contact Us</h3>
                {user?.isAdmin && <ResetDbButton />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Have questions or suggestions about the platform? We'd love to hear from you!
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>1234567890</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>curryblasters@gmail.com</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "mailto:curryblasters@gmail.com"}
              >
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      <NewSuggestionModal
        isOpen={isNewSuggestionModalOpen}
        onClose={() => setIsNewSuggestionModalOpen(false)}
      />
      
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        suggestionId={selectedSuggestionId || undefined}
      />
    </WaveBackground>
  );
}
