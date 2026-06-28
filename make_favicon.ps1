Add-Type -AssemblyName System.Drawing

$srcPath = "public\Logo\ElectroHomeSY-logo-icon.png"
$outPath = "public\favicon.png"

$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$w = $src.Width
$h = $src.Height
$size = [Math]::Min($w, $h)
$x = [int](($w - $size) / 2)
$y = [int](($h - $size) / 2)

# Crop to square
$cropped = New-Object System.Drawing.Bitmap($size, $size)
$gc = [System.Drawing.Graphics]::FromImage($cropped)
$srcRect = New-Object System.Drawing.Rectangle($x, $y, $size, $size)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$gc.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$gc.Dispose()

# Resize to 64x64
$resized = New-Object System.Drawing.Bitmap($cropped, 64, 64)
$resized.Save((Resolve-Path "public" | Join-Path -ChildPath "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$cropped.Dispose()
$resized.Dispose()

Write-Host "Favicon PNG 64x64 created at public\favicon.png"
