"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, PenSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditableProfileImageProps {
  className?: string;
  size?: number;
}

export default function EditableProfileImage({
  className,
  size,
}: EditableProfileImageProps) {
  const { isLoaded, user } = useUser();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className={cn("relative flex flex-col items-center", className)}>
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div className="h-0 opacity-0" />
      </div>
    );
  }

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setImageFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    try {
      setIsUploading(true);
      await user?.setProfileImage({ file: imageFile });
      toast.success("Profile image updated");
      setPreviewImage(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const fullName = user?.fullName || user?.firstName || "User";
  const imageUrl = user?.imageUrl || "/profile-circle.256x256.png";

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div
          className={cn(
            "w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg relative",
            className
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={previewImage || imageUrl}
              alt={fullName}
              width={size}
              height={size}
              className="min-w-full min-h-full object-cover"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Edit overlay */}
          <label
            htmlFor="profile-image"
            className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            aria-label="Change profile picture"
          >
            <PenSquare className="h-8 w-8 text-white" />
            <span className="sr-only">Change profile picture</span>
          </label>
        </div>

        <input
          id="profile-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          aria-label="Upload profile picture"
        />
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 mt-4 flex justify-center",
          imageFile ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
        )}
      >
        <div className="flex items-center gap-2">
          <Button onClick={handleImageUpload} disabled={isUploading} size="sm">
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewImage(null);
              setImageFile(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
