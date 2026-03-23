param(
  [switch]$Fast
)

$ErrorActionPreference = "Stop"

function Run-Check([string]$name, [string]$command) {
  Write-Host "`n[CHECK] $name" -ForegroundColor Cyan
  Write-Host "        $command" -ForegroundColor DarkGray
  cmd /c $command
}

Run-Check "Local auth routes" "npm run test -- apps/api/__tests__/auth/auth-local-routes.test.ts"
Run-Check "Password policy + hasher" "npm run test -- apps/api/__tests__/auth/password-policy.test.ts apps/api/__tests__/auth/password-hasher.test.ts"
Run-Check "Login lockout" "npm run test -- apps/api/__tests__/auth/authenticate-local-login.test.ts"

if (-not $Fast) {
  Run-Check "MFA services" "npm run test -- apps/api/__tests__/auth/totp-service.test.ts apps/api/__tests__/auth/mfa-enrollment.test.ts"
  Run-Check "RBAC/admin" "npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/api/__tests__/auth/role-middleware.test.ts"
}

Write-Host "`nDefense sanity checks completed." -ForegroundColor Green