Add-Type -AssemblyName System.Drawing

$iconsDir = "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\public\icons"
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null
}

$logoPath = "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\public\uploads\general\1789563604789-1787644810312-logo_pixian_ai.png"
$hasLogo = Test-Path $logoPath

$sizes = @(72, 96, 128, 144, 152, 180, 192, 384, 512)

$srcImg = $null
if ($hasLogo) {
    $srcImg = [System.Drawing.Image]::FromFile($logoPath)
}

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background Navy
    $navy = [System.Drawing.ColorTranslator]::FromHtml("#00407a")
    $bgBrush = New-Object System.Drawing.SolidBrush($navy)
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    if ($srcImg -ne $null) {
        # Render real logo with 10% padding
        $pad = [int]($size * 0.10)
        $drawW = $size - (2 * $pad)
        $drawH = $size - (2 * $pad)
        $g.DrawImage($srcImg, $pad, $pad, $drawW, $drawH)
    } else {
        # Fallback geometric emblem
        $gold = [System.Drawing.ColorTranslator]::FromHtml("#F5A602")
        $goldBrush = New-Object System.Drawing.SolidBrush($gold)
        $penWidth = [float]($size * 0.04)
        $pen = New-Object System.Drawing.Pen($gold, $penWidth)

        $margin = [float]($size * 0.12)
        $w = [float]($size - (2 * $margin))
        $g.DrawEllipse($pen, $margin, $margin, $w, $w)

        $boxW = [float]($size * 0.38)
        $boxH = [float]($size * 0.38)
        $boxX = [float](($size - $boxW) / 2)
        $boxY = [float](($size - $boxH) / 2)
        $g.FillRectangle($goldBrush, $boxX, $boxY, $boxW, $boxH)

        $innerPen = New-Object System.Drawing.Pen($navy, [float]($size * 0.035))
        $g.DrawLine($innerPen, [float]($boxX + $boxW * 0.5), $boxY, [float]($boxX + $boxW * 0.5), [float]($boxY + $boxH))
        $g.DrawLine($innerPen, $boxX, [float]($boxY + $boxH * 0.5), [float]($boxX + $boxW), [float]($boxY + $boxH * 0.5))

        $innerPen.Dispose()
        $pen.Dispose()
        $goldBrush.Dispose()
    }

    # Save normal icon
    $targetPath = Join-Path $iconsDir "icon-$size.png"
    if ($size -eq 180) {
        $targetPath = Join-Path $iconsDir "apple-touch-icon.png"
    }
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Also save maskable-512
    if ($size -eq 512) {
        $maskablePath = Join-Path $iconsDir "maskable-512.png"
        $bmp.Save($maskablePath, [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $targetPath"
}

if ($srcImg -ne $null) {
    $srcImg.Dispose()
}
