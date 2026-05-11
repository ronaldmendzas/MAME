param(
  [string]$DevVarsPath = "apps/api/.dev.vars",
  [string]$Password = "Str0ng!Password#2026",
  [string]$EmailDomain = "example.com"
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

  $value = $line.Substring($name.Length + 1)
  return $value.Trim().Trim('"')
}

function New-ClerkUserWithRole(
  [string]$Secret,
  [string]$Role,
  [string]$Email,
  [string]$Password
) {
  $headers = @{
    Authorization = "Bearer $Secret"
    "Content-Type" = "application/json"
  }

  $createBody = @{
    email_address = @($Email)
    password = $Password
    skip_password_checks = $true
    skip_password_requirement = $false
  } | ConvertTo-Json -Depth 8

  $created = Invoke-RestMethod -Method Post -Uri "https://api.clerk.com/v1/users" -Headers $headers -Body $createBody

  $metaBody = @{
    public_metadata = @{
      role = $Role
    }
  } | ConvertTo-Json -Depth 8

  Invoke-RestMethod -Method Patch -Uri "https://api.clerk.com/v1/users/$($created.id)/metadata" -Headers $headers -Body $metaBody | Out-Null

  return [PSCustomObject]@{
    role = $Role
    userId = $created.id
    email = $Email
    password = $Password
  }
}

$secret = Get-SecretFromDevVars -path $DevVarsPath -name "CLERK_SECRET_KEY"
$suffix = Get-Date -Format "yyyyMMddHHmmss"
$roles = @("user", "moderator", "auditor", "admin")

$results = @()
foreach ($role in $roles) {
  $email = "mame.$role.$suffix@$EmailDomain"
  $results += New-ClerkUserWithRole -Secret $secret -Role $role -Email $email -Password $Password
}

$results | Format-Table -AutoSize

Write-Output ""
Write-Output "Created test users successfully."
