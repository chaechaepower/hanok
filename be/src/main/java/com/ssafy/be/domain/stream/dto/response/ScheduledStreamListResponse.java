package com.ssafy.be.domain.stream.dto.response;

import java.util.List;

public record ScheduledStreamListResponse(
        List<ScheduledStreamResponse> streams,
        boolean hasNext
) {}