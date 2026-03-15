package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Schema(description = "물품 수정 요청")
public class ItemUpdateSwaggerRequest {
    @Schema(description = "물품명") public String name;
    @Schema(description = "물품 설명") public String description;
    @Schema(description = "카테고리") public Category category;
    @Schema(description = "시작가") public Long startPrice;
    @Schema(description = "입찰 단위") public Long bidUnit;
    @Schema(description = "경매 시간(분)") public Integer auctionDuration;
    @Schema(description = "물품 상태") public ItemCondition itemCondition;
    @Schema(description = "해시태그") public List<String> tags;
    @Schema(description = "이미지 파일 (최대 3장)") public List<MultipartFile> images;
}