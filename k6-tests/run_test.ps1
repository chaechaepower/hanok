param (
    [string]$scriptPath = "unique_auction/01_smoke.js",
    [string[]]$EnvVars = @()
)

$linuxPath    = $scriptPath -replace "\\", "/" -replace "^\./", ""
$timestamp    = Get-Date -Format "yyyyMMdd_HHmmss"
$reportName   = $scriptPath -replace "[\\/]", "_" -replace "\.js", "" -replace "^\._", ""
$htmlFileName = "${timestamp}_${reportName}_dashboard.html"

New-Item -ItemType Directory -Force -Path "reports" | Out-Null

$BASE_URL    = "http://j14d105.p.ssafy.io:8080/api/v1"
$WS_BASE_URL = "ws://j14d105.p.ssafy.io:8080/ws-connect"
$INFLUX_URL  = "http://j14d105.p.ssafy.io:8086/k6"

# ✅ EnvVars에서 TEST_TIMESTAMP 덮어쓰기 방지
# EnvVars에 TEST_TIMESTAMP가 없으면 기본값 사용
$hasTimestamp = $EnvVars | Where-Object { $_ -like "TEST_TIMESTAMP=*" }
if (-not $hasTimestamp) {
    $EnvVars += "TEST_TIMESTAMP=$timestamp"
}

$extraEnvArgs = @()
foreach ($env in $EnvVars) {
    $extraEnvArgs += "-e"
    $extraEnvArgs += $env
}

docker run --rm `
  -e BASE_URL="$BASE_URL" `
  -e WS_BASE_URL="$WS_BASE_URL" `
  -e K6_WEB_DASHBOARD=true `
  -e K6_WEB_DASHBOARD_EXPORT="reports/$htmlFileName" `
  @extraEnvArgs `
  -v "${PWD}:/scripts" `
  -w /scripts `
  grafana/k6 run `
  --out influxdb="$INFLUX_URL" `
  $linuxPath