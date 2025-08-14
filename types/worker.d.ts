// Worker configuration types for Cloudflare Workers
declare global {
  interface Env {
    // Environment variables
    MONGODB_CONNECTION_STRING?: string;
    MONGODB_DATABASE_NAME?: string;
    
    // Mocha Users Service
    MOCHA_USERS_SERVICE_API_URL?: string;
    MOCHA_USERS_SERVICE_API_KEY?: string;
    
    // Database binding (if using D1)
    DB?: any;
  }
}

export {};
