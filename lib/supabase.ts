import { createClient } from "@supabase/supabase-js";

// Environment variables should be set in your .env.local file
// NEXT_PUBLIC_SUPABASE_URL=your-project-url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// SUPABASE_SERVICE_KEY=your-service-key (only for server-side usage)

// Client-side Supabase client (limited permissions via anon key)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Server-side Supabase client with service role (full admin access)
// Only use this in server-side contexts (API routes, Server Components)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Upload a file to Supabase Storage
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File | Blob,
  userId: string,
  options?: { contentType?: string }
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: options?.contentType,
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Get a signed URL for a file (with expiry time)
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60 // seconds
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw error;
  }
}

// Delete a file from Supabase Storage
export async function deleteFile(bucket: string, path: string) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
