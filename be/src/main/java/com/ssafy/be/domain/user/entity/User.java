package com.ssafy.be.domain.user.entity;

import com.ssafy.be.domain.wallet.exception.WalletErrorCode;
import com.ssafy.be.global.exception.GlobalException;
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

    @Column(name = "profile_image", length = 100)
    private String profileImage; // GCS 연동 전까지 null 허용

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive; // 활성화 여부 (기본값 true)

    @Column(nullable = false)
    private Long balance; // 가상머니 잔액 (기본값 0)

    @Column(name = "deposited_balance", nullable = false)
    private Long depositedBalance; // 예치된 잔액 (기본값 0)

    @Column(name = "bank_code", length = 50)
    private String bankCode; // 은행명 (회원가입 시 입력 X)

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
                .profileImage(null)   // GCS 연동 후 default 이미지 URL로 교체 예정
                .isActive(true)
                .balance(0L)
                .depositedBalance(0L)
                .notificationSetting(true)
                .build();
    }

    public void increaseBalance(Long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
        }

        this.balance += amount;
    }
}