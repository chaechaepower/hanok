-- ============================================================
--  검색 성능/품질 테스트용 더미 데이터 생성 프로시저
--  대상: stream, item, auction, tag
--  전제: seller (및 연결된 user) 가 이미 존재해야 함
--
--  생성 규모:
--    stream  : 2,000건  (LIVE 500 + SCHEDULED 1,500)
--    item    : 10,000건 (stream당 5개)
--    auction : 10,000건 (item당 1개)
--    tag     : 30,000건 (item당 3개)
--
--  마커 (정리 시 WHERE 조건):
--    stream.notice       = '__seed__'
--    item.description    = '__seed__'
--
--  실행:
--    Workbench에서 이 파일 전체 선택 후 Ctrl+Shift+Enter
--    → CALL seed_search_testdata();
--
--  정리:
--    CALL cleanup_seed_testdata();
-- ============================================================

-- ── 이중 실행 방지 ──────────────────────────────────────────
DROP PROCEDURE IF EXISTS seed_search_testdata;
DROP PROCEDURE IF EXISTS cleanup_seed_testdata;

-- ============================================================
--  정리 프로시저
-- ============================================================
DELIMITER $$

CREATE PROCEDURE cleanup_seed_testdata()
BEGIN
    -- 연관 관계 순서대로 삭제
    DELETE t FROM tag t
        INNER JOIN item i ON t.item_id = i.id
        WHERE i.description = '__seed__';

    DELETE a FROM auction a
        INNER JOIN item i ON a.item_id = i.id
        WHERE i.description = '__seed__';

    DELETE FROM item WHERE description = '__seed__';

    DELETE FROM stream WHERE notice = '__seed__';

    SELECT
        (SELECT COUNT(*) FROM stream  WHERE notice       = '__seed__') AS remaining_streams,
        (SELECT COUNT(*) FROM item    WHERE description  = '__seed__') AS remaining_items;
END $$

