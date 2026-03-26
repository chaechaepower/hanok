# ============================================================
# 검색 성능 비교 테스트 (FULLTEXT 유무)
# ============================================================

$BASE_URL = "http://j14d105.p.ssafy.io:8080/api/v1"
$TIMESTAMP = (Get-Date).ToString("yyyyMMdd_HHmmss")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  검색 성능 비교 테스트 시작" -ForegroundColor Cyan
Write-Host "  타임스탬프: $TIMESTAMP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── 1단계: FULLTEXT 적용 상태 측정 ───────────────────────────
Write-Host "`n[1단계] FULLTEXT 적용 상태 측정 중..." -ForegroundColor Green
$env:FULLTEXT_ENABLED = "true"
$env:TEST_TIMESTAMP   = "${TIMESTAMP}_fulltext_on"
k6 run --out "influxdb=http://j14d105.p.ssafy.io:8086/k6" `
       -e BASE_URL=$BASE_URL `
       -e FULLTEXT_ENABLED=true `
       -e TEST_TIMESTAMP="${TIMESTAMP}_fulltext_on" `
       ".\search\02_stepup.js"

Write-Host "`n[1단계 완료] 결과 저장됨" -ForegroundColor Green
Write-Host "다음 단계 진행 전 DB에서 FULLTEXT를 DROP하세요:" -ForegroundColor Yellow
Write-Host "  ALTER TABLE stream DROP INDEX ft_stream_title;" -ForegroundColor Yellow
Write-Host "  ALTER TABLE item   DROP INDEX ft_item_name;" -ForegroundColor Yellow
Write-Host "  ALTER TABLE tag    DROP INDEX ft_tag_name;" -ForegroundColor Yellow
Write-Host "`n준비되면 Enter를 누르세요..." -ForegroundColor Yellow
Read-Host

# ── 2단계: FULLTEXT 제거 상태 측정 ───────────────────────────
Write-Host "`n[2단계] FULLTEXT 제거 상태 측정 중..." -ForegroundColor Red
Write-Host "⚠️  이 단계에서 검색 API는 500 에러가 발생합니다" -ForegroundColor Red
Write-Host "⚠️  이것이 FULLTEXT 인덱스 제거의 실제 영향입니다" -ForegroundColor Red
$env:FULLTEXT_ENABLED = "false"
$env:TEST_TIMESTAMP   = "${TIMESTAMP}_fulltext_off"
k6 run --out "influxdb=http://j14d105.p.ssafy.io:8086/k6" `
       -e BASE_URL=$BASE_URL `
       -e FULLTEXT_ENABLED=false `
       -e TEST_TIMESTAMP="${TIMESTAMP}_fulltext_off" `
       ".\search\02_stepup.js"

Write-Host "`n[2단계 완료] FULLTEXT 복구하세요:" -ForegroundColor Yellow
Write-Host "  ALTER TABLE stream ADD FULLTEXT INDEX ft_stream_title (title) WITH PARSER ngram;" -ForegroundColor Yellow
Write-Host "  ALTER TABLE item   ADD FULLTEXT INDEX ft_item_name (name) WITH PARSER ngram;" -ForegroundColor Yellow
Write-Host "  ALTER TABLE tag    ADD FULLTEXT INDEX ft_tag_name (name) WITH PARSER ngram;" -ForegroundColor Yellow
Write-Host "`n복구 완료 후 Enter를 누르세요..." -ForegroundColor Yellow
Read-Host

# ── 3단계: 복구 후 재측정 ────────────────────────────────────
Write-Host "`n[3단계] FULLTEXT 복구 후 재측정 중..." -ForegroundColor Green
$env:FULLTEXT_ENABLED = "true"
$env:TEST_TIMESTAMP   = "${TIMESTAMP}_fulltext_restored"
k6 run --out "influxdb=http://j14d105.p.ssafy.io:8086/k6" `
       -e BASE_URL=$BASE_URL `
       -e FULLTEXT_ENABLED=true `
       -e TEST_TIMESTAMP="${TIMESTAMP}_fulltext_restored" `
       ".\search\02_stepup.js"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  전체 비교 테스트 완료" -ForegroundColor Cyan
Write-Host "  reports/ 디렉토리에서 CSV 비교하세요" -ForegroundColor Cyan
Write-Host "  파일 패턴: ${TIMESTAMP}_*_summary.csv" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan