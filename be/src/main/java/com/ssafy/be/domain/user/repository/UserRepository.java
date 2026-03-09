package com.ssafy.be.domain.user.repository;

import com.ssafy.be.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// [Repository Layer]
// DB와의 실제 통신을 담당
// JpaRepository 상속만으로 기본 CRUD 메서드 자동 제공
// Service에서 이 인터페이스를 주입받아 DB 접근
public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일 중복 확인용
    // SELECT * FROM user WHERE email = ? 쿼리 자동 생성
    boolean existsByEmail(String email);

    // 로그인 시 사용 (다음 티켓에서 활용)
    // SELECT * FROM user WHERE email = ? 쿼리 자동 생성
    Optional<User> findByEmail(String email);
}