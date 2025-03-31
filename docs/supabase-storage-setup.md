# Supabase Storage Setup Guide

This guide will help you set up Supabase storage for your application.

## 1. Create a Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys from the API settings

## 2. Create Storage Bucket

1. In your Supabase dashboard, navigate to **Storage**
2. Click **Create bucket**
3. Name your bucket `resources`
4. Set the access level to **Private** (this will be controlled via RLS policies)

## 3. Configure RLS Policies

For secure access control, add the following Row Level Security (RLS) policies to your `resources` bucket:

### Allow users to select their own files

```sql
CREATE POLICY "Users can view their own resources"
ON storage.objects FOR SELECT
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### Allow users to insert their own files

```sql
CREATE POLICY "Users can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

### Allow users to update their own files

```sql
CREATE POLICY "Users can update their own resources"
ON storage.objects FOR UPDATE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### Allow users to delete their own files

```sql
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Configure Environment Variables

Add the following variables to your `.env.local` file:

```shell
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key (anon key) for client-side usage
- `SUPABASE_SERVICE_KEY`: Secret service key for server-side operations (keep this secure!)

## 5. Using the Integration

The integration is now set up. Files uploaded through the resource upload dialog will be:

1. Stored in Supabase with a path structure: `resources/{user_id}/{module_id}/{unique_filename}`
2. Secured so users can only access their own files
3. Deleted automatically when the associated resource is deleted
4. Accessed securely through short-lived signed URLs

## 6. Troubleshooting

If you encounter issues with file uploads:

1. Check that your environment variables are correctly set
2. Verify that your RLS policies are properly configured
3. Check browser console for any errors during upload
4. Ensure your Supabase bucket has been created correctly
