# PowerShell script to upload SSL files to your server

$server = "39.175.57.2"
$user = "djdn"
$port = "22"

Write-Host "=========================================="
Write-Host "Uploading SSL files to $server"
Write-Host "=========================================="
Write-Host ""

# Upload certificate
Write-Host "Uploading certificate..."
scp -P $port C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com_bundle.crt ${user}@${server}:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificate uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Certificate upload failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Upload private key
Write-Host "Uploading private key..."
scp -P $port C:/wamp64/www/yiwuexpress/dromkok.com_nginx/dromkok.com_nginx/dromkok.com.key ${user}@${server}:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Private key uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Private key upload failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ SSL files uploaded successfully!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. SSH into server: ssh ${user}@${server} -p ${port}"
Write-Host "2. Follow the commands in SETUP_SSL_YOUR_SERVER.txt"
Write-Host ""
