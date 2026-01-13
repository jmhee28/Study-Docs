# React의 State와 Hook

---

## 1) State와 리렌더링의 핵심 개념

### State란?

- 컴포넌트가 **UI를 결정하는 데이터(상태)** 를 “React가 관리하도록” 맡긴 값입니다.
- State가 바뀌면 React는 **그 컴포넌트를 다시 렌더링(리렌더링)** 해서 UI를 최신 상태로 맞춥니다.

### 리렌더링이 정확히 뭐냐?

- “DOM을 통째로 다시 그린다”가 아니라,

  1. 컴포넌트 함수가 다시 실행되고(=렌더 단계),
  2. 새 UI 결과(가상 DOM)를 만들고,
  3. 이전 결과와 비교해서 **바뀐 부분만 실제 DOM에 반영**합니다.

### 중요한 규칙

- State는 **직접 변경하면 안 됩니다**. (불변성 유지)

  - React는 “값이 바뀌었는지”를 비교하여 업데이트 판단을 하므로, 객체/배열을 직접 수정하면 변화 감지가 꼬일 수 있습니다.

- 렌더링 중에는 “순수 함수처럼” 동작해야 합니다.

  - 렌더링 도중에 네트워크 요청/DOM 조작 같은 “부작용”을 하면 예측이 어려워집니다. 그래서 부작용은 `useEffect`로 분리합니다.

---

## 2) useState: 상태 관리와 상태 변경 → 리렌더링

### 기본 사용

```js
const [count, setCount] = useState(0);
```

- `count`: 현재 상태 값
- `setCount`: 상태 변경 함수 (호출 시 리렌더링 트리거)

### 상태 업데이트의 두 방식

#### (1) 값으로 업데이트

```js
setCount(count + 1);
```

- 이때 `count`는 “현재 렌더링 시점의 값”을 참조합니다.

#### (2) 함수형 업데이트(권장되는 경우 많음)

```js
setCount((prev) => prev + 1);
```

- 이전 상태(prev)를 받아 새 상태를 계산합니다.
- **연속 업데이트**나 **비동기 흐름**에서 안전합니다.

### setState는 즉시 반영될까?

- 대개 React는 여러 업데이트를 **배치(batch)** 해서 효율적으로 처리합니다.
- 그래서 `setCount` 직후에 `count`를 찍으면 “이전 값”이 보일 수 있습니다.

  - “상태 변경 결과에 반응하는 로직”은 보통 `useEffect`로 다룹니다.

---

## 3) useEffect: 사이드 이펙트(부작용) 처리 + clean up

### 사이드 이펙트란?

렌더링 자체(“UI 계산”)가 아닌, 외부 세계와 상호작용하는 작업:

- 데이터 fetch / 구독(subscription)
- 타이머(setInterval, setTimeout)
- 이벤트 리스너 등록/해제
- DOM 직접 조작(가능하면 지양)

### 기본 구조

```js
useEffect(() => {
  // 부작용 수행
  return () => {
    // clean up (정리)
  };
}, [deps]);
```

### deps(의존성 배열) 패턴 3가지

#### (1) deps 없음: 매 렌더마다 실행

```js
useEffect(() => { ... });
```

- 거의 안 씁니다. 불필요한 반복 실행 위험.

#### (2) 빈 배열 []: 마운트 시 1회 + 언마운트 시 clean up

```js
useEffect(() => {
  // 최초 1회
  return () => {
    // 컴포넌트 사라질 때 정리
  };
}, []);
```

#### (3) deps 지정: deps 변경 시마다 실행 + 이전 effect clean up 후 재실행

```js
useEffect(() => {
  // deps가 바뀔 때마다 실행
  return () => {
    // 다음 실행 전에, 혹은 언마운트 전에 정리
  };
}, [someState, someProp]);
```

### clean up이 왜 중요?

예: 이벤트 리스너/타이머/구독을 정리 안 하면

- 중복 등록되어 여러 번 실행
- 메모리 누수
- “이미 사라진 컴포넌트”를 업데이트하는 문제(경고/버그)

### fetch와 effect의 주의점(실무 포인트)

- 빠르게 상태가 바뀌면 “이전 요청 결과가 늦게 도착해 덮어쓰는” 레이스 컨디션이 생길 수 있습니다.
- `AbortController` 같은 취소 로직을 넣거나, 최신 요청만 반영하는 패턴을 씁니다.

