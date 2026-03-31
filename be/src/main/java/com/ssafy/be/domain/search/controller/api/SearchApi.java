package com.ssafy.be.domain.search.controller.api;

import com.ssafy.be.domain.search.dto.response.SellerSearchResult;
import com.ssafy.be.domain.search.dto.response.StreamSearchPage;
import java.util.List;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Search", description = "검색 API")
public interface SearchApi {

    @Operation(summary = "스트림 검색", description = "키워드로 경매 스트림을 검색합니다.")
    @ApiResponse(responseCode = "200", description = "검색 성공")
    @ApiResponse(
            responseCode = "400",
            description = "키워드 검증 실패 (공백 / 너무 짧음 / 너무 김)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @GetMapping
    ResponseEntity<StreamSearchPage> search(
            @Parameter(description = "검색 키워드 (2자 이상, 50자 이하)", required = true)
            @RequestParam String keyword,
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기", example = "20")
            @RequestParam(defaultValue = "20") int size
    );

    @Operation(summary = "상점 검색", description = "키워드로 상점(셀러)을 검색합니다.")
    @ApiResponse(responseCode = "200", description = "검색 성공")
    @ApiResponse(
            responseCode = "400",
            description = "키워드 검증 실패 (공백 / 너무 짧음 / 너무 김)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @GetMapping("/sellers")
    ResponseEntity<List<SellerSearchResult>> searchSellers(
            @Parameter(description = "검색 키워드 (2자 이상, 50자 이하)", required = true)
            @RequestParam String keyword,
            String principal
    );
}
