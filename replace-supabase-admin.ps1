# Script to replace supabaseAdmin with supabase in admin files
# This is part of the security refactoring to remove service role key from client

$files = @(
    "src\admin\hooks\usePermissions.ts",
    "src\admin\hooks\useUsers.ts",
    "src\admin\hooks\useUserDetail.ts",
    "src\admin\hooks\useUserMutations.ts",
    "src\admin\hooks\useAnalytics.ts",
    "src\admin\hooks\useActivityFeed.ts",
    "src\admin\hooks\useAuditLogs.ts",
    "src\admin\hooks\useDashboardMetrics.ts",
    "src\admin\hooks\useFeatureFlags.ts",
    "src\admin\hooks\useGlobalTransactions.ts",
    "src\admin\hooks\useImpersonation.ts",
    "src\admin\hooks\useReports.ts",
    "src\admin\hooks\useSystemHealth.ts",
    "src\admin\hooks\useSystemSettings.ts",
    "src\admin\hooks\useTransactionTrends.ts",
    "src\admin\pages\auth\Setup2FA.tsx",
    "src\admin\pages\auth\Verify2FA.tsx",
    "src\admin\pages\AuditLogs.tsx",
    "src\admin\components\tables\RecentUsersTable.tsx",
    "src\admin\components\layout\Header.tsx",
    "src\admin\components\AdminCommandPalette.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        
        # Read content
        $content = Get-Content $fullPath -Raw
        
        # Replace import statement
        $content = $content -replace "import { supabaseAdmin } from '@/admin/lib/supabase-admin';", "import { supabase } from '@/lib/supabase';"
        
        # Replace all usages
        $content = $content -replace "supabaseAdmin", "supabase"
        
        # Write back
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $fullPath" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Replaced supabaseAdmin with supabase in $($files.Count) files." -ForegroundColor Cyan