---

## 4) useRef: “값은 유지되지만 리렌더링은 발생시키지 않는” 저장소

### 핵심 특징

- `ref.current` 값 변경은 **리렌더링을 일으키지 않습니다.**
- 렌더 사이에 **값을 기억**해야 하지만, 그 값이 UI를 바꾸지 않을 때 적합합니다.

### 대표 용도 1: DOM 참조

```js
const inputRef = useRef(null);

<input ref={inputRef} />;
// inputRef.current.focus()
```

### 대표 용도 2: 타이머/외부 인스턴스 보관

```js
const intervalIdRef = useRef(null);
```

### 대표 용도 3: 이전 값 기억(previous value)

- “이전 props/state” 비교할 때도 ref를 씁니다.

---

## 5) useMemo: “비싼 계산 결과”를 메모이제이션(캐싱)

### 목적

렌더링마다 계산 비용이 큰 로직이 있고, **입력 값이 안 바뀌면 결과도 동일**하다면 캐싱해서 성능을 아낍니다.

```js
const filtered = useMemo(() => {
  return items.filter(...); // 비용이 큰 연산이라고 가정
}, [items, keyword]);
```

### 오해 주의

- `useMemo`는 “항상 성능 향상”이 아닙니다.
- 메모이제이션 자체도 비용이 있고, 의존성 관리가 잘못되면 오히려 버그/복잡도만 늘어납니다.
- 정말로 “비싼 연산”이거나 “참조 동일성이 중요”할 때 씁니다.

### 참조 동일성(실무에서 중요)

- 자식 컴포넌트가 `React.memo`로 최적화되어 있거나,
- `useEffect` deps로 객체/배열을 넣어야 해서 “불필요한 변경 감지”를 막고 싶을 때,
  `useMemo`로 객체/배열을 고정해주는 경우가 많습니다.

---

## 6) useCallback: “함수”를 메모이제이션(참조 고정)

### 목적

- 렌더링 때마다 함수가 새로 만들어지는 것을 막고, **함수 참조를 안정적으로 유지**합니다.
- 같은 함수가 같은 레퍼런스를 가지도록 해 이걸 전달받는 컴포넌트가 불필요하게 리렌더링되는 걸 막음

```js
const onClick = useCallback(() => {
  setCount((c) => c + 1);
}, []);
```

### 주로 언제 필요?

- 자식 컴포넌트가 `React.memo`로 최적화되어 있고,
- 부모가 렌더될 때마다 새 함수가 전달되면 자식이 불필요하게 리렌더되는 상황에서 효과적입니다.

### 주의점

- `useCallback(fn, deps)`는 사실상 `useMemo(() => fn, deps)`와 비슷합니다.
- 남발하면 코드가 복잡해지고, deps 누락 시 버그(오래된 값 참조)가 생깁니다.

---

## 7) useMemo vs useCallback 한 줄 구분

- `useMemo`: **값(계산 결과)** 을 캐싱
- `useCallback`: **함수(콜백)** 을 캐싱

---

## 8) Hook 사용 시 가장 흔한 실수 3가지

1. **deps 누락으로 stale closure(오래된 값 캡처)**

- effect/callback 안에서 state를 쓰는데 deps에 안 넣으면 “예전 값”을 계속 참조할 수 있습니다.
- 해결: deps를 정확히 넣거나, 상태 업데이트는 함수형 업데이트 사용.

2. **useMemo/useCallback 남발**

- 성능 측정 없이 습관적으로 쓰면 복잡도만 올라갑니다.
- “병목이 되는 부분”에만 제한적으로.

3. **ref로 state를 대체하려고 함**

- UI에 영향을 주는 값은 state로 관리해야 React 흐름이 자연스럽습니다.
- ref는 “UI와 무관한 저장”에 적합합니다.

---

# References

- [리액트에서 useMemo와 useCallback의 올바른 사용법](https://f-lab.kr/insight/react-usememo-usecallback-20250226?gad_source=1&gad_campaignid=22368870602&gbraid=0AAAAACGgUFens6BreHlYkThrvXJC4_FC0&gclid=Cj0KCQiAsY3LBhCwARIsAF6O6Xj3VJWMkB3VSxPqEoKIoal7cZwe2WvnQdqTMUent_YiADdZ9GumKuAaAgX3EALw_wcB)
