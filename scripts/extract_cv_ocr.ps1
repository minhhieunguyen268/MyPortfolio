param(
  [Parameter(Mandatory = $true)][string]$PdfPath,
  [Parameter(Mandatory = $true)][string]$OutPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null

# WinRT activation
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrResult, Windows.Media.Ocr, ContentType = WindowsRuntime]

if (!(Test-Path -LiteralPath $PdfPath)) {
  throw "PDF not found: $PdfPath"
}

$extType = [System.WindowsRuntimeSystemExtensions]

$asTaskOp = $extType.GetMethods([System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::Static) |
  Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.IsGenericType -and
    $_.GetParameters()[0].ParameterType.GetGenericTypeDefinition().FullName -eq 'Windows.Foundation.IAsyncOperation`1'
  } |
  Select-Object -First 1

if ($null -eq $asTaskOp) { throw 'AsTask(IAsyncOperation<T>) not found' }

$asTaskAction = $extType.GetMethods([System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::Static) |
  Where-Object {
    $_.Name -eq 'AsTask' -and -not $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.FullName -eq 'Windows.Foundation.IAsyncAction'
  } |
  Select-Object -First 1

if ($null -eq $asTaskAction) { throw 'AsTask(IAsyncAction) not found' }

function AwaitOp([object]$op, [Type]$resultType) {
  $closed = $asTaskOp.MakeGenericMethod(@($resultType))
  $task = $closed.Invoke($null, @($op))
  return $task.GetAwaiter().GetResult()
}

function AwaitAction([object]$action) {
  $task = $asTaskAction.Invoke($null, @($action))
  $task.GetAwaiter().GetResult() | Out-Null
}

$pdfFile = AwaitOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync($PdfPath)) ([Windows.Storage.StorageFile])
$pdfDoc = AwaitOp ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($pdfFile)) ([Windows.Data.Pdf.PdfDocument])

$ocr = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $ocr) {
  throw 'OCR engine unavailable on this Windows profile.'
}

$sb = New-Object System.Text.StringBuilder
$pageCount = [int]$pdfDoc.PageCount

for ($i = 0; $i -lt $pageCount; $i++) {
  $page = $pdfDoc.GetPage($i)
  try {
    $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
    AwaitAction ($page.RenderToStreamAsync($stream))
    $stream.Seek(0) | Out-Null

    $decoder = AwaitOp ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = AwaitOp ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = AwaitOp ($ocr.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    $null = $sb.AppendLine(("===== PAGE {0} / {1} =====" -f ($i + 1), $pageCount))
    $null = $sb.AppendLine($result.Text)
    $null = $sb.AppendLine()
  } finally {
    $page.Dispose()
  }
}

$outDir = Split-Path -Parent $OutPath
if ($outDir -and !(Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

[System.IO.File]::WriteAllText($OutPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote OCR text: $OutPath"