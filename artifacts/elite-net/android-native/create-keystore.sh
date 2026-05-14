#!/bin/bash
# ─── Elite Net — Keystore Generator ─────────────────────────────────────────
# Run this script ONCE to generate your signing keystore.
# Keep the output files in a safe place — you will need them for every build.
#
# Usage:
#   chmod +x create-keystore.sh
#   ./create-keystore.sh
#
# Output:
#   elite-net-release.keystore   — copy to android/app/
#   elite-net-release.keystore.b64 — paste as KEYSTORE_BASE64 GitHub Secret

set -e

KEYSTORE_NAME="elite-net-release.keystore"
KEY_ALIAS="elite-net"

echo ""
echo "════════════════════════════════════════"
echo "   Elite Net — Keystore Generator"
echo "════════════════════════════════════════"
echo ""
read -rsp "Enter a strong keystore password (remember this!): " STORE_PASS
echo ""
read -rsp "Enter key password (press Enter to use same password): " KEY_PASS_INPUT
echo ""

KEY_PASS="${KEY_PASS_INPUT:-$STORE_PASS}"

keytool -genkey -v \
  -keystore "$KEYSTORE_NAME" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Elite Net, OU=Mobile, O=EliteNet, L=Cairo, ST=Cairo, C=EG"

echo ""
echo "✅ Keystore created: $KEYSTORE_NAME"
echo ""
echo "Converting to base64 for GitHub Secret..."
base64 -i "$KEYSTORE_NAME" | tr -d '\n' > "${KEYSTORE_NAME}.b64"
echo "✅ Base64 saved to: ${KEYSTORE_NAME}.b64"
echo ""
echo "════════════════════════════════════════"
echo "   GitHub Secrets to set:"
echo "════════════════════════════════════════"
echo ""
echo "KEYSTORE_BASE64  →  copy content of ${KEYSTORE_NAME}.b64"
echo "KEYSTORE_PASSWORD → $STORE_PASS"
echo "KEY_PASSWORD      → $KEY_PASS"
echo ""
echo "⚠️  Keep these values safe! You cannot update the app later without the same keystore."