-- ============================================================
--  데이터 생성 프로시저
-- ============================================================
CREATE PROCEDURE seed_search_testdata()
proc_body: BEGIN
    -- ── 변수 선언 ──────────────────────────────────────────────
    DECLARE v_seller_id   BIGINT;
    DECLARE v_stream_id   BIGINT;
    DECLARE v_item_id     BIGINT;
    DECLARE v_seller_cnt  INT;
    DECLARE v_stream_title VARCHAR(255);
    DECLARE v_item_name    VARCHAR(255);
    DECLARE v_category     VARCHAR(100);
    DECLARE v_tag1         VARCHAR(100);
    DECLARE v_tag2         VARCHAR(100);
    DECLARE v_tag3         VARCHAR(100);

    DECLARE i INT DEFAULT 0;  -- stream 루프
    DECLARE j INT DEFAULT 0;  -- item 루프
    DECLARE b INT DEFAULT 0;  -- brand index  (0~19)
    DECLARE c INT DEFAULT 0;  -- category index (0~10)
    DECLARE s INT DEFAULT 0;  -- suffix index

    -- ── 이미 실행된 경우 중단 ──────────────────────────────────
    IF (SELECT COUNT(*) FROM stream WHERE notice = '__seed__') > 0 THEN
        SELECT '이미 seed 데이터가 존재합니다. cleanup 후 재실행하세요.' AS message;
        LEAVE proc_body;
    END IF;

    -- ── seller 존재 확인 ───────────────────────────────────────
    SELECT COUNT(*) INTO v_seller_cnt FROM seller;
    IF v_seller_cnt = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'seller 테이블이 비어있습니다. 기존 유저/셀러 데이터가 필요합니다.';
    END IF;

    -- ── seller ID 임시 테이블 (LIMIT/OFFSET 변수 제한 우회) ──────
    DROP TEMPORARY TABLE IF EXISTS _tmp_sellers;
    CREATE TEMPORARY TABLE _tmp_sellers AS
        SELECT id, (@rn := @rn + 1) - 1 AS rn
        FROM seller, (SELECT @rn := 0) r
        ORDER BY id;

    -- ── stream 루프 (2,000건) ──────────────────────────────────
    SET i = 0;
    WHILE i < 2000 DO

        SET b = i % 20;
        SET c = i % 11;
        SET s = (i / 20) % 10;   -- 같은 브랜드 내 변형 인덱스

        -- seller 순환 배정 (임시 테이블에서 rn으로 직접 조회)
        SELECT id INTO v_seller_id
        FROM _tmp_sellers WHERE rn = (i % v_seller_cnt);

        -- 브랜드별 스트림 타이틀
        SET v_stream_title = CASE b
            WHEN 0  THEN CONCAT('나이키 ', ELT(s+1,'에어맥스90','에어조던1','덩크로우','에어포스1','리액트인피니티','줌플라이5','페가수스40','인피니티런4','코르테즈','와플레이서'), ' 한정 경매')
            WHEN 1  THEN CONCAT('아디다스 ', ELT(s+1,'울트라부스트23','스탠스미스','슈퍼스타','삼바OG','가젤인도어','포럼로우','NMD_R1','이지350','파퀘트코트','트레포일'), ' 라이브')
            WHEN 2  THEN CONCAT('뉴발란스 ', ELT(s+1,'993메이드인USA','992그레이','990v6','574레거시','530실버','327오리지널','2002R화이트','1906R클라우드','9060블랙','860v13'), ' 경매방송')
            WHEN 3  THEN CONCAT('아식스 ', ELT(s+1,'젤카야노30','젤님버스25','젤쿠무루스','카야노30','스카이스피드4','젤라이트쏘','젤엑스','블래스트FF3','누트리폼3','젤레졸브2'), ' 한정판')
            WHEN 4  THEN CONCAT('살로몬 ', ELT(s+1,'스피드크로스6','XT-6 ADV','울트라글라이드2','겐도3','앰퓨스3','알파크로스5','펄스15','소닉3발레스타','오토크로스2','웨이트레일5'), ' 스트림')
            WHEN 5  THEN CONCAT('롤렉스 ', ELT(s+1,'서브마리너 126610LN','데이토나 116500LN','GMT마스터II 126710BLNR','익스플로러I 224270','씨드웰러 126600','오이스터퍼페추얼 41','에어킹 116900','밀가우스 116400GV','스카이드웰러 336934','요트마스터 226659'), ' 경매')
            WHEN 6  THEN CONCAT('오메가 ', ELT(s+1,'씨마스터 다이버300m','스피드마스터 문워치','컨스텔레이션 퀀텀','드빌 아워비전','플래닛오션 600m','아쿠아테라 150m','레일마스터','다이내믹','씨마스터 아쿠아','문워치 310'), ' 한정경매')
            WHEN 7  THEN CONCAT('샤넬 ', ELT(s+1,'클래식플랩 미디엄','보이백 라지','가브리엘 스몰','코코핸들 스몰','2.55 리에디션','타임리스 WOC','클래식플랩 점보','클래식플랩 미니','19백 스몰','22백 미니'), ' 라이브경매')
            WHEN 8  THEN CONCAT('루이비통 ', ELT(s+1,'스피디 25','네버풀 MM','온더고 PM','팔라스 BB','티볼리 PM','알마 BB','카퓌신 미니','마를레 체인','파삭 소형','노에 버킷'), ' 경매방송')
            WHEN 9  THEN CONCAT('구찌 ', ELT(s+1,'마몬트 미니','디오니소스 스몰','GG마몬트 미디엄','오피디아 스몰','뱀부 1947','블룸 숄더백','미키 GG','재키 1961','블라인드 포 러브','실비 버킷'), ' 스트림')
            WHEN 10 THEN CONCAT('포켓몬 ', ELT(s+1,'리자몽VMAX PSA10','피카츄V 풀아트','뮤츠GX 레인보우','이브이V SA','메가리자몽EX XY','리자몽스타 e시리즈','피카츄 초판 홀로','뮤GX 레인보우','루기아V SA','수력몬V 풀아트'), ' 카드경매')
            WHEN 11 THEN CONCAT('원피스 ', ELT(s+1,'루피 기어5 피규어','조로 와도이치문지 피규어','나미 네코네코 피규어','우솝 킹 피규어','상디 핫스터프 피규어','쵸파 람볼람부 피규어','로빈 DXF','프랑키 사이보그','브룩 요미요미','에이스 포테이스'), ' 한정판경매')
            WHEN 12 THEN CONCAT('건담 ', ELT(s+1,'MG 유니콘 VER.KA','PG 더블오 레이저','RG 프리덤 2.0','HGUC 데스티니','MG 스트라이크 루쥬','RG 케르베로스','MG 레드프레임 개조','PG 사이저','HGBF 영원히','MG 에피온 EW'), ' 한정경매')
            WHEN 13 THEN CONCAT('애플 ', ELT(s+1,'아이폰15 프로맥스 256G','에어팟 프로2 MagSafe','맥북에어 M3 15인치','애플워치 울트라2','아이패드 프로 M4 13인치','아이폰14 프로 512G','에어팟 3세대','맥북프로 M3 Pro','맥미니 M2 Pro','비전 프로 256G'), ' 중고경매')
            WHEN 14 THEN CONCAT('삼성 ', ELT(s+1,'갤럭시S24 울트라 512G','갤럭시 버즈2 프로','갤럭시워치6 클래식 47mm','갤럭시탭 S9 울트라','갤럭시Z 폴드5 512G','갤럭시Z 플립5 256G','갤럭시북4 프로360','갤럭시링','갤럭시S23 FE','갤럭시A54 256G'), ' 미개봉경매')
            WHEN 15 THEN CONCAT('레고 ', ELT(s+1,'테크닉 맥라렌 F1 42141','시티 경찰서 60316','크리에이터 타지마할 10256','스타워즈 밀레니엄팔콘 75192','해리포터 호그와트 75978','마인크래프트 크리퍼 21156','닌자고 시티도크 71741','아이디어 허블망원경 21045','아트 모나리자 31213','아키텍처 에펠탑 21019'), ' 한정경매')
            WHEN 16 THEN CONCAT('에어조던 ', ELT(s+1,'1 레트로 하이 OG 시카고','3 레트로 블랙시멘트','4 레트로 화이트시멘트','5 레트로 올드로얄','6 레트로 카민','11 레트로 컨코드','12 레트로 플레이오프','13 레트로 플린트','14 레트로 페르라리','1 레트로 로얄 토'), ' 경매')
            WHEN 17 THEN CONCAT('반클리프아펠 ', ELT(s+1,'빈티지알함브라 목걸이','마지크알함브라 팔찌','알함브라 귀걸이 18K','페리백클로버 반지','럭키스프링 클립','줄리에트 목걸이','로망 목걸이','빅토리아 팔찌','메티아 목걸이 다이아','블루클리프 귀걸이'), ' 주얼리경매')
            WHEN 18 THEN CONCAT('에르메스 ', ELT(s+1,'버킨25 토고 블랙','버킨30 스위프트 골드','버킨35 클레망스 에투프','켈리25 박스칼프 루즈','켈리28 에버컬러 블루','켈리35 토고 그리','린디26 스위프트 나타','피코탄18 클레망스 블랙','에블린29 에버컬러','가든파티36 네고론다'), ' 명품경매')
            ELSE         CONCAT('빈티지 ', ELT(s+1,'LP판 비틀즈 화이트앨범','라이카 M6 필름카메라','스타워즈 오리지널 포스터','오메가 씨마스터 1960s','샤넬 2.55 빈티지 1970s','대한민국 초대 우표','주한미군 코인 1945','앤틱 마호가니 책상','청자 상감 운학문 매병','앤디워홀 수프캔 프린트'), ' 아트경매')
        END;

        -- 카테고리 매핑
        SET v_category = CASE c
            WHEN 0  THEN 'SNEAKERS_SHOES'
            WHEN 1  THEN 'SNEAKERS_SHOES'
            WHEN 2  THEN 'SNEAKERS_SHOES'
            WHEN 3  THEN 'WATCHES'
            WHEN 4  THEN 'WATCHES'
            WHEN 5  THEN 'BAGS_FASHION_ACCESSORIES'
            WHEN 6  THEN 'BAGS_FASHION_ACCESSORIES'
            WHEN 7  THEN 'BAGS_FASHION_ACCESSORIES'
            WHEN 8  THEN 'TRADING_CARDS'
            WHEN 9  THEN 'FIGURES_ARTTOYS_GOODS'
            ELSE         'ANTIQUES'
        END;

        -- stream 삽입
        INSERT INTO stream (title, category, status, thumbnail,
                            scheduled_at, start_type, notice, created_at, seller_id)
        VALUES (
            v_stream_title,
            v_category,
            IF(i < 500, 'LIVE', 'SCHEDULED'),
            CONCAT('https://picsum.photos/seed/str', i, '/400/300'),
            DATE_ADD(NOW(), INTERVAL (i * 3) HOUR),
            'SCHEDULED',
            '__seed__',
            DATE_SUB(NOW(), INTERVAL (2000 - i) MINUTE),
            v_seller_id
        );
        SET v_stream_id = LAST_INSERT_ID();

        -- ── item 루프 (스트림당 5개) ──────────────────────────
        SET j = 0;
        WHILE j < 5 DO

            -- 아이템 이름 (브랜드별)
            SET v_item_name = CASE b
                WHEN 0  THEN CONCAT('나이키 에어맥스 ', 230 + ((i*5+j)*7 % 120), 'mm')
                WHEN 1  THEN CONCAT('아디다스 울트라부스트 ', ELT(j+1,'23 남성','23 여성','라이트 남','라이트 여','COLD.RDY'))
                WHEN 2  THEN CONCAT('뉴발란스 992 ', ELT(j+1,'그레이','화이트','네이비','베이지','블랙'), ' ', 230+((i+j)*5%90))
                WHEN 3  THEN CONCAT('아식스 젤카야노 ', 28+j, ' ', ELT(j+1,'남성','여성','와이드','엑스트라와이드','스탠다드'))
                WHEN 4  THEN CONCAT('살로몬 ', ELT(j+1,'스피드크로스6','XT-6 ADV','울트라글라이드2','겐도3','앰퓨스3'), ' SIZE:', 250+j*5)
                WHEN 5  THEN CONCAT('롤렉스 서브마리너 ', ELT(j+1,'2020년식','2021년식','2022년식','2023년식','2024년식'))
                WHEN 6  THEN CONCAT('오메가 씨마스터 ', ELT(j+1,'300m 블랙','300m 블루','300m 그린','아쿠아테라','플래닛오션'))
                WHEN 7  THEN CONCAT('샤넬 클래식플랩 ', ELT(j+1,'미디엄 블랙 캐비어','미디엄 베이지 램스킨','스몰 블랙','점보 블랙','미니 핑크'))
                WHEN 8  THEN CONCAT('루이비통 ', ELT(j+1,'네버풀 MM 모노그램','스피디 25 모노그램','온더고 PM','팔라스 BB','알마 BB 에삐'))
                WHEN 9  THEN CONCAT('구찌 마몬트 ', ELT(j+1,'미니 블랙','스몰 베이지','미디엄 레드','미니 화이트','마이크로 블랙'))
                WHEN 10 THEN CONCAT('포켓몬카드 ', ELT(j+1,'리자몽VMAX','피카츄V 풀아트','뮤츠GX','이브이V SA','메가리자몽EX'), ' PSA', 8+j%3)
                WHEN 11 THEN CONCAT('원피스 피규어 ', ELT(j+1,'루피 기어5','조로 와도','나미 네코','상디 핫스터프','에이스 포테이스'))
                WHEN 12 THEN CONCAT('건담 ', ELT(j+1,'MG 유니콘VER.KA','PG 더블오레이저','RG 프리덤2.0','HGUC 데스티니','MG 스트라이크루쥬'))
                WHEN 13 THEN CONCAT('아이폰15 프로맥스 ', ELT(j+1,'128G 블랙','256G 화이트','512G 내추럴','1TB 블루','256G 골드'))
                WHEN 14 THEN CONCAT('갤럭시S24 울트라 ', ELT(j+1,'256G 블랙','256G 그레이','512G 블랙','512G 바이올렛','1TB 블랙'))
                WHEN 15 THEN CONCAT('레고 ', ELT(j+1,'테크닉 맥라렌F1 42141','스타워즈 밀팔콘 75192','해리포터 호그와트성 71043','아이디어 NES 71374','크리에이터 에펠탑 10307'))
                WHEN 16 THEN CONCAT('에어조던1 레트로 ', ELT(j+1,'시카고 2015','브레드 2013','로얄 2017','섀도우 2018','모카 2001'))
                WHEN 17 THEN CONCAT('반클리프아펠 ', ELT(j+1,'알함브라 목걸이 18K 화이트골드','알함브라 팔찌 18K 옐로우골드','알함브라 반지','페리백클로버 다이아','럭키스프링 다이아'))
                WHEN 18 THEN CONCAT('에르메스 버킨 ', ELT(j+1,'25 토고 블랙','25 스위프트 루즈','30 클레망스 에투프','30 에버컬러 블루','35 토고 골드'))
                ELSE        CONCAT('빈티지 ', ELT(j+1,'LP판 비틀즈','라이카 필름카메라','빈티지 포스터','앤틱 시계','오리지널 코인'))
            END;

            -- 태그 설정
            SET v_tag1 = CASE b
                WHEN 0  THEN '나이키'      WHEN 1  THEN '아디다스'    WHEN 2  THEN '뉴발란스'
                WHEN 3  THEN '아식스'      WHEN 4  THEN '살로몬'      WHEN 5  THEN '롤렉스'
                WHEN 6  THEN '오메가'      WHEN 7  THEN '샤넬'        WHEN 8  THEN '루이비통'
                WHEN 9  THEN '구찌'        WHEN 10 THEN '포켓몬'      WHEN 11 THEN '원피스'
                WHEN 12 THEN '건담'        WHEN 13 THEN '애플'        WHEN 14 THEN '삼성'
                WHEN 15 THEN '레고'        WHEN 16 THEN '조던'        WHEN 17 THEN '반클리프'
                WHEN 18 THEN '에르메스'    ELSE '빈티지'
            END;

            SET v_tag2 = CASE c
                WHEN 0  THEN '스니커즈'    WHEN 1  THEN '운동화'      WHEN 2  THEN '신발'
                WHEN 3  THEN '시계'        WHEN 4  THEN '명품시계'    WHEN 5  THEN '명품백'
                WHEN 6  THEN '핸드백'      WHEN 7  THEN '가방'        WHEN 8  THEN '트레이딩카드'
                WHEN 9  THEN '피규어'      ELSE '앤틱'
            END;

            SET v_tag3 = ELT(1 + ((i+j) % 8),
                '한정판', '레어', '미개봉', '빈티지', '컬렉터블', '프리미엄', '오리지널', '데드스탁');

            -- item 삽입
            INSERT INTO item (name, description, category, status, item_condition,
                              image1, created_at, seller_id)
            VALUES (
                v_item_name,
                '__seed__',
                v_category,
                'READY',
                ELT(1 + ((i+j) % 4), 'BRAND_NEW', 'OPEN_BOX', 'REFURBISHED', 'USED'),
                CONCAT('https://picsum.photos/seed/itm', i, '_', j, '/400/400'),
                DATE_SUB(NOW(), INTERVAL (2000 - i) MINUTE),
                v_seller_id
            );
            SET v_item_id = LAST_INSERT_ID();

            -- tag 삽입 (3개)
            INSERT INTO tag (name, item_id) VALUES (v_tag1, v_item_id);
            INSERT INTO tag (name, item_id) VALUES (v_tag2, v_item_id);
            INSERT INTO tag (name, item_id) VALUES (v_tag3, v_item_id);

            -- auction 삽입
            INSERT INTO auction (auction_status, auction_type, auction_duration, stream_id, item_id)
            VALUES (
                'READY',
                ELT(1 + (i % 2), 'UNIQUE_TOP', 'BOTTOM_UP'),
                300,
                v_stream_id,
                v_item_id
            );

            SET j = j + 1;
        END WHILE;

        SET i = i + 1;
    END WHILE;

    DROP TEMPORARY TABLE IF EXISTS _tmp_sellers;

    -- ── 최종 집계 출력 ─────────────────────────────────────────
    SELECT
        (SELECT COUNT(*) FROM stream  WHERE notice      = '__seed__') AS inserted_streams,
        (SELECT COUNT(*) FROM item    WHERE description = '__seed__') AS inserted_items,
        (SELECT COUNT(*) FROM tag     WHERE name IN (
            '나이키','아디다스','뉴발란스','아식스','살로몬',
            '롤렉스','오메가','샤넬','루이비통','구찌',
            '포켓몬','원피스','건담','애플','삼성',
            '레고','조던','반클리프','에르메스','빈티지'
        ))                                                             AS inserted_brand_tags,
        (SELECT COUNT(*) FROM auction WHERE auction_status = 'READY'
             AND stream_id IN (SELECT id FROM stream WHERE notice = '__seed__')) AS inserted_auctions;

