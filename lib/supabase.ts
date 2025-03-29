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

/**
 * Creates and returns a new Supabase client with admin privileges.
 *
 * The client is configured to automatically refresh tokens without persisting sessions,
 * ensuring that a fresh instance is created for each request.
 *
 * @returns A new Supabase client instance configured with admin privileges.
 */
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

/**
 * Uploads a file to a specified Supabase Storage bucket.
 *
 * The function uses a freshly created Supabase admin client to attempt to upload the provided file
 * to the given bucket and path. Additional upload options can be supplied to customize the behavior.
 * If the upload encounters an error, the function logs the error and returns false.
 *
 * @example
 * const success = await uploadFile('photos', 'user1/avatar.png', fileObject, 'user1', { cacheControl: '3600' });
 *
 * @param bucket - The bucket in Supabase Storage where the file will be stored.
 * @param path - The destination path within the bucket.
 * @param file - The File object to be uploaded.
 * @param userId - The identifier of the user associated with the upload.
 * @param options - Optional settings to customize the upload.
 *
 * @returns A promise that resolves to true if the file is uploaded successfully, or false if an error occurs.
 */
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

/**
 * Retrieves a signed URL for a file in Supabase Storage.
 *
 * This function creates a fresh admin client and requests a signed URL for the specified file in the given bucket.
 * The URL will expire after the specified duration. If an error occurs, the function logs the error and returns null.
 *
 * @param bucket - The name of the Supabase Storage bucket containing the file.
 * @param path - The file path within the bucket.
 * @param expiresIn - The duration in seconds for which the signed URL remains valid. Defaults to 604800 (7 days).
 * @returns The signed URL data if the operation is successful; otherwise, null.
 */
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

/**
 * Deletes a file from a specified Supabase Storage bucket.
 *
 * This function creates a fresh admin client and attempts to remove the file at the given path from the designated bucket. If the deletion fails, it logs the error and returns null.
 *
 * @param bucket - The name of the storage bucket.
 * @param path - The path to the file being deleted.
 * @returns The deletion result data if successful; otherwise, null.
 */
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
