# OpenAI Integration Setup

This document explains how to set up and use OpenAI models in the Study Chat application.

## Prerequisites

The application now supports OpenAI models (GPT-4o and GPT-3.5 Turbo) alongside Google's Gemini models. To use the OpenAI models, you need an OpenAI API key.

## Setting Up Your OpenAI API Key

1. Create an account at [OpenAI](https://platform.openai.com/) if you don't already have one
2. Navigate to the [API keys page](https://platform.openai.com/api-keys)
3. Create a new API key and copy it
4. Set up your environment variable:

Create a `.env.local` file in the root of your project if it doesn't exist already and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## How It Works

The application will automatically detect if an OpenAI API key is available when a user selects an OpenAI model (GPT-4o or GPT-3.5 Turbo).

If the API key is found:

- The application will use the selected OpenAI model
- The model will be initialized with the appropriate configuration

If the API key is not found:

- The application will automatically fall back to using Gemini 2.0 Flash
- A notification will appear in the server logs

## Deployment Considerations

When deploying to your hosting environment, make sure to add the `OPENAI_API_KEY` as an environment variable in your hosting platform.

### For Vercel Deployment:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add a new variable with the name `OPENAI_API_KEY` and your key as the value
4. Redeploy your application

## Testing Your Setup

To verify that your OpenAI integration is working:

1. Start your development server
2. Open the application and navigate to a chat
3. Look for the model selector dropdown menu
4. Select either "GPT-4o" or "GPT-3.5 Turbo"
5. Send a message and confirm that the model responds correctly

The server logs will show which model is being used for each request, helping you verify that the OpenAI models are working as expected.

## Troubleshooting

If you encounter issues with the OpenAI integration:

1. Verify that your API key is correct and has not expired
2. Check that the `.env.local` file is properly formatted
3. Restart your development server after making changes to environment variables
4. Check the server logs for specific error messages

If the API key is valid but you're still experiencing issues, you may need to check your API usage limits in your OpenAI account.
