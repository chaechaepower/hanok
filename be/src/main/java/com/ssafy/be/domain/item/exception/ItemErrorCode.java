package com.ssafy.be.domain.item.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ItemErrorCode implements ErrorCode {
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "I001", "존재하지 않는 물품입니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I002", "파일 업로드에 실패했습니다."),
    ITEM_NOT_DELETABLE_LIVE(HttpStatus.CONFLICT,"I003","현재 생방송 중인 경매 상태이므로 삭제할 수 없습니다."),
    ITEM_NOT_DELETABLE_SOLD(HttpStatus.CONFLICT,"I004","이미 판매 완료된 물품은 삭제할 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
