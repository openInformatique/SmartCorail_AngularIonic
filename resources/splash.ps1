param([string]$Source, [string]$Res)
Add-Type -AssemblyName System.Drawing

$corail = [System.Drawing.Image]::FromFile($Source)
$fichiers = Get-ChildItem -Path $Res -Recurse -Filter 'splash.png'
foreach ($f in $fichiers) {
  $ancien = [System.Drawing.Image]::FromFile($f.FullName)
  $l = $ancien.Width
  $h = $ancien.Height
  $ancien.Dispose()
  $bmp = New-Object System.Drawing.Bitmap($l, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::White)
  # Corail centré, sur un quart du plus petit côté.
  $cote = [int]([Math]::Min($l, $h) * 0.25)
  $g.DrawImage($corail, [int](($l - $cote) / 2), [int](($h - $cote) / 2), $cote, $cote)
  $g.Dispose()
  $bmp.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "$($f.Directory.Name) ${l}x${h}"
}
$corail.Dispose()
