import { Hono } from "hono";
import type { DatabaseManager } from "@/shared/database";

export function createDatabaseEndpoints(getDbManager: () => Promise<DatabaseManager>) {
  const app = new Hono();

  // Simple auth middleware
  const simpleAuthMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    try {
      const userData = JSON.parse(authHeader.replace('Bearer ', ''));
      c.set("simpleUser", userData);
      await next();
    } catch (error) {
      return c.json({ error: "Invalid authorization header" }, 401);
    }
  };

  // Simple admin middleware
  const simpleAdminMiddleware = async (c: any, next: any) => {
    const user = c.get("simpleUser");
    
    if (!user || user.type !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    await next();
  };

  // File upload endpoint for simple admin
  app.post('/api/simple-admin/upload', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      // Validate file type
      const allowedTypes = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a'
      };

      if (!allowedTypes[file.type as keyof typeof allowedTypes]) {
        return c.json({ 
          error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP for images; MP3, WAV, M4A for audio` 
        }, 400);
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return c.json({ error: "File too large. Maximum size is 100MB" }, 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = allowedTypes[file.type as keyof typeof allowedTypes];
      const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
      
      // Get file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      const db = await getDbManager();
      
      // Store file metadata and binary data
      const id = await db.getNextId('uploaded_files');
      await db.uploadedFiles.insertOne({
        id,
        filename,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: arrayBuffer,
        created_at: new Date().toISOString()
      });

      // Return the file URL
      const fileUrl = `/api/files/${filename}`;
      
      return c.json({ 
        success: true, 
        url: fileUrl,
        filename: filename,
        originalName: file.name,
        size: file.size,
        type: file.type
      });

    } catch (error) {
      console.error('File upload error:', error);
      return c.json({ error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
    }
  });

  // File serving endpoint
  app.get('/api/files/:filename', async (c) => {
    try {
      const filename = c.req.param('filename');
      const db = await getDbManager();
      
      const file = await db.uploadedFiles.findOne({ filename });

      if (!file) {
        return c.json({ error: "File not found" }, 404);
      }
      
      // Return the file with appropriate headers
      return new Response(file.file_data, {
        headers: {
          'Content-Type': file.file_type,
          'Content-Disposition': `inline; filename="${file.original_name}"`,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });

    } catch (error) {
      console.error('File serving error:', error);
      return c.json({ error: "Failed to serve file" }, 500);
    }
  });

  // Simple Admin Books API
  app.get('/api/simple-admin/books', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const db = await getDbManager();
      const books = await db.books.find({}).sort({ created_at: -1 }).toArray();
      
      // Add category names
      const categories = await db.categories.find({}).toArray();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
      
      const booksWithCategories = books.map(book => ({
        ...book,
        category_name: book.category_id ? categoryMap.get(book.category_id) : null
      }));

      return c.json({ books: booksWithCategories });
    } catch (error) {
      console.error('Failed to fetch admin books:', error);
      return c.json({ error: 'Failed to fetch books' }, 500);
    }
  });

  app.get('/api/simple-admin/books/:id', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const bookId = parseInt(c.req.param('id'));
      const db = await getDbManager();
      
      const book = await db.books.findOne({ id: bookId });
      
      if (!book) {
        return c.json({ error: "Book not found" }, 404);
      }
      
      // Add category name if book has category
      if (book.category_id) {
        const category = await db.categories.findOne({ id: book.category_id });
        book.category_name = category?.name || null;
      }
      
      return c.json({ book });
    } catch (error) {
      console.error('Failed to fetch admin book:', error);
      return c.json({ error: 'Failed to fetch book' }, 500);
    }
  });

  app.post('/api/simple-admin/books', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      
      const { title, author, description, category_id, audio_url, cover_image_url, duration_seconds, is_published } = body;
      
      if (!title || !author || !audio_url) {
        return c.json({ error: "Title, author, and audio URL are required" }, 400);
      }

      const db = await getDbManager();
      const id = await db.getNextId('books');
      
      await db.books.insertOne({
        id,
        title,
        author,
        description: description || null,
        category_id: category_id || null,
        audio_url,
        cover_image_url: cover_image_url || null,
        duration_seconds: duration_seconds || null,
        is_published: is_published ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return c.json({ success: true, id });
    } catch (error) {
      console.error('Failed to create book:', error);
      return c.json({ error: 'Failed to create book' }, 500);
    }
  });

  app.put('/api/simple-admin/books/:id', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const bookId = parseInt(c.req.param('id'));
      const body = await c.req.json();
      
      const { title, author, description, category_id, audio_url, cover_image_url, duration_seconds, is_published } = body;
      
      if (!title || !author || !audio_url) {
        return c.json({ error: "Title, author, and audio URL are required" }, 400);
      }

      const db = await getDbManager();

      await db.books.updateOne(
        { id: bookId },
        {
          $set: {
            title,
            author,
            description: description || null,
            category_id: category_id || null,
            audio_url,
            cover_image_url: cover_image_url || null,
            duration_seconds: duration_seconds || null,
            is_published: is_published ? 1 : 0,
            updated_at: new Date().toISOString()
          }
        }
      );
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to update book:', error);
      return c.json({ error: 'Failed to update book' }, 500);
    }
  });

  app.patch('/api/simple-admin/books/:id/toggle-publication', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const bookId = parseInt(c.req.param('id'));
      const body = await c.req.json();
      
      const db = await getDbManager();
      
      await db.books.updateOne(
        { id: bookId },
        {
          $set: {
            is_published: body.is_published ? 1 : 0,
            updated_at: new Date().toISOString()
          }
        }
      );
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to toggle book publication:', error);
      return c.json({ error: 'Failed to toggle publication' }, 500);
    }
  });

  app.delete('/api/simple-admin/books/:id', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const bookId = parseInt(c.req.param('id'));
      const db = await getDbManager();
      
      // Also delete from user favorites
      await db.userFavorites.deleteMany({ book_id: bookId });
      await db.books.deleteOne({ id: bookId });
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to delete book:', error);
      return c.json({ error: 'Failed to delete book' }, 500);
    }
  });

  // Simple Admin Categories API
  app.get('/api/simple-admin/categories', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const db = await getDbManager();
      const categories = await db.categories.find({}).sort({ name: 1 }).toArray();

      return c.json({ categories });
    } catch (error) {
      console.error('Failed to fetch admin categories:', error);
      return c.json({ error: 'Failed to fetch categories' }, 500);
    }
  });

  app.get('/api/simple-admin/categories/:id', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const categoryId = parseInt(c.req.param('id'));
      const db = await getDbManager();
      
      const category = await db.categories.findOne({ id: categoryId });
      
      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }
      
      return c.json({ category });
    } catch (error) {
      console.error('Failed to fetch admin category:', error);
      return c.json({ error: 'Failed to fetch category' }, 500);
    }
  });

  app.post('/api/simple-admin/categories', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const { name, slug, description } = body;
      
      if (!name || !slug) {
        return c.json({ error: "Name and slug are required" }, 400);
      }

      const db = await getDbManager();
      const id = await db.getNextId('categories');

      await db.categories.insertOne({
        id,
        name,
        slug,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return c.json({ success: true, id });
    } catch (error) {
      console.error('Failed to create category:', error);
      return c.json({ error: 'Failed to create category' }, 500);
    }
  });

  app.put('/api/simple-admin/categories/:id', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
    try {
      const categoryId = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const { name, slug, description } = body;
      
      if (!name || !slug) {
        return c.json({ error: "Name and slug are required" }, 400);
      }

      const db = await getDbManager();

      await db.categories.updateOne(
        { id: categoryId },
        {
          $set: {
            name,
            slug,
            description: description || null,
            updated_at: new Date().toISOString()
          }
        }
      );
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to update category:', error);
      return c.json({ error: 'Failed to update category' }, 500);
    }
  });

  return app;
}