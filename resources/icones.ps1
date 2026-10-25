param([string]$Source, [string]$Res, [string]$Web)
Add-Type -AssemblyName System.Drawing

$corail = [System.Drawing.Image]::FromFile($Source)

function Dessiner([int]$taille, [double]$part, [string]$fond, [string]$chemin) {
  $bmp = New-Object System.Drawing.Bitmap($taille, $taille)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::Transparent)
  if ($fond -eq 'carre') { $g.FillRectangle([System.Drawing.Brushes]::White, 0, 0, $taille, $taille) }
  if ($fond -eq 'rond') { $g.FillEllipse([System.Drawing.Brushes]::White, 0, 0, $taille, $taille) }
  $cote = [int]($taille * $part)
  $marge = [int](($taille - $cote) / 2)
  $g.DrawImage($corail, $marge, $marge, $cote, $cote)
  $g.Dispose()
  $bmp.Save($chemin, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$densites = @{ 'mdpi' = 1.0; 'hdpi' = 1.5; 'xhdpi' = 2.0; 'xxhdpi' = 3.0; 'xxxhdpi' = 4.0 }
foreach ($d in $densites.Keys) {
  $dossier = Join-Path $Res "mipmap-$d"
  $f = $densites[$d]
  # Icônes classiques (48 dp) : fond blanc, carré ou rond.
  Dessiner ([int](48 * $f)) 0.78 'carre' (Join-Path $dossier 'ic_launcher.png')
  Dessiner ([int](48 * $f)) 0.68 'rond' (Join-Path $dossier 'ic_launcher_round.png')
  # Icône adaptative (108 dp) : corail dans la zone sûre de 66 dp, sur fond transparent.
  Dessiner ([int](108 * $f)) 0.58 'aucun' (Join-Path $dossier 'ic_launcher_foreground.png')
}
# Icône du navigateur (favicon).
Dessiner 64 0.9 'aucun' (Join-Path $Web 'favicon.png')
$corail.Dispose()
'ok'
