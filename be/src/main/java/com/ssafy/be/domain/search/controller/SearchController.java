package com.ssafy.be.domain.search.controller;

import com.ssafy.be.domain.search.controller.api.SearchApi;
import com.ssafy.be.domain.search.dto.response.SellerSearchResult;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.exception.SearchErrorCode;
import com.ssafy.be.domain.search.service.SearchService;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController implements SearchApi {

    private final SearchService searchService;

    @Override
    public ResponseEntity<List<StreamSearchResult>> search(
            @RequestParam String keyword
    ) {
        validateKeyword(keyword);
        return ResponseEntity.ok(searchService.search(keyword));
    }

    @Override
    public ResponseEntity<List<SellerSearchResult>> searchSellers(
            @RequestParam String keyword,
            @AuthenticationPrincipal String principal
    ) {
        validateKeyword(keyword);
        Long userId = principal != null ? Long.parseLong(principal) : null;
        return ResponseEntity.ok(searchService.searchSellers(keyword, userId));
    }

    private void validateKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            throw new GlobalException(SearchErrorCode.KEYWORD_BLANK);
        }
        if (keyword.trim().length() < 2) {
            throw new GlobalException(SearchErrorCode.KEYWORD_TOO_SHORT);
        }
        if (keyword.trim().length() > 50) {
            throw new GlobalException(SearchErrorCode.KEYWORD_TOO_LONG);
        }
    }
}
