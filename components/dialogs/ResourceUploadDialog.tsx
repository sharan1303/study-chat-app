import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Plus, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Schema for resource creation
const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  type: z.string().min(1, "Please select a resource type"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  moduleId: z.string().min(1, "Please select a module"),
  file: z.any().optional(),
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

interface ResourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedModuleId?: string;
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  preselectedModuleId,
}: ResourceUploadDialogProps) {
  const router = useRouter();

  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        type: "",
        url: "",
        moduleId: preselectedModuleId || "",
      });
      setSelectedFile(null);
    }
  }, [open, form, preselectedModuleId]);

  // Fetch available modules
  useEffect(() => {
    const fetchModules = async () => {
      if (!open) return;
      try {
        setIsLoading(true);
        const response = await axios.get("/api/modules");

        // Make sure we're handling the response data correctly
        if (response.data && Array.isArray(response.data)) {
          setModules(response.data);
        } else if (
          response.data &&
          typeof response.data === "object" &&
          response.data.modules &&
          Array.isArray(response.data.modules)
        ) {
          // Handle case where API returns { modules: [...] }
          setModules(response.data.modules);
        } else if (
          response.data &&
          typeof response.data === "object" &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          // Handle case where API returns { data: [...] }
          setModules(response.data.data);
        } else {
          // Set modules to empty array if data is not in expected format
          console.error("Unexpected API response format:", response.data);
          setModules([]);
          toast.error("Failed to load modules: unexpected data format");
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
        toast.error("Failed to load modules");
        setModules([]); // Ensure modules is an array even after error
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [open]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("moduleId", values.moduleId);
      formData.append("type", values.type);

      if (values.description) {
        formData.append("description", values.description);
      }

      if (values.url) {
        formData.append("url", values.url);
      }

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await axios.post("/api/resources", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Resource created successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  // Process the selected file
  const handleFile = (file: File) => {
    setSelectedFile(file);

    // Auto-detect resource type based on file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    let type = "";
    if (extension === "pdf") type = "pdf";
    else if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension || ""))
      type = "image";
    else if (["mp4", "avi", "mov"].includes(extension || "")) type = "video";

    if (type) {
      form.setValue("type", type);
    }

    // Auto-fill title if empty
    if (!form.getValues().title) {
      const fileName = file.name.split(".").slice(0, -1).join(".");
      form.setValue("title", fileName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Upload Resource</DialogTitle>
          </div>
          <DialogDescription>
            Add resources to help study for your modules
          </DialogDescription>
        </DialogHeader>

        {/* File upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/10" : "border-muted"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Drag and Drop assets here</p>
              <p className="text-muted-foreground">Or</p>
            </div>
            <label htmlFor="file-upload">
              <Button variant="default" className="cursor-pointer">
                Browse
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 border rounded flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Form fields */}
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!!preselectedModuleId || isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading ? (
                            <div className="p-2 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading modules...</span>
                            </div>
                          ) : Array.isArray(modules) && modules.length > 0 ? (
                            modules.map((moduleItem) => (
                              <SelectItem
                                key={moduleItem.id}
                                value={moduleItem.id}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{moduleItem.icon}</span>
                                  <span>{moduleItem.name}</span>
                                </span>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-modules">
                              No modules available
                            </SelectItem>
                          )}
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
              </div>

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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
                      <Plus className="mr-2 h-4 w-4" />
                      Create Resource
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
