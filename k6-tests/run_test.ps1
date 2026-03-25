param (
    [string]$scriptPath = "unique_auction/01_smoke.js"
)

# ✅ 핵심 추가: Windows의 역슬래시(\)를 Linux의 슬래시(/)로 자동 변환
$linuxPath = $scriptPath -replace "\\", "/" -replace "^\./", ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
# 파일명 만들 때는 역슬래시, 슬래시 다 언더바로 변경
$reportName = $scriptPath -replace "[\\/]", "_" -replace "\.js", "" -replace "^\._", ""
$htmlFileName = "${timestamp}_${reportName}_dashboard.html"

New-Item -ItemType Directory -Force -Path "reports" | Out-Null

# ==================== 환경 변수 세팅 ====================
$BASE_URL    = "http://j14d105.p.ssafy.io:8080/api/v1"
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
  $linuxPath  # 👈 수정한 linuxPath 변수를 전달