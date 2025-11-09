#!/bin/bash

# Lightpoint Deployment Script for Railway

echo "🚀 Deploying Lightpoint to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Initialize project if needed
if [ ! -f "railway.json" ]; then
    echo "📦 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "⚙️ Setting environment variables..."
echo "Please enter your configuration:"

read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Key: " SUPABASE_SERVICE_KEY
read -p "OpenRouter API Key: " OPENROUTER_KEY
read -p "OpenAI API Key: " OPENAI_KEY
read -p "Encryption Key (32+ chars): " ENCRYPTION_KEY

railway variables set NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
railway variables set SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
railway variables set OPENROUTER_API_KEY="$OPENROUTER_KEY"
railway variables set OPENAI_API_KEY="$OPENAI_KEY"
railway variables set ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Deploy
echo "🚢 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "  1. Set up Supabase storage bucket 'complaint-documents'"
echo "  2. Run database migrations in Supabase SQL Editor"
echo "  3. Seed knowledge base with HMRC guidance"
echo "  4. Test the deployment at your Railway URL"

