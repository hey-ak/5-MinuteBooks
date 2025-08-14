import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { DatabaseManager } from "@/shared/database";
import { createDatabaseEndpoints } from "./database-endpoints";

const app = new Hono<{ Bindings: Env }>();

// Database connection
let dbManager: DatabaseManager | null = null;

async function getDbManager(): Promise<DatabaseManager> {
  if (!dbManager) {
    dbManager = new DatabaseManager();
    await dbManager.connect();
    await dbManager.createIndexes();
  }
  return dbManager;
}

// Simple Auth endpoints
app.post('/api/auth/signup', async (c) => {
  const body = await c.req.json();
  const { username, email, password, userType } = body;

  // Block admin signup - admins are pre-configured
  if (userType === 'admin') {
    return c.json({ error: "Admin accounts cannot be created through signup. Please contact system administrator." }, 403);
  }

  if (!username || !email || !password) {
    return c.json({ error: "Username, email, and password are required" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters long" }, 400);
  }

  try {
    const db = await getDbManager();
    
    // Check if username or email already exists
    const existingUsers = await db.userInteractions.find({
      $or: [
        { user_id: username },
        { user_id: email }
      ]
    }).toArray();
    
    if (existingUsers.length > 0) {
      return c.json({ error: "Username or email already exists. Please choose different credentials or sign in." }, 409);
    }
    
    // Create user record by adding a user interaction
    const userId = `user-${username}`;
    await db.userInteractions.insertOne({
      id: await db.getNextId('user_interactions'),
      user_id: username,
      book_id: 0, // Special marker for user registration
      interaction_type: 'registration',
      created_at: new Date().toISOString()
    });
    
    const user = {
      id: userId,
      username,
      type: 'user' as const,
      email
    };

    return c.json({ success: true, user });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: "Failed to create account. Please try again." }, 500);
  }
});

app.post('/api/auth/signin', async (c) => {
  const body = await c.req.json();
  const { username, password, userType } = body;

  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }

  // Admin credentials (fixed)
  if (userType === 'admin') {
    if (username === 'akshay@admin.com' && password === 'akshay@admin') {
      const user = {
        id: 'admin-1',
        username: 'akshay@admin.com',
        type: 'admin',
        email: 'akshay@admin.com'
      };
      return c.json({ success: true, user });
    } else {
      return c.json({ error: "Invalid admin credentials. Please check your email and password." }, 401);
    }
  }

  // Regular user validation
  if (userType === 'user') {
    // Check if user is trying to use admin credentials
    if (username === 'akshay@admin.com') {
      return c.json({ error: "This is an admin account. Please select 'Admin' account type to sign in." }, 403);
    }

    const db = await getDbManager();
    
    // Check if this is a registered user
    const registeredUser = await db.userInteractions.findOne({ 
      user_id: username, 
      interaction_type: 'registration' 
    });
    
    // If not registered and not a demo user, suggest signup
    if (!registeredUser && !isValidDemoUser(username, password)) {
      return c.json({ 
        error: "Account not found. Please create an account first or use demo credentials.",
        suggestion: "signup"
      }, 404);
    }

    const user = {
      id: `user-${username}`,
      username,
      type: 'user',
      email: username.includes('@') ? username : `${username}@example.com`
    };

    return c.json({ success: true, user });
  }

  return c.json({ error: "Invalid account type" }, 400);
});

// Helper function to check if it's a valid demo user
function isValidDemoUser(username: string, password: string): boolean {
  // Allow some demo users for testing
  const demoUsers = [
    { username: 'demo', password: 'demo' },
    { username: 'test', password: 'test' },
    { username: 'user', password: 'user' },
    { username: 'guest', password: 'guest' }
  ];
  
  return demoUsers.some(demo => demo.username === username && demo.password === password);
}

app.post('/api/auth/logout', async (c) => {
  return c.json({ success: true });
});

// Helper function to check if user is admin
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = await getDbManager();
    const adminUser = await db.adminUsers.findOne({ user_id: user.id });

    if (!adminUser) {
      return c.json({ error: "Admin access required" }, 403);
    }

    await next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

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

