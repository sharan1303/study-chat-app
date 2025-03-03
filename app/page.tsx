import type { Metadata } from "next"
import Link from "next/link"
import { GraduationCap, BookOpen, FileText, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "StudyAI - Your University Study Assistant",
  description: "AI-powered study assistant for university modules",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6" />
              <span className="font-bold">StudyAI</span>
            </Link>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/modules">Modules</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/resources">Resources</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/chat">Chat</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your AI Study Companion
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Chat with specialized AI agents for each of your university modules. Import your notes, slides, and
                  readings for personalized assistance.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/chat">Start Studying</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/modules">Browse Modules</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Smart Learning
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Study Smarter, Not Harder
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our AI agents understand your course materials and help you master difficult concepts through
                  interactive conversations.
                </p>
              </div>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Module-Specific Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Each university module has its own specialized AI agent that understands the specific curriculum
                      and learning objectives.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Import Your Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Upload lecture slides, notes, and reading materials to create a personalized knowledge base for
                      your AI assistants.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Interactive Learning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Ask questions, request explanations, and test your knowledge through natural conversations with
                      your AI study companions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2025 StudyAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Terms
            </Button>
            <Button variant="ghost" size="sm">
              Privacy
            </Button>
            <Button variant="ghost" size="sm">
              Contact
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

