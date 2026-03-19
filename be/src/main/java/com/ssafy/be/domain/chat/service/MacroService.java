package com.ssafy.be.domain.chat.service;

import com.ssafy.be.domain.chat.dto.payload.MacroTemplatePayload;
import com.ssafy.be.domain.chat.dto.request.MacroTemplateRequest;
import com.ssafy.be.domain.chat.exception.MacroErrorCode;
import com.ssafy.be.domain.stream.repository.MacroRedisRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MacroService {

    private final MacroRedisRepository macroRedisRepository;

    public MacroTemplatePayload handleMacro(Long streamId, MacroTemplateRequest request) {
        String answer = macroRedisRepository.findOne(streamId, request.questionType());

        if (answer == null) {
            throw new GlobalException(MacroErrorCode.MACRO_NOT_FOUND); // null 반환 대신 예외
        }

        return buildPayload(request.questionType(), answer);
    }

    private MacroTemplatePayload buildPayload(String questionType, String answer) {
        return MacroTemplatePayload.builder()
                .questionType(questionType)
                .answer(answer)
                .sender("seller")
                .createdAt(LocalDateTime.now())
                .build();
    }
}