END $$

DELIMITER ;

-- ============================================================
--  실행 (위 프로시저 생성 후 바로 실행됨)
-- ============================================================
CALL seed_search_testdata();


-- ============================================================
--  ① 실행 직후 검증 쿼리  (Workbench 캡쳐 ①)
-- ============================================================

-- 전체 규모
SELECT
    (SELECT COUNT(*) FROM stream  WHERE notice      = '__seed__')               AS total_streams,
    (SELECT COUNT(*) FROM stream  WHERE notice='__seed__' AND status='LIVE')    AS live_streams,
    (SELECT COUNT(*) FROM stream  WHERE notice='__seed__' AND status='SCHEDULED') AS scheduled_streams,
    (SELECT COUNT(*) FROM item    WHERE description = '__seed__')               AS total_items,
    (SELECT COUNT(*) FROM auction WHERE stream_id IN
        (SELECT id FROM stream WHERE notice = '__seed__'))                      AS total_auctions,
    (SELECT COUNT(*) FROM tag)                                                  AS total_tags;

-- 카테고리별 스트림 분포
SELECT category, COUNT(*) AS cnt
FROM stream WHERE notice = '__seed__'
GROUP BY category ORDER BY cnt DESC;

-- 브랜드 태그 분포 TOP 20
SELECT name AS brand_tag, COUNT(*) AS cnt
FROM tag
WHERE name IN ('나이키','아디다스','뉴발란스','아식스','살로몬',
               '롤렉스','오메가','샤넬','루이비통','구찌',
               '포켓몬','원피스','건담','애플','삼성',
               '레고','조던','반클리프','에르메스','빈티지')
GROUP BY name ORDER BY cnt DESC;

-- FULLTEXT 검색 동작 확인 (seed 데이터 히트율)
SELECT COUNT(*) AS fulltext_hit_stream
FROM stream
WHERE MATCH(title) AGAINST('나이키' IN BOOLEAN MODE)
  AND status IN ('LIVE','SCHEDULED')
  AND notice = '__seed__';

SELECT COUNT(*) AS fulltext_hit_item
FROM item
WHERE MATCH(name) AGAINST('롤렉스' IN BOOLEAN MODE)
  AND description = '__seed__';
