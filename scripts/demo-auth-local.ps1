param(
  [string]$ApiBaseUrl = "http://localhost:8787",
  [string]$Login = "demo@example.com",
  [string]$StrongPassword = "Str0ng!Password#2026",
  [string]$WeakPassword = "12345678"
)

$ErrorActionPreference = "Stop"

function Step([string]$text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Post-Json([string]$url, [hashtable]$body) {
  $json = $body | ConvertTo-Json -Depth 10
  try {
    return Invoke-RestMethod -Method Post -Uri $url -ContentType "application/json" -Body $json
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $responseBody = $reader.ReadToEnd()
      Write-Host $responseBody -ForegroundColor Yellow
    }
    throw
  }
}

Step "Case 1: Strong password registration"
$case1 = Post-Json "$ApiBaseUrl/auth/local/register" @{
  login = $Login
  password = $StrongPassword
}
$userId = $case1.data.userId
Write-Host "Registered userId: $userId" -ForegroundColor Green

Step "Case 2: Weak password rejected"
try {
  Post-Json "$ApiBaseUrl/auth/local/register" @{
    login = "weak@example.com"
    password = $WeakPassword
  } | Out-Null
  Write-Host "Unexpected success on weak password" -ForegroundColor Red
} catch {
  Write-Host "Weak password correctly rejected" -ForegroundColor Green
}

Step "Case 3: Login with strong password"
$loginResult = Post-Json "$ApiBaseUrl/auth/local/login" @{
  login = $Login
  password = $StrongPassword
}
$status = $loginResult.data.status
Write-Host "Login status: $status" -ForegroundColor Green

Step "Case 4: Begin MFA enrollment"
$mfaBegin = Post-Json "$ApiBaseUrl/auth/local/mfa/begin" @{
  userId = $userId
  accountName = $Login
  issuer = "MAME"
}
Write-Host "otpauth URI generated" -ForegroundColor Green
Write-Host $mfaBegin.data.otpAuthUri -ForegroundColor DarkGray

Step "Case 5: Confirm and verify MFA"
Write-Host "Enter current 6-digit authenticator code for $Login:" -ForegroundColor Yellow
$code = Read-Host

$confirm = Post-Json "$ApiBaseUrl/auth/local/mfa/confirm" @{
  userId = $userId
  code = $code
}
Write-Host "MFA confirm status: $($confirm.data.status)" -ForegroundColor Green

$verify = Post-Json "$ApiBaseUrl/auth/local/mfa/verify" @{
  userId = $userId
  code = $code
}
Write-Host "MFA verify status: $($verify.data.status)" -ForegroundColor Green

Write-Host "`nDemo sequence completed." -ForegroundColor Magenta