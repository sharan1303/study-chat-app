# Study Chat - AI-Powered Personal Study Assistant

AI-powered study assistant application built with Next.js and Vercel AI SDK helping students learn and understand their university subjects through organised and interactive chat conversations.

## Project Overview

Study Chat provides an intelligent chat interface where students can:

- Study with AI assistants specialized for different modules
- Upload lecture notes and study materials
- Ask questions about specific selected documents
- Search the internet for additional resources
- Filter sources for academic papers
- Categorise conversations and documents into modules to reflect their curriculum

Using Vercel AI SDK to power conversations with AI models, it provides a good selection of models to use with a clean, modern UI built with shadcn/ui components.

[Production deployment can be found here at Study Chat App](https://study-chat-app.vercel.app/)

## Features

**Module Management**: Create, edit, and organise your chats into categories called modules with custom icons\
**AI Chat Interface**: Engage in natural conversations with AI about your study materials\
**Resource Library**: Browse and access study resources organised in categories\
**User Authentication**: Secure sign-in with Clerk authentication\
**Dynamic Rendering**: Fast, responsive interface with server-side rendering support\
**Chat History**: Save and browse previous conversations for easy reference\
**Collapsible Sidebar**: Improved UI with collapsible sidebar for better screen utilization\
**Profile Management**: Integrated Clerk user profile management\
**Responsive Design**: Optimized for both desktop and mobile devices

## Getting Started

To run the application locally, follow these steps:

First, run the development server

```shell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **AI Integration**: Vercel AI SDK
- **Database**: Prisma ORM with Supabase
- **AI Models**:
  - Primary: Gemini 2.0 Flash
  - Search: Perplexity API
- **State Management**: React Context API and Server-sent events (SSE)

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_database_url

# AI Models
GOOGLE_API_KEY=your_google_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Dynamic Rendering
NEXT_PUBLIC_FORCE_DYNAMIC=true
NEXT_PRIVATE_STANDALONE=1
```

## Project Structure

- `app/` - Next.js app router pages and API routes
  - `[moduleName]/` - Module-specific routes including chat
  - `api/` - Backend API endpoints for chat, modules, and resources
  - `chat/` - General chat interface
  - `modules/` - Module management UI
  - `settings/` - User settings and preferences
  - `ClientChatPage` - Client-side chat page interface
- `components/` - Reusable UI components
  - `ui/` - Shadcn UI components
  - User interface elements (Sidebar, Chat, etc.)
- `lib/` - Utility functions and shared code
  - Server-sent events (SSE) for real-time updates
  - Context providers
  - Helper functions
  - Session management
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Recent Updates

**Real-time Updates**: Implemented Server-Sent Events for real-time UI updates without page refreshes\
**Chat Management**: Added ability to delete individual chats and clear chat history\
**Anonymous Users Support**: Enhanced session management for both authenticated and anonymous users\
**Data Migration**: Added seamless migration of anonymous user data with event broadcasting\
**Session Persistence**: Improved session ID storage with localStorage and cookies for better reliability\
**UI Enhancements**: Updated confirmation dialogs and improved styling consistency\
**Error Handling**: Enhanced error handling and logging throughout the application

For a detailed list of recent commits merged from the dev branch to main, please see [UPDATES.md](./UPDATES.md).

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [Clerk Authentication](https://clerk.com/docs)

## Deployment Notes

The application is configured for dynamic rendering, which is essential for features that use authentication, headers, and search parameters. When deploying to Vercel or similar platforms:

1. Ensure the environment variables for dynamic rendering are set
2. The build process uses the `next.config.mjs` configuration for standalone output
3. All pages using `useSearchParams()` are wrapped in Suspense boundaries
4. For local development, use `npm run dev` which doesn't require static generation

## Database Schema

The application uses three primary models:

- **User**: Authenticated users with modules
- **Module**: Study modules with names, descriptions, and resources
- **Resource**: Study materials linked to specific modules
- **Chat**: User conversations with metadata and module associations

Each resource is associated with a module, and each module is associated with a user, creating a clean hierarchical structure. Chat history is also linked to modules when applicable.
