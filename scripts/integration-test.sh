#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
API_KEY="${API_KEY:-dev-api-key-change-me}"

echo "=== Native Tracking Integration Test ==="
echo "API: $API_URL"

# 1. Create Mediago campaign
echo ""
echo "1. Creating Mediago campaign..."
CAMPAIGN=$(curl -s -X POST "$API_URL/api/campaigns" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "name": "Test Seniorsante",
    "slug": "test-seniorsante",
    "trafficSource": "mediago",
    "destinationUrl": "https://example.com/landing"
  }')
CAMPAIGN_ID=$(echo "$CAMPAIGN" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
echo "Campaign created: $CAMPAIGN_ID"

# 2. Click redirect
echo ""
echo "2. Testing click redirect..."
REDIRECT=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" \
  "$API_URL/click/test-seniorsante?tracking_id=test-tracking-123&utm_source=mediago&ad_id=1000000")
echo "Redirect: $REDIRECT"
echo "$REDIRECT" | grep -q "302" || { echo "FAIL: expected 302 redirect"; exit 1; }
echo "$REDIRECT" | grep -q "click_id=" || { echo "FAIL: missing click_id in redirect"; exit 1; }
echo "$REDIRECT" | grep -q "tk-cid=" || { echo "FAIL: missing tk-cid in redirect"; exit 1; }

CLICK_ID=$(echo "$REDIRECT" | sed -n 's/.*click_id=\([^&]*\).*/\1/p')
echo "Click ID: $CLICK_ID"

# 3. Tracker script
echo ""
echo "3. Testing tracker script..."
SCRIPT=$(curl -s "$API_URL/t/tracker.js")
echo "$SCRIPT" | grep -q "tkCallback" || { echo "FAIL: tracker script missing tkCallback"; exit 1; }
echo "$SCRIPT" | grep -q "tk-cid" || { echo "FAIL: tracker script missing tk-cid"; exit 1; }
echo "Tracker script OK"

# 4. Server-side conversion
echo ""
echo "4. Firing server-side conversion..."
CONV=$(curl -s -X POST "$API_URL/conversions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"clickId\":\"$CLICK_ID\",\"eventType\":\"lead\",\"metadata\":{\"email\":\"user@example.com\"}}")
echo "Conversion: $CONV"
echo "$CONV" | grep -q "conversion" || { echo "FAIL: conversion not created"; exit 1; }

# 5. Wait for async postback
sleep 2

# 6. Check conversions list
echo ""
echo "5. Checking conversion status..."
CONVERSIONS=$(curl -s "$API_URL/api/conversions" -H "x-api-key: $API_KEY")
echo "$CONVERSIONS" | python3 -m json.tool 2>/dev/null | head -30 || echo "$CONVERSIONS"

# 7. Pixel postback
echo ""
echo "6. Testing pixel postback endpoint..."
curl -s "$API_URL/postback/$CLICK_ID" | head -c 200
echo ""

echo ""
echo "=== Integration test complete ==="
