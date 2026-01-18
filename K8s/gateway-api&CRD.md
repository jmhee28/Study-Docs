# Gateway API / CRD


**Gateway API는 Kubernetes에서 네트워크 트래픽을 외부로부터 클러스터 내부의 서비스로 안전하고 유연하게 전달하기 위한 새로운 표준 API 리소스 집합**이다.
전통적으로는 Ingress 리소스를 통해 HTTP/HTTPS 요청을 클러스터 내부 서비스로 라우팅했지만, Ingress는 기능 확장에 한계가 있었고, L4(Transport Layer) 수준의 트래픽이나 멀티 프로토콜, 고급 라우팅 제어를 지원하기 어려웠다.
이러한 배경에서 등장한 것이 바로 Gateway API 이다.

| 리소스 | 설명 |
|--------|------|
| GatewayClass | 인프라 제공자가 정의하는 Gateway 구현 클래스 |
| Gateway | 실제 L4/L7 트래픽을 수신하는 리소스 |
| Route (HTTPRoute, TLSRoute, TCPRoute, GRPCRoute) | 서비스로 트래픽을 라우팅하는 규칙 |
| ReferencePolicy, BackendPolicy | 고급 권한과 정책 제어 리소스 |

## Gateway 리소스를 어디에 만들어야 할까?

| 리소스 | 위치 기준 | 설명 |
|--------|----------|------|
| GatewayClass | 클러스터 전역 | 어떤 Gateway 컨트롤러를 사용할지 지정 |
| Gateway | 애플리케이션(Service)이 존재하는 네임스페이스 | 실제로 트래픽을 수신하는 진입점 |
| Route (HTTPRoute 등) | 애플리케이션 네임스페이슬 | Gateway를 참조하여 라우팅 정의 |

- GatewayClass 는 전역 리소스니까 네임스페이스가 없다 (cluster-scoped)
- Gateway 는 특정 네임스페이스에 생성되며, 해당 네임스페이스에 존재하는 Route만 기본적으로 받아들인다
- 물론 allowedRoutes 설정으로 다른 네임스페이스도 허용할 수 있다.
- Route (HTTPRoute, TLSRoute 등)는 자신의 네임스페이스에서 Gateway를 parentRefs 로 참조한다
 

- default 네임스페이스에 있는 애플리케이션을 외부에서 노출하고 싶다면:
   - Gateway → default 네임스페이스에 생성
   - HTTPRoute → default 네임스페이스에 생성
   - Service, Deployment → 역시 default 에 존재
 

## 1) Gateway API는 “규칙/추상화(컨트롤 플레인)”

Gateway API 설치/적용에서 나오는 리소스들:

* `GatewayClass` : “어떤 구현체(컨트롤러)를 쓸 거냐” 선언
* `Gateway` : “리스너(80/443), 주소, TLS 등 게이트웨이 인스턴스” 선언
* `HTTPRoute` : “Host/Path 라우팅 규칙” 선언d   

---
# CRD
CRD(CustomResourceDefinition)는 **쿠버네티스에 “새로운 리소스 종류(kind)”를 추가하는 확장 메커니즘**
-  기본 리소스(Pod/Service/Deployment)처럼, 너만의 리소스를 쿠버네티스 API로 다루게 해준다.

---

## 1) CRD가 정확히 뭐냐

* 쿠버네티스는 원래 `Pod`, `Service` 같은 **정해진 kind**만 알아듣는다.
* CRD를 설치하면 API Server가

  * “이제부터 `Gateway`, `HTTPRoute` 같은 kind도 받아줄게”라고 **새 타입을 등록**한다.

즉, CRD는 **새 리소스 타입의 “정의서(스키마 등록)”**다.

---

## 2) CRD vs CR 

* **CRD**: “타입 정의”

  * 예: `kind: CustomResourceDefinition`
  * 어떤 필드가 있는지, 어떤 버전(v1beta1/v1), 어떤 그룹(gateway.networking.k8s.io)인지 등
