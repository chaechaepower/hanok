# 🏺 한옥 - 라이브 경매 커머스 플랫폼

<p align="center">
  <img src="./fe/public/Logo.png" alt="한옥" width="50%">
</p>


<br>

## 💡 프로젝트 소개

**한옥**은 판매자가 실시간 라이브로 상품을 소개하고, 시청자들은 실시간 입찰로 경매에 참여할 수 있는 **라이브 커머스 경매 서비스**입니다.

낙찰부터 에스크로, 결제, 정산, NFT 거래증명서 발행까지 거래의 전 흐름을 하나의 플랫폼에서 안전하게 처리할 수 있도록 설계했습니다.


<br>

## 📅 프로젝트 기간

<2026.02.16 ~ 2026.03.30>


<br>

## ✨ 주요 기능

### **실시간 라이브 경매**
- **WebRTC 영상 송출**: LiveKit SFU 서버를 통한 1:N 라이브 스트리밍
- **2가지 경매 방식**: 일반(상향식) / 유일최고가 경매를 시나리오에 맞게 선택
- **실시간 입찰·채팅**: STOMP 브로커로 입찰 결과·시청자 수·채팅을 동기화
- **금칙어 필터**: Aho-Corasick 알고리즘 기반의 채팅 안전 필터

### **안전한 거래 보장**
- **에스크로 시스템**: 낙찰 → 예치금 보관 → 송장 등록 → 구매 확정 → 정산 단계별 관리
- **NFT 거래 증명서**: 구매 확정 시 영수증을 발행하여 블록체인에 영구 기록

### **사용자 경험**
- **실시간 알림**: SSE로 팔로우·에스크로 상태·낙찰·공지를 즉시 푸시
- **판매자 운영 도구**: 프로필·공지·상품 관리, 평점·랭킹·매출 리포트
- **AI 썸네일 생성**: Gemini 이미지 모델로 스트림 썸네일 자동 생성

### **운영 안정성**
- **Blue/Green 무중단 배포**: Jenkins + Nginx upstream 전환으로 다운타임 0
- **통합 관측성**: Prometheus + Loki + Grafana로 메트릭·로그 일원화


<br>

## 🛠️ 기술 스택

### **Backend**

<img src="https://img.shields.io/badge/Java 21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white"> <img src="https://img.shields.io/badge/Spring Boot 3.4-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white"> <img src="https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=Flyway&logoColor=white"> <img src="https://img.shields.io/badge/STOMP WebSocket-000000?style=for-the-badge"> <img src="https://img.shields.io/badge/SSE-FF6F00?style=for-the-badge"> <img src="https://img.shields.io/badge/Redis 7-DC382D?style=for-the-badge&logo=Redis&logoColor=white"> <img src="https://img.shields.io/badge/MySQL 8.0-4479A1?style=for-the-badge&logo=MySQL&logoColor=white"> <img src="https://img.shields.io/badge/GCS-4285F4?style=for-the-badge&logo=GoogleCloud&logoColor=white"> <img src="https://img.shields.io/badge/LiveKit 0.12-000000?style=for-the-badge"> <img src="https://img.shields.io/badge/SonarQube-4E9BCD?style=for-the-badge&logo=SonarQube&logoColor=white"> <img src="https://img.shields.io/badge/JaCoCo-D22128?style=for-the-badge">

### **Frontend**

<img src="https://img.shields.io/badge/React 19-61DAFB?style=for-the-badge&logo=React&logoColor=black"> <img src="https://img.shields.io/badge/Vite 7-646CFF?style=for-the-badge&logo=Vite&logoColor=white"> <img src="https://img.shields.io/badge/TypeScript 5.9-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white"> <img src="https://img.shields.io/badge/Tailwind CSS 4-06B6D4?style=for-the-badge&logo=TailwindCSS&logoColor=white"> <img src="https://img.shields.io/badge/TanStack Query 5-FF4154?style=for-the-badge&logo=ReactQuery&logoColor=white"> <img src="https://img.shields.io/badge/STOMP.js-000000?style=for-the-badge"> <img src="https://img.shields.io/badge/LiveKit Client-000000?style=for-the-badge"> <img src="https://img.shields.io/badge/MSW-FF6A33?style=for-the-badge&logo=MSW&logoColor=white">

### **Blockchain**

<img src="https://img.shields.io/badge/Solidity 0.8-363636?style=for-the-badge&logo=Solidity&logoColor=white"> <img src="https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=Hardhat&logoColor=black"> <img src="https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=OpenZeppelin&logoColor=white"> <img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white">

### **Infrastructure & DevOps**

<img src="https://img.shields.io/badge/AWS EC2-232F3E?style=for-the-badge&logo=AmazonEC2&logoColor=white"> <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=Jenkins&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white">  <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=NGINX&logoColor=white"> 

### **Monitoring & Testing**

<img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white"> <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=Grafana&logoColor=white"> <img src="https://img.shields.io/badge/Loki-F46800?style=for-the-badge&logo=Grafana&logoColor=white"> <img src="https://img.shields.io/badge/InfluxDB-22ADF6?style=for-the-badge&logo=InfluxDB&logoColor=white"> <img src="https://img.shields.io/badge/k6-7D64FF?style=for-the-badge&logo=k6&logoColor=white">

### **Communication & Collaboration**

<img src="https://img.shields.io/badge/GitLab-FCA121?style=for-the-badge&logo=Gitlab&logoColor=white"> <img src="https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=Jira&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=Notion&logoColor=white">


<br>

## 🎯 팀원 소개

| ![팀원1](./dummy/shin-jaehyeok.jpg) | ![팀원2](./dummy/lee-hyoeun.png) | ![팀원3](./dummy/choi-jaegak.png) | ![팀원4](./dummy/kim-chaeyoon.png) | ![팀원5](./dummy/bae-jaeyu.png) | ![팀원6](./dummy/kim-gangyeon.png) |
|------|------|------|------|------|------|
| 신재혁 | 이효은 | 최재각 | 김채윤 |  배재유 | 김강연 |
| Frontend | Frontend | Frontend | Backend | Backend | Backend, Infra | 


<br>

## 🎯 프로젝트 산출물

- [아키텍처 가이드](./아키텍쳐가이드.md)


<br>

## 💖 화면 구성

### 메인 페이지
- 라이브 진행, 예정 스트림 카드 리스트
- 카테고리 및 키워드 검색, 신규 판매자 추천 캐러셀
- 시청자 수, 썸네일, 판매자 정보를 한 화면에서 확인

![메인페이지](./dummy/main-page.png)

### 라이브 페이지 (시청자 / 판매자)
- **시청자**: 라이브 영상 시청 + 실시간 채팅 및 매크로 채팅 + 실시간 입찰 버튼
- **판매자**: 방송 송출, 상품 라이브 등록, 경매 설명/시작/종료 제어
- 낙찰 시 낙찰자 개인에게 즉시 알림

![한옥 시연](./dummy/live-page.gif)

### 라이브 등록 / 생성 페이지
- 라이브 제목, 카테고리, 예약 시간, 썸네일 등 설정
- 경매 상품 등록(이미지, 시작가, 경매 방식 선택)
- 카테고리별 채팅 매크로 사전 등록

### 판매자 리포트
- 누적 매출, 낙찰 건수, 평점 및 리뷰 수 시각화
- 판매자 랭킹 및 팔로워 추이
  
![판매자리포트](./dummy/seller-report.png)

### 가상머니 페이지
- 현재 잔액 / 출금 가능 금액 표시
- PortOne 결제창을 통한 충전, 등록 계좌로 출금 요청
- 충전 및 출금 내역 타임라인
