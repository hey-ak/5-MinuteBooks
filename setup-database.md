# Database Setup Guide

## Quick Start

The application now uses an in-memory database that's compatible with Cloudflare Workers. No external database setup is required!

## 1. Start the Application

```bash
npm run dev
```

That's it! The database will be automatically initialized with sample data.

## 2. Verify Setup

1. Check that categories are loading on the home page
2. Try logging in as admin (email: akshay@admin.com, password: akshay@admin)
3. Verify that the admin dashboard loads
4. Test file upload functionality by adding a new book

## What's Included

- **Sample Categories**: 5 pre-loaded categories (Self Help, Business, Productivity, Psychology, Philosophy)
- **Admin User**: Pre-configured admin account (email: akshay@admin.com, password: akshay@admin)
- **File Upload**: Working file upload with 100MB limit
- **All Features**: Categories, books, favorites, admin panel all working

## Database Features

- **In-Memory Storage**: Fast, no external dependencies
- **MongoDB-like API**: Familiar query interface
- **Auto-incrementing IDs**: Proper ID management
- **File Storage**: Binary file storage in memory (up to 100MB per file)
- **Data Persistence**: Data persists during development session

## Production Considerations

For production, you may want to:
1. Use a persistent database like MongoDB Atlas, PostgreSQL, or similar
2. Implement proper file storage (Cloudflare R2, AWS S3, etc.)
3. Add data backup and recovery mechanisms

## Troubleshooting

### Application Won't Start
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run check`

### File Upload Issues
- Files are stored in memory with 100MB limit
- Supported formats: JPEG, PNG, WebP for images; MP3, WAV, M4A for audio
- Files are served with proper caching headers

### Admin Access Issues
- Use exact credentials: email: `akshay@admin.com`, password: `akshay@admin`
- Make sure you're using the admin login form, not regular user login
- Admin accounts cannot be created through signup - they are pre-configured

## What's Different from MongoDB

- **No External Database**: Everything runs in-memory
- **Cloudflare Workers Compatible**: Works with the Cloudflare Workers runtime
- **Simplified Setup**: No database installation or configuration needed
- **Development Focused**: Perfect for development and testing
- **Easy Migration**: Can be easily migrated to a real database later