* **CR(Custom Resource)**: 그 타입으로 만든 “실제 객체”

  * 예: `kind: Gateway`, `kind: HTTPRoute`
  * 네가 `kubectl apply -f gateway.yaml`로 만드는 것

비유:

* CRD = 테이블 스키마
* CR = 그 테이블의 실제 row

---

## 3) CRD만 있으면 동작하나?

대부분 **아니**. CRD는 “API에 등록”만 해줄 뿐이고,
**동작을 만드는 건 Controller(Operator)** 야.

흐름:

1. CRD 설치 → API Server가 새 kind를 저장/조회 가능
2. 너가 CR 생성(예: Gateway 생성)
3. Controller가 watch(감시)하다가
4. 실제 리소스(Deployment/Service/Config 등)를 만들거나 설정을 바꿔서 “현실화”

그래서 Gateway API도:

* CRD(리소스 타입들) + Controller(Envoy Gateway 같은 구현체)
  둘 다 있어야 라우팅이 실제로 됨.

---

## 4) 어디서 보나/확인하나

```bash
kubectl get crd
kubectl get crd | grep gateway
kubectl explain gateway --api-version=gateway.networking.k8s.io/v1
```

---

## 5) 예시로 감 잡기 (Gateway API)

* CRD가 등록해주는 kind들: `GatewayClass`, `Gateway`, `HTTPRoute` …
* 너는 `Gateway`, `HTTPRoute` 같은 CR을 만든다
* Envoy Gateway 같은 컨트롤러가 그걸 읽고 실제 트래픽 처리를 구성한다

---
    
# Envoy Gateway

## 2) 실제 트래픽을 “받는 입구(데이터 플레인)”가 필요함

Gateway API를 실제로 동작시키려면 구현체가 있어야 합니다. 예: **Envoy Gateway**.

Envoy Gateway를 설치하면 보통 구성 요소가 생깁니다:

* 컨트롤러(Controller) Deployment
* 데이터플레인(Envoy Proxy) Deployment/DaemonSet
* 그리고 **그 Envoy Proxy를 외부에 노출시키는 Service**


> “외부에서 접속할 IP/엔드포인트”를 만들기 위해
> **Envoy Proxy 앞에 `Service(type=LoadBalancer)`를 둔다**
> → 그 순간 NKS에서는 Load Balancer 상품이 연동되며, IP(Floating/VIP)가 생성될 수 있음

즉, Service는 “Gateway API랑 별개”가 아니라 **Gateway를 실제로 외부에 열어주는 입구**로 쓰이는 겁니다.

---

## 3) 왜 NKS에서 Service 설정(사설 IP/플로팅 IP)이 중요해지나

NKS는 `type: LoadBalancer` Service를 만들면 **클라우드 LB를 자동 생성**하고,
기본값이면 **Floating IP(공인 IP)까지 붙일 수** 있습니다.


* Gateway API/Envoy Gateway 설치 → (뒤에서) Envoy Proxy 노출용 Service 생성됨
* Service를 아무 설정 없이 만들면 → Floating IP까지 생길 수 있음
*  “사설 IP만” 쓰고 싶다 → Service에 “Floating IP 사용 안 함” 옵션을 넣어라

---

## 4) 한 장으로 정리(매핑)

* Gateway API 리소스(Gateway/Route) = **라우팅 규칙**
* Gateway Controller(Envoy Gateway 등) = **그 규칙을 실제 프록시에 반영**
* Service(LoadBalancer) = **그 프록시(Envoy)를 외부에 노출시키는 방법**
* NKS LB 연동 = **Service를 만들면 클라우드 LB/IP가 따라 생성**


1. **Envoy Gateway 같은 구현체를 설치했다**
   → 설치 과정에서 `envoy-gateway` 네임스페이스에 `Service type=LoadBalancer`가 같이 생김 (정상)

2. **Gateway/HTTPRoute만 만들었는데 Service가 따로 생겼다**
   → 누군가(또는 Helm chart)가 “게이트웨이 프록시 노출”을 위해 Service를 만든 것

---

# Reference
- [kubernetes gateway api 정리](https://somaz.tistory.com/403)