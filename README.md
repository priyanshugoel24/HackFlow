# ContextBoard

A Next.js application with authentication and status management.

## Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd contextboard
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Random secret for NextAuth (generate with `openssl rand -base64 32`)
   - `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: From GitHub OAuth App
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google OAuth App

3. **Database Setup**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## OAuth Provider Setup

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### Google OAuth
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Set Authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env.local`

## Troubleshooting

### "Not authenticated" Error
- Ensure your OAuth providers are properly configured
- Check that `.env.local` has all required variables
- Verify your OAuth callback URLs match your domain
- Try signing out and signing back in

### Database Connection Issues
- Check your `DATABASE_URL` in `.env.local`
- Ensure your PostgreSQL database is running
- Run `npx prisma migrate deploy` to ensure schema is up-to-date

### Development Server Issues
- If port 3000 is occupied, Next.js will use port 3001
- Update your OAuth callback URLs accordingly
- Clear browser cache and cookies for localhost

## Features

- **Authentication**: GitHub and Google OAuth
- **Status Management**: Available, Busy, Focused states
- **Project Management**: Create, update, and delete projects
- **Context Cards**: Create and manage context cards with rich content
- **Project-Context Card Relationships**: Link context cards to specific projects
- **User Dashboard**: View and update your status
- **Database**: PostgreSQL with Prisma ORM

## API Endpoints

### Authentication
- `/api/auth/[...nextauth]` - NextAuth endpoints

### Status Management
- `GET /api/status` - Get current user status
- `POST /api/status` - Update user status

### Projects
- `GET /api/projects` - Get all projects for the user
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get a specific project with its context cards
- `PATCH /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project
- `GET /api/projects/[id]/context-cards` - Get context cards for a specific project

### Context Cards
- `GET /api/context-cards` - Get all context cards for the user
- `POST /api/context-cards` - Create a new context card (can optionally link to a project)
- `PATCH /api/context-cards/[id]` - Update a context card
- `DELETE /api/context-cards/[id]` - Delete a context card

## Routes

### Dynamic Routes
- `/projects/[id]` - Individual project page showing project details and context cards
- `/` - Main dashboard with project grid and sidebar

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts       # NextAuth handlers
│   │   ├── status/route.ts                   # Status API
│   │   ├── projects/
│   │   │   ├── route.ts                      # Projects CRUD
│   │   │   └── [id]/
│   │   │       ├── route.ts                  # Individual project operations
│   │   │       └── context-cards/route.ts   # Project-specific context cards
│   │   └── context-cards/
│   │       ├── route.ts                      # Context cards CRUD
│   │       └── [id]/route.ts                 # Individual context card operations
│   ├── layout.tsx                            # Root layout
│   └── page.tsx                              # Home page
├── components/
│   ├── AuthStatus.tsx                        # Auth component
│   ├── Navbar.tsx                            # Navigation bar
│   ├── LoginPage.tsx                         # Login page
│   └── providers.tsx                         # Session provider
├── lib/
│   ├── auth.ts                               # NextAuth configuration
│   └── prisma.ts                             # Prisma client
├── types/
│   └── next-auth.d.ts                        # NextAuth types
└── prisma/
    └── schema.prisma                         # Database schema
```
