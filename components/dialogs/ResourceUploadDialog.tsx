import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { broadcastResourceCreated } from "@/lib/events";
import { getOrCreateSessionIdClient } from "@/lib/session";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  moduleId: z.string().min(1, "Please select a module"),
});

// Interface for module data
interface Module {
  id: string;
  name: string;
  context: string | null;
  icon: string;
}

// Add this interface at the top of the file, after other interfaces
interface UploadResult {
  file?: string;
  error?: {
    response?: {
      data?: {
        error?: string;
      };
    };
  };
}

interface ResourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedModuleId?: string;
}

/**
 * Renders a dialog for uploading a resource to a module.
 *
 * This component provides a user interface for uploading resources via file input. It supports drag-and-drop
 * file uploads and uses the filename as the resource title. The dialog fetches available modules from the server for selection
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [moduleLoadError, setModuleLoadError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleId: preselectedModuleId || "",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        moduleId: preselectedModuleId || "",
      });
      setSelectedFiles([]);
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
        // Get session ID for anonymous users
        const sessionId = getOrCreateSessionIdClient();

        // Add sessionId to the request URL
        let url = "/api/modules";
        if (sessionId) {
          url += `?sessionId=${sessionId}`;
          console.log(
            "Using sessionId for module fetch:",
            `${sessionId.substring(0, 8)}...`
          );
        }

        const response = await axios.get(url);
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

      // If there are files to upload
      if (selectedFiles.length > 0) {
        // Check for files exceeding size limit (50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        const oversizedFiles = selectedFiles.filter(
          (file) => file.size > MAX_FILE_SIZE
        );

        if (oversizedFiles.length > 0) {
          const fileNames = oversizedFiles.map((f) => f.name).join(", ");
          toast.error(`File size exceeds limit (50MB): ${fileNames}`);
          setIsSubmitting(false);
          return;
        }

        // Get sessionId for anonymous users
        const sessionId = getOrCreateSessionIdClient();

        // For each file, create and submit a FormData object
        const uploadResults = await Promise.allSettled(
          selectedFiles.map(async (file) => {
            const formData = new FormData();
            // Use the filename without extension as the title
            const fileName = file.name.split(".").slice(0, -1).join(".");
            formData.append("title", fileName);
            formData.append("moduleId", values.moduleId);
            formData.append("file", file);

            try {
              // Add sessionId to URL if available
              // Add sessionId to URL if available
              let url = "/api/resources/upload";
              if (sessionId) {
                url += `?sessionId=${sessionId}`;
                console.log(
                  "Using sessionId for upload:",
                  `${sessionId.substring(0, 8)}...`
                );
              }

              return await axios.post(url, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
            } catch (error) {
              console.error("Upload error:", error);
              return { file: file.name, error };
            }
          })
        );

        const successfulUploads = uploadResults.filter(
          (result) =>
            result.status === "fulfilled" && !("error" in result.value)
        );

        // Find both rejected promises and fulfilled promises with errors
        const failedUploads = uploadResults.filter(
          (result) =>
            result.status === "rejected" ||
            (result.status === "fulfilled" && "error" in result.value)
        );

        if (failedUploads.length > 0) {
          const errorMessages = failedUploads
            .map((result) => {
              if (result.status === "rejected") {
                return result.reason?.message || "Unknown error";
              } else {
                // For fulfilled but with error property
                const error =
                  (result.value as UploadResult).error?.response?.data?.error ||
                  "Unknown error";
                return `${(result.value as UploadResult).file || ""}: ${error}`;
              }
            })
            .join("\n");
          toast.error("Failed to upload resources:\n" + errorMessages);
        }

        if (successfulUploads.length > 0) {
          if (successfulUploads.length === 1) {
            toast.success(
              `Successfully uploaded ${successfulUploads.length} resource to ${
                modules.find((m) => m.id === values.moduleId)?.name
              }`
            );
          } else {
            toast.success(
              `Successfully uploaded ${successfulUploads.length} resources to ${
                modules.find((m) => m.id === values.moduleId)?.name
              }`
            );
          }

          // Broadcast resource created event
          successfulUploads.forEach((upload) => {
            if (upload.status === "fulfilled" && "data" in upload.value) {
              const resourceData = upload.value.data;
              broadcastResourceCreated({
                id: resourceData.id,
                moduleId: values.moduleId,
              });
            }
          });
        }
      }

      onOpenChange(false);
      form.reset();
      setSelectedFiles([]);
      router.refresh();
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
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
          <DialogDescription>Add resources to help you study</DialogDescription>
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
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-medium">Drag and Drop here</p>
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
              multiple
              className="hidden"
              onChange={handleFileChange}
              aria-label="File upload"
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="p-3 border rounded flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
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

              <div className="flex justify-between items-center gap-2 pt-4">
                <div className="text-xs text-muted-foreground">
                  Press Enter to upload
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
