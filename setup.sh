#!/bin/bash

echo "🚀 Setting up Chrome Password Manager with Nillion Integration..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the extension
echo "🔨 Building extension with webpack..."
npm run build

# Copy necessary files to dist
echo "📋 Copying extension files..."
cp manifest.json dist/
cp popup.html dist/
cp icon.png dist/
cp -r src dist/ 2>/dev/null || true

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (top right toggle)"
echo "3. Click 'Load unpacked' and select the 'dist' folder"
echo "4. Your extension should now be loaded and ready to use!"
echo ""
echo "🔐 Features:"
echo "• Auto-detects password fields on websites"
echo "• Generates cryptographically secure passwords"
echo "• Stores passwords securely using Nillion network"
echo "• Falls back to local Chrome storage if Nillion is unavailable"
echo ""
echo "🎯 To test:"
echo "1. Visit any website with a login form"
echo "2. Click on a password field"
echo "3. Use the popup to generate and save a secure password"
echo "4. The password will be auto-filled on future visits"
