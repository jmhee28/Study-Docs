# Gateway API - Envoy Gateway

<img src="../imgs/K8S/envoy-gateway.png" alt="Gateway API - Envoy Gateway">    



## 1) 한 줄 정의

* **Gateway API**: 쿠버네티스에서 트래픽 라우팅 규칙을 표준 리소스(`GatewayClass`, `Gateway`, `HTTPRoute` 등)로 선언하는 API(=CRD 기반)
* **Envoy Gateway**: Gateway API를 해석해 **Envoy Proxy를 구성/운영**하는 구현체(컨트롤 플레인)
* **Envoy Proxy**: 실제 트래픽을 받아 라우팅/보안/제어/관측을 수행하는 **데이터 플레인 프록시(Pod로 실행)**

---

## 2) Envoy Proxy가 하는 일(데이터 플레인)

1. **라우팅**: Host/Path/Header/Method 등 조건 기반으로 백엔드 결정 (HTTP/gRPC/TCP)
2. **로드밸런싱**: 여러 백엔드 Pod로 분산 (RR/LeastReq/ConsistentHash 등)
3. **보안**: TLS 종료, mTLS (인증/인가는 보통 상위 정책/컨트롤 플레인이 설정)
4. **트래픽 제어(Resilience)**: 타임아웃/리트라이/서킷브레이커/커넥션 제한/레이트리밋
5. **관측성**: 메트릭, 액세스 로그, 트레이싱 출력

---

## 3) Envoy Gateway ↔ Envoy Proxy 관계(핵심)

* **Envoy Gateway = 컨트롤 플레인**

  * `Gateway`, `HTTPRoute` 같은 리소스를 **watch**
  * 이를 Envoy 설정(xDS)으로 변환해 **Envoy Proxy에 적용/배포/운영**
* **Envoy Proxy = 데이터 플레인**

  * 실제 요청/패킷을 처리하는 프록시 인스턴스(Pod)

비유:

* Envoy Gateway = 관제센터(정책/규칙 생성·배포)
* Envoy Proxy = 경찰(현장에서 트래픽 처리)

---

## 4) Service(LoadBalancer)는 무엇?

* `Service type: LoadBalancer`는 **Envoy Proxy Pod로 트래픽을 “들여보내기 위한 노출 방식”** 중 하나
* 즉, **Envoy Gateway 자체가 LoadBalancer가 아니라**,
  **Envoy Proxy를 외부/내부에서 접근시키려는 방법**으로 Service(LB/NodePort/ClusterIP 등)를 사용함

---

## 5) 트래픽 흐름(가장 일반적인 형태)

**Client → (Service: LoadBalancer/NodePort/ClusterIP) → Envoy Proxy Pod → (Route 규칙 적용) → backend Service → backend Pod**

---

## 6) 클러스터에서 빠르게 확인

### Envoy 관련 Service 찾기

```bash
kubectl get svc -A | grep -i envoy
kubectl describe svc -n <ns> <svc-name>
```

### Service가 가리키는 Pod 확인(Selector로)

```bash
kubectl get pods -n <ns> -l <selector-labels>
```

---





## 1) Gateway API란?

**Gateway API**는 쿠버네티스 클러스터 **외부/내부로 들어오는 네트워크 트래픽을 표준화된 방식으로 관리**하기 위한 Kubernetes API야.
기존 **Ingress API**보다 **표현력이 높고(Expressive), 확장 가능(Extensible)** 하게 설계됐어.

* 핵심 리소스

  * **GatewayClass**: “어떤 구현체(컨트롤러)가 이 Gateway API를 처리할지”를 나타내는 클래스
  * **Gateway**: 실제 트래픽 진입점(리스너/포트/TLS 등)
  * **Route들**: `HTTPRoute`, `TLSRoute`, `TCPRoute`, `GRPCRoute` 등 → “매칭 조건과 라우팅 규칙” 정의

---

