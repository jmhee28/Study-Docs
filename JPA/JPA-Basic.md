# JPA 실무 중심 정리 (Pre-Practical JPA 요약)

## 1. JPA를 왜 쓰는가 — 핵심 목적

### JPA의 본질

- **ORM (Object–Relation Mapping)**
  - 사람이 직접 하던 **Object ↔ RDB 매핑을 자동화**
- 목적은 단순함
  - **생산성 향상 + 런타임 오류 감소 + 코드 안정성 확보**

### JPA 이전의 문제

- JDBC / MyBatis
    - SQL 문자열 오타 → **컴파일 시점에 못 잡음**
    - 컬럼 순서 실수 → **데이터 꼬임**
    - RowMapper 반복 → **유지보수 지옥**
- 모든 오류가 **런타임에서만 터짐**

👉 JPA는 **“DB도 개발 영역으로 끌어올린 기술”** 이다.

---

## 2. RDB + JPA를 쓰는 현실적인 서비스 구조

### 3-Tier Architecture

```
Web  |  WAS  |  RDB

```

- Web / WAS
    - **수평 확장(scale-out)** 가능
- RDB
    - **수평 확장 어려움**
    - 보통 Active–Standby 구조
    - 비용·성능 한계 존재

👉 **결론: DB는 최대한 아껴 써야 한다**

---

## 3. RDB를 “아끼는” 실무 전략 (중요 ⭐)

### 1️⃣ Cache Layer

- Redis, Spring Cache, JPA 1·2차 캐시
- 조회는 WAS에서, DB는 최후 수단

### 2️⃣ Denormalization (반정규화)

- 정규화는 교과서, 실무는 **조회 성능**
- 조회 비율이 압도적으로 높다면:
    - count 컬럼
    - 집계 결과 컬럼
- **쓰기 비용 < 읽기 비용** 구조에서 적극 검토

---

## 4. JPA Entity 설계의 핵심 원칙

### 1️⃣ ID 설계

- **UUID v7 / TSID 권장**
    - 시간 기반 → 인덱스 효율
- PK만으로 대부분의 조회가 가능해야 함
- “ID로만 조회 가능하게 설계”가 이상적

---

### 2️⃣ Entity는 “가볍게”

- Entity = **DB Model**
- DTO ≠ Entity
- HTTP ↔ DTO (Immutable)
- Service 내부 ↔ Entity (Mutable)

👉 **Controller에서 Entity 만지지 않는다**

---

## 5. 연관관계 매핑 — 교과서 vs 실무

### ⚠️ 실무 핵심 결론

> “연관관계는 최소한으로, 양방향은 정말 필요할 때만”
> 

---

### 1️⃣ OneToMany (실무에서 제일 문제)

- 컬렉션 기반 조회:
    - ❌ Pagination 불가
    - ❌ 메모리 로딩
- `user.getPosts()`
    
    → 실무적으로 **의미 없음**
    

👉 **Repository에서 직접 조회**

---

### 2️⃣ ManyToMany는 쓰지 않는다

- 현실 세계엔 항상 **중간 테이블 + 속성**
- 날짜, 상태, 삭제 여부 등 추가됨
- → **명시적 Entity로 분리**

```
User - Follow - User
User - ThumbsUp - Post

```

---

## 6. Fetch 전략 (핵심)

### 기본 FetchType

| 관계 | 기본값 |
| --- | --- |
| @ManyToOne | EAGER |
| @OneToMany | LAZY |

### 실무 원칙

- **EAGER 거의 쓰지 않음**
- 필요한 경우만
    - `JOIN FETCH`
    - JPQL로 명시적 로딩

👉 EAGER 남발 = **N+1 지옥**

---

## 7. Pagination — 실무에서 가장 중요한 포인트

### ❌ Offset Pagination

- `page / size`
- count 쿼리 발생
- 데이터 많아질수록 성능 급락

### ✅ Cursor(Scrolling) Pagination

- `id < cursorId`
- 다음 데이터 존재 여부만 확인
- 대규모 트래픽에 적합

👉 **JPA Pagination은 “편의용”, 실무는 Cursor**

---

## 8. JPQL vs QueryDSL (실무 판단)

### QueryDSL

**장점**

- 동적 쿼리
- 컴파일 타임 검증

**단점**

- 전처리(Q파일)
- 코드량 증가
- 관리 복잡

### 강의자의 결론 (중요)

> “JPQL 수준에서 해결하는 것이 운영·형상관리 측면에서 가장 좋다”
> 
> 
> *Simple is the best*
> 

---

## 9. 통계·집계 시스템에서는 JPA를 조심

- 대량 집계
- 복잡한 group by
- 통계 전용 쿼리

👉 이런 경우

- JPA ❌
- Native SQL / 별도 분석 DB ⭕

(당신 메모 내용과 정확히 일치)

---

## 10. 동시성 & 트랜잭션 — JPA의 진짜 난이도

### Optimistic Lock

- `@Version`
- 충돌 시 재시도
- Spring Retry 사용

### Pessimistic Lock

- DB Lock
- Timeout 필수

👉 “DB 사용의 꽃은 **동시성 제어**”

---

> JPA는 Object–Relation 매핑을 자동화해 생산성과 안정성을 높이지만,
> 실무에서는 연관관계를 최소화하고 ID 기반 조회, Cursor Pagination,
> Denormalization, Cache Layer를 적극 활용해야 합니다.
> 특히 OneToMany 컬렉션 조회와 EAGER Fetch는 성능 이슈를 유발하므로
> JPQL과 JOIN FETCH로 명시적으로 제어하는 것이 중요합니다.
> 

---

## 11. Transaction & Concurrency - 중요

### Transaction

- 하나의 프로세스에서 여러 자원에 대한 작업을 All or Nothing으로 처리
- 예: 계좌이체

### Concurrency

- 하나의 자원에 대한 여러 프로세스 작업의 무결성을 보장
- 예: 티켓팅

### JPA Transaction

**Commit / Rollback**

- `@Transactional`로 감싼 부분이 종료되는 시점에 커밋/롤백 결정
- 내부에서 예외가 발생하는 경우
    - `RuntimeException` 발생 시 롤백
    - `Exception` 발생 시 커밋
