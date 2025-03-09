"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Schema for resource creation
const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  type: z.string().min(1, "Please select a resource type"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  moduleId: z.string().min(1, "Please select a module"),
});

// Resource types
const resourceTypes = [
  { value: "pdf", label: "PDF Document" },
  { value: "link", label: "External Link" },
  { value: "image", label: "Image" },
  { value: "notes", label: "Notes" },
  { value: "code", label: "Code" },
  { value: "video", label: "Video" },
];

// Interface for module data
interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
}

export default function NewResourcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedModuleId = searchParams?.get("moduleId");

  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      url: "",
      moduleId: preselectedModuleId || "",
    },
  });

  // Fetch available modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/modules");
        setModules(response.data);
      } catch (error) {
        console.error("Error fetching modules:", error);
        toast.error("Failed to load modules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      await axios.post("/api/resources", values);

      toast.success("Resource created successfully");

      // Redirect to the modules page or the specific module page
      if (preselectedModuleId) {
        // Find the module name to construct the URL
        const moduleItem = modules.find((m) => m.id === preselectedModuleId);
        if (moduleItem) {
          router.push(`/modules/${moduleItem.name}`);
        } else {
          router.push("/modules");
        }
      } else {
        router.push("/modules");
      }
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Add Resource</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading modules...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter resource title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter resource description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {resourceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/resource"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for external resources
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!!preselectedModuleId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modules.map((moduleItem) => (
                            <SelectItem
                              key={moduleItem.id}
                              value={moduleItem.id}
                            >
                              <span className="flex items-center gap-2">
                                <span>{moduleItem.icon}</span>
                                <span>{moduleItem.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {preselectedModuleId && (
                        <FormDescription>
                          Module automatically selected based on current page
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Create Resource
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
