# Lombok과 JPA 엔티티 

## 1) Lombok 생성자 계열 

### `@NoArgsConstructor`

* **의미**: 파라미터 없는 기본 생성자 생성
* **왜 필요**: **JPA는 엔티티를 리플렉션으로 생성**하므로 기본 생성자가 필요함(최소 `protected` 권장)
* **권장 패턴**

  * `@NoArgsConstructor(access = AccessLevel.PROTECTED)`
  * 외부에서 `new Entity()`로 막 생성하지 못하게 막고, JPA만 만들 수 있게 함

### `@AllArgsConstructor`

* **의미**: 모든 필드를 받는 생성자 생성
* **엔티티에서 주의**:

  * 엔티티는 **식별자(id), 연관관계, 컬렉션, 상태값** 등을 “모두 받는 생성자”로 만들면 **실수 유발**이 큼
  * 특히 `id`까지 받으면 “영속성/식별자 관리”가 꼬일 수 있음
* **대안**: 필요한 필드만 받는 “의도된 생성자/정적 팩토리”를 직접 만들거나 `@Builder`를 제한적으로 사용

### `@RequiredArgsConstructor`

* **의미**: `final` 또는 `@NonNull` 필드만 받는 생성자 생성
* **엔티티에서는 보통 비추천**

  * 엔티티 필드를 `final`로 두기 어렵고(JPA 프록시/지연로딩/바이트코드 강화 등), 설계가 애매해짐
  * DTO/Service 계층에서 더 자주 씀

---

## 2) Lombok Getter/Setter/Equals (엔티티에서 자주 실수 나는 부분)

### `@Getter`

* **권장**: 엔티티엔 보통 `@Getter`만 붙이는 패턴이 많음
* JPA 변경 감지(Dirty Checking) 관점에서도 “상태 변경은 의도된 메서드로”가 안전

### `@Setter`

* **엔티티에 무분별하게 붙이면 위험**

  * 어디서든 값이 바뀌어 **불변식(invariant) 깨짐**
  * 트랜잭션 밖에서 변경해도 컴파일이 되니 디버깅이 어려움
* **권장**: 필요한 필드만 개별 setter 또는 `changeXxx()` 같은 도메인 메서드 제공

### `@Data`

* **엔티티에 거의 비추천**

  * `@Getter + @Setter + @EqualsAndHashCode + @ToString` 포함
  * `equals/hashCode`가 연관관계/프록시/지연로딩 문제를 일으킬 수 있고
  * `toString`이 연관관계 순환 참조로 터질 수 있음

### `@EqualsAndHashCode`

* 엔티티는 **ID 기반 equals/hashCode**가 원칙인데, ID가 생성 전엔 null이라 또 문제가 생김
* 실무에선 “엔티티 equals/hashCode를 웬만하면 건드리지 않기” 또는 “비즈니스 키 기반 + 엄격한 규칙”이 많음

### `@ToString`

* 연관관계 필드 포함하면 지연로딩 트리거/순환참조 위험
* 쓰려면 `@ToString.Exclude`로 연관관계는 제외

---

## 3) Lombok Builder 계열

### `@Builder`

* **좋은 점**: 생성 시점에 가독성 좋음
* **엔티티에서 주의**

  * 연관관계/컬렉션 초기화 누락
  * 필수값 누락을 컴파일 타임에 못 잡음
  * “엔티티 생성 규칙”이 느슨해짐
* **권장 패턴**

  * 엔티티엔 “정적 팩토리 + 의도된 파라미터만”
  * 또는 `@Builder`를 **생성자에 붙여서** 노출 필드를 통제

---

## 4) JPA 엔티티에서 사실상 기본 세트 

* `@Entity`, `@Table`
* `@Id`, `@GeneratedValue`
* 연관관계: `@ManyToOne`, `@OneToMany`, `@JoinColumn`
* 컬렉션은 보통 `private final List<X> xs = new ArrayList<>();` 초기화 + setter 금지
* 기본 생성자는 `protected`

---

## 5) 엔티티에서 가장 흔한 “안전 조합” 예시

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

  @Id @GeneratedValue
  private Long id;

  private String name;

  public Member(String name) {
    this.name = name;
  }

  public void changeName(String name) {
    this.name = name;
  }
}
```

* 생성 규칙은 생성자/팩토리로 통제
* 변경 규칙은 도메인 메서드로 통제
* 기본 생성자는 protected로 JPA만 사용

---
# `@Data` , `@Builder` 상세
## `@Data` (Lombok)

`@Data`는 아래를 **한 방에 묶어서 생성**하는 “DTO 편의 어노테이션”이야.

* `@Getter` : 모든 필드 getter
* `@Setter` : 모든 필드 setter
* `@RequiredArgsConstructor` : `final`/`@NonNull` 필드 받는 생성자
* `@ToString`
* `@EqualsAndHashCode`

### 언제 쓰면 좋나

* **DTO / Request / Response / VO(값 객체)** 처럼 “값을 담고 전달”하는 객체에 편함.
* 특히 컨트롤러 요청/응답 모델에서 생산성 좋음.

### 엔티티(JPA)에서 왜 보통 피하나

1. **무차별 Setter**

* 어디서든 필드가 바뀌어 **불변식(invariant) 깨짐** + 변경 추적 어려움

2. **toString / equals&hashCode 위험**

* 연관관계가 있으면 `toString()`에서 **순환참조** 터지거나,
* `equals/hashCode`가 연관관계/프록시/지연로딩을 건드려 **성능/버그** 유발 가능

**결론**: 엔티티에는 보통 `@Getter` + 필요한 변경 메서드만 두고, `@Data`는 DTO에 쓰는 쪽이 안전.

---

## `@Builder` (Lombok)

`@Builder`는 **빌더 패턴**을 자동 생성해줘. 생성자 파라미터가 많을 때 가독성이 좋아짐.

### 기본 사용

```java
@Builder
public class UserDto {
  private String name;
  private Integer age;
}
```

사용:

```java
UserDto dto = UserDto.builder()
    .name("mhee")
    .age(26)
    .build();
```

### 장점

* 생성 인자 많아도 **가독성 좋고 순서 실수 방지**
* 선택 파라미터(옵션)가 많은 객체에 특히 좋음

### 주의점

1. **필수값 강제가 약함**

* 빌더는 “안 넣어도 컴파일이 됨” → 런타임에 null 문제로 터질 수 있음
  (필수 필드는 생성자/정적 팩토리로 강제하는 게 더 안전)

2. **기본값 주의 (`@Builder.Default`)**

```java
@Builder
public class A {
  @Builder.Default
  private int retry = 3;
}
```

* 빌더 사용 시 기본값이 유지되려면 `@Builder.Default`가 필요함.
* 컬렉션도 마찬가지.

3. **엔티티(JPA)에서 무분별 사용은 위험**

* 엔티티는 “생성 규칙/연관관계 세팅/컬렉션 초기화/양방향 관계 편의메서드”가 중요해서
  빌더로 아무나 막 만들게 하면 **일관성 깨짐**이 잦음.

### 엔티티에서 `@Builder`를 쓰고 싶다면 (권장 방식)

* 클래스 전체에 붙이기보다 **의도된 생성자에만 붙여서** 노출 필드를 통제하는 패턴이 안전함.

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {
  @Id @GeneratedValue
  private Long id;

  private String name;

  @Builder
  private Member(String name) { // 빌더가 접근 가능한 생성자 범위를 통제
    this.name = name;
  }
}
```

