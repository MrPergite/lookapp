#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔧 Building project with Vercel..."
vercel build

echo "🚀 Deploying prebuilt output..."
vercel deploy --prebuilt

echo "🌐 Promoting deployment to production..."
vercel --prod

echo "✅ Deployment complete!"
