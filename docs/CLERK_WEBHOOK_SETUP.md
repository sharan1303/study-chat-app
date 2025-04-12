# Clerk Webhook Setup for Automatic User Syncing

This guide explains how to set up a webhook in your Clerk dashboard to automatically synchronize users between Clerk and your database.

## Why You Need This

When users sign up or log in through Clerk, they need to be automatically added to your database. The webhook we've created will:

- Create new users in your database when they sign up in Clerk
- Update user information in your database when it changes in Clerk
- Ensure all authenticated users exist in your database without manual intervention

## Setup Instructions

1. **Log in to your Clerk Dashboard**

   - Go to [dashboard.clerk.com](https://dashboard.clerk.com/)
   - Select your application

2. **Create a Webhook**
   - Navigate to the "Webhooks" section in the sidebar
   - Click "Add Endpoint"
   - For the URL, enter: `https://yourdomain.com/api/webhooks/clerk` (replace with your actual domain)
3. **Select Events**

   - Under "Events", select:
     - `user.created`
     - `user.updated`

4. **Generate a Signing Secret**

   - Clerk will automatically generate a signing secret for your webhook
   - Copy this secret

5. **Update Environment Variables**

   - Add the webhook secret to your environment variables:

     ```shell
     CLERK_WEBHOOK_SECRET=your_webhook_secret_here
     ```

   - Make sure to add this to your production environment

6. **Deploy Your Application**

   - Deploy your application with the updated environment variables
   - The webhook endpoint at `/api/webhooks/clerk` is now ready to receive events

7. **Test the Webhook**
   - Create a new test user in Clerk
   - Check your database to confirm the user was automatically created

## Troubleshooting

If users aren't being synced:

1. **Check Webhook Logs in Clerk Dashboard**

   - Go to the Webhooks section
   - Look for failed webhook attempts

2. **Check Application Logs**

   - Look for errors in your application logs related to the webhook

3. **Verify Environment Variables**

   - Make sure `CLERK_WEBHOOK_SECRET` is correctly set in your environment

4. **Test Endpoint Accessibility**
   - Ensure your webhook endpoint is publicly accessible

## Manual Sync Option

If needed, you can still manually sync users using the existing script:

```bash
node scripts/sync-clerk-users.mjs
```

This can be helpful for one-time migrations or fixing issues.
