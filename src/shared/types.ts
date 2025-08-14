import z from "zod";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const BookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  description: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  audio_url: z.string(),
  duration_seconds: z.number().nullable(),
  category_id: z.number().nullable(),
  category_name: z.string().nullable().optional(),
  is_published: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const FavoriteSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  book_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Book = z.infer<typeof BookSchema>;
export type Favorite = z.infer<typeof FavoriteSchema>;
