# Spring Boot YAML 설정 예시: H2 (테스트) + MySQL (로컬)
### 2-1) `spring.datasource` (H2 연결)

```yaml
datasource:
  url: jdbc:h2:mem:svcm;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false
  driver-class-name: org.h2.Driver
  username: sa
  password:
```

#### `url: jdbc:h2:mem:svcm;...`

* `mem:svcm` → **메모리 DB**(프로세스 안에서만 존재)
* 옵션:

  * `DB_CLOSE_DELAY=-1`

    * 마지막 커넥션이 닫혀도 **DB를 바로 닫지 않음**
    * 테스트 중 커넥션이 잠깐 끊겼다가 다시 연결되어도 데이터가 유지되는 효과
  * `DB_CLOSE_ON_EXIT=false`

    * JVM 종료 시점에 DB를 닫는 동작을 제어(테스트/콘솔 접근 시 편의 목적)

#### `driver-class-name: org.h2.Driver`

* H2 JDBC 드라이버 클래스

#### `username: sa`, `password:`

* H2 기본 계정 관례가 `sa`/빈 비밀번호인 경우가 많습니다.

---

### 2-2) `spring.h2.console` (H2 콘솔)

```yaml
h2:
  console:
    enabled: true
    path: /h2-console
    settings:
      web-allow-others: true
```

* `enabled: true` → H2 웹 콘솔 활성화
* `path: /h2-console` → 접속 URL 경로
* `web-allow-others: true`

  * **외부 호스트에서의 접속 허용** 옵션
  * 로컬 개발/테스트 편의는 좋지만, 운영환경에서는 보안상 보통 비활성화합니다.

---

### 2-3) `spring.jpa` (Hibernate/JPA 설정)

```yaml
jpa:
  hibernate:
    ddl-auto: create
  show-sql: true
  properties:
    hibernate:
      format_sql: true
  defer-datasource-initialization: true
```

#### `ddl-auto: create`

* 애플리케이션 시작 시 **스키마를 새로 생성**하고(기존 있으면 드랍 후 생성 개념),
* 종료 시 드랍은 하지 않습니다(`create-drop`이 종료 시 드랍).
* 테스트에서 “매번 깨끗한 DB”를 원할 때 자주 씁니다.

#### `show-sql: true`

* 실행되는 SQL을 로그로 출력합니다. (출력 형식/로그 레벨은 환경에 따라 다를 수 있음)

#### `hibernate.format_sql: true`

* SQL을 보기 좋게 줄바꿈/정렬해 출력합니다.

#### `defer-datasource-initialization: true`

* **SQL 초기화(data.sql 등)** 실행 시점과 JPA 스키마 생성 시점의 순서를 조정합니다.
* 전형적으로 “Hibernate가 테이블 만든 다음에 `data.sql` 넣고 싶다” 같은 요구에 사용합니다.

---

### 2-4) `spring.sql.init` (SQL 초기화)

```yaml
sql:
  init:
    mode: always
```

* 스프링이 `schema.sql`, `data.sql` 같은 초기화 SQL을 **항상 실행**하도록 합니다.
* `always`: 임베디드 DB든 외부 DB든 무조건 실행
* 테스트에서는 편하지만, 로컬/운영에서 `always`를 쓰면 의도치 않게 데이터가 들어갈 수 있어 보통 프로파일로 제한합니다.

---

## 3) `local` 프로파일 블록 (MySQL)

```yaml
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:mysql://localhost:3306/svcm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: 
  jpa:
    hibernate:
      ddl-auto: update
    ...
```

### `spring.config.activate.on-profile: local`

* 이 블록은 **`local` 프로파일에서만 적용**됩니다.
* 위 공통에서 `active: local`이라 기본 실행이 이 설정을 타게 됩니다.

---

### 3-1) `spring.datasource` (MySQL 연결)

#### `url`

`jdbc:mysql://localhost:3306/svcm?...`

* `localhost:3306` → 로컬 MySQL 포트(기본 3306)
* `/svcm` → DB(schema) 이름

쿼리 파라미터:

* `useSSL=false`

  * 로컬에서 SSL을 끄는 옵션(개발 편의). 서버 설정에 따라 경고/제약이 있을 수 있음.
* `allowPublicKeyRetrieval=true`

  * MySQL 8에서 `caching_sha2_password` 사용 시, SSL 없이도 공개키를 받아 인증을 진행할 수 있게 하는 옵션(개발 환경에서 자주 사용)
* `serverTimezone=Asia/Seoul`

  * JDBC 드라이버가 서버 타임존을 명확히 알도록 지정
  * 시간 컬럼 처리(특히 TIMESTAMP)나 변환 이슈 줄이기 목적

#### `driver-class-name: com.mysql.cj.jdbc.Driver`

* MySQL Connector/J 8+ 드라이버

#### `username/password`

* 로컬 DB 인증 정보
* (참고) 이 값은 보통 레포에 그대로 두기보다 `.env`, `application-local.yml` 분리, 시크릿/환경변수로 관리합니다.

---

### 3-2) `spring.jpa` (로컬)

```yaml
jpa:
  hibernate:
    ddl-auto: update   # 필요시 create / create-drop
  show-sql: true
  properties:
    hibernate:
      format_sql: true
```

#### `ddl-auto: update`

* 엔티티 변경을 감지해 **스키마를 가능한 범위에서 자동 반영**합니다.
* 장점: 로컬 개발이 편함
* 단점: 복잡한 변경(컬럼 타입 변경, 제약조건/인덱스 변경 등)에서는 의도대로 안 맞거나 위험할 수 있음.
* 팀/운영 환경에서는 보통 Flyway/Liquibase 같은 마이그레이션 툴을 사용하고 `ddl-auto`는 끄는 편입니다.

나머지 `show-sql`, `format_sql`은 test와 동일: SQL 로그 출력/포맷팅.

---

