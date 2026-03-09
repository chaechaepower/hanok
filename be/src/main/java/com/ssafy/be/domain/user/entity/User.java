package com.ssafy.be.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// [Entity Layer]
// DB의 user 테이블과 1:1 매핑되는 객체
// Controller → Service → Repository 순으로 흐르며
// Repository에서 이 객체를 DB에 저장/조회함
@Entity
@Table(name = "user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 기본 생성자 (외부 직접 생성 방지)
@Builder
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image", length = 500)
    private String profileImage; // GCS 연동 전까지 null 허용

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive; // 활성화 여부

    @Column(nullable = false)
    private Long balance; // 가상머니 잔액

    @Column(name = "deposited_auction_balance", nullable = false)
    private Long depositedAuctionBalance; // 예치된 낙찰 잔액

    @Column(name = "deposited_withdraw_balance", nullable = false)
    private Long depositedWithdrawBalance; // 예치된 출금 잔액

    @Column(name = "bank_code", length = 50)
    private String bankCode; // 은행명 (회원가입 시 입력 X)

    @Column(name = "account_name", length = 50)
    private String accountName; // 예금주 (회원가입 시 입력 X)

    @Column(name = "account_num", length = 100)
    private String accountNum; // 계좌번호 (회원가입 시 입력 X)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "notification_setting", nullable = false)
    private Boolean notificationSetting; // 알림 설정 (기본값 true)

    // 회원가입 시 User 생성을 위한 정적 팩토리 메서드
    // Service에서 new User() 대신 User.createUser()로 생성
    public static User createUser(String email, String encodedPassword,
                                  String nickname, String phone) {
        return User.builder()
                .email(email)
                .password(encodedPassword)
                .nickname(nickname)
                .phone(phone)
                .profileImage("https://storage.googleapis.com/hanok-storage/profiles/default/default-profile.png")   // GCS 기본 프로필 이미지   // GCS 연동 후 default 이미지 URL로 교체 예정
                .isActive(true)
                .balance(0L)
                .depositedAuctionBalance(0L)
                .depositedWithdrawBalance(0L)
                .notificationSetting(true)
                .build();
    }

    public void increaseBalance(Long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("금액이 0보다 작습니다.");
        }

        this.balance += amount;
    }

    public void requestWithdraw(Long amount) {
        decreaseBalance(amount);
        increaseDepositedWithdrawBalance(amount);
    }

    private void decreaseBalance(Long amount) {
        if (!hasSufficientBalance(amount)) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        this.balance -= amount;
    }

    public void decreaseDepositedWithdrawBalance(Long amount) {
        if (!hasSufficientDepositedWithdrawBalance(amount)) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        this.depositedWithdrawBalance -= amount;
    }

    private void increaseDepositedWithdrawBalance(Long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("금액이 0보다 작습니다.");
        }

        this.depositedWithdrawBalance += amount;
    }

    public boolean hasSufficientBalance(Long amount) {
        return this.balance >= amount;
    }

    private boolean hasSufficientDepositedWithdrawBalance(Long amount) {
        return this.depositedWithdrawBalance >= amount;
    }

    public void updateProfileImage(String profileImageUrl) {
        this.profileImage = profileImageUrl;
    }
}