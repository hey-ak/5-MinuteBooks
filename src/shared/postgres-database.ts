import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, inArray, desc, asc } from 'drizzle-orm';
import * as schema from './schema';
import type { 
  Category as SchemaCategory,
  Book as SchemaBook,
  UserFavorite as SchemaUserFavorite,
  AdminUser as SchemaAdminUser,
  UploadedFile as SchemaUploadedFile,
  SearchHistory as SchemaSearchHistory,
  UserInteraction as SchemaUserInteraction,
  NewCategory,
  NewBook,
  NewUserFavorite,
  NewAdminUser,
  NewUploadedFile,
  NewSearchHistory,
  NewUserInteraction
} from './schema';

// Re-export the existing interfaces to maintain compatibility
export interface Category extends Omit<SchemaCategory, 'created_at' | 'updated_at'> {
  _id?: string;
  created_at: string;
  updated_at: string;
}

export interface Book extends Omit<SchemaBook, 'created_at' | 'updated_at' | 'is_published'> {
  _id?: string;
  is_published: number; // Keep as number for compatibility
  category_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite extends Omit<SchemaUserFavorite, 'created_at' | 'updated_at'> {
  _id?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser extends Omit<SchemaAdminUser, 'created_at' | 'updated_at'> {
  _id?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile extends Omit<SchemaUploadedFile, 'created_at' | 'file_data'> {
  _id?: string;
  file_data: ArrayBuffer; // Keep existing interface
  created_at: string;
}

export interface SearchHistory extends Omit<SchemaSearchHistory, 'created_at'> {
  _id?: string;
  created_at: string;
}

export interface UserInteraction extends Omit<SchemaUserInteraction, 'created_at'> {
  _id?: string;
  created_at: string;
}

// Collection interface - same as before
interface Collection<T> {
  find(filter?: Partial<T>): CollectionQuery<T>;
  findOne(filter: Partial<T>): Promise<T | null>;
  insertOne(doc: T): Promise<{ insertedId: string }>;
  insertMany(docs: T[]): Promise<{ insertedIds: string[] }>;
  updateOne(filter: Partial<T>, update: { $set: Partial<T> }): Promise<{ modifiedCount: number }>;
  deleteOne(filter: Partial<T>): Promise<{ deletedCount: number }>;
  deleteMany(filter: Partial<T>): Promise<{ deletedCount: number }>;
}

interface CollectionQuery<T> {
  sort(sortSpec: Record<string, 1 | -1>): CollectionQuery<T>;
  toArray(): Promise<T[]>;
}

class PostgresCollection<T extends { id?: number; _id?: string; created_at?: string; updated_at?: string }> implements Collection<T> {
  constructor(
    private db: ReturnType<typeof drizzle>,
    private table: any,
    private transformer: {
      toDb: (doc: T) => any;
      fromDb: (row: any) => T;
    }
  ) {}

  find(filter: Partial<T> = {}): CollectionQuery<T> {
    let sortOrder: 'asc' | 'desc' | null = null;
    let sortKey: string | null = null;
    
    const collectionQuery: CollectionQuery<T> = {
      sort: (sortSpec: Record<string, 1 | -1>) => {
        sortKey = Object.keys(sortSpec)[0];
        sortOrder = sortSpec[sortKey] === 1 ? 'asc' : 'desc';
        return collectionQuery;
      },
      toArray: async () => {
        const conditions = this.buildWhereConditions(filter);
        let query: any = this.db.select().from(this.table);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions) as any);
        }
        
        if (sortKey && this.table[sortKey]) {
          query = sortOrder === 'asc' 
            ? query.orderBy(asc(this.table[sortKey]))
            : query.orderBy(desc(this.table[sortKey]));
        }
        
        const rows = await query;
        return rows.map((row: any) => this.transformer.fromDb(row));
      }
    };
    
    return collectionQuery;
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const conditions = this.buildWhereConditions(filter);
    const query = conditions.length > 0
      ? this.db.select().from(this.table).where(and(...conditions) as any).limit(1)
      : this.db.select().from(this.table).limit(1);
    
    const rows = await query;
    return rows.length > 0 ? this.transformer.fromDb(rows[0]) : null;
  }

  async insertOne(doc: T): Promise<{ insertedId: string }> {
    const dbDoc = this.transformer.toDb(doc);
    const result = await this.db.insert(this.table).values(dbDoc).returning();
    const inserted = Array.isArray(result) ? result[0] : result;
    const id = inserted?.id?.toString() || Math.random().toString(36).substring(2);
    return { insertedId: id };
  }

  async insertMany(docs: T[]): Promise<{ insertedIds: string[] }> {
    const ids: string[] = [];
    for (const doc of docs) {
      const result = await this.insertOne(doc);
      ids.push(result.insertedId);
    }
    return { insertedIds: ids };
  }

  async updateOne(filter: Partial<T>, update: { $set: Partial<T> }): Promise<{ modifiedCount: number }> {
    const conditions = this.buildWhereConditions(filter);
    if (conditions.length === 0) return { modifiedCount: 0 };
    
    const dbUpdate = this.transformer.toDb(update.$set as T);
    // Add updated_at if not present
    if ('updated_at' in this.table && !dbUpdate.updated_at) {
      dbUpdate.updated_at = new Date().toISOString();
    }
    
    const result = await this.db
      .update(this.table)
      .set(dbUpdate)
      .where(and(...conditions) as any);
    
    return { modifiedCount: result.rowCount || 0 };
  }

  async deleteOne(filter: Partial<T>): Promise<{ deletedCount: number }> {
    const conditions = this.buildWhereConditions(filter);
    if (conditions.length === 0) return { deletedCount: 0 };
    
    const result = await this.db
      .delete(this.table)
      .where(and(...conditions) as any);
    
    return { deletedCount: result.rowCount || 0 };
  }

