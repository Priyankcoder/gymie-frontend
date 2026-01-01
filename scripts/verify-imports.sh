
#!/bin/bash

echo "Verifying all import statements match actual file names..."
echo ""

ERRORS=0

# Check for case-sensitive import mismatches in services
echo "Checking service imports..."

# mlInferenceService
if grep -r "from.*['\"].*MLInferenceService['\"]" frontend/src --include="*.ts" --include="*.tsx" | grep -v "MLInferenceService.web"; then
    echo "❌ Found incorrect import: should be 'mlInferenceService' (lowercase m)"
    ERRORS=$((ERRORS + 1))
fi

# offlineNutritionService
if grep -r "from.*['\"].*OfflineNutritionService['\"]" frontend/src --include="*.ts" --include="*.tsx"; then
    echo "❌ Found incorrect import: should be 'offlineNutritionService' (lowercase o)"
    ERRORS=$((ERRORS + 1))
fi

# photoSyncService
if grep -r "from.*['\"].*PhotoSyncService['\"]" frontend/src --include="*.ts" --include="*.tsx"; then
    echo "❌ Found incorrect import: should be 'photoSyncService' (lowercase p)"
    ERRORS=$((ERRORS + 1))
fi

# authStorage
if grep -r "from.*['\"].*AuthStorage['\"]" frontend/src --include="*.ts" --include="*.tsx"; then
    echo "❌ Found incorrect import: should be 'authStorage' (lowercase a)"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✅ All imports verified - no case-sensitivity issues found!"
else
    echo ""
    echo "❌ Found $ERRORS import issue(s) that need fixing"
    exit 1
fi
