import { pgTable, serial, varchar, text, integer, boolean, timestamp, bigint, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Books table
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  description: text('description'),
  cover_image_url: varchar('cover_image_url', { length: 500 }),
  audio_url: varchar('audio_url', { length: 500 }).notNull(),
  duration_seconds: integer('duration_seconds'),
  category_id: integer('category_id').references(() => categories.id),
  is_published: boolean('is_published').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// User favorites table
export const userFavorites = pgTable('user_favorites', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  book_id: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userBookUnique: unique().on(table.user_id, table.book_id),
}));

// Admin users table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).unique().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Uploaded files table (now with R2 references)
export const uploadedFiles = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).unique().notNull(),
  original_name: varchar('original_name', { length: 255 }).notNull(),
  file_type: varchar('file_type', { length: 100 }).notNull(),
  file_size: bigint('file_size', { mode: 'number' }).notNull(),
  r2_key: varchar('r2_key', { length: 500 }).notNull(), // R2 object key
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Search history table
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }),
  search_term: varchar('search_term', { length: 255 }).notNull(),
  results_count: integer('results_count').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User interactions table
export const userInteractions = pgTable('user_interactions', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  book_id: integer('book_id').references(() => books.id),
  interaction_type: varchar('interaction_type', { length: 50 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(categories, {
    fields: [books.category_id],
    references: [categories.id],
  }),
  favorites: many(userFavorites),
  interactions: many(userInteractions),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  book: one(books, {
    fields: [userFavorites.book_id],
    references: [books.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  book: one(books, {
    fields: [userInteractions.book_id],
    references: [books.id],
  }),
}));

// Export types that match your existing interfaces
export type Category = typeof categories.$inferSelect;
export type Book = typeof books.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;

export type NewCategory = typeof categories.$inferInsert;
export type NewBook = typeof books.$inferInsert;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;
export type NewSearchHistory = typeof searchHistory.$inferInsert;
export type NewUserInteraction = typeof userInteractions.$inferInsert;