  async deleteMany(filter: Partial<T>): Promise<{ deletedCount: number }> {
    const conditions = this.buildWhereConditions(filter);
    if (conditions.length === 0) return { deletedCount: 0 };
    
    const result = await this.db
      .delete(this.table)
      .where(and(...conditions) as any);
    
    return { deletedCount: result.rowCount || 0 };
  }

  private buildWhereConditions(filter: Partial<T>): any[] {
    const conditions: any[] = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') continue; // Skip MongoDB-style _id
      
      if (typeof value === 'object' && value !== null && '$in' in value) {
        // Handle $in operator
        const inValues = (value as any).$in;
        if (this.table[key] && inValues.length > 0) {
          conditions.push(inArray(this.table[key], inValues));
        }
      } else if (this.table[key] && value !== undefined) {
        conditions.push(eq(this.table[key], value));
      }
    }
    
    return conditions;
  }
}

export class PostgresDatabaseManager {
  private db: ReturnType<typeof drizzle>;
  private connected: boolean = false;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema });
  }

  async connect(): Promise<void> {
    this.connected = true;
    // Initialize with sample data if needed
    await this.initializeData();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  private async initializeData(): Promise<void> {
    try {
      // Check if categories exist
      const existingCategories = await this.db.select().from(schema.categories).limit(1);
      
      if (existingCategories.length === 0) {
        // Initialize categories
        await this.db.insert(schema.categories).values([
          {
            name: 'Self Help',
            slug: 'self-help',
            description: 'Books focused on personal development and improvement',
          },
          {
            name: 'Business',
            slug: 'business',
            description: 'Books about entrepreneurship, leadership, and business strategy',
          },
          {
            name: 'Productivity',
            slug: 'productivity',
            description: 'Books about time management, efficiency, and getting things done',
          },
          {
            name: 'Psychology',
            slug: 'psychology',
            description: 'Books exploring human behavior and mental processes',
          },
          {
            name: 'Philosophy',
            slug: 'philosophy',
            description: 'Books about fundamental questions of existence and meaning',
          }
        ]);

        // Initialize admin user
        await this.db.insert(schema.adminUsers).values({
          user_id: 'admin-1',
        });
      }
    } catch (error) {
      console.error('Failed to initialize data:', error);
      // Don't throw - this might be a schema issue that gets resolved
    }
  }

  // Collection getters with transformers
  get categories(): Collection<Category> {
    return new PostgresCollection(this.db, schema.categories, {
      toDb: (doc: Category) => ({
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
        updated_at: doc.updated_at ? new Date(doc.updated_at) : new Date(),
      }),
      fromDb: (row: SchemaCategory) => ({
        ...row,
        _id: row.id.toString(),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })
    });
  }

  get books(): Collection<Book> {
    return new PostgresCollection(this.db, schema.books, {
      toDb: (doc: Book) => ({
        ...doc,
        is_published: doc.is_published === 1,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
        updated_at: doc.updated_at ? new Date(doc.updated_at) : new Date(),
      }),
      fromDb: (row: SchemaBook) => ({
        ...row,
        _id: row.id.toString(),
        is_published: row.is_published ? 1 : 0,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })
    });
  }

  get userFavorites(): Collection<UserFavorite> {
    return new PostgresCollection(this.db, schema.userFavorites, {
      toDb: (doc: UserFavorite) => ({
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
        updated_at: doc.updated_at ? new Date(doc.updated_at) : new Date(),
      }),
      fromDb: (row: SchemaUserFavorite) => ({
        ...row,
        _id: row.id.toString(),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })
    });
  }

  get adminUsers(): Collection<AdminUser> {
    return new PostgresCollection(this.db, schema.adminUsers, {
      toDb: (doc: AdminUser) => ({
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
        updated_at: doc.updated_at ? new Date(doc.updated_at) : new Date(),
      }),
      fromDb: (row: SchemaAdminUser) => ({
        ...row,
        _id: row.id.toString(),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })
    });
  }

  get uploadedFiles(): Collection<UploadedFile> {
    return new PostgresCollection(this.db, schema.uploadedFiles, {
      toDb: (doc: UploadedFile) => ({
        ...doc,
        r2_key: `files/${doc.filename}`, // Store in R2
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
      }),
      fromDb: (row: SchemaUploadedFile) => ({
        ...row,
        _id: row.id.toString(),
        file_data: new ArrayBuffer(0), // Will be loaded from R2 when needed
        created_at: row.created_at.toISOString(),
      })
    });
  }

  get searchHistory(): Collection<SearchHistory> {
    return new PostgresCollection(this.db, schema.searchHistory, {
      toDb: (doc: SearchHistory) => ({
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
      }),
      fromDb: (row: SchemaSearchHistory) => ({
        ...row,
        _id: row.id.toString(),
        created_at: row.created_at.toISOString(),
      })
    });
  }

  get userInteractions(): Collection<UserInteraction> {
    return new PostgresCollection(this.db, schema.userInteractions, {
      toDb: (doc: UserInteraction) => ({
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at) : undefined,
      }),
      fromDb: (row: SchemaUserInteraction) => ({
        ...row,
        _id: row.id.toString(),
        created_at: row.created_at.toISOString(),
      })
    });
  }

  // Helper method to get next ID - now handled by PostgreSQL SERIAL
  async getNextId(collectionName: string): Promise<number> {
    // For PostgreSQL, we don't need to manually manage IDs
    // But we keep this method for compatibility
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  // Create database tables
  async createIndexes(): Promise<void> {
    // Indexes are created automatically by the database schema
    // This method is kept for compatibility
  }
}
