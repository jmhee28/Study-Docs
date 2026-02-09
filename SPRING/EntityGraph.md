# `@EntityGraph`
`@EntityGraph`는 **JPA가 연관 엔티티를 “어떻게 fetch(join)해서 가져올지”를 쿼리마다 제어**하게 해주는 기능이야. 핵심 목적은:

* **N+1 문제를 줄이기**
* 화면/유스케이스별로 **필요한 연관만 즉시 로딩(fetch join)** 하도록 조정
* `LAZY/EAGER` 같은 **정적 매핑 설정을 쿼리 단에서 덮어쓰기**

---

## 1) 왜 필요한가 (LAZY로 두면 생기는 문제)

보통 연관관계는 `LAZY`로 두고 필요할 때만 로딩하는데, 목록 조회 같은 곳에서

* `Scenario` 100개 조회
* 각 `Scenario.getService()` 접근 시마다 추가 쿼리 100번

같은 **N+1**이 터져. 이때 `@EntityGraph`로 “이번 조회에서는 service까지 같이 가져와”를 선언하면 **한 번의 쿼리(또는 최소 쿼리)**로 해결 가능.

---

## 2) 사용 방식 2가지

### A. “동적” EntityGraph (메서드에 바로 선언)

```java
public interface ScenarioRepository extends JpaRepository<Scenario, Long> {

  @EntityGraph(attributePaths = {"service", "schedule"})
  List<Scenario> findByEnabledTrue();
}
```

* `enabled=true` 시나리오를 가져올 때 `service`, `schedule`을 **즉시 로딩**하도록 지시
* 구현체는 보통 `LEFT OUTER JOIN` 형태로 연관을 함께 가져옴(Provider에 따라 최적화)

### B. “정적” NamedEntityGraph (엔티티에 미리 정의)

```java
@Entity
@NamedEntityGraph(
  name = "Scenario.withServiceAndSchedule",
  attributeNodes = {
    @NamedAttributeNode("service"),
    @NamedAttributeNode("schedule")
  }
)
public class Scenario { ... }
```

```java
@EntityGraph(value = "Scenario.withServiceAndSchedule")
List<Scenario> findByEnabledTrue();
```

* 여러 곳에서 재사용할 때 깔끔

---

## 3) `EntityGraphType` 차이 (FETCH vs LOAD)

```java
@EntityGraph(attributePaths = {"service"}, type = EntityGraph.EntityGraphType.FETCH)
```

* **FETCH (default)**: 그래프에 명시한 것만 EAGER처럼 가져오고, 나머지는 LAZY 유지
  → “이번 쿼리에선 이거만 확실히 같이 가져와” 느낌

```java
@EntityGraph(attributePaths = {"service"}, type = EntityGraph.EntityGraphType.LOAD)
```

* **LOAD**: 그래프에 있는 건 가져오고, **나머지는 엔티티 매핑에 설정된 FetchType을 따름**
  → 엔티티에 EAGER가 섞여 있으면 의도치 않게 더 많이 붙을 수 있음

실무에선 보통 **FETCH를 기본으로** 많이 씀.

---

## 4) 자주 겪는 함정 / 주의점

### (1) 컬렉션(OneToMany)까지 여러 개 join하면 “뻥튀기” 위험

예: `Scenario`에 `results`(OneToMany)도, `notifications`(OneToMany)도 한 번에 가져오면
조인 결과가 곱으로 늘어서 **중복 row 폭발**이 날 수 있어.

* 해결: 한 번에 너무 많은 컬렉션 fetch 지양
* 경우에 따라 조회를 분리하거나, 페이징 전략 재설계

### (2) `@EntityGraph` + 페이징(Pageable)에서 컬렉션 fetch는 특히 조심

컬렉션 fetch join은 DB row 기준으로 페이징이 적용되기 때문에 결과가 꼬이기 쉬움.

### (3) “무조건 한 쿼리” 보장은 아님

Provider(Hibernate 등)가 상황에 따라 추가 쿼리를 쓰기도 함(배치 fetch 등).
다만 N+1 방지 목적에는 매우 유효.

---

## 5) `fetch join`(JPQL)과의 관계

* JPQL `join fetch`는 **쿼리 문자열에 조인을 직접 적는 방식**
* `@EntityGraph`는 **메서드/쿼리 정의는 그대로 두고 fetch plan만 분리**한다는 점이 장점

즉:

* 특정 화면/유스케이스별 fetch 전략을 깔끔하게 관리하려면 `@EntityGraph`가 편함
* 복잡한 조건/조인 최적화까지 직접 통제해야 하면 `join fetch`가 더 명확할 때도 있음


