# Study Chat - AI-Powered Study Assistant

This is an AI-powered study assistant application built with Next.js that helps students learn and understand their university modules through interactive chat conversations.

## Project Overview

Study Chat provides an intelligent chat interface where students can:

- Ask questions about their course materials
- Get explanations for complex concepts
- Study with AI assistants specialized for different modules
- Access their study modules and resources in one place
- Track chat history across different modules

The application uses the Vercel AI SDK to power conversations with AI models and provides a clean, modern UI built with shadcn/ui components.

[Production deployment can be found here at Study Chat](https://study-chat-app.vercel.app/)

## Features

- **Module Management**: Create, edit, and organize study modules with custom icons
- **AI Chat Interface**: Engage in natural conversations with AI about your study materials
- **Resource Library**: Browse and access study resources organized by module
- **User Authentication**: Secure sign-in with Clerk authentication
- **Dynamic Rendering**: Fast, responsive interface with server-side rendering support
- **Chat History**: Save and browse previous conversations for easy reference
- **Collapsible Sidebar**: Improved UI with collapsible sidebar for better screen utilization
- **Profile Management**: Integrated Clerk user profile management
- **Responsive Design**: Optimized for both desktop and mobile devices

## Getting Started

To run the application locally, follow these steps:

First, run the development server

```shell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **AI Integration**: Vercel AI SDK
- **Database**: Prisma with Supabase
- **AI Models**:
  - Primary: Gemini 2.0 Flash
  - Search: Perplexity API
- **State Management**: React Context API

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
- `components/` - Reusable UI components
  - `ui/` - Shadcn UI components
  - User interface elements (Sidebar, Chat, etc.)
- `lib/` - Utility functions and shared code
  - Context providers
  - Helper functions
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Recent Updates

- **Sidebar Improvements**: Enhanced sidebar with collapsible functionality and animations
- **State Management**: Implemented context-based state management for sidebar
- **Chat History**: Added chat history display in the sidebar
- **User Settings**: Integrated Clerk user profile management in settings page
- **Header Alignment**: Fixed alignment issues across different pages
- **UI Enhancements**: Improved styling and layout consistency

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
4. For local development, use `bun dev` which doesn't require static generation

## Database Schema

The application uses three primary models:

- **User**: Authenticated users with modules
- **Module**: Study modules with names, descriptions, and resources
- **Resource**: Study materials linked to specific modules
- **Chat**: User conversations with metadata and module associations

Each resource is associated with a module, and each module is associated with a user, creating a clean hierarchical structure. Chat history is also linked to modules when applicable.
