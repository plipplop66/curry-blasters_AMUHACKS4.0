import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { filterProfanity, containsProfanity } from "./profanity";
import { insertSuggestionSchema, insertCommentSchema, insertVoteSchema, insertReportSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Not authorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Reset demo data endpoint (admin only)
  app.post("/api/reset-demo", isAdmin, async (req, res) => {
    try {
      // Drop all tables and recreate with demo data
      await storage.resetDatabase();
      res.status(200).json({ success: true, message: "Demo data reset successfully" });
    } catch (error) {
      console.error("Error resetting demo data:", error);
      res.status(500).json({ success: false, message: "Failed to reset demo data" });
    }
  });

  // Get suggestions near location
  app.get("/api/suggestions", async (req, res) => {
    try {
      let suggestions;
      
      if (req.query.lat && req.query.lng) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50; // Default 50km radius
        
        suggestions = await storage.getSuggestionsByLocation({ lat, lng }, radius);
      } else {
        // Return all suggestions if no location provided
        suggestions = Array.from((await storage.getSuggestionsByLocation({} as any, 0)));
      }
      
      // Get user data for each suggestion
      const suggestionsWithUserData = await Promise.all(suggestions.map(async (suggestion) => {
        const user = await storage.getUser(suggestion.userId);
        return {
          ...suggestion,
          user: user ? { id: user.id, name: user.name, username: user.username } : null
        };
      }));
      
      res.json(suggestionsWithUserData);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Get suggestion by id
  app.get("/api/suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suggestion = await storage.getSuggestion(id);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      // Get user data
      const user = await storage.getUser(suggestion.userId);
      
      res.json({
        ...suggestion,
        user: user ? { id: user.id, name: user.name, username: user.username } : null
      });
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      res.status(500).json({ message: "Failed to fetch suggestion" });
    }
  });

  // Create suggestion
  app.post("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const suggestionData = insertSuggestionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Filter profanity in title and description
      const filteredSuggestion = {
        ...suggestionData,
        title: filterProfanity(suggestionData.title),
        description: filterProfanity(suggestionData.description)
      };
      
      // Check if suggestion contains profanity and warn user if needed
      if (containsProfanity(suggestionData.title) || containsProfanity(suggestionData.description)) {
        await storage.updateUserWarningCount(req.user.id, 1);
      }
      
      const suggestion = await storage.createSuggestion(filteredSuggestion);
      
      res.status(201).json(suggestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid suggestion data", errors: error.errors });
      }
      console.error("Error creating suggestion:", error);
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  });

  // Update suggestion status (admin only)
  app.patch("/api/suggestions/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      
      const suggestion = await storage.updateSuggestionStatus(id, status, rejectionReason);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      res.status(500).json({ message: "Failed to update suggestion status" });
    }
  });
  
  // Delete suggestion (owner only)
  app.delete("/api/suggestions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if suggestion exists
      const suggestion = await storage.getSuggestion(id);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      // Check if user is the owner of the suggestion
      if (suggestion.userId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "You can only delete your own suggestions" });
      }
      
      await storage.deleteSuggestion(id);
      
      res.status(200).json({ message: "Suggestion deleted successfully" });
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      res.status(500).json({ message: "Failed to delete suggestion" });
    }
  });

  // Get comments for suggestion
  app.get("/api/suggestions/:id/comments", async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      
      const comments = await storage.getCommentsBySuggestionId(suggestionId);
      
      // Get user data for each comment
      const commentsWithUserData = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: user ? { id: user.id, name: user.name, username: user.username } : null
        };
      }));
      
      res.json(commentsWithUserData);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add comment to suggestion
  app.post("/api/suggestions/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      
      // Check if suggestion exists
      const suggestion = await storage.getSuggestion(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        suggestionId,
        userId: req.user.id
      });
      
      // Filter profanity in comment content
      const filteredComment = {
        ...commentData,
        content: filterProfanity(commentData.content)
      };
      
      // Check if comment contains profanity and warn user if needed
      if (containsProfanity(commentData.content)) {
        await storage.updateUserWarningCount(req.user.id, 1);
      }
      
      const comment = await storage.createComment(filteredComment);
      
      // Get user data
      const user = await storage.getUser(comment.userId);
      
      res.status(201).json({
        ...comment,
        user: user ? { id: user.id, name: user.name, username: user.username } : null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Vote on suggestion
  app.post("/api/suggestions/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      
      // Check if suggestion exists
      const suggestion = await storage.getSuggestion(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      const voteData = insertVoteSchema.parse({
        suggestionId,
        userId: req.user.id,
        isUpvote: req.body.isUpvote
      });
      
      const vote = await storage.createOrUpdateVote(voteData);
      
      // Get updated suggestion with vote counts
      const updatedSuggestion = await storage.getSuggestion(suggestionId);
      
      res.json({
        vote,
        suggestion: updatedSuggestion
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      console.error("Error voting on suggestion:", error);
      res.status(500).json({ message: "Failed to vote on suggestion" });
    }
  });

  // Report suggestion or comment
  app.post("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Validate that either suggestionId or commentId is provided (not both)
      if ((reportData.suggestionId && reportData.commentId) || (!reportData.suggestionId && !reportData.commentId)) {
        return res.status(400).json({ message: "Either suggestionId or commentId must be provided" });
      }
      
      // Verify the suggestion or comment exists
      if (reportData.suggestionId) {
        const suggestion = await storage.getSuggestion(reportData.suggestionId);
        if (!suggestion) {
          return res.status(404).json({ message: "Suggestion not found" });
        }
      } else if (reportData.commentId) {
        const comment = await storage.getComment(reportData.commentId);
        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }
      }
      
      const report = await storage.createReport(reportData);
      
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Resolve report (admin only)
  app.patch("/api/reports/:id/resolve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const report = await storage.resolveReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  // Get current user's data
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      // Get user's suggestions
      const suggestions = await storage.getSuggestionsByUserId(req.user.id);
      
      res.json({
        user: req.user,
        suggestions
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  // Update user location
  app.put("/api/profile/location", isAuthenticated, async (req, res) => {
    try {
      const { lat, lng, address } = req.body;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: "Invalid location data" });
      }
      
      // Update user with new location
      const user = { ...req.user, location: { lat, lng, address } };
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to update location" });
        }
        res.json({ location: { lat, lng, address } });
      });
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
