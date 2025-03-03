import Link from "next/link"
import { ChevronRight, BookOpen, Upload, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ModulesPage() {
  const modules = [
    {
      id: "cs101",
      name: "Computer Science 101",
      description: "Introduction to programming concepts and algorithms",
      icon: "💻",
      progress: 65,
      resources: 12,
      lastStudied: "2 days ago",
    },
    {
      id: "math201",
      name: "Advanced Mathematics",
      description: "Calculus, linear algebra, and differential equations",
      icon: "🧮",
      progress: 42,
      resources: 8,
      lastStudied: "Yesterday",
    },
    {
      id: "phys150",
      name: "Physics Fundamentals",
      description: "Mechanics, thermodynamics, and electromagnetism",
      icon: "⚛️",
      progress: 78,
      resources: 15,
      lastStudied: "3 days ago",
    },
    {
      id: "bio220",
      name: "Molecular Biology",
      description: "Cell structure, DNA, and protein synthesis",
      icon: "🧬",
      progress: 30,
      resources: 10,
      lastStudied: "1 week ago",
    },
  ]

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Modules</h1>
          <p className="text-muted-foreground">Manage your study modules and resources</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Add New Module
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Modules</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">{module.icon}</div>
                      <CardTitle>{module.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <CardDescription className="mb-3">{module.description}</CardDescription>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>{module.resources} resources</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>{module.lastStudied}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between w-full">
                    <Button variant="outline" asChild>
                      <Link href={`/modules/${module.id}`}>Manage</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/chat?module=${module.id}`}>
                        Study Now
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="active">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Showing active modules only</p>
          </div>
        </TabsContent>
        <TabsContent value="archived">
          <div className="text-center py-10">
            <p className="text-muted-foreground">No archived modules</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

