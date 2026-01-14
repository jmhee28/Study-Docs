# K8s Ingress, Gateway API, k9s, NKS 핵심 정리

## 1) K8s Cluster에서 Ingress Controller가 하는 일

### 핵심 역할

* 클러스터 “밖(인터넷/사내망)”에서 들어오는 트래픽을 **클러스터 내부 서비스(Service)로 라우팅**해 주는 관문 역할
* 보통은 **L7(HTTP/HTTPS)** 기준으로 Host/Path 기반 라우팅, TLS 종료(termination), 리다이렉트, 인증 연동 등을 담당

### 중요한 관점

* Ingress는 “리소스(명세)”이고, **Ingress Controller는 그 명세를 실제 프록시/로드밸런서에 반영하는 구현체**입니다.
* 따라서 “Ingress를 쓴다”는 말은 반쪽이고, **무슨 Controller(예: NGINX Ingress, ALB Controller 등)를 쓰는지**가 운영 현실을 결정합니다.

---

## 2) Gateway API (Ingress 다음 세대) — 왜 뜨는가

### Ingress 대비 장점(요지)

* Ingress보다 더 **표준화된 역할 분리**(GatewayClass / Gateway / Route)
* **팀/플랫폼 운영 관점에서 권한 분리**가 쉬움(플랫폼팀은 GatewayClass/Gateway, 서비스팀은 Route 위주)
* 기능 확장(TCP/UDP, 정책 리소스 연계 등)과 “구현체 간 호환성”을 목표로 설계

> 구현체/상태는 공식 “Implementations” 페이지에서 지속 업데이트됩니다. ([gateway-api.sigs.k8s.io][1])
> 최근 Gateway API 1.4에서는 구현체가 지원 기능을 선언하는 `supportedFeatures` 같은 개선도 소개됩니다. ([Kubernetes][2])

---

## 3) Gateway API 구현체(Controller) 선택 기준 요약


### (1) 기본값으로 무난한 선택

* **Envoy Gateway (GA)**: 표준 Gateway API 중심 + 기능/성능 균형. “특별한 이유 없으면 이거부터”라는 포지션으로 많이 언급됨(구현체 상태는 위 Implementations에서 확인). ([gateway-api.sigs.k8s.io][1])

### (2) NGINX 생태계 선호/기존 Ingress 경험 활용

* **NGINX Gateway Fabric (GA)**: NGINX 기반. 기존 NGINX 운영 경험/도구 체계가 있으면 온보딩이 빠름. ([gateway-api-inference-extension.sigs.k8s.io][3])

### (3) 서비스 메시/트래픽 정책까지 “한 번에”

* **Istio (GA)**: 강력하지만 구성/운영이 무겁고 학습비용이 큼. “메시가 필요할 때” 정당화가 잘 됨.

### (4) CNI/네트워크 스택과 결합

* **Cilium**: 이미 Cilium을 CNI로 쓰는 클러스터라면 네트워크/보안 정책과 함께 설계하기 좋음.

### (5) 빠르고 가볍게

* **Traefik Proxy (GA)**: 도입·운영이 간단한 편. 다만 기능/정책이 복잡해질수록 한계가 보일 수 있음.

### (6) 특정 생태계 연계

* **kgateway (GA)**: Gloo 기반 생태계면 선택이 자연스러움.
* **Airlock Microgateway**: 일반 웹서비스 “표준 관문”이라기보다 보안/특수 목적 성격.
* **Agent Gateway**: “NKS에서 제공하는 옵션”이라면, **NKS 표준 가이드/운영 지원**을 기대할 수 있는 선택지(벤더 표준을 따르는 이점).

참고로, 구현체별 “상대적 업데이트 성능/상태 반영”을 비교한 벤치마크 자료도 있습니다(절대적 진리는 아니지만 참고용). ([GitHub][4])

---

## 4) k9s 사용법 — “kubectl을 화면으로 쓰는 법”

### k9s의 본질

* kubectl을 대체한다기보다, **리소스 탐색/로그/exec/스케일링/롤아웃 같은 반복 작업을 TUI로 빠르게** 하는 도구

### 오늘 기준으로 잡아둘 “최소 루틴”

* **리소스 탐색**: pod/service/deploy 등 뷰 전환(명령/단축키 기반)
* **문제 파악**: 이벤트/상태/로그를 빠르게 확인
* **조치**: rollout restart, scale, exec, port-forward 등

