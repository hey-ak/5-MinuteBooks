// Simple in-memory database that mimics MongoDB API for Cloudflare Workers
export interface Category {
  _id?: string;
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  _id?: string;
  id: number;
  title: string;
  author: string;
  description: string | null;
  cover_image_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  category_id: number | null;
  category_name?: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  _id?: string;
  id: number;
  user_id: string;
  book_id: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  _id?: string;
  id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  _id?: string;
  id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_data: ArrayBuffer;
  created_at: string;
}

export interface SearchHistory {
  _id?: string;
  id: number;
  user_id: string | null;
  search_term: string;
  results_count: number;
  created_at: string;
}

export interface UserInteraction {
  _id?: string;
  id: number;
  user_id: string;
  book_id: number;
  interaction_type: string;
  created_at: string;
}

// Simple collection interface
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

// In-memory storage
const storage: Record<string, any[]> = {
  categories: [],
  books: [],
  user_favorites: [],
  admin_users: [],
  uploaded_files: [],
  search_history: [],
  user_interactions: [],
  counters: []
};

// Initialize with sample data
function initializeData() {
  if (storage.categories.length === 0) {
    // Initialize counters
    storage.counters = [
      { _id: 'categories', sequence_value: 5 },
      { _id: 'books', sequence_value: 0 },
      { _id: 'user_favorites', sequence_value: 0 },
      { _id: 'admin_users', sequence_value: 1 },
      { _id: 'uploaded_files', sequence_value: 0 },
      { _id: 'search_history', sequence_value: 0 },
      { _id: 'user_interactions', sequence_value: 0 }
    ];

    // Initialize categories
    storage.categories = [
      {
        id: 1,
        name: 'Self Help',
        slug: 'self-help',
        description: 'Books focused on personal development and improvement',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Business',
        slug: 'business',
        description: 'Books about entrepreneurship, leadership, and business strategy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Productivity',
        slug: 'productivity',
        description: 'Books about time management, efficiency, and getting things done',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Psychology',
        slug: 'psychology',
        description: 'Books exploring human behavior and mental processes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Philosophy',
        slug: 'philosophy',
        description: 'Books about fundamental questions of existence and meaning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Initialize admin user
    storage.admin_users = [
      {
        id: 1,
        user_id: 'admin-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

class SimpleCollection<T extends { id?: number }> implements Collection<T> {
  constructor(private collectionName: string) {
    initializeData();
  }

  find(filter: Partial<T> = {}): CollectionQuery<T> {
    const data = storage[this.collectionName] || [];
    let results = data.filter(item => this.matchesFilter(item, filter));
    
    const query: CollectionQuery<T> = {
      sort: (sortSpec: Record<string, 1 | -1>) => {
        const sortKey = Object.keys(sortSpec)[0];
        const sortOrder = sortSpec[sortKey];
        
        results = results.sort((a, b) => {
          const aVal = a[sortKey];
          const bVal = b[sortKey];
          
          if (aVal < bVal) return sortOrder === 1 ? -1 : 1;
          if (aVal > bVal) return sortOrder === 1 ? 1 : -1;
          return 0;
        });
        
        return query;
      },
      toArray: async () => results
    };
    
    return query;
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const data = storage[this.collectionName] || [];
    const result = data.find(item => this.matchesFilter(item, filter));
    return result || null;
  }

  async insertOne(doc: T): Promise<{ insertedId: string }> {
    if (!storage[this.collectionName]) {
      storage[this.collectionName] = [];
    }
    
    const id = Math.random().toString(36).substring(2);
    const docWithId = { ...doc, _id: id };
    storage[this.collectionName].push(docWithId);
    
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
    const data = storage[this.collectionName] || [];
    const index = data.findIndex(item => this.matchesFilter(item, filter));
    
    if (index !== -1) {
      data[index] = { ...data[index], ...update.$set };
      return { modifiedCount: 1 };
    }
    
    return { modifiedCount: 0 };
  }

  async deleteOne(filter: Partial<T>): Promise<{ deletedCount: number }> {
    const data = storage[this.collectionName] || [];
    const index = data.findIndex(item => this.matchesFilter(item, filter));
    
    if (index !== -1) {
      data.splice(index, 1);
      return { deletedCount: 1 };
    }
    
    return { deletedCount: 0 };
  }

  async deleteMany(filter: Partial<T>): Promise<{ deletedCount: number }> {
    const data = storage[this.collectionName] || [];
    const initialLength = data.length;
    
    storage[this.collectionName] = data.filter(item => !this.matchesFilter(item, filter));
    
    return { deletedCount: initialLength - storage[this.collectionName].length };
  }

  private matchesFilter(item: any, filter: Partial<T>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$in') {
        // Handle $in operator
        continue;
      }
      
      if (typeof value === 'object' && value !== null && '$in' in value) {
        // Handle field: { $in: [values] }
        const inValues = (value as any).$in;
        if (!inValues.includes(item[key])) {
          return false;
        }
      } else if (item[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

export class DatabaseManager {
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
    initializeData();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  // Collection getters
  get categories(): Collection<Category> {
    return new SimpleCollection<Category>('categories');
  }

  get books(): Collection<Book> {
    return new SimpleCollection<Book>('books');
  }

  get userFavorites(): Collection<UserFavorite> {
    return new SimpleCollection<UserFavorite>('user_favorites');
  }

  get adminUsers(): Collection<AdminUser> {
    return new SimpleCollection<AdminUser>('admin_users');
  }

  get uploadedFiles(): Collection<UploadedFile> {
    return new SimpleCollection<UploadedFile>('uploaded_files');
  }

  get searchHistory(): Collection<SearchHistory> {
    return new SimpleCollection<SearchHistory>('search_history');
  }

  get userInteractions(): Collection<UserInteraction> {
    return new SimpleCollection<UserInteraction>('user_interactions');
  }

  // Helper method to get next ID for a collection
  async getNextId(collectionName: string): Promise<number> {
    const counters = storage.counters || [];
    let counter = counters.find(c => c._id === collectionName);
    
    if (!counter) {
      counter = { _id: collectionName, sequence_value: 1 };
      counters.push(counter);
    } else {
      counter.sequence_value += 1;
    }
    
    return counter.sequence_value;
  }

  // Create indexes (no-op for in-memory database)
  async createIndexes(): Promise<void> {
    // No-op for in-memory database
  }
}