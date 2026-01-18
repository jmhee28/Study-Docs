# Study-Docs

이 레포지토리는 공부한 내용을 정리하는 목적으로 만든 개인 노트 모음이다.

## 목차

### JAVA

| 파일 | 내용 요약 |
|:-----|:----------|
| [java.md](./JAVA/java.md) | Java 기초 개념 정리: 접근제한자, 오버로딩/오버라이딩, 인터페이스, 예외 처리, 컬렉션(Set/List/Map), 복사(Shallow/Deep Copy) |

### JPA

| 파일 | 내용 요약 |
|:-----|:----------|
| [JPA-Basic.md](./JPA/JPA-Basic.md) | JPA 실무 중심 정리: ORM 목적, Entity 설계, 연관관계 매핑, Fetch 전략, Pagination, 트랜잭션/동시성 제어 |
| [Perisistence.md](./JPA/Perisistence.md) | 영속성 컨텍스트: 엔티티 생명주기, 1차 캐시, 쓰기 지연, 변경 감지, 플러시와 커밋 |
| [Proxy.md](./JPA/Proxy.md) | 프록시와 지연로딩: 프록시 객체 초기화, 즉시로딩/지연로딩, Cascade, Orphan 객체 제거 |
| [Cascade-Lazy-Transactional-Autowired-Naming-Paging.md](./JPA/Cascade-Lazy-Transactional-Autowired-Naming-Paging.md) | JPA 관련 개념 통합 정리: Cascade 타입, Lazy Loading, @Transactional, @Autowired, JPA Naming, Paging |
| [DAO-DTO.md](./JPA/DAO-DTO.md) | DAO와 DTO의 정의, 역할, 차이점 및 JPA에서의 대응 관계 |

### REACT

| 파일 | 내용 요약 |
|:-----|:----------|
| [hooks.md](./REACT/hooks.md) | React State와 Hook: useState, useEffect, useRef, useMemo, useCallback의 개념과 사용법 |
| [hook2.md](./REACT/hook2.md) | React Hook 심화: useContext, Custom Hook, Controlled Component, React Router, useNavigate, Lifting State Up |
| [Tictactoe.md](./REACT/Tictactoe.md) | React 튜토리얼 Tic-Tac-Toe: 컴포넌트화, Props, State, Lifting State Up, 불변성, Time Travel 구현 |

### SPRING

| 파일 | 내용 요약 |
|:-----|:----------|
| [Configuration.md](./SPRING/Configuration.md) | @Configuration과 싱글톤: CGLIB를 통한 싱글톤 보장, @Bean 메서드의 동작 원리 |
| [springContainer.md](./SPRING/springContainer.md) | 스프링 컨테이너: BeanFactory, ApplicationContext, 싱글톤 컨테이너, 상태 관리 주의사항 |
| [bean.md](./SPRING/bean.md) | 스프링 빈: BeanDefinition, 빈 조회 방법, 빈 상속관계, BeanFactory vs ApplicationContext |

### K8s

| 파일 | 내용 요약 |
|:-----|:----------|
| [k8s.md](./K8s/k8s.md) | 쿠버네티스 기본 개념: Cluster, Node, Pod, Control Plane, Pod-to-Pod 통신, Service, 자원 관리 |
| [vi-bash.md](./K8s/vi-bash.md) | vi/bash 교육: function과 subroutine 차이, bash 함수 사용법 |
| [service.md](./K8s/service.md) | Service: Pod 집합에 대한 가상 IP 제공, Service Type(ClusterIP, NodePort, LoadBalancer) |
| [Service_type.md](./K8s/Service_type.md) | Service Type 상세: ClusterIP, NodePort, LoadBalancer, ExternalName의 특징과 사용 사례 |
| [deployment.md](./K8s/deployment.md) | Deployment: ReplicaSet을 관리하는 컨트롤러, 업데이트 설정 지원 |
| [Controller.md](./K8s/Controller.md) | Ingress Controller, Gateway API, k9s, NKS: Ingress/Gateway API 개념, 구현체 선택, k9s 사용법, Floating IP |
| [configmap-secret.md](./K8s/configmap-secret.md) | ConfigMap과 Secret: 설정 값과 민감 정보 저장, Pod에 환경변수/Volume 형태로 주입 |
| [gateway-api&CRD.md](./K8s/gateway-api&CRD.md) | Gateway API와 CRD: Gateway API 리소스 구조, CRD 개념, Envoy Gateway와의 관계 |
| [gateway-api&envoy-gateway.md](./K8s/gateway-api&envoy-gateway.md) | Gateway API - Envoy Gateway: Gateway API 표준, Envoy Gateway 구현체, 정책(BackendTrafficPolicy, ClientTrafficPolicy, SecurityPolicy) |

### JAVASCRIPT

| 파일 | 내용 요약 |
|:-----|:----------|
| [javascript.md](./JAVASCRIPT/javascript.md) | JavaScript 기초: var/let/const 차이, 호이스팅, TDZ, setTimeout, Event Loop 동작 원리 |
