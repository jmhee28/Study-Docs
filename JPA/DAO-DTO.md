# DAO vs DTO 정리

## 1. 정의

- DAO (Data Access Object)
  - DB 접근을 담당하는 계층/객체
  - CRUD, 조회, 저장, 트랜잭션 경계 내에서 동작
- DTO (Data Transfer Object)
  - 계층 간 데이터 전달을 위한 객체
  - 화면/요청/응답에 필요한 데이터만 담는 용도

---

## 2. 역할과 위치

| 항목 | DAO | DTO |
| --- | --- | --- |
| 목적 | 데이터 접근 추상화 | 데이터 전달 최적화 |
| 위치 | Repository/Infra 계층 | Controller/Service/API 경계 |
| 책임 | 조회/저장 로직 | 필드 전달, 직렬화 |
| 상태 | 보통 영속성 대상 아님 | 불변(immutable) 권장 |

---

## 3. JPA에서의 대응 관계

- DAO 역할: `Repository` (Spring Data JPA 등)
- DTO 역할: API 요청/응답 모델, 조회 전용 프로젝션

---

## 4. 실무 팁

- Controller는 Entity 대신 DTO를 사용
- DAO는 비즈니스 로직이 아닌 데이터 접근에 집중
- DTO는 필요한 필드만 포함해 과한 노출 방지
- 복잡한 조회는 DTO로 직접 조회 (JPQL/QueryDSL/프로젝션)

---

## 5. 간단 예시

```java
// DAO 역할
public interface UserRepository extends JpaRepository<User, Long> {
}

// DTO 역할
public record UserResponse(Long id, String name) {
}
```
