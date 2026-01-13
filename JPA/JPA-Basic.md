# JPA 실무 중심 정리 (Pre-Practical JPA 요약)

## 목차

1. [JPA를 왜 쓰는가 — 핵심 목적](#1-jpa를-왜-쓰는가--핵심-목적)
2. [RDB + JPA를 쓰는 현실적인 서비스 구조](#2-rdb--jpa를-쓰는-현실적인-서비스-구조)
3. [RDB를 “아끼는” 실무 전략 (중요 ⭐)](#3-rdb를-아끼는-실무-전략-중요-)
4. [JPA Entity 설계의 핵심 원칙](#4-jpa-entity-설계의-핵심-원칙)
5. [연관관계 매핑 — 교과서 vs 실무](#5-연관관계-매핑--교과서-vs-실무)
6. [Fetch 전략 (핵심)](#6-fetch-전략-핵심)
7. [Pagination — 실무에서 가장 중요한 포인트](#7-pagination--실무에서-가장-중요한-포인트)
8. [JPQL vs QueryDSL (실무 판단)](#8-jpql-vs-querydsl-실무-판단)
9. [통계·집계 시스템에서는 JPA를 조심](#9-통계집계-시스템에서는-jpa를-조심)
10. [동시성 & 트랜잭션 — JPA의 진짜 난이도](#10-동시성--트랜잭션--jpa의-진짜-난이도)
11. [⭐ Transaction & Concurrency - 중요](#⭐11-transaction--concurrency---중요)
12. [`equals(), hashCode(), toString() Overriding`](#12-equals-hashcode-tostring-overriding)

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

## 11.⭐ Transaction & Concurrency - 중요

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

## 12. `equals(), hashCode(), toString() Overriding`

- Entity는 ID로 선언된 필드가 identical 하므로 `equals`, `hashCode`는 ID 필드만 사용
- `toString`은 순환 참조(User -> Post -> User -> Post...)가 발생하지 않게 주의
- `equals`, `hashCode`도 연관관계 포함 시 순환 참조가 생길 수 있으니 동일하게 조심

```java
import java.util.Objects;

@Entity
public class User {
    @Id
    private Long id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User other = (User) o;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "User{id=" + id + "}";
    }
}
```

- `equals`는 ID가 같은 경우만 동일하다고 판단 (ID가 null이면 동일하다고 보지 않음)
- `hashCode`도 ID만 사용해 컬렉션/캐시 동작을 일관되게 유지
- `toString`은 연관관계를 출력하지 않아서 순환 참조를 방지

요지는 “**JPA Entity에서 equals/hashCode/toString을 잘못 만들면, 컬렉션/연관관계/프록시 때문에 장애급 문제가 난다**” 입니다. 그래서 “ID만 쓰고, 연관관계는 넣지 말라”

---

## 1) 왜 `equals()` / `hashCode()`를 ID만으로 하라는가

### Entity의 “동일성” 기준은 보통 PK(ID)

* DB에서 같은 row를 의미하려면 결국 **PK가 같아야** 합니다.
* 그래서 `equals/hashCode`는 **ID만 사용**하는 게 가장 단순하고 안전합니다. 

### 연관관계(예: posts)를 equals/hashCode에 넣으면 생기는 문제

1. **순환 참조 가능**

* User.equals → posts 비교 → Post.equals → user 비교 → 다시 User.equals …
  이런 식으로 무한 루프(스택오버플로) 가능

2. **지연로딩(LAZY) 폭발**

* equals 호출 한 번 했는데 연관 컬렉션을 비교하려고 하면서
  LAZY 로딩이 발생 → 쿼리 폭탄(N+1) 또는 성능 급락

3. **HashSet/HashMap에서 깨짐**

* `hashCode`는 “객체가 Set/Map에 들어간 뒤에는 변하면 안 된다”가 전제입니다.
* 그런데 equals/hashCode에 연관관계나 변경 가능한 필드(name 등)를 넣으면
  값이 바뀌는 순간 Set/Map에서 객체를 못 찾는 버그가 납니다.

---

## 2) 왜 `toString()`에 연관관계를 넣으면 안 되는가

`toString()`은 디버깅/로그에서 매우 자주 호출됩니다.

* User.toString에 posts를 찍음
* Post.toString에 user를 찍음
  → `User -> Post -> User -> Post...` 무한 반복으로 **StackOverflowError**가 날 수 있습니다. 

또는 LAZY 컬렉션을 출력하려다 **원치 않는 쿼리 호출**이 터질 수도 있습니다.

그래서 실무에서는:

* `toString()`은 **ID 같은 최소 정보만**
* 연관관계는 절대 펼치지 않기
  이 원칙이 안전합니다.

---

## 3) 코드 해석

```java
return id != null && id.equals(other.id);
```

* **id가 null이면(아직 저장 안 된 엔티티)** “동일하다고 보지 않겠다”
* **id가 둘 다 같으면** “같은 엔티티(같은 DB row)로 보겠다”

```java
return Objects.hash(id);
```

* hashCode도 id만으로 계산 → Set/Map 안정성 확보

```java
return "User{id=" + id + "}";
```

* toString에 연관관계 출력 안 함 → 순환참조/LAZY 쿼리 방지

---

## 4) 자주 나오는 질문 2개

### Q1. “그럼 저장 전(new) 엔티티는 equals가 항상 false면 문제 아닌가?”

보통 괜찮습니다. 저장 전에는 DB row가 없으니 “동일성”을 강하게 주장하기 어렵습니다.
(대신 비즈니스 키로 동일성을 관리해야 하는 특수 케이스는 별도 설계가 필요)

### Q2. “Lombok의 @Data 쓰면 안 돼?”

Entity에 `@Data`는 보통 위험합니다.

* equals/hashCode/toString에 모든 필드(연관관계 포함)가 들어가서
  위 문제들이 그대로 발생할 수 있습니다.
  강의에서도 toString/equals/hashCode를 조심하라고 강조한 이유가 이것입니다. 

---

## 5) 실무 권장 패턴(간단 규칙)

* Entity에는 `@Getter` 정도만
* `equals/hashCode`는 **ID만**
* `toString`은 **ID, 핵심 필드만(연관관계 금지)**
* 특히 양방향 연관관계일수록 더 엄격하게


## 13. **동일성(identity)** 과 **동등성(equality)** 의 차이


## 1) 동일성(Identity)

* 의미: **“완전히 같은 객체(레퍼런스)인가?”**
* 기준: **메모리 주소(참조)**
* Java 표현:

  * `a == b`
  * `System.identityHashCode(a)`는 “참조 기반 해시”에 가깝습니다(동등성 해시와 별개)

예:

```java
User a = new User();
User b = a;
System.out.println(a == b); // true (동일한 참조)
```

---

## 2) 동등성(Equality)

* 의미: **“값/의미가 같은가?”**
* 기준: **equals()가 정의한 규칙**
* Java 표현:

  * `a.equals(b)`
  * `hashCode()`는 equals와 **일관성**이 있어야 Set/Map에서 정상 동작

예:

```java
User a = new User(1L);
User b = new User(1L);
System.out.println(a == b);       // false (다른 객체)
System.out.println(a.equals(b));  // true  (ID가 같다고 정의했다면)
```

---

## 3) JPA에서 더 헷갈리는 이유 (핵심만)

JPA는 같은 DB row라도 상황에 따라 “객체가 같아 보이거나/달라 보일 수” 있습니다.

### (1) 같은 트랜잭션(같은 Persistence Context) 안에서는

* 같은 PK를 조회하면 **항상 같은 객체 인스턴스**를 돌려주는 경향이 있습니다.
* 즉, 보통 `==`도 true가 되는 경우가 많습니다. (1차 캐시 효과)

### (2) 트랜잭션이 달라지면

* 같은 PK라도 다른 시점에 조회한 객체는 **다른 인스턴스**
* `==`는 false가 됩니다.
* 그래서 “DB row 기준으로 같은 엔티티인가”를 판단하려면 보통 **equals(동등성) 규칙이 필요**합니다.

---

## 4) 실무에서의 결론(엔티티 기준)

* **동일성(==)**: “지금 이 JVM 메모리에서 같은 인스턴스냐”를 보는 것
* **동등성(equals)**: “같은 도메인/DB row로 볼 것이냐”를 정의하는 것
  → 엔티티는 일반적으로 **PK(ID)로 동등성을 정의**합니다.

 `equals/hashCode는 ID만`이라고 한 이유와 직결됩니다.
(연관관계나 변경 가능한 필드를 넣으면 동등성 정의가 깨지거나 순환참조/성능 문제가 생김)
