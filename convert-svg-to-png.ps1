$svgPath = "C:\Users\blane\OneDrive\Documents\musicgenerator\src\assets\CMG.svg"
$pngPath = "C:\Users\blane\OneDrive\Documents\musicgenerator\src\assets\cmg-256.png"
$icoPath = "C:\Users\blane\OneDrive\Documents\musicgenerator\src\assets\cmg.ico"

# Read SVG content
$svgContent = Get-Content $svgPath -Raw

# Create an HTML file to render the SVG and convert to PNG
$html = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial; }
        #svgContainer { display: inline-block; }
        svg { width: 256px; height: 256px; display: block; border: 1px solid #ccc; }
        button { margin-top: 10px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
    </style>
</head>
<body>
    <h2>SVG to PNG Converter</h2>
    <div id="svgContainer">
$svgContent
    </div>
    <br>
    <button onclick="convertToPNG()">Download as PNG</button>
    
    <script>
        function convertToPNG() {
            const svg = document.querySelector('svg');
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, 256, 256);
                canvas.toBlob(function(blob) {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'cmg-256.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            
            img.src = url;
        }
    </script>
</body>
</html>
"@

$tempHtml = "$env:TEMP\svg-render.html"
$html | Out-File -FilePath $tempHtml -Encoding UTF8

Write-Host "Created HTML file at: $tempHtml"
Write-Host ""
Write-Host "Opening browser - click 'Download as PNG' button"
Write-Host "Save the file to your Downloads folder as 'cmg-256.png'"
Write-Host ""
Write-Host "Then run these commands:"
Write-Host "  Move-Item `$env:USERPROFILE\Downloads\cmg-256.png $pngPath"
Write-Host "  png-to-ico $pngPath $icoPath"
Write-Host "  Copy-Item $icoPath C:\cmg.ico"
Write-Host "  reg add `"HKEY_CLASSES_ROOT\CMGFile\DefaultIcon`" /ve /d `"C:\cmg.ico`" /f"
Write-Host "  taskkill /f /im explorer.exe; Start-Process explorer.exe"

# Open the HTML file
Start-Process $tempHtml
