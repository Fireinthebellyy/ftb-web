# Comment Section Feature Implementation

## Overview
This document describes the implementation of the comment section feature for opportunities in the FTB Web application.

## Features Implemented

### ✅ Functional Requirements
- [x] Users can post a comment under a specific post/item
- [x] Comments display username, timestamp, and content
- [x] Comments are ordered by newest first
- [x] Input box supports basic validation (non-empty, max length 1000 chars)
- [x] Loading and error states are handled during submit/fetch/delete

### ✅ UI/UX Requirements
- [x] Comment box is visible below the post (when expanded)
- [x] Loading spinner/skeleton while fetching comments
- [x] Toast notifications on successful submit/delete
- [x] Auto-clear input box after successful submission

### ✅ Technical Requirements
- [x] Comments are sanitized before saving to database
- [x] Full CRUD operations (Create, Read, Delete)
- [x] Optimistic updates for better UX
- [x] Proper error handling and user feedback

## Architecture

### Database Schema
The comments are stored in a `comments` table with the following structure:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE
);
```

### API Endpoints
- `GET /api/opportunities/[id]/comments` - Fetch comments for an opportunity
- `POST /api/opportunities/[id]/comments` - Create a new comment
- `DELETE /api/opportunities/[id]/comments/[commentId]` - Delete a comment

### Frontend Components
- `CommentSection` - Main component that manages the comment section
- `CommentItem` - Individual comment display component
- `CommentInput` - Comment creation form

### React Query Integration
- `useComments(opportunityId)` - Fetch comments with caching
- `useCreateComment(opportunityId)` - Create comment with optimistic updates
- `useDeleteComment(opportunityId)` - Delete comment with optimistic updates

## Usage

### In OpportunityCard
The comment section is automatically included in each opportunity card:

```tsx
<OpportunityCard opportunity={opportunity} />
```

### Standalone Usage
You can also use the comment section independently:

```tsx
<CommentSection opportunityId={opportunityId} />
```

## Features

### Comment Creation
- Real-time validation (non-empty, max 1000 characters)
- Content sanitization to prevent XSS
- Optimistic updates for instant feedback
- Toast notifications for success/error states

### Comment Display
- Shows user avatar (or initials fallback)
- Displays username and timestamp
- Responsive design for mobile and desktop
- Collapsible interface to save space

### Comment Management
- Users can only delete their own comments
- Confirmation through toast notifications
- Optimistic deletion for better UX

### Authentication
- Comments require user authentication
- Unauthenticated users see a login prompt
- User avatars and names are displayed from the auth session

## Security Features
- Content sanitization to prevent XSS attacks
- User authorization for comment deletion
- Input validation and length limits
- SQL injection prevention through parameterized queries

## Performance Optimizations
- React Query caching for comments
- Optimistic updates for better perceived performance
- Lazy loading of comment section (collapsible)
- Efficient re-renders with proper React patterns

## Mobile Responsiveness
- Responsive design that works on all screen sizes
- Touch-friendly interface
- Optimized spacing and typography for mobile
- Collapsible interface to save screen space

## Future Enhancements
- Comment editing functionality
- Comment replies/threading
- Comment moderation features
- Rich text formatting
- Comment notifications
- Comment search functionality
