param(
  [Parameter(Mandatory = $true)]
  [string]$Email,
  [string]$DevVarsPath = "apps/api/.dev.vars"
)

$ErrorActionPreference = "Stop"

function Get-SecretFromDevVars([string]$path, [string]$name) {
  if (-not (Test-Path $path)) {
    throw "Dev vars file not found: $path"
  }

  $line = Get-Content $path | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
  if (-not $line) {
    throw "$name not found in $path"
  }

  return $line.Substring($name.Length + 1).Trim().Trim('"')
}

$secret = Get-SecretFromDevVars -path $DevVarsPath -name "CLERK_SECRET_KEY"
$headers = @{
  Authorization = "Bearer $secret"
  "Content-Type" = "application/json"
}

$encodedEmail = [System.Uri]::EscapeDataString($Email)
$users = Invoke-RestMethod -Method Get -Uri "https://api.clerk.com/v1/users?email_address=$encodedEmail&limit=10" -Headers $headers

if (-not $users -or $users.Count -eq 0) {
  throw "No Clerk user found with email: $Email"
}

$user = $users[0]
$userId = $user.id

$metadataBody = @{
  public_metadata = @{
    role = "admin"
  }
} | ConvertTo-Json -Depth 8

Invoke-RestMethod -Method Patch -Uri "https://api.clerk.com/v1/users/$userId/metadata" -Headers $headers -Body $metadataBody | Out-Null

Write-Output "UPDATED|$userId|$Email|role=admin"
