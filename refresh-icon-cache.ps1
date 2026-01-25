# Apply registry changes
Write-Host "Applying registry changes..."
Start-Process -FilePath "reg" -ArgumentList "import", "`"$PSScriptRoot\fix-cmg-icon.reg`"" -Wait -NoNewWindow

# Refresh icon cache by restarting Explorer
Write-Host "Refreshing icon cache..."
Stop-Process -Name explorer -Force
Start-Sleep -Seconds 2

Write-Host "Icon cache refreshed. Please check your .cmg files now."
