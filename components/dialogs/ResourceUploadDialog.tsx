import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

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
  { value: "audio", label: "Audio" },
  { value: "document", label: "Document" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "archive", label: "Archive" },
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

/**
 * Renders a dialog for uploading a resource to a module.
 *
 * This component provides a user interface for uploading a resource via file input or URL. It supports drag-and-drop
 * file uploads, automatically detects the file's resource type based on its MIME type or extension,
 * and auto-fills the resource title if not provided. The dialog fetches available modules from the server for selection
 * and resets its state when opened or closed. If the user is not authenticated, the dialog will close.
 *
 * @param open - Indicates whether the upload dialog is visible.
 * @param onOpenChange - Callback to update the dialog's visibility.
 * @param preselectedModuleId - Optional module ID to preselect in the module dropdown.
 */
export function ResourceUploadDialog({
  open,
  onOpenChange,
  preselectedModuleId,
}: ResourceUploadDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSignedIn } = useUser();

  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [moduleLoadError, setModuleLoadError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
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
        setModuleLoadError(null);
        console.log("Fetching modules...");
        const response = await axios.get("/api/modules");
        console.log("Modules API response:", response.data);

        // Handle the response data format - API returns { modules: [...] }
        if (
          response.data &&
          response.data.modules &&
          Array.isArray(response.data.modules)
        ) {
          console.log(
            "Setting modules from response.data.modules:",
            response.data.modules
          );
          setModules(response.data.modules);
        } else if (response.data && Array.isArray(response.data)) {
          console.log("Setting modules from response.data:", response.data);
          setModules(response.data);
        } else {
          // Set modules to empty array if data is not in expected format
          console.error("Unexpected API response format:", response.data);
          setModules([]);
          setModuleLoadError("Unexpected data format from server");
          toast.error("Failed to load modules: unexpected data format");
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
        setModules([]);
        setModuleLoadError("Failed to load your modules");
        toast.error("Failed to load modules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [open]);

  // Safety check - redirect to login if not authenticated
  useEffect(() => {
    if (open && !isSignedIn) {
      onOpenChange(false);
    }
  }, [open, isSignedIn, onOpenChange]);

  // If not signed in, don't render the dialog
  if (!isSignedIn) {
    return null;
  }

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("moduleId", values.moduleId);
      formData.append("type", values.type);

      // Use URL field for external resources only if no file is uploaded
      if (values.url && !selectedFile) {
        formData.append("url", values.url);
      }

      // Handle file uploads with the new endpoint
      if (selectedFile) {
        // Add the file to form data
        formData.append("file", selectedFile);

        // Use the new file upload endpoint
        await axios.post("/api/resources/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // For non-file resources (links, etc.), use the standard endpoint
        await axios.post("/api/resources", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast.success("Resource created successfully");

      // Close the dialog
      onOpenChange(false);

      // Reset form and selected file
      form.reset();
      setSelectedFile(null);

      // Refresh the current page to show the newly added resource
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

    // Get file extension and mime type
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.toLowerCase();

    console.log("File info:", {
      name: file.name,
      extension,
      mimeType,
      size: file.size,
    });

    // Auto-detect resource type based on file extension and mime type
    let type = "";

    // Check mime type first
    if (mimeType.includes("pdf")) {
      type = "pdf";
    } else if (mimeType.includes("image/")) {
      // Use standard "image" type instead of "image/extension"
      type = "image";
    } else if (mimeType.includes("video/")) {
      // Use standard "video" type instead of "video/extension"
      type = "video";
    } else if (mimeType.includes("audio/")) {
      // Use standard "audio" type instead of "audio/extension"
      type = "audio";
    } else if (
      mimeType.includes("text/") ||
      mimeType.includes("application/msword") ||
      mimeType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessing"
      )
    ) {
      type = "document";
    } else if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      type = "spreadsheet";
    } else if (
      mimeType.includes("zip") ||
      mimeType.includes("archive") ||
      mimeType.includes("compressed")
    ) {
      type = "archive";
    }

    // If mime type didn't work, try extension
    if (!type) {
      if (extension === "pdf") {
        type = "pdf";
      } else if (
        ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(extension)
      ) {
        type = "image";
      } else if (["mp4", "avi", "mov", "webm", "mkv"].includes(extension)) {
        type = "video";
      } else if (["mp3", "wav", "ogg", "flac", "aac"].includes(extension)) {
        type = "audio";
      } else if (["doc", "docx", "txt", "rtf", "odt"].includes(extension)) {
        type = "document";
      } else if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
        type = "spreadsheet";
      } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
        type = "archive";
      } else if (
        ["html", "css", "js", "ts", "jsx", "tsx", "json", "php", "py"].includes(
          extension
        )
      ) {
        type = "code";
      }
    }

    // Set a default type if we couldn't detect it
    if (!type) {
      type = "document";
    }

    console.log("Detected resource type:", type);
    form.setValue("type", type);

    // Auto-fill title if empty (remove extension from filename)
    if (!form.getValues().title) {
      const fileName = file.name.split(".").slice(0, -1).join(".");
      form.setValue("title", fileName);
    }
  };

  // Function to trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
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
            <Button
              variant="default"
              className="cursor-pointer"
              onClick={handleBrowseClick}
              type="button"
            >
              Browse
            </Button>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              aria-label="File upload"
            />
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
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              onKeyDown={(e) => {
                // Submit form when Enter is pressed in an input field
                if (e.key === "Enter" && !e.shiftKey) {
                  // Skip if in textarea or submitting is in progress
                  if (e.target instanceof HTMLTextAreaElement || isSubmitting) {
                    return;
                  }

                  // Skip if in select elements
                  if (
                    e.target instanceof HTMLElement &&
                    (e.target.tagName === "SELECT" ||
                      e.target.closest('[role="combobox"]'))
                  ) {
                    return;
                  }

                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }
              }}
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          sideOffset={4}
                          className="z-[200]"
                        >
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
                        value={field.value || undefined}
                        disabled={!!preselectedModuleId || isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          sideOffset={4}
                          className="z-[200]"
                        >
                          {isLoading ? (
                            <div className="p-2 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading modules...</span>
                            </div>
                          ) : moduleLoadError ? (
                            <div className="p-2 text-center text-destructive">
                              {moduleLoadError}
                              <div className="mt-1 text-xs text-muted-foreground">
                                Try refreshing the dialog
                              </div>
                            </div>
                          ) : modules.length > 0 ? (
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
                            <div className="p-2 text-center text-muted-foreground">
                              No modules available.
                              <div className="mt-1 text-xs">
                                You need to create a module first.
                              </div>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
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

              <div className="flex justify-between items-center gap-2 pt-4">
                <div className="text-xs text-muted-foreground">
                  Press Enter to upload or Ctrl+Enter in description
                </div>
                <div className="flex gap-2">
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
                        Uploading...
                      </>
                    ) : (
                      <>Upload</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
