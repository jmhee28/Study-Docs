
# 컨테이너 환경에서의 java 애플리케이션의 리소스와 메모리 설정

## 1) 메모리 장애는 “두 레벨”로 나뉜다

### 컨테이너/Kubernetes 레벨: `OOMKilled`

* **의미**: 컨테이너가 `limits.memory`를 넘어서 **커널(OOM killer)** 이 프로세스를 강제 종료
* **징후**: `reason: OOMKilled` (종종 `exitCode: 137`)

### JVM 레벨: `Java heap space`

* **의미**: JVM의 **Heap 상한(Xmx)** 을 초과해 JVM 내부에서 OOM
* **징후**: `java.lang.OutOfMemoryError: Java heap space`

✅ 둘은 원인/대응이 완전히 다르다.

---

## 2) `requests` / `limits`에서 메모리 포인트

### `resources.requests.memory`

* **예약치**(스케줄링 기준)
* 노드 배치에 영향을 주지만, **OOM 자체를 직접 막아주진 않음**

### `resources.limits.memory`

* 컨테이너 메모리 **상한(cap)**
* 이 상한을 넘으면 **OOMKilled** 위험이 커짐

---

## 3) 컨테이너 메모리는 Heap만이 아니다

> 컨테이너 메모리 ≈ **Heap + Heap 밖(non-heap/off-heap) + 네이티브/OS 오버헤드**

Heap 밖 대표 항목

* Metaspace(클래스 메타데이터)
* Thread stack(스레드 수 많으면 증가)
* Direct buffer / NIO / Netty 등 off-heap
* JIT 코드 캐시, GC 내부 구조물
* APM/에이전트, libc/SSL/소켓 버퍼 등

✅ 그래서 `Xmx`를 `limits.memory`에 너무 가깝게 잡으면 Heap 밖이 조금만 늘어도 **OOMKilled**로 터질 수 있다.

---

## 4) 컨테이너에서 Heap이 “너무 작게” 잡힐 수 있음

* JVM은 컨테이너 메모리를 인식하더라도 기본 설정에서는 **Heap을 limit의 일부(보수적 비율)** 로 잡는 경우가 있다.
* 결과:

  * 컨테이너 메모리(limit)는 남는데
  * Heap이 작아 **GC가 과도**해지거나 **`Java heap space`** 발생 가능

---

## 5) Heap 설정 방식 2가지

### (1) 고정값

* `-Xms`, `-Xmx`로 Heap 초기/최대 고정
* 단점: Pod limit 바뀌면 값도 같이 바꿔야 해서 운영 실수 가능

### (2) 비율 기반(컨테이너 limit에 자동으로 맞춤)

* `-XX:InitialRAMPercentage`
* `-XX:MaxRAMPercentage`
* 장점: `limits.memory`가 바뀌어도 비율로 Heap이 따라감

---

## 6) 상황별 진단 & 대응

### A) `OOMKilled` / exit 137

* 원인: **컨테이너 전체 메모리(limit) 초과**
* 체크 순서

  1. `limits.memory`가 너무 낮은가?
  2. Heap 밖(off-heap, thread, metaspace) 증가가 큰가?
  3. `Xmx`가 limit에 너무 붙어 안전 마진이 부족한가?

### B) `Java heap space`

* 원인: **Heap(Xmx) 부족**
* 체크 순서

  1. `Xmx` 또는 `MaxRAMPercentage` 상향
  2. 메모리 많이 쓰는 코드/캐시/컬렉션 점검
  3. GC 튜닝은 그 다음

---

## 7) 실무 기본 원칙(시작점)

* Heap을 너무 작게 잡으면 → **GC 지옥 / `Java heap space`**
* Heap을 너무 크게 잡으면 → Heap 밖 때문에 **`OOMKilled`**
* 경험칙 시작값:

  * **Heap은 `limits.memory`의 50~70% 수준으로 시작**
  * 나머지는 **Heap 밖/네이티브 안전 마진**으로 남긴다
    (정확한 비율은 워크로드/스레드/에이전트에 따라 조정)

---

## refs

- https://findstar.pe.kr/2022/07/10/java-application-memory-size-on-container/

---
