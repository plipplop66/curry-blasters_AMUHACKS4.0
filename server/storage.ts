import { users, suggestions, comments, votes, reports, type User, type InsertUser, type Suggestion, type InsertSuggestion, type Comment, type InsertComment, type Vote, type InsertVote, type Report, type InsertReport, type SuggestionStatus, type Location } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWarningCount(userId: number, increment: number): Promise<User | undefined>;
  banUser(userId: number): Promise<User | undefined>;
  
  // Suggestion operations
  getSuggestion(id: number): Promise<Suggestion | undefined>;
  getSuggestionsByUserId(userId: number): Promise<Suggestion[]>;
  getSuggestionsByLocation(location: Location, radiusKm: number): Promise<Suggestion[]>;
  getSuggestionsByStatus(status: SuggestionStatus): Promise<Suggestion[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  updateSuggestionStatus(id: number, status: SuggestionStatus, rejectionReason?: string): Promise<Suggestion | undefined>;
  deleteSuggestion(id: number): Promise<void>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsBySuggestionId(suggestionId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Vote operations
  getVoteByUserAndSuggestion(userId: number, suggestionId: number): Promise<Vote | undefined>;
  createOrUpdateVote(vote: InsertVote): Promise<Vote>;
  
  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getReportsBySuggestionId(suggestionId: number): Promise<Report[]>;
  getReportsByCommentId(commentId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  resolveReport(id: number): Promise<Report | undefined>;
  
  // Database operations
  resetDatabase(): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private suggestionsMap: Map<number, Suggestion>;
  private commentsMap: Map<number, Comment>;
  private votesMap: Map<number, Vote>;
  private reportsMap: Map<number, Report>;
  
  private userIdCounter: number;
  private suggestionIdCounter: number;
  private commentIdCounter: number;
  private voteIdCounter: number;
  private reportIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.usersMap = new Map();
    this.suggestionsMap = new Map();
    this.commentsMap = new Map();
    this.votesMap = new Map();
    this.reportsMap = new Map();
    
    this.userIdCounter = 1;
    this.suggestionIdCounter = 1;
    this.commentIdCounter = 1;
    this.voteIdCounter = 1;
    this.reportIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$X/4rkyr2X6VZ6HI.WBvJSOnpJefMMMYTURVs0KvWWnbd1QsX7U0Ni", // "admin123"
      name: "Administrator",
      email: "admin@curryblasters.com",
    }).then(user => {
      // Update to make admin
      const adminUser = { ...user, isAdmin: true };
      this.usersMap.set(user.id, adminUser);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...userData, 
      id,
      isAdmin: false,
      warningCount: 0,
      isBanned: false,
      location: {},
      createdAt: new Date()
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUserWarningCount(userId: number, increment: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      warningCount: user.warningCount + increment,
      isBanned: (user.warningCount + increment) >= 2
    };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async banUser(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isBanned: true };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }

  // Suggestion operations
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    return this.suggestionsMap.get(id);
  }
  
  async getSuggestionsByUserId(userId: number): Promise<Suggestion[]> {
    return Array.from(this.suggestionsMap.values()).filter(
      (suggestion) => suggestion.userId === userId
    );
  }
  
  async getSuggestionsByLocation(location: Location, radiusKm: number): Promise<Suggestion[]> {
    if (!location.lat || !location.lng) {
      return Array.from(this.suggestionsMap.values());
    }
    
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the earth in km
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; // Distance in km
      return d;
    };
    
    return Array.from(this.suggestionsMap.values()).filter(suggestion => {
      if (!suggestion.location || !suggestion.location.lat || !suggestion.location.lng) return false;
      const distance = calculateDistance(
        location.lat, 
        location.lng, 
        suggestion.location.lat, 
        suggestion.location.lng
      );
      return distance <= radiusKm;
    });
  }
  
  async getSuggestionsByStatus(status: SuggestionStatus): Promise<Suggestion[]> {
    return Array.from(this.suggestionsMap.values()).filter(
      (suggestion) => suggestion.status === status
    );
  }
  
  async createSuggestion(suggestionData: InsertSuggestion): Promise<Suggestion> {
    const id = this.suggestionIdCounter++;
    const suggestion: Suggestion = {
      ...suggestionData,
      id,
      status: "ACTIVE",
      rejectionReason: null,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date()
    };
    this.suggestionsMap.set(id, suggestion);
    return suggestion;
  }
  
  async updateSuggestionStatus(id: number, status: SuggestionStatus, rejectionReason?: string): Promise<Suggestion | undefined> {
    const suggestion = await this.getSuggestion(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion: Suggestion = {
      ...suggestion,
      status,
      rejectionReason: status === "REJECTED" ? (rejectionReason || null) : null
    };
    
    this.suggestionsMap.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  
  async deleteSuggestion(id: number): Promise<void> {
    // Delete all related entities first
    
    // Delete related comments
    const commentsToDelete = await this.getCommentsBySuggestionId(id);
    for (const comment of commentsToDelete) {
      // Delete any reports on this comment
      const commentReports = await this.getReportsByCommentId(comment.id);
      for (const report of commentReports) {
        this.reportsMap.delete(report.id);
      }
      this.commentsMap.delete(comment.id);
    }
    
    // Delete related votes
    const votes = Array.from(this.votesMap.values()).filter(vote => vote.suggestionId === id);
    for (const vote of votes) {
      this.votesMap.delete(vote.id);
    }
    
    // Delete related reports
    const suggestionReports = await this.getReportsBySuggestionId(id);
    for (const report of suggestionReports) {
      this.reportsMap.delete(report.id);
    }
    
    // Finally delete the suggestion itself
    this.suggestionsMap.delete(id);
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.commentsMap.get(id);
  }
  
  async getCommentsBySuggestionId(suggestionId: number): Promise<Comment[]> {
    return Array.from(this.commentsMap.values()).filter(
      (comment) => comment.suggestionId === suggestionId
    );
  }
  
  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const comment: Comment = {
      ...commentData,
      id,
      createdAt: new Date()
    };
    this.commentsMap.set(id, comment);
    return comment;
  }

  // Vote operations  
  async getVoteByUserAndSuggestion(userId: number, suggestionId: number): Promise<Vote | undefined> {
    return Array.from(this.votesMap.values()).find(
      (vote) => vote.userId === userId && vote.suggestionId === suggestionId
    );
  }
  
  async createOrUpdateVote(voteData: InsertVote): Promise<Vote> {
    const existingVote = await this.getVoteByUserAndSuggestion(voteData.userId, voteData.suggestionId);
    
    if (existingVote) {
      // Update existing vote
      const updatedVote: Vote = {
        ...existingVote,
        isUpvote: voteData.isUpvote
      };
      this.votesMap.set(existingVote.id, updatedVote);
      
      // Update the suggestion vote counts
      const suggestion = await this.getSuggestion(voteData.suggestionId);
      if (suggestion) {
        if (existingVote.isUpvote && !voteData.isUpvote) {
          // Changed from upvote to downvote
          const updatedSuggestion: Suggestion = {
            ...suggestion,
            upvotes: suggestion.upvotes - 1,
            downvotes: suggestion.downvotes + 1
          };
          this.suggestionsMap.set(suggestion.id, updatedSuggestion);
        } else if (!existingVote.isUpvote && voteData.isUpvote) {
          // Changed from downvote to upvote
          const updatedSuggestion: Suggestion = {
            ...suggestion,
            upvotes: suggestion.upvotes + 1,
            downvotes: suggestion.downvotes - 1
          };
          this.suggestionsMap.set(suggestion.id, updatedSuggestion);
        }
      }
      
      return updatedVote;
    } else {
      // Create new vote
      const id = this.voteIdCounter++;
      const vote: Vote = {
        ...voteData,
        id
      };
      this.votesMap.set(id, vote);
      
      // Update the suggestion vote counts
      const suggestion = await this.getSuggestion(voteData.suggestionId);
      if (suggestion) {
        const updatedSuggestion: Suggestion = {
          ...suggestion,
          upvotes: voteData.isUpvote ? suggestion.upvotes + 1 : suggestion.upvotes,
          downvotes: !voteData.isUpvote ? suggestion.downvotes + 1 : suggestion.downvotes
        };
        this.suggestionsMap.set(suggestion.id, updatedSuggestion);
      }
      
      return vote;
    }
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reportsMap.get(id);
  }
  
  async getReportsBySuggestionId(suggestionId: number): Promise<Report[]> {
    return Array.from(this.reportsMap.values()).filter(
      (report) => report.suggestionId === suggestionId
    );
  }
  
  async getReportsByCommentId(commentId: number): Promise<Report[]> {
    return Array.from(this.reportsMap.values()).filter(
      (report) => report.commentId === commentId
    );
  }
  
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const report: Report = {
      ...reportData,
      id,
      createdAt: new Date(),
      resolved: false
    };
    this.reportsMap.set(id, report);
    return report;
  }
  
  async resolveReport(id: number): Promise<Report | undefined> {
    const report = await this.getReport(id);
    if (!report) return undefined;
    
    const updatedReport: Report = {
      ...report,
      resolved: true
    };
    
    this.reportsMap.set(id, updatedReport);
    return updatedReport;
  }
  
  // Database operations
  async resetDatabase(): Promise<void> {
    // Clear all in-memory collections
    this.usersMap.clear();
    this.suggestionsMap.clear();
    this.commentsMap.clear();
    this.votesMap.clear();
    this.reportsMap.clear();
    
    // Reset counters
    this.userIdCounter = 1;
    this.suggestionIdCounter = 1;
    this.commentIdCounter = 1;
    this.voteIdCounter = 1;
    this.reportIdCounter = 1;
    
    // Import and run the seed data function
    const { seedDemoData } = require('./demo-data');
    await seedDemoData();
    
    console.log("In-memory database reset and seeded successfully");
  }
  
  // Helper methods
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      eq(users.username, username)
    );
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      eq(users.email, email)
    );
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      location: {},
      warningCount: 0,
      isBanned: false
    }).returning();
    return user;
  }
  
  async updateUserWarningCount(userId: number, increment: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const newWarningCount = user.warningCount + increment;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        warningCount: newWarningCount,
        isBanned: newWarningCount >= 2
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async banUser(userId: number): Promise<User | undefined> {
    const [bannedUser] = await db
      .update(users)
      .set({ isBanned: true })
      .where(eq(users.id, userId))
      .returning();
    
    return bannedUser;
  }
  
  // Suggestion operations
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    const [suggestion] = await db.select().from(suggestions).where(eq(suggestions.id, id));
    return suggestion;
  }
  
  async getSuggestionsByUserId(userId: number): Promise<Suggestion[]> {
    return await db.select().from(suggestions).where(eq(suggestions.userId, userId));
  }
  
  async getSuggestionsByLocation(location: Location, radiusKm: number): Promise<Suggestion[]> {
    // First get all suggestions
    const allSuggestions = await db.select().from(suggestions);
    
    // Filter by distance and add distance property
    return allSuggestions
      .map(suggestion => {
        // Parse the location JSON
        const suggestionLocation = suggestion.location as unknown as Location;
        if (!suggestionLocation || !suggestionLocation.lat || !suggestionLocation.lng) return null;
        
        const distance = this.calculateDistance(
          location.lat, location.lng,
          suggestionLocation.lat, suggestionLocation.lng
        );
        
        if (distance <= radiusKm) {
          return {
            ...suggestion,
            distance
          };
        }
        return null;
      })
      .filter((suggestion): suggestion is Suggestion => suggestion !== null);
  }
  
  async getSuggestionsByStatus(status: SuggestionStatus): Promise<Suggestion[]> {
    return await db.select().from(suggestions).where(eq(suggestions.status, status));
  }
  
  async createSuggestion(suggestionData: InsertSuggestion): Promise<Suggestion> {
    const [suggestion] = await db.insert(suggestions).values({
      ...suggestionData,
      status: "ACTIVE",
      upvotes: 0,
      downvotes: 0
    }).returning();
    return suggestion;
  }
  
  async updateSuggestionStatus(id: number, status: SuggestionStatus, rejectionReason?: string): Promise<Suggestion | undefined> {
    const updateData: Partial<Suggestion> = { 
      status,
      rejectionReason: status === "REJECTED" ? (rejectionReason || null) : null
    };
    
    const [updatedSuggestion] = await db
      .update(suggestions)
      .set(updateData)
      .where(eq(suggestions.id, id))
      .returning();
    
    return updatedSuggestion;
  }
  
  async deleteSuggestion(id: number): Promise<void> {
    // Using transactions to ensure all related entities are deleted properly
    await db.transaction(async (tx) => {
      // Delete related reports for comments on this suggestion
      const suggestionComments = await tx.select({ id: comments.id }).from(comments)
        .where(eq(comments.suggestionId, id));
      
      for (const comment of suggestionComments) {
        await tx.delete(reports)
          .where(eq(reports.commentId, comment.id));
      }
      
      // Delete related reports for this suggestion
      await tx.delete(reports)
        .where(eq(reports.suggestionId, id));
      
      // Delete related votes
      await tx.delete(votes)
        .where(eq(votes.suggestionId, id));
      
      // Delete related comments
      await tx.delete(comments)
        .where(eq(comments.suggestionId, id));
      
      // Delete the suggestion itself
      await tx.delete(suggestions)
        .where(eq(suggestions.id, id));
    });
  }
  
  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }
  
  async getCommentsBySuggestionId(suggestionId: number): Promise<Comment[]> {
    // We'll fetch all comments for this suggestion with their user information
    const allComments = await db.select({
      comment: comments,
      user: users
    })
    .from(comments)
    .where(eq(comments.suggestionId, suggestionId))
    .leftJoin(users, eq(comments.userId, users.id));
    
    // Transform to expected format while preserving relations
    return allComments.map(({ comment, user }) => ({
      ...comment,
      user: user ? {
        id: user.id,
        username: user.username,
        name: user.name
      } : undefined
    }));
  }
  
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    return comment;
  }
  
  // Vote operations
  async getVoteByUserAndSuggestion(userId: number, suggestionId: number): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(
      and(
        eq(votes.userId, userId),
        eq(votes.suggestionId, suggestionId)
      )
    );
    return vote;
  }
  
  async createOrUpdateVote(voteData: InsertVote): Promise<Vote> {
    const existingVote = await this.getVoteByUserAndSuggestion(voteData.userId, voteData.suggestionId);
    
    if (existingVote) {
      // If vote direction changed, update upvotes/downvotes counts
      if (existingVote.isUpvote !== voteData.isUpvote) {
        const suggestion = await this.getSuggestion(voteData.suggestionId);
        if (suggestion) {
          if (voteData.isUpvote) {
            // Changed from downvote to upvote
            await db
              .update(suggestions)
              .set({
                upvotes: suggestion.upvotes + 1,
                downvotes: suggestion.downvotes - 1
              })
              .where(eq(suggestions.id, suggestion.id));
          } else {
            // Changed from upvote to downvote
            await db
              .update(suggestions)
              .set({
                upvotes: suggestion.upvotes - 1,
                downvotes: suggestion.downvotes + 1
              })
              .where(eq(suggestions.id, suggestion.id));
          }
        }
      }
      
      // Update the vote
      const [updatedVote] = await db
        .update(votes)
        .set({ isUpvote: voteData.isUpvote })
        .where(eq(votes.id, existingVote.id))
        .returning();
        
      return updatedVote;
    } else {
      // New vote, add to votes collection and update suggestion counts
      const [vote] = await db
        .insert(votes)
        .values(voteData)
        .returning();
      
      // Update suggestion upvote/downvote counts
      const suggestion = await this.getSuggestion(voteData.suggestionId);
      if (suggestion) {
        await db
          .update(suggestions)
          .set({
            upvotes: suggestion.upvotes + (voteData.isUpvote ? 1 : 0),
            downvotes: suggestion.downvotes + (voteData.isUpvote ? 0 : 1)
          })
          .where(eq(suggestions.id, suggestion.id));
      }
      
      return vote;
    }
  }
  
  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }
  
  async getReportsBySuggestionId(suggestionId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.suggestionId, suggestionId));
  }
  
  async getReportsByCommentId(commentId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.commentId, commentId));
  }
  
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values({
      ...reportData,
      resolved: false
    }).returning();
    return report;
  }
  
  async resolveReport(id: number): Promise<Report | undefined> {
    const [resolvedReport] = await db
      .update(reports)
      .set({ resolved: true })
      .where(eq(reports.id, id))
      .returning();
    
    return resolvedReport;
  }
  
  // Helper method for location-based queries
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  // Reset the database by dropping and recreating all tables
  async resetDatabase(): Promise<void> {
    try {
      // Drop all tables in the correct order (respecting foreign key constraints)
      await db.execute(sql`DROP TABLE IF EXISTS session CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS reports CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS votes CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS comments CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS suggestions CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
      
      // Push schema definitions using Drizzle schema
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          warning_count INTEGER NOT NULL DEFAULT 0,
          is_banned BOOLEAN NOT NULL DEFAULT false,
          location JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS suggestions (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          location JSONB NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          status TEXT NOT NULL,
          rejection_reason TEXT,
          upvotes INTEGER NOT NULL DEFAULT 0,
          downvotes INTEGER NOT NULL DEFAULT 0,
          photo_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          suggestion_id INTEGER NOT NULL REFERENCES suggestions(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          parent_id INTEGER REFERENCES comments(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS votes (
          id SERIAL PRIMARY KEY,
          suggestion_id INTEGER NOT NULL REFERENCES suggestions(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          is_upvote BOOLEAN NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS reports (
          id SERIAL PRIMARY KEY,
          suggestion_id INTEGER REFERENCES suggestions(id),
          comment_id INTEGER REFERENCES comments(id),
          description TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          photo_url TEXT,
          reason TEXT NOT NULL,
          resolved BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      
      // Seed the database with demo data
      const { seedDemoData } = await import('./demo-data');
      await seedDemoData();
      
      console.log("Database successfully reset and seeded");
    } catch (error) {
      console.error("Error resetting database:", error);
      throw error;
    }
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
