import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  warningCount: integer("warning_count").default(0).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  location: json("location").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
});

export const suggestionStatus = z.enum([
  "ACTIVE", 
  "IN_PROGRESS", 
  "DONE", 
  "REJECTED"
]);

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: json("location").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status", { enum: ["ACTIVE", "IN_PROGRESS", "DONE", "REJECTED"] }).default("ACTIVE").notNull(),
  rejectionReason: text("rejection_reason"),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  title: true,
  description: true,
  location: true,
  userId: true,
  photoUrl: true,
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  suggestionId: true,
  userId: true,
  parentId: true,
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id").notNull(),
  isUpvote: boolean("is_upvote").notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  suggestionId: true,
  userId: true,
  isUpvote: true,
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").notNull(),
  suggestionId: integer("suggestion_id"),
  commentId: integer("comment_id"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false).notNull()
});

export const insertReportSchema = createInsertSchema(reports).pick({
  reason: true,
  description: true,
  userId: true,
  suggestionId: true,
  commentId: true,
  photoUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestions.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type SuggestionStatus = z.infer<typeof suggestionStatus>;

export type Location = {
  lat: number;
  lng: number;
  address?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  suggestions: many(suggestions),
  comments: many(comments),
  votes: many(votes),
  reports: many(reports)
}));

export const suggestionsRelations = relations(suggestions, ({ one, many }) => ({
  user: one(users, { fields: [suggestions.userId], references: [users.id] }),
  comments: many(comments),
  votes: many(votes),
  reports: many(reports)
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  suggestion: one(suggestions, { fields: [comments.suggestionId], references: [suggestions.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: 'parent_comment' }),
  replies: many(comments, { relationName: 'parent_comment' }),
  reports: many(reports)
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, { fields: [votes.userId], references: [users.id] }),
  suggestion: one(suggestions, { fields: [votes.suggestionId], references: [suggestions.id] })
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  suggestion: one(suggestions, { fields: [reports.suggestionId], references: [suggestions.id] }),
  comment: one(comments, { fields: [reports.commentId], references: [comments.id] })
}));
