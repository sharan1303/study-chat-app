# StudyAI - AI-Powered Study Assistant

This is an AI-powered study assistant application built with Next.js that helps students learn and understand their university modules through interactive chat conversations.

## Project Overview

StudyAI provides an intelligent chat interface where students can:

- Ask questions about their course materials
- Get explanations for complex concepts
- Study with AI assistants specialized for different modules
- Access their study modules and resources in one place

The application uses the Vercel AI SDK to power conversations with AI models and provides a clean, modern UI built with shadcn/ui components.

## Features

- **AI Chat Interface**: Engage in natural conversations with AI about your study materials
- **Module-Specific Assistants**: Each module has its own specialized AI assistant
- **Resource Management**: Upload and organize study materials
- **Progress Tracking**: Monitor your learning progress across different modules

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **AI Integration**: Vercel AI SDK
- **Database**: Prisma with Supabase
- **Search**: Perplexity API

## Environment Variables

Create a `.env.local` file with the following variables:

```
GOOGLE_API_KEY=your_google_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
DATABASE_URL=your_database_url
```

## Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - Reusable UI components
- `lib/` - Utility functions and shared code
- `prisma/` - Database schema and migrations

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs)

## Todo List

- [ ] Implement user authentication and profiles
- [ ] Add file upload functionality for study materials
- [ ] Create a dashboard for tracking study progress
- [ ] Implement module creation and customization
- [ ] Add support for more AI models
- [ ] Improve search capabilities with better context handling
- [ ] Create mobile-responsive design improvements
- [ ] Add unit and integration tests
- [ ] Implement data persistence for chat history
- [ ] Add export functionality for chat conversations
- [ ] Create admin panel for managing modules and resources
- [ ] Implement collaborative study sessions
