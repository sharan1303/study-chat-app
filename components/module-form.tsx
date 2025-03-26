"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/context/SessionContext";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { encodeModuleSlug } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  icon: z.string().min(1, "Please select an icon"),
});

type FormValues = z.infer<typeof formSchema>;

const icons = [
  "📚",
  "🧠",
  "🔬",
  "🧮",
  "🌍",
  "🖥️",
  "📊",
  "📝",
  "🎨",
  "🎭",
  "🏛️",
  "⚗️",
  "🔢",
  "📜",
  "🎵",
];

interface ModuleFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string;
    icon: string;
  };
  successEventName?: string;
  sessionId?: string | null;
  onSuccess?: () => void;
}

export const ModuleForm = ({
  initialData,
  successEventName,
  sessionId: propSessionId,
  onSuccess,
}: ModuleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { sessionId: contextSessionId } = useSession();
  const { isSignedIn } = useUser();
  const router = useRouter();

  // Use sessionId from props if provided, otherwise use from context
  const sessionId = propSessionId ?? contextSessionId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "📚",
    },
  });

  // Reset form error when form values change
  const formValues = form.watch();
  useEffect(() => {
    setFormError(null);
  }, [formValues]);

  const triggerSuccess = () => {
    // Dispatch custom event that parent can listen for
    if (typeof window !== "undefined" && successEventName) {
      window.dispatchEvent(new CustomEvent(successEventName));
    }

    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
    setFormError(null);

    try {
      setIsSubmitting(true);

      if (initialData) {
        // Update existing module
        console.log("Updating module:", initialData.id);

        // Check if we need to add sessionId
        let updateUrl = `/api/modules/${initialData.id}`;
        if (!isSignedIn && sessionId) {
          updateUrl = `/api/modules/${initialData.id}?sessionId=${sessionId}`;
        }

        const updateResponse = await axios.post(updateUrl, values);
        console.log("Module updated response:", updateResponse.data);
        toast.success("Module updated");

        // First close the dialog
        triggerSuccess();

        // For navigation if name changed
        if (values.name !== initialData.name) {
          // If name changed, navigate to new URL using router
          setTimeout(() => {
            const formattedName = encodeModuleSlug(values.name);
            router.push(`/modules/${formattedName}`);
          }, 600);
        }
        // No need for else clause with page reload - SSE will handle it
      } else {
        // Create new module
        console.log("Creating new module");

        try {
          const createdModule = await api.createModule(values);
          console.log("Module created response:", createdModule);

          // Close the dialog
          triggerSuccess();

          // Show success message
          toast.success("Module created");

          // No need to force a page reload - SSE will handle the sidebar update
        } catch (error: unknown) {
          console.error("Error creating module:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create module";
          setFormError(errorMessage);
          toast.error("Failed to create module");
          throw error; // Re-throw to be caught by the outer catch
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response?.data);
        setFormError(error.response?.data?.error || "Failed to create module");
      } else {
        setFormError("An unexpected error occurred");
      }
      toast.error(
        initialData ? "Failed to update module" : "Failed to create module"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {initialData ? "Edit Module" : "Create New Module"}
      </h2>

      {formError && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
          {formError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter module name" {...field} />
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
                    placeholder="Enter a brief description of this module"
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
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <div className="grid grid-cols-5 gap-2">
                  {icons.map((icon) => (
                    <Button
                      type="button"
                      key={icon}
                      variant={field.value === icon ? "default" : "outline"}
                      className="h-12 w-12 text-2xl"
                      onClick={() => field.onChange(icon)}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={triggerSuccess}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Module"
              ) : (
                "Create Module"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
