package com.ssafy.be.domain.stream.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StreamSortType;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.entity.StreamViewType;

public record StreamListRequest(
        StreamViewType type,
        Category category,
        StreamStatus status,
        StreamSortType sort,
        int page,
        int size) {
    public StreamListRequest {
        if (type == null) type = StreamViewType.ALL;
        if (status == null) status = StreamStatus.LIVE;
        if (sort == null) sort = StreamSortType.LATEST;
        if (page < 0) page = 0;
        if (size <= 0) size = 8;
    }
}
