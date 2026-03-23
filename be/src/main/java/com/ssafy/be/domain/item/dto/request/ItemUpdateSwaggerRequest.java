package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Schema(description = "물품 수정 요청 (multipart: request JSON + 선택적 image1~3)")
public class ItemUpdateSwaggerRequest {
    @Schema(description = "물품명") public String name;
    @Schema(description = "물품 설명") public String description;
    @Schema(description = "카테고리") public Category category;
    @Schema(description = "물품 상태") public ItemCondition itemCondition;
    @Schema(description = "해시태그") public List<String> tags;
    @Schema(description = "이미지 URL 3칸 고정 (null=해당 슬롯 삭제 의도). 파일이 있으면 해당 슬롯은 업로드 우선")
    public List<String> images;
    @Schema(description = "1번 슬롯 새 이미지 (선택)") public MultipartFile image1;
    @Schema(description = "2번 슬롯 새 이미지 (선택)") public MultipartFile image2;
    @Schema(description = "3번 슬롯 새 이미지 (선택)") public MultipartFile image3;
}