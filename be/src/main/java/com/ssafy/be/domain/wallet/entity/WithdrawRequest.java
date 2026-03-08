package com.ssafy.be.domain.wallet.entity;

import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

import static com.ssafy.be.domain.wallet.entity.WithdrawStatus.PENDING;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Entity
public class WithdrawRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long amount;

    @Enumerated(EnumType.STRING)
    private WithdrawStatus withdrawStatus;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    private WithdrawRequest(Long amount,
                            WithdrawStatus withdrawStatus,
                            User user) {
        this.amount = amount;
        this.withdrawStatus = withdrawStatus;
        this.user = user;
    }

    public void completeWithDraw() {
        this.withdrawStatus = WithdrawStatus.COMPLETED;
        this.processedAt = LocalDateTime.now();
    }

    public boolean isPending() {
        return this.withdrawStatus == PENDING;
    }
}
