$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:3000'
$customerCookie = Join-Path $PSScriptRoot 'customer-cookies.txt'
$adminCookie = Join-Path $PSScriptRoot 'admin-cookies.txt'

Write-Host "`n1. Health"
curl.exe "$baseUrl/api/health"

Write-Host "`n`n2. Customer login"
curl.exe -c $customerCookie -X POST "$baseUrl/api/auth/login" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "username=dilara" `
  --data-urlencode "password=password123"

Write-Host "`n`n3. Customer accounts"
curl.exe -b $customerCookie "$baseUrl/api/accounts"

Write-Host "`n`n4. Customer transactions"
curl.exe -b $customerCookie "$baseUrl/api/transactions?account=1000003423"

Write-Host "`n`n5. Transfer"
curl.exe -b $customerCookie -X POST "$baseUrl/api/transfer" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "fromAccount=1000003423" `
  --data-urlencode "toAccount=2000006754" `
  --data-urlencode "amount=100" `
  --data-urlencode "description=test transfer"

Write-Host "`n`n6. Statement"
curl.exe -b $customerCookie "$baseUrl/api/statement?account=1000003423"

Write-Host "`n`n7. New user sign-up"
$newAccountNumber = Get-Random -Minimum 3000000000 -Maximum 3999999999
$newUserCookie = Join-Path $PSScriptRoot 'new-user-cookies.txt'
curl.exe -c $newUserCookie -X POST "$baseUrl/api/auth/signup" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "accountNumber=$newAccountNumber" `
  --data-urlencode "accountName=Test User" `
  --data-urlencode "branch=Test Branch" `
  --data-urlencode "nic=200012345678" `
  --data-urlencode "email=test$newAccountNumber@example.test" `
  --data-urlencode "password=test1234" `
  --data-urlencode "confirmPassword=test1234"

Write-Host "`n`n8. Add another account for new user"
$secondAccountNumber = Get-Random -Minimum 4000000000 -Maximum 4999999999
curl.exe -b $newUserCookie -X POST "$baseUrl/api/accounts" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "accountNumber=$secondAccountNumber" `
  --data-urlencode "accountName=Second Savings" `
  --data-urlencode "branch=Second Branch"

Write-Host "`n`n9. New user accounts"
curl.exe -b $newUserCookie "$baseUrl/api/accounts"

Write-Host "`n`n10. Admin login"
curl.exe -c $adminCookie -X POST "$baseUrl/api/auth/login" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "username=admin" `
  --data-urlencode "password=admin"

Write-Host "`n`n11. Admin system"
curl.exe -b $adminCookie "$baseUrl/api/admin/system"

Write-Host "`n`n12. Setup"
curl.exe -b $adminCookie "$baseUrl/api/setup"

Write-Host "`n`n13. Search"
curl.exe -b $adminCookie "$baseUrl/api/search?q=dilara"

Write-Host "`n`nDone."