공식 문서의 CLI/뷰 인자와 사용 흐름을 한 번 훑어두면, “어디서 무엇을 보는지”가 정리됩니다. ([K9s][5])
또, 실전 단축키/워크플로우(예: yaml 저장→로컬에서 수정→apply) 같은 형태는 치트시트가 기억에 잘 남습니다. ([HackingNote][6])

---

## 5) “k8s doc 보는 법” — Implementations 페이지를 즐겨찾기해야 하는 이유

Gateway API는 “표준 리소스” + “구현체” 조합이라,

* **표준 스펙만 봐서는 운영이 끝나지 않고**
* **내가 고른 구현체가 무엇을 얼마나 지원하는지**를 계속 확인해야 합니다.

그래서 당신이 링크로 찍어둔 “Implementations / implementation status” 섹션은 실무적으로 매우 핵심입니다. ([gateway-api.sigs.k8s.io][1])

---

## 6) NHN Cloud NKS 정리 — Floating IP vs 사설 IP

### 사설 IP(= Fixed/Private IP)

* 인스턴스/노드가 서브넷에서 받는 **내부 통신용 IP**
* 외부 인터넷에서 직접 접근 불가 (기본 전제) ([docs.nhncloud.com][7])

### Floating IP

* 외부에서 접근 가능한 공인 성격의 IP를 **리소스에 1:1로 붙였다 떼는 방식**
* “내부 사설 IP는 유지하면서, 외부 노출이 필요할 때만 붙여서 쓰는” 패턴 ([docs.nhncloud.com][7])

### NKS 맥락에서의 포인트(운영 감각)

* NKS에서 `Service type=LoadBalancer`를 만들면, 외부에서 보이는 IP가 “플로팅 IP로 접근되는 형태”로 안내됩니다. ([docs.nhncloud.com][8])
* 노드 그룹에 Floating IP 자동할당 같은 옵션은 **사용자가 미리 만들어둔 floating IP를 할당**하는 방식이며, 재고(여유 floating IP)가 부족하면 스케일링이 실패할 수 있다는 점이 운영 포인트입니다. ([docs.nhncloud.com][9])

---

## 오늘 학습의 한 줄 결론

* **Ingress는 “구현체 중심 운영”**이고,
* **Gateway API는 “표준 + 권한분리 + 구현체 지원 범위 확인”**이 핵심이며,
* **NKS에서는 외부 노출이 곧 Floating IP 설계/재고 관리와 연결**되고,
* **k9s는 이 모든 운영 상태를 빠르게 읽고 조치하는 ‘콘솔형 관제 도구’**로 가져가면 됩니다.

원하면, 위 내용을 바탕으로 **“NKS에서 Gateway API(예: Envoy Gateway)로 외부 트래픽 받는 최소 아키텍처(로드밸런서/플로팅IP/게이트웨이/라우트) 한 장 요약”** 형태로도 정리해드리겠습니다.

[1]: https://gateway-api.sigs.k8s.io/implementations/?utm_source=chatgpt.com "Implementations"
[2]: https://kubernetes.io/blog/2025/11/06/gateway-api-v1-4/?utm_source=chatgpt.com "Gateway API 1.4: New Features"
[3]: https://gateway-api-inference-extension.sigs.k8s.io/implementations/gateways/?utm_source=chatgpt.com "Gateway Implementations - Gateway API Inference Extension"
[4]: https://github.com/howardjohn/gateway-api-bench?utm_source=chatgpt.com "Gateway API Benchmarks provides a common set of tests ..."
[5]: https://k9scli.io/topics/commands/?utm_source=chatgpt.com "Commands"
[6]: https://www.hackingnote.com/en/cheatsheets/k9s/?utm_source=chatgpt.com "Cheatsheet - k9s"
[7]: https://docs.nhncloud.com/ko/Network/Floating%20IP/ko/overview/?utm_source=chatgpt.com "Network > Floating IP > 개요"
[8]: https://docs.nhncloud.com/ko/Container/NKS/ko/user-guide/?utm_source=chatgpt.com "Container > NHN Kubernetes Service(NKS) > 사용 가이드"
[9]: https://docs.nhncloud.com/en/Container/NKS/en/user-guide/?utm_source=chatgpt.com "Container > NHN Kubernetes Service (NKS) > User Guide"
