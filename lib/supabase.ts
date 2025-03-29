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

// Initialize the Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
}

// Ensure a fresh client is created for each request
export function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  });
}

// For backwards compatibility
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

// Upload a file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  userId: string,
  options = {}
) {
  // Get a fresh client for each upload
  const client = getSupabaseAdmin();

  try {
    const { error } = await client.storage.from(bucket).upload(path, file, {
      upsert: true,
      ...options,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("File upload error:", error);
    return false;
  }
}

// Get a signed URL for a file (with expiry time)
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60 * 60 * 24 * 7 // 7 days
) {
  // Get a fresh client for each operation
  const client = getSupabaseAdmin();

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
}

// Delete a file from Supabase Storage
export async function deleteFile(bucket: string, path: string) {
  // Get a fresh client for each operation
  const client = getSupabaseAdmin();

  try {
    const { data, error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Error removing file:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error deleting file:", error);
    return null;
  }
}
