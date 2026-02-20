#!/bin/bash

# setup-oauth-staging.sh
# This script updates the staging server with Google OAuth credentials
# Run this on the staging server after obtaining credentials from Google Cloud Console

set -e

echo "=================================="
echo "Google OAuth Staging Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found in current directory"
    echo "Please run this script from the moonlanding root directory"
    exit 1
fi

echo "Current .env file location: $(pwd)/.env"
echo ""

# Prompt for credentials
echo "Enter the OAuth credentials from Google Cloud Console:"
echo "=================================================="
read -p "Client ID (from Google Cloud Console): " CLIENT_ID
read -sp "Client Secret (from Google Cloud Console): " CLIENT_SECRET
echo ""
echo ""

# Validate inputs
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "ERROR: Client ID and Client Secret are required"
    exit 1
fi

# Backup the current .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d-%H%M%S)"
cp .env "$BACKUP_FILE"
echo "✓ Backed up .env to: $BACKUP_FILE"
echo ""

# Update or add the environment variables
if grep -q "^GOOGLE_CLIENT_ID=" .env; then
    sed -i.bak "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|" .env
else
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
fi

if grep -q "^GOOGLE_CLIENT_SECRET=" .env; then
    sed -i.bak "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|" .env
else
    echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET" >> .env
fi

if grep -q "^GOOGLE_REDIRECT_URI=" .env; then
    sed -i.bak "s|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback|" .env
else
    echo "GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback" >> .env
fi

echo "✓ Updated .env with OAuth credentials"
echo ""

# Verify the changes
echo "Verifying .env updates:"
echo "========================"
grep "^GOOGLE_" .env | sed 's/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=***HIDDEN***/g'
echo ""

# Restart the application
echo "Attempting to restart the application..."
echo "=========================================="

# Try different restart methods
if command -v systemctl &> /dev/null && systemctl is-active --quiet moonlanding; then
    echo "Using systemctl to restart moonlanding..."
    sudo systemctl restart moonlanding
    echo "✓ Service restarted"
elif [ -f "docker-compose.yml" ]; then
    echo "Using docker-compose to restart..."
    docker-compose restart
    echo "✓ Docker containers restarted"
elif command -v docker &> /dev/null; then
    echo "Using docker to restart..."
    docker restart moonlanding
    echo "✓ Docker container restarted"
else
    echo "⚠ Could not automatically restart the application"
    echo "Please restart manually:"
    echo "  - systemctl restart moonlanding (if using systemd)"
    echo "  - docker restart moonlanding (if using Docker)"
    echo "  - Or restart your application server manually"
fi

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Wait 30 seconds for server to fully start"
echo "2. Test the OAuth flow:"
echo "   - Visit: https://app.acc.l-inc.co.za/login"
echo "   - Click 'Sign in with Google'"
echo "   - Authenticate with your Google account"
echo ""
echo "3. Verify setup:"
echo "   - From your local machine, run:"
echo "   - node verify-staging-auth.js"
echo ""
echo "If you need to rollback, restore from backup:"
echo "   cp $BACKUP_FILE .env"
echo ""

