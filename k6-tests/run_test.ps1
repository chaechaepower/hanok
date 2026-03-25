param (
    [string]$scriptPath = "search/01_smoke.js"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportName = $scriptPath -replace "/", "_" -replace ".js", ""
$htmlFileName = "${timestamp}_${reportName}_dashboard.html"

New-Item -ItemType Directory -Force -Path "reports" | Out-Null

# ==================== 환경 변수 세팅 ====================
$BASE_URL    = "http://j14d105.p.ssafy.io:8080/api/v1"
# ✅ 1. Spring Boot 엔드포인트인 /ws-connect 로 수정
$WS_BASE_URL = "ws://j14d105.p.ssafy.io:8080/ws-connect"

$INFLUX_URL  = "http://j14d105.p.ssafy.io:8086/k6"

# ==================== Docker 실행 ====================
docker run --rm `
  -e BASE_URL="$BASE_URL" `
  -e WS_BASE_URL="$WS_BASE_URL" `
  -e TEST_TIMESTAMP="$timestamp" `
  -e K6_WEB_DASHBOARD=true `
  -e K6_WEB_DASHBOARD_EXPORT="reports/$htmlFileName" `
  -v "${PWD}:/scripts" `
  -w /scripts `
  grafana/k6 run `
  --out influxdb="$INFLUX_URL" `
  $scriptPath