## 2) 왜 Ingress 대신 Gateway API인가?

Ingress는 HTTP(S) 노출을 위한 기본 기능은 제공했지만,

* 고급 기능(예: 더 세밀한 매칭/정책/확장)이 부족했고
* 이를 보완하려고 **컨트롤러별 커스텀 annotation**이 난립했어
* 결과적으로 **표준이 깨지고(파편화), 이식성(portability)이 떨어짐**

Gateway API는 이런 문제를 해결하려고:

* 역할 분리(인프라 팀 vs 앱 팀) 가능한 리소스 설계
* 표준화된 라우팅/보안/노출 모델
* 확장(Extensions)을 “타입 안전한 CRD”로 제공

---

## 3) Gateway API로 가능한 일(Use Cases)

Gateway API를 쓰면 다음을 표준 방식으로 할 수 있어:

* 외부 트래픽이 **어떻게 클러스터로 들어오고**, **어디로 라우팅되는지** 정의
* HTTP(S)/TLS/TCP 라우팅 규칙을 Kubernetes-native하게 구성
* **HTTPRoute**로 호스트 기반/경로 기반/헤더 기반 라우팅
* Gateway에서 **TLS 종료(TLS termination)** 설정
* 구현체(Envoy/NGINX 등)가 달라도 **구성의 이식성/일관성** 향상

---

## 4) Envoy Gateway와의 관계

* **Gateway API는 “표준 인터페이스(규칙)”**
* **Envoy Gateway는 그 표준을 구현하는 제품급(Production-grade) 컨트롤 플레인**

  * Gateway/Route 설정을 읽어서
  * Envoy Proxy가 이해하는 **xDS 설정**으로 변환하고
  * 클러스터 안의 Envoy Proxy(데이터 플레인)를 운영/업데이트함

즉,

* Gateway API = “무엇을 하고 싶다”를 선언하는 표준
* Envoy Gateway = 그 선언을 “진짜 동작”으로 바꿔주는 시스템

---

## 5) Gateway API Extensions(확장)이란?

표준 Gateway API에 없는 기능(예: 인증/레이트리밋/트래픽 제어 등)을 구현체가 **CRD 형태로 타입 안전하게 제공**하는 것.

과거 Ingress는 annotation으로 땜질했는데, 타입 검증이 약해서 실수가 잦았음.
Extensions는 **구조가 명확하고 규칙이 엄격**해서 오류를 빨리 잡을 수 있어.

### 확장 기능 예시

* 고급 트래픽 관리: 재시도, 서킷브레이커, 고급 LB 알고리즘 등
* 보안 강화: 구현체 특화 TLS/인증/접근제어
* 관측성: 모니터링/로깅/트레이싱 연동
* 커스텀 프로토콜 지원
* Rate limiting, compression 등

### Envoy Gateway의 확장 모델

* 표준 리소스(Gateway/HTTPRoute 등)를 직접 바꾸지 않고
* **Policy Attachment 모델**로 “정책 리소스”를 붙여서 기능을 확장

---

## 6) Envoy Gateway 주요 정책(Extensions) 정리

### 6-1) BackendTrafficPolicy (게이트웨이 ↔ 백엔드 사이 정책)

Envoy Gateway가 **백엔드 서비스로 통신하는 방식**을 제어하는 정책.

* 목적: 안정성/복원력/성능 최적화
* 예: 서킷브레이커, 연결 제한, 로드밸런싱 전략, (글로벌/로컬) 레이트리밋, fault injection 등

**적용 대상(Targeting)**

* `targetRefs`: 특정 리소스를 직접 지목(HTTPRoute/Gateway 등)
* `targetSelectors`: 라벨로 매칭해서 다수 리소스에 적용

**제약**

* 정책은 **같은 namespace**의 리소스만 타겟 가능

**우선순위(Precedence)**
더 “구체적인 범위”가 더 강함:

