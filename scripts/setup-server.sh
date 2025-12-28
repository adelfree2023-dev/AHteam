#!/bin/bash

# ============================================
# AHteam Factory - Server Setup Script
# Ubuntu 22.04 LTS
# ============================================

echo "🏭 AHteam Factory Setup"
echo "========================"
echo ""

# Update system
echo "📦 Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
echo ""
echo "📦 Step 2: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js
echo ""
echo "✅ Node.js version:"
node --version
npm --version

# Install Git
echo ""
echo "📦 Step 3: Installing Git..."
sudo apt install -y git

# Clone repository
echo ""
echo "📦 Step 4: Cloning AHteam repository..."
cd ~
git clone https://github.com/adelfree2023-dev/AHteam.git factory

# Enter directory
cd ~/factory

# Install dependencies
echo ""
echo "📦 Step 5: Installing dependencies..."
npm install

# Install Generator dependencies
echo ""
echo "📦 Step 6: Installing Generator..."
cd generator
npm install
cd ..

# Create generated directory
mkdir -p generated

# Success message
echo ""
echo "================================"
echo "✅ Factory Setup Complete!"
echo "================================"
echo ""
echo "📁 Location: ~/factory"
echo ""
echo "🚀 To generate a website:"
echo "   cd ~/factory/generator"
echo "   npm run generate"
echo ""
echo "📦 Output will be in: ~/factory/generated/website"
echo ""
