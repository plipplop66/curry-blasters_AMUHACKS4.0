import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { Menu, Moon, Sun } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`py-4 font-medium ${location === "/" ? "border-b-2 border-[#CC2121] text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
            Posts
          </Link>
          <Link href="/?filter=hot" className={`py-4 font-medium ${location === "/?filter=hot" ? "border-b-2 border-[#CC2121] text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
            HOT
          </Link>
          <Link href="/?filter=locations" className={`py-4 font-medium ${location === "/?filter=locations" ? "border-b-2 border-[#CC2121] text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
            Locations
          </Link>
        </nav>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
          
          <Button 
            className="bg-[#FF7F7F] hover:bg-[#FF5252] text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Contact us
          </Button>
          
          {user ? (
            <Button 
              variant="ghost"
              className="text-gray-600 hover:text-[#CC2121] text-sm font-medium"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Link href="/auth">
              <Button
                variant="ghost" 
                className="text-gray-600 hover:text-[#CC2121] text-sm font-medium"
              >
                Login
              </Button>
            </Link>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 py-2 px-4 shadow-inner">
          <nav className="flex flex-col space-y-3">
            <Link href="/" className={`py-2 font-medium ${location === "/" ? "text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
              Posts
            </Link>
            <Link href="/?filter=hot" className={`py-2 font-medium ${location === "/?filter=hot" ? "text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
              HOT
            </Link>
            <Link href="/?filter=locations" className={`py-2 font-medium ${location === "/?filter=locations" ? "text-[#CC2121]" : "text-gray-500 hover:text-[#CC2121]"}`}>
              Locations
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