1. Route rule-level(HTTPRoute/GRPCRoute의 특정 rule sectionName) **최상**
2. Route-level(HTTPRoute/GRPCRoute 전체)
3. Listener-level(Gateway의 특정 listener sectionName)
4. Gateway-level(Gateway 전체) **최하**

같은 레벨에서 여러 개 충돌 시:

* **더 오래된(creationTimestamp가 빠른) 정책이 승리**
* 타임스탬프 같으면 **이름 사전순**

**Policy Merging**
`mergeType`을 route 쪽(자식 리소스 타겟) 정책에 설정하면,

* 상위(게이트웨이/리스너) 정책과 “덮어쓰기”가 아니라 **병합** 가능
* `StrategicMerge`: 쿠버네티스 전략적 머지(배열/구조 병합에 유리)
* `JSONMerge`: RFC7396 방식(배열은 통째로 교체되는 경향)

---

### 6-2) ClientTrafficPolicy (클라이언트 ↔ 게이트웨이(Envoy) 사이 정책)

다운스트림 클라이언트가 Envoy의 **리스너로 들어오는 구간**(엣지) 동작을 제어.

* 예: TLS 종료/mTLS, 타임아웃/keepalive, 클라이언트 IP 신뢰 체인, 경로 정규화, HTTP1/2/3 튜닝, 헬스체크 등

**적용 대상**

* Gateway에 붙임(리스너 단위까지 sectionName으로 가능)
* 역시 같은 namespace 제약

**우선순위**

* 리스너(sectionName) 지정한 정책이 더 우선
* 동레벨 충돌은 “오래된 정책 우선 + 이름 사전순”

---

### 6-3) SecurityPolicy (인증/인가/보안 정책)

게이트웨이로 들어오는 트래픽에 대해 **인증(Authentication)** 과 **인가(Authorization)** 를 선언형으로 적용.

* 예: mTLS, JWT, API Key, Basic Auth, OIDC 연동, CORS, 외부 인가 서비스 연동 등

**TCPRoute는 제한**: IP allow/deny 같은 IP 기반 인가 정도만 가능(HTTP 계열 인증은 적용 어려움)

**우선순위 구조**
BackendTrafficPolicy와 유사한 계층:

* rule-level > route-level > listener-level > gateway-level
* 동레벨 충돌은 “오래된 정책 우선 + 이름 사전순”

---

## 7) API Gateway / Proxy / Load Balancing / Rate Limiting 개념 연결

### API Gateway

* 여러 마이크로서비스 앞단의 **중앙 진입점**
* 인증/레이트리밋/라우팅/관측성 같은 공통 관심사를 중앙에서 처리

### Proxy(Envoy Proxy)

* 클라이언트 요청을 받아 백엔드로 전달하고 응답을 다시 돌려주는 **중개자**
* Envoy Gateway는

  * **Control plane**(설정 변환/배포) + **Data plane(Envoy Proxy)** 구조

### Load Balancing (BackendTrafficPolicy로 제어)

지원 전략 예:

* Round Robin, Random, Least Request(기본), Consistent Hash(세션 고정 등)

### Rate Limiting (BackendTrafficPolicy로 제어)

* **Local**: Envoy 인스턴스별 독립 제한(빠르고 가벼움)
* **Global**: Envoy 전체 공통 제한(외부 Rate Limit Service + 보통 Redis 필요)
* 둘 다 동시에 설정 가능: **Local 먼저**, 그 다음 **Global** 체크

---

### 최종 한 줄 요약

* **Gateway API**: “표준 리소스 모델(규칙)”
* **Envoy Gateway**: “그 규칙을 Envoy 설정(xDS)으로 바꿔 실제 트래픽을 처리하게 하는 구현체”
* **Extensions(Policy CRD)**: 표준에 없는 고급 기능을 타입 안전하게 붙이는 방식(Backend/Client/Security 정책 등)

# Reference
https://gateway.envoyproxy.io/docs/concepts/