// OAuth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Categories API
app.get('/api/categories', async (c) => {
  try {
    const db = await getDbManager();
    const categories = await db.categories.find({}).sort({ name: 1 }).toArray();
    
    return c.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Books API
app.get('/api/books', async (c) => {
  try {
    const categoryId = c.req.query('category_id');
    const db = await getDbManager();
    
    // Build query filter
    const filter: any = { is_published: 1 };
    if (categoryId) {
      filter.category_id = parseInt(categoryId);
    }
    
    // Get books
    const books = await db.books.find(filter).sort({ created_at: -1 }).toArray();
    
    // Add category names
    const categoryIds = [...new Set(books.map(book => book.category_id).filter(Boolean))];
    const categories = await db.categories.find({}).toArray();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    const booksWithCategories = books.map(book => ({
      ...book,
      category_name: book.category_id ? categoryMap.get(book.category_id) : null
    }));
    
    return c.json({ books: booksWithCategories });
  } catch (error) {
    console.error('Failed to fetch books:', error);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

app.get('/api/books/:id', async (c) => {
  try {
    const bookId = parseInt(c.req.param('id'));
    const db = await getDbManager();
    
    const book = await db.books.findOne({ id: bookId, is_published: 1 });
    
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
    console.error('Failed to fetch book:', error);
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
});

// User favorites API - protected routes (supports both auth methods)
app.get('/api/favorites', async (c) => {
  // Try simple auth first
  const authHeader = c.req.header('Authorization');
  let user = null;
  
  if (authHeader) {
    try {
      const userData = JSON.parse(authHeader.replace('Bearer ', ''));
      user = userData;
    } catch (error) {
      // If simple auth fails, try OAuth auth
      const oauthUser = c.get("user");
      if (oauthUser) {
        user = oauthUser;
      }
    }
  }
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  try {
    const db = await getDbManager();
    
    // Get user favorites
    const userFavorites = await db.userFavorites.find({ user_id: user.id }).sort({ created_at: -1 }).toArray();
    const bookIds = userFavorites.map(fav => fav.book_id);
    
    if (bookIds.length === 0) {
      return c.json({ favorites: [] });
    }
    
    // Get books
    const allBooks = await db.books.find({ is_published: 1 }).toArray();
    const books = allBooks.filter(book => bookIds.includes(book.id));
    
    // Get categories
    const categories = await db.categories.find({}).toArray();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    // Combine data
    const favorites = userFavorites.map(fav => {
      const book = books.find(b => b.id === fav.book_id);
      if (!book) return null;
      
      return {
        ...book,
        category_name: book.category_id ? categoryMap.get(book.category_id) : null,
        favorited_at: fav.created_at
      };
    }).filter(Boolean);
    
    return c.json({ favorites });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return c.json({ error: 'Failed to fetch favorites' }, 500);
  }
});

app.post('/api/favorites', async (c) => {
  // Try simple auth first
  const authHeader = c.req.header('Authorization');
  let user = null;
  
  if (authHeader) {
    try {
      const userData = JSON.parse(authHeader.replace('Bearer ', ''));
      user = userData;
    } catch (error) {
      // If simple auth fails, try OAuth auth
      const oauthUser = c.get("user");
      if (oauthUser) {
        user = oauthUser;
      }
    }
  }
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  try {
    const body = await c.req.json();
    
    if (!body.book_id) {
      return c.json({ error: "Book ID is required" }, 400);
    }
    
    const db = await getDbManager();
    
    // Check if already favorited
    const existing = await db.userFavorites.findOne({ 
      user_id: user.id, 
      book_id: body.book_id 
    });
    
    if (existing) {
      return c.json({ error: "Book already favorited" }, 400);
    }
    
    // Add to favorites
    const id = await db.getNextId('user_favorites');
    await db.userFavorites.insertOne({
      id,
      user_id: user.id,
      book_id: body.book_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

app.delete('/api/favorites/:bookId', async (c) => {
  // Try simple auth first
  const authHeader = c.req.header('Authorization');
  let user = null;
  
  if (authHeader) {
    try {
      const userData = JSON.parse(authHeader.replace('Bearer ', ''));
      user = userData;
    } catch (error) {
      // If simple auth fails, try OAuth auth
      const oauthUser = c.get("user");
      if (oauthUser) {
        user = oauthUser;
      }
    }
  }
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  try {
    const bookId = parseInt(c.req.param('bookId'));
    const db = await getDbManager();
    
    await db.userFavorites.deleteOne({
      user_id: user.id,
      book_id: bookId
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

// Admin verification endpoint
app.get('/api/admin/verify', authMiddleware, adminMiddleware, async (c) => {
  return c.json({ success: true });
});

// Simple admin verification endpoint
app.get('/api/simple-admin/verify', simpleAuthMiddleware, simpleAdminMiddleware, async (c) => {
  return c.json({ success: true });
});

// Mount database endpoints
const dbEndpoints = createDatabaseEndpoints(getDbManager);
app.route('/', dbEndpoints);

export default app;