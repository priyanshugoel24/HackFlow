# Testing the New Schema Relationships

## What Changed in the Schema

### ContextCard Model
- Added `projectId` field (optional) to link context cards to projects
- Added `project` relation to reference the associated project

### Project Model
- Added `contextCards` relation (one-to-many) to reference related context cards

## API Endpoints That Support the New Relationships

### 1. Create Context Card with Project Link
```bash
POST /api/context-cards
Content-Type: application/json

{
  "title": "Test Card",
  "content": "This is a test card",
  "projectId": "project-id-here"
}
```

### 2. Update Context Card to Link/Unlink Project
```bash
PATCH /api/context-cards/[cardId]
Content-Type: application/json

{
  "projectId": "new-project-id"
}
```

### 3. Get Context Cards for a Specific Project
```bash
GET /api/projects/[projectId]/context-cards
```

### 4. Update Context Card to Remove Project Link
```bash
PATCH /api/context-cards/[cardId]
Content-Type: application/json

{
  "projectId": null
}
```

## Test the Relationships

1. **Create a Project**:
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Project", "link": "https://example.com"}'
   ```

2. **Create a Context Card linked to the Project**:
   ```bash
   curl -X POST http://localhost:3000/api/context-cards \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Card", "content": "Test content", "projectId": "PROJECT_ID_FROM_STEP_1"}'
   ```

3. **Get Context Cards for the Project**:
   ```bash
   curl -X GET http://localhost:3000/api/projects/PROJECT_ID_FROM_STEP_1/context-cards
   ```

4. **Update Context Card to change project**:
   ```bash
   curl -X PATCH http://localhost:3000/api/context-cards/CARD_ID_FROM_STEP_2 \
     -H "Content-Type: application/json" \
     -d '{"projectId": "DIFFERENT_PROJECT_ID"}'
   ```

## Expected Behavior

- Context cards can be created without a project (projectId = null)
- Context cards can be linked to projects during creation or update
- Getting context cards for a project returns only cards linked to that project
- Deleting a project will cascade delete all linked context cards
- Updating a context card can change its project association
- Clicking on a project card navigates to `/projects/[id]` route showing project details and context cards
- Project sidebar also navigates to the dynamic route when project is selected

## Dynamic Routes

### Project Details Page
- **Route**: `/projects/[id]`
- **Description**: Shows individual project details with all its context cards
- **Features**: 
  - Project header with name, description, members, tags
  - Back navigation to main dashboard
  - Context cards list for the specific project
  - Project settings and external link access
