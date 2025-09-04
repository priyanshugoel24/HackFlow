# HackFlow

HackFlow is a powerful team-based productivity and collaboration platform designed for developers, product teams, and hackathon enthusiasts. It combines task management, decision logging, AI-assisted workflows, and real-time collaboration into a single, seamless experience.

---

## 🚀 Features

### 🧩 Team & Project Management
- **Team Layer**: Create and manage multiple teams, each containing several projects.
- **Team Roles**: Owner and Member roles with scoped permissions.
- **Invite Members**: Add collaborators via email with team-level access control.
- **Online Presence**: See who's online and editing in real-time across teams.

### 📌 Context Cards
- **Types**: Cards can be tagged as Tasks, Insights, Decisions, or general Notes.
- **Mentions & Assignments**: Mention teammates and assign cards within team scope.
- **Tags & Filtering**: Organize cards using tags and rich filters.
- **Archiving**: Archive and restore completed or outdated cards.

### 📚 Real-Time Collaboration
- **Live Editing**: Google Docs-style collaborative editing using CRDT and Ably + Yjs.
- **Cursors & Awareness**: View others’ cursors and editing status in real-time.
- **Presence Indicators**: Know who is editing or online in a specific card.

### ⚡ Focus & Hackathon Modes
- **Focus Mode**: Pomodoro-style immersive mode for selected cards with time tracking, session summaries, and progress charts.
- **Hackathon Mode**: Dedicated productivity mode for sprints and hackathons, scoped to teams.
- **Progress Tracking**: Project-level progress bars based on completed task cards.

### 🧠 AI Integrations
- **Standup Digest**: Auto-generated summaries of team activity.
- **Contextual Assistant**: AI assistant to help write, summarize, or brainstorm inside cards.
- **Meeting Note Generator**: Convert discussions or notes into structured meeting summaries.
- **Smart Card Creation**: Generate new cards based on meeting transcripts or AI inputs.

### 🔍 Universal Search
- **Fuzzy Matching**: Search across cards, members, projects, and tags.
- **AI Search Mode**: Switch to Ask-AI mode for contextual information retrieval.

### 📊 Analytics Dashboard
- **Team Analytics**: Project progress, task velocity, and activity insights.
- **Project Health**: Card-type breakdowns and completion metrics.

### 💬 Comments & Threads
- **Threaded Discussions**: Add comment threads on each context card.
- **Mentions & Editing**: Mention users, edit or delete comments, and view timestamps.
- **Real-Time Sync**: Comments sync live using Ably.

---

## 🧠 Terminology

- **Team**: A group of collaborators working on multiple projects.
- **Project**: A container of context cards under a specific initiative.
- **Context Card**: A unit of thought like a task, insight, or decision.
- **Assigned Cards**: Task-type cards assigned to or mentioning you.
- **Focus Mode**: A distraction-free modal for deep work on selected cards.
- **Hackathon Mode**: A productivity mode tailored for sprints or timed competitions.

---

## 🧱 Tech Stack

- **Framework**: Next.js 15 with App Router and Server Components
- **Language**: TypeScript + SQL + React
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js (JWT)
- **File Storage**: Supabase Storage
- **Realtime Sync**: Ably Realtime
- **AI Features**: Gemini API
- **UI & Styling**: Tailwind CSS + ShadCN UI
- **Search**: Fuse.js
- **State Management**: Zustand
- **Deployment**: Vercel
