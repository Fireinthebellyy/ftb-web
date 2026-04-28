# Admin Controls System - Complete Guide

## Overview

The new admin control system provides comprehensive management of internships through a single unified interface. Moderators (admin/editor roles) can now control all aspects of an internship's visibility, ordering, and lifecycle through the **Admin Controls Modal**.

## Features

### 1. **Visibility Management**
   - **Active/Inactive**: Show or hide the internship on the platform
   - **Trending**: Mark internship as trending to highlight it prominently
   - **Featured Home**: Feature the internship on the homepage

### 2. **Ordering & Indexing**
   - **Display Index**: Controls general ordering (lower numbers appear first)
   - **Trending Index**: Controls ordering within trending section
   - **Featured Home Index**: Controls ordering within featured section

### 3. **Deletion**
   - **Soft Delete**: Permanently remove internship (with confirmation dialog)
   - Non-destructive - records are maintained in database for auditing

## User Interface

### Location
- **Desktop Header**: Settings icon (⚙️) in the internship detail page header
- **Only Visible To**: Admin and Editor roles

### Modals
- **Admin Controls Modal**: Tabbed interface with 3 tabs:
  1. **Visibility** - Boolean toggles for visibility settings
  2. **Ordering** - Numeric inputs for index values
  3. **Danger** - Delete functionality with confirmation

## API Endpoints

### PATCH /api/internships/[id]
Updates internship properties

**Required Role**: Admin or Editor

**Payload Examples**:

```json
{
  "display_index": 1,
  "trending_index": 5,
  "featured_home_index": 2,
  "isTrending": true,
  "isFeaturedHome": true,
  "isActive": true
}
```

### DELETE /api/internships/[id]
Soft deletes the internship

**Required Role**: Admin or Editor

**Response**:
```json
{
  "success": true
}
```

## Database Schema

### Internships Table Columns
```sql
- display_index: integer (nullable)
- trending_index: integer (nullable)
- featured_home_index: integer (nullable)
- is_trending: boolean (default: false)
- is_featured_home: boolean (default: false)
- isActive: boolean (default: true)
- deletedAt: timestamp (nullable, for soft delete)
```

## Implementation Details

### Components

#### 1. **AdminControlsModal.tsx**
- Main modal component with tabbed interface
- Manages all admin state and API interactions
- Handles delete confirmation dialog
- Features:
  - Optimistic UI updates
  - Error handling with rollback
  - Loading states
  - Toast notifications

#### 2. **InternshipDesktopHeader.tsx**
- Updated to use single admin button (Settings icon)
- Replaces individual trending/featured buttons
- Cleaner UI with reduced button clutter

#### 3. **Internship Detail Page**
- Integrated AdminControlsModal
- State management for modal open/close
- Delegates all admin operations to modal

### State Management
```typescript
// Modal open/close
const [adminModalOpen, setAdminModalOpen] = useState(false);

// Modal fields (managed within AdminControlsModal)
const [displayIndex, setDisplayIndex] = useState<number>(0);
const [trendingIndex, setTrendingIndex] = useState<number>(0);
const [featuredIndex, setFeaturedIndex] = useState<number>(0);
const [isTrending, setIsTrending] = useState<boolean>(false);
const [isFeatured, setIsFeatured] = useState<boolean>(false);
const [isActive, setIsActive] = useState<boolean>(true);
```

## Usage Flow

### For Moderators:
1. Navigate to internship detail page
2. Click the Settings (⚙️) icon in the header (appears only for admins/editors)
3. Modal opens with three tabs:
   - **Visibility Tab**: Toggle trending, featured, and active status
   - **Ordering Tab**: Adjust display indices to reorder internships
   - **Danger Tab**: Delete the internship with confirmation
4. Click "Save Changes" to apply updates
5. Toast notification confirms success/failure

### For Users:
- No changes visible - internships are managed transparently
- Admin controls don't affect user-facing content directly
- Changes take effect immediately

## Error Handling

### Authorization Errors
- **401**: User not authenticated
- **403**: User lacks moderator permissions
- Shows toast error: "Unauthorized" or "Forbidden"

### Validation Errors
- Invalid indices show inline error messages
- Form submission blocked until valid
- User-friendly error messages

### Network Errors
- Automatic rollback of optimistic UI updates
- Detailed error toast notifications
- Console logging for debugging

## Performance Considerations

### Optimistic Updates
- UI updates immediately on user action
- Rollback on API failure
- Improved perceived performance

### Debouncing
- Index input changes don't trigger debouncing
- Changes batch on Save button click
- Reduces unnecessary API calls

## Security

### Access Control
- Only admins/editors can see the admin button
- API enforces role-based access
- Soft deletes maintain audit trail

### Input Validation
- All numeric inputs validated
- Display indices checked for valid integers
- API-side validation in PATCH handler

## Migration Guide (from old system)

### Old System
```typescript
// Separate toggle buttons
<Button onClick={onToggleTrending}>Trending</Button>
<Button onClick={onToggleFeatured}>Featured</Button>
<Button onClick={onEditClick}>Edit</Button>
```

### New System
```typescript
// Single admin button
<Button onClick={() => setAdminModalOpen(true)}>
  <Settings /> Admin
</Button>
```

### Benefits
- ✅ Unified interface
- ✅ Less cluttered UI
- ✅ Full control in one place
- ✅ Easier to manage
- ✅ Delete functionality integrated

## Future Enhancements

1. **Bulk Actions**: Manage multiple internships at once
2. **Scheduling**: Set future dates for visibility changes
3. **Audit Log**: Track all admin changes
4. **Analytics**: View impact of admin changes
5. **Templates**: Save and apply index presets
6. **Automation**: Rules-based automatic positioning

## Troubleshooting

### Button Not Showing
- **Check**: Are you logged in as admin/editor?
- **Solution**: Use admin account or check role assignment

### Changes Not Saving
- **Check**: Are there validation errors in console?
- **Solution**: Review error message and correct inputs

### Modal Won't Close
- **Check**: Is a request still in progress?
- **Solution**: Wait for save operation to complete

### Index Changes Not Working
- **Check**: Are indices negative or invalid?
- **Solution**: Use positive integer values only

## Files Modified

1. **components/internship/AdminControlsModal.tsx** (NEW)
   - Complete modal component with all functionality

2. **components/internship/InternshipDesktopHeader.tsx**
   - Updated props interface
   - Replaced individual toggle buttons with admin button
   - Simplified button logic

3. **app/intern/[id]/page.tsx**
   - Added AdminControlsModal import
   - Added adminModalOpen state
   - Removed unused toggle functions
   - Integrated modal into layout

4. **app/api/internships/[id]/route.ts**
   - Existing PATCH handler supports all new fields
   - Existing DELETE handler already implemented
   - No changes needed

## Related Endpoints

- `GET /api/internships/[id]` - Fetch internship details
- `PATCH /api/internships/[id]` - Update internship
- `PUT /api/internships/[id]` - Full update
- `DELETE /api/internships/[id]` - Soft delete

## Database Impact

- No new tables created
- Existing columns used
- Soft delete approach (deletedAt flag)
- Backward compatible with existing queries

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Created by**: Admin Control System Implementation
