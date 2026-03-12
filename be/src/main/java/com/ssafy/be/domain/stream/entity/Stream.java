package com.ssafy.be.domain.stream.entity;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.seller.entity.Seller;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Entity
public class Stream {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private Category category;

    @Enumerated(EnumType.STRING)
    private StreamStatus status;

    private String thumbnail;

    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    private StartType startType;

    private String notice;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    private LocalDateTime startedAt;

    @Builder
    private Stream(
            String title,
            Category category,
            StreamStatus status,
            String thumbnail,
            LocalDateTime scheduledAt,
            StartType startType,
            String notice,
            Seller seller) {
        this.title = title;
        this.category = category;
        this.status = status;
        this.thumbnail = thumbnail;
        this.scheduledAt = scheduledAt;
        this.startType = startType;
        this.notice = notice;
        this.seller = seller;
    }

    public void update(
            String title,
            Category category,
            StartType startType,
            LocalDateTime scheduledAt,
            String notice) {
        Optional.ofNullable(title).ifPresent(v -> this.title = v);
        Optional.ofNullable(category).ifPresent(v -> this.category = v);
        Optional.ofNullable(startType).ifPresent(v -> this.startType = v);
        Optional.ofNullable(scheduledAt).ifPresent(v -> this.scheduledAt = v);
        Optional.ofNullable(notice).ifPresent(v -> this.notice = v);
    }

    public void updateThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public void start() {
        this.status = StreamStatus.LIVE;
        this.startedAt = LocalDateTime.now();
    }

    public void end() {
        this.status = StreamStatus.ENDED;
    }

}
