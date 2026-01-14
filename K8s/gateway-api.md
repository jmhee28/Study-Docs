

**Gateway API를 “설치”하면, 실제 트래픽을 받기 위해 결국 `Service(type=LoadBalancer)`가 필요.**
Gateway API는 “라우팅 규칙(표준 리소스)”이고, **외부에서 들어오는 트래픽을 실제로 받아줄 네트워크 엔드포인트**는 보통 Service가 만들어 줍니다.

## API GATWAY   
- API 게이트웨이 는 외부 클라이언트(모바일 앱, 브라우저 또는 외부 API)와 백엔드 마이크로서비스 또는 API 사이에 위치하는 특정 유형의 애플리케이션 수준 서비스 입니다.

- 주요 목적은 모든 클라이언트 요청에 대한 단일 진입점 역할을 하여 API 트래픽을 관리하고 조율하는 것입니다.

- API 게이트웨이에는 간단한 트래픽 라우팅 외에도 인증 , 속도 제한 , 캐싱 , 부하 분산 , 로깅 , 모니터링 과 같은 추가 기능이 포함됩니다 .

- API 게이트웨이 에 대한 주요 사항 :

- API에 초점 : 주로 API 호출과 관련된 트래픽을 처리합니다(애플리케이션 계층 - OSI 모델의 7계층).
- API 요청 관리 : API 소비자를 위한 단일 진입점 역할을 하며 API 경로에 따라 다양한 백엔드 서비스에 요청을 프록시할 수 있습니다.
- 추가 기능 : API 게이트웨이에는 보안(인증, 권한 부여), 트래픽 관리(속도 제한, 조절), 캐싱 및 모니터링이 포함되는 경우가 많습니다.
- Kubernetes에 국한되지 않음 : API 게이트웨이는 모든 환경(클라우드, 온프레미스 또는 하이브리드)에서 사용할 수 있으며 Kubernetes 클러스터에 국한되지 않습니다.

## 1) Gateway API는 “규칙/추상화(컨트롤 플레인)”

Gateway API 설치/적용에서 나오는 리소스들:

* `GatewayClass` : “어떤 구현체(컨트롤러)를 쓸 거냐” 선언
* `Gateway` : “리스너(80/443), 주소, TLS 등 게이트웨이 인스턴스” 선언
* `HTTPRoute` : “Host/Path 라우팅 규칙” 선언d   

이건 **트래픽을 ‘어떻게 보낼지’에 대한 스펙(명세)**이지, 그 자체가 인터넷에서 접속 가능한 IP를 자동으로 만들어주는 건 아닙니다.

---

## 2) 실제 트래픽을 “받는 입구(데이터 플레인)”가 필요함

Gateway API를 실제로 동작시키려면 구현체가 있어야 합니다. 예: **Envoy Gateway**.

Envoy Gateway를 설치하면 보통 구성 요소가 생깁니다:

* 컨트롤러(Controller) Deployment
* 데이터플레인(Envoy Proxy) Deployment/DaemonSet
* 그리고 **그 Envoy Proxy를 외부에 노출시키는 Service**

여기서 핵심이:

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

## 역할의 분리 (role-oriented)
- 인프라 운영자/Devops 는 GatewayClass,Gateway를 관리 
- 개발자는 트래픽 라우팅을 관리 (HTTPRoute)- Service
  <img src="../imgs/K8S/role.png" alt="Gateway API Role-Oriented">