import { storage } from './storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { SuggestionStatus } from '@shared/schema';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDemoData() {
  try {
    console.log("Seeding demo data...");
    
    // Check if we already have data
    const existingSuggestions = await storage.getSuggestionsByStatus("ACTIVE" as SuggestionStatus);
    if (existingSuggestions.length > 0) {
      console.log("Demo data already exists, skipping seed");
      return;
    }
    
    // Create admin user
    const adminUser = await storage.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      name: "Admin User",
      email: "admin@example.com",
      isAdmin: true
    });
    
    // Create a few demo users
    const demoUser1 = await storage.createUser({
      username: "janesmith",
      password: await hashPassword("password123"),
      name: "Jane Smith",
      email: "jane@example.com"
    });
    
    const demoUser2 = await storage.createUser({
      username: "johndoe",
      password: await hashPassword("password123"),
      name: "John Doe",
      email: "john@example.com"
    });
    
    // Create some demo suggestions with locations in various states
    await storage.createSuggestion({
      title: "Fix pothole on Main Street",
      description: "There's a large pothole that needs to be fixed urgently. It's causing damage to vehicles.",
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: "Main Street, Downtown"
      },
      userId: demoUser1.id
    });
    
    await storage.createSuggestion({
      title: "Install new street lights",
      description: "The street lights on Park Avenue are not working properly. We need new LED lights installed for better visibility.",
      location: {
        lat: 12.9815,
        lng: 77.6072,
        address: "Park Avenue"
      },
      userId: demoUser2.id
    });
    
    const inProgressSuggestion = await storage.createSuggestion({
      title: "Add bike lane on Hill Road",
      description: "With increasing cyclists, we need a dedicated bike lane on Hill Road for safety.",
      location: {
        lat: 12.9892,
        lng: 77.5900,
        address: "Hill Road"
      },
      userId: demoUser1.id
    });
    
    await storage.updateSuggestionStatus(inProgressSuggestion.id, "IN_PROGRESS" as SuggestionStatus);
    
    const completedSuggestion = await storage.createSuggestion({
      title: "Plant trees near the community center",
      description: "The area around the community center lacks greenery. We should plant native trees to improve the environment.",
      location: {
        lat: 12.9702,
        lng: 77.6099,
        address: "Community Center"
      },
      userId: demoUser2.id
    });
    
    await storage.updateSuggestionStatus(completedSuggestion.id, "DONE" as SuggestionStatus);
    
    const rejectedSuggestion = await storage.createSuggestion({
      title: "Build a skate park in residential area",
      description: "We need a skate park for the youth in our residential area. It would provide a good recreational activity.",
      location: {
        lat: 12.9659,
        lng: 77.5976,
        address: "Residential Zone"
      },
      userId: demoUser1.id
    });
    
    await storage.updateSuggestionStatus(
      rejectedSuggestion.id, 
      "REJECTED" as SuggestionStatus, 
      "Location not suitable due to noise concerns in residential area"
    );
    
    // Add more dummy posts with a mix of high and low vote counts
    const popularSuggestion1 = await storage.createSuggestion({
      title: "Create a community garden in Central Park",
      description: "A community garden would allow residents to grow fresh produce and flowers while building community connections. We have identified an ideal location in Central Park that gets plenty of sunlight.",
      location: {
        lat: 12.9750,
        lng: 77.5930,
        address: "Central Park"
      },
      userId: demoUser2.id
    });
    
    // Give this suggestion lots of upvotes to make it appear in "hot"
    for (let i = 0; i < 15; i++) {
      await storage.createOrUpdateVote({
        suggestionId: popularSuggestion1.id,
        userId: i === 0 ? demoUser1.id : demoUser2.id, // Use existing users to avoid creating too many users
        isUpvote: true
      });
    }
    
    const popularSuggestion2 = await storage.createSuggestion({
      title: "Install public WiFi hotspots in downtown area",
      description: "Free public WiFi would benefit local businesses, students, tourists, and residents alike. We should install hotspots in key areas of the downtown district to improve digital connectivity for everyone.",
      location: {
        lat: 12.9680,
        lng: 77.5910,
        address: "Downtown Square"
      },
      userId: demoUser1.id
    });
    
    // Give this suggestion many upvotes and a few downvotes
    for (let i = 0; i < 12; i++) {
      await storage.createOrUpdateVote({
        suggestionId: popularSuggestion2.id,
        userId: i === 0 ? demoUser2.id : demoUser1.id,
        isUpvote: i < 10 // 10 upvotes, 2 downvotes
      });
    }
    
    // Add a few more suggestions with varying popularity
    await storage.createSuggestion({
      title: "Create a dog park near Riverside",
      description: "Many residents have dogs but there's no dedicated space for them to play off-leash. A fenced dog park would be a great addition to the Riverside neighborhood.",
      location: {
        lat: 12.9810,
        lng: 77.5990,
        address: "Riverside Park"
      },
      userId: demoUser2.id
    });
    
    await storage.createSuggestion({
      title: "Renovate the old playground on Oak Street",
      description: "The playground equipment is outdated and some items are becoming unsafe. We should renovate it with modern, safe equipment that caters to different age groups.",
      location: {
        lat: 12.9680,
        lng: 77.6020,
        address: "Oak Street Park"
      },
      userId: demoUser1.id
    });
    
    await storage.createSuggestion({
      title: "Add more recycling bins in public areas",
      description: "To promote environmental responsibility, we need more recycling bins placed strategically throughout public spaces, especially in parks and plazas.",
      location: {
        lat: 12.9730,
        lng: 77.6050,
        address: "City-wide"
      },
      userId: demoUser2.id
    });
    
    // Add some comments
    await storage.createComment({
      content: "I noticed this too! The pothole is getting bigger every day.",
      suggestionId: 1,
      userId: demoUser2.id
    });
    
    await storage.createComment({
      content: "I support this initiative. The current lights are too dim.",
      suggestionId: 2,
      userId: demoUser1.id
    });
    
    await storage.createComment({
      content: "This would be great for cyclist safety!",
      suggestionId: 3,
      userId: demoUser2.id
    });
    
    // Add comments to the popular suggestions
    await storage.createComment({
      content: "This is exactly what our community needs! I'd love to help with the initial planting.",
      suggestionId: popularSuggestion1.id,
      userId: demoUser1.id
    });
    
    await storage.createComment({
      content: "I can volunteer some time to help maintain the garden once it's established.",
      suggestionId: popularSuggestion1.id,
      userId: demoUser2.id
    });
    
    await storage.createComment({
      content: "Public WiFi would be fantastic for small businesses like mine that can't afford high-speed internet.",
      suggestionId: popularSuggestion2.id,
      userId: demoUser2.id
    });
    
    await storage.createComment({
      content: "I'm concerned about the security implications. Would there be any content filtering?",
      suggestionId: popularSuggestion2.id,
      userId: demoUser1.id
    });
    
    await storage.createComment({
      content: "My dog would love this! There's nowhere safe to let him run currently.",
      suggestionId: 8, // Dog park suggestion
      userId: demoUser1.id
    });
    
    await storage.createComment({
      content: "The playground equipment is definitely showing its age. My kids got splinters last time.",
      suggestionId: 9, // Playground suggestion
      userId: demoUser2.id
    });
    
    // Add some votes
    await storage.createOrUpdateVote({
      suggestionId: 1,
      userId: demoUser2.id,
      isUpvote: true
    });
    
    await storage.createOrUpdateVote({
      suggestionId: 2,
      userId: demoUser1.id,
      isUpvote: true
    });
    
    await storage.createOrUpdateVote({
      suggestionId: 3,
      userId: demoUser2.id,
      isUpvote: true
    });
    
    console.log("Demo data seeded successfully");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}