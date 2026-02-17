# Kubernetes 리소스 관리 정리 (requests / limits)

## 1) `resources.requests` / `resources.limits` 의미

### requests = “요청/예약치”

* **스케줄링 기준**(파드가 어느 노드에 올라갈지 결정할 때 사용)
* 노드에 **requests만큼의 여유**가 있어야 배치됨

예)

* `requests.memory: 64Mi` → 최소 64Mi 정도는 필요하니 그만큼 **자리(예약)** 잡아줘
* `requests.cpu: 100m` → 0.1 vCPU 정도는 **예약**해줘

> requests는 “항상 그만큼 사용”이 아니라 “그 정도는 필요할 수 있으니 확보”에 가깝다.

---

### limits = “상한/최대치(cap)”

컨테이너가 쓸 수 있는 **최대치**.

#### 메모리 `limits.memory`

* limit 초과로 메모리 할당이 필요해지면 **OOMKilled(강제 종료)** 위험이 큼
* 메모리는 **“넘으면 죽는다”** 가 핵심

#### CPU `limits.cpu`

* limit 초과 사용 시 **throttling(쓰로틀링)** 으로 느려짐
* CPU는 **“넘으면 느려진다”** 가 핵심(즉시 kill 아님)

---

## 2) 단위 빠른 해석

### CPU: `m` (millicore)

* `100m` = 0.1 vCPU
* `300m` = 0.3 vCPU
* `1000m` = 1 vCPU

### Memory: `Mi/Gi`

* `1Gi` = `1024Mi`
* `64Mi` ≈ 67MB
* `128Mi` ≈ 134MB

---

## 3) requests/limits 조정 시 영향

### requests를 낮추면

* **배치가 쉬워짐**(예약이 작아져서 노드에 올리기 쉬움)
* 단, 너무 낮으면 실제 부하에서 CPU 경쟁/메모리 압박으로 성능 저하 가능

### limits를 낮추면

* 단, 너무 낮으면

  * 메모리: **OOMKilled** 위험 증가
  * CPU: **throttling** 증가 → 지연/처리량 악화

---

## 4) 언제 명시적으로 적어야 하나?

* 컨테이너가 기본값보다 **확실히 더 필요/덜 필요**할 때
* 운영/테스트에서:

  * OOMKilled 발생 → `limits.memory` 재조정
  * CPU throttling 높음 → `limits.cpu` 재조정
  * 스케줄링이 안 됨(자리가 없음) → `requests.*`가 과한지 점검

---

## 5) 현재 적용된 requests/limits 확인

### 파드별 requests/limits 요약(컨테이너 스펙 출력)

```bash
kubectl get pod -n <ns> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.name}{": req="}{.resources.requests.cpu}{","}{.resources.requests.memory}{" lim="}{.resources.limits.cpu}{","}{.resources.limits.memory}{"  "}{end}{"\n"}{end}'
```


## OOM
- `OOMKilled`는 **Out Of Memory Killed**의 약자.
- 보통 **컨테이너/파드가 쓸 수 있는 메모리 한도(memory limit)를 넘어서서**, 리눅스 커널(OOM killer)이 프로세스를 강제 종료했을 때 Kubernetes 상태(reason)로


* `reason: OOMKilled`
* `exitCode: 137` (강제 종료 시 자주 같이 뜸) 

원인 케이스는 

1. **컨테이너 limit 초과**(가장 흔함)
2. **노드 전체 메모리 압박**으로 커널이 희생양을 골라 죽임 

