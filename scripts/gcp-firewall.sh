#!/bin/bash

# ============================================
# AHteam Factory - GCP Firewall Setup
# Run once to open all required ports
# ============================================

echo "🔓 Opening Firewall Ports..."

# All ports in one command
gcloud compute firewall-rules create allow-web-ports \
  --allow tcp:80,tcp:443,tcp:3000,tcp:3001,tcp:3002,tcp:3003,tcp:3004,tcp:3005,tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow all web ports for AHteam Factory"

echo "✅ Firewall rules created!"
echo ""
echo "Ports opened:"
echo "  - 80    (HTTP)"
echo "  - 443   (HTTPS)"
echo "  - 3000  (Dev Server)"
echo "  - 3001  (Dev Server)"
echo "  - 3002  (Dev Server)"
echo "  - 3003  (Dev Server)"
echo "  - 3004  (Dev Server)"
echo "  - 3005  (Dev Server)"
echo "  - 8080  (Serve)"
