param(
  [int]$Port = 8123,
  [string]$Root = ""
)

$ErrorActionPreference = "Stop"

if (-not $Root) {
  $Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$Root = (Resolve-Path $Root).Path.TrimEnd("\")
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "TCE local server"
Write-Host "Root: $Root"
Write-Host "URL:  http://localhost:$Port/"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".mjs"  = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".webp" = "image/webp"
  ".woff2" = "font/woff2"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()

  try {
    $relative = $context.Request.Url.AbsolutePath

    if ($relative -eq "/") {
      $relative = "/index.html"
    }

    $relative = [System.Uri]::UnescapeDataString($relative).TrimStart("/").Replace("/", "\")
    $file = Join-Path $Root $relative
    $resolved = [System.IO.Path]::GetFullPath($file)

    if (-not $resolved.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
      $context.Response.OutputStream.Write($body, 0, $body.Length)
      continue
    }

    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found: $relative")
      $context.Response.OutputStream.Write($body, 0, $body.Length)
      continue
    }

    $extension = [System.IO.Path]::GetExtension($resolved).ToLowerInvariant()
    $mime = $mimeTypes[$extension]

    if (-not $mime) {
      $mime = "application/octet-stream"
    }

    $bytes = [System.IO.File]::ReadAllBytes($resolved)
    $context.Response.ContentType = $mime
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.Headers.Add("Cache-Control", "no-store")
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $context.Response.StatusCode = 500
    $body = [System.Text.Encoding]::UTF8.GetBytes("Server error: $($_.Exception.Message)")
    $context.Response.OutputStream.Write($body, 0, $body.Length)
  } finally {
    $context.Response.OutputStream.Close()
  }
}
