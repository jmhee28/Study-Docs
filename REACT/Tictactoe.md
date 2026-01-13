# [React 튜토리얼: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) 핵심 정리

## 전체 로드맵

1. **보드 만들기**: 9개 Square를 grid로 렌더링
2. **Props로 데이터 전달**: Board → Square로 값 전달
3. **State로 클릭 반응**: 클릭 시 X 표시
4. **Lifting State Up**: Square 상태를 Board로 올려 게임 규칙 구현
5. **승자 판별**: calculateWinner로 게임 종료 처리
6. **Time Travel**: history로 이전 상태 저장 → jumpTo로 과거 이동
7. **중복 상태 제거**: 파생 가능한 값은 state에 저장하지 않기

---

## 1) Setup / Starter 구조 이해

- `App.js`: 화면을 구성하는 핵심 컴포넌트
- `styles.css`: `.square`, `.board-row` 같은 UI 스타일 정의
- `index.js`: React 앱을 DOM에 mount 하는 진입점(거의 수정 안 함)

---

## 2) 보드 만들기 (JSX 규칙 체감)

### 문제: JSX는 “인접한 태그”를 그대로 반환할 수 없음

```jsx
return <button /> <button /> // ❌
```

해결: Fragment 또는 부모 태그로 감싸기

```jsx
return (
  <>
    <button />
    <button />
  </>
);
```

### grid로 만들기

`<div className="board-row">`로 3개씩 묶어서 3줄 생성

---

## 3) 컴포넌트화 + Props 전달

### 목표: 복붙 대신 재사용

- `Square` 컴포넌트를 만들고 `Board`가 9번 렌더링

```jsx
function Square({ value }) {
  return <button className="square">{value}</button>;
}
```

Board가 값을 내려줌:

```jsx
<Square value={squares[0]} />
```

핵심:

- **Props = 부모가 자식에게 내려주는 읽기 전용 데이터**
- JSX에서 변수 출력은 `{value}`

---

## 4) “클릭하면 X” 만들기 (State 도입)

### 처음 방식(비추천 흐름): Square 내부에 state 저장

```jsx
const [value, setValue] = useState(null);
```

→ 클릭하면 `setValue('X')`

문제: 각 Square가 자기 상태를 가지면 **Board는 전체 상태(9칸)를 모를 수 있음**
→ 승자 판별/턴 관리/히스토리 구현이 어려워짐

---

## 5) Lifting State Up (가장 중요한 전환점)

### 결론: 게임 상태는 Board(또는 상위)에서 “중앙집중”으로 관리

- `squares` 배열을 Board로 올림: `Array(9).fill(null)`
- Square는 “표시 + 클릭 이벤트 전달”만 담당 (stateless)

```jsx
function Square({ value, onSquareClick }) {
  return <button onClick={onSquareClick}>{value}</button>;
}
```

Board는 클릭을 처리:

- `nextSquares = squares.slice()`로 복사 (불변성)
- `nextSquares[i] = 'X' 또는 'O'`
- `setSquares(nextSquares)`

### 왜 `onSquareClick={() => handleClick(i)}` 인가?

`handleClick(0)` 처럼 “호출”하면 렌더 중 상태 변경 → 무한 렌더링 발생
따라서 “함수를 전달”해야 함.

---

## 6) 불변성(immutability)이 중요한 이유

### 왜 `slice()`로 복사해서 업데이트?

- 과거 상태를 유지할 수 있음 → **undo/redo(시간여행)** 구현 가능
- 비교가 쉬워서 성능 최적화에도 도움(변경 여부 판단)

---

## 7) 턴 처리 (X ↔ O)

`xIsNext` boolean state 추가 후 매 클릭마다 토글:

```jsx
if (xIsNext) nextSquares[i] = "X";
else nextSquares[i] = "O";
setXIsNext(!xIsNext);
```

추가 룰:

- 이미 채워진 칸 클릭 시 무시
- 승자 발생 후 클릭 무시

```jsx
if (squares[i] || calculateWinner(squares)) return;
```

---

## 8) 승자 판별 + 상태 표시

`calculateWinner(squares)`:

- 8가지 승리 라인 검사
- 승리 시 `'X' | 'O'`, 아니면 `null`

UI에 상태 표시:

- `Winner: X`
- 아니면 `Next player: O`

---

# 9) Time Travel (React의 “강점” 맛보기)

## 핵심 아이디어: history로 “상태 스냅샷” 저장

`history`는 “각 턴의 squares 배열”을 쌓아둔 것:

```jsx
const [history, setHistory] = useState([Array(9).fill(null)]);
```

현재 보드:

```jsx
const currentSquares = history[currentMove];
```

## state를 한 번 더 끌어올리기: Board → Game

- Game이 `history`, `currentMove`를 관리
- Board는 “현재 squares”를 props로 받아서 렌더링만 함
- Board가 새로운 `nextSquares`를 만들면 `onPlay(nextSquares)`로 Game에 보고

Game의 handlePlay:

- 현재 시점까지 히스토리만 남기고(시간여행 후 분기)
- 새 상태 추가
- currentMove 갱신

```jsx
const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
setHistory(nextHistory);
setCurrentMove(nextHistory.length - 1);
```

## 과거로 이동: jumpTo

```jsx
setCurrentMove(move);
```

---

## 10) 리스트 렌더링 + key

history로 moves 목록 만들기:

```jsx
const moves = history.map((squares, move) => (
  <li key={move}>
    <button onClick={() => jumpTo(move)}>Go to move #{move}</button>
  </li>
));
```

`key`는 React가 리스트 항목의 정체성을 추적하기 위해 필요
이 케이스는 move가 절대 재정렬/삽입/삭제되지 않으므로 index 사용이 안전

---

## 11) 최종 클린업: 중복 상태 제거

`xIsNext`는 사실 `currentMove`로 계산 가능
따라서 state로 두지 말고 파생값으로 계산:

```jsx
const xIsNext = currentMove % 2 === 0;
```

이게 “redundant state 제거”의 전형적인 예시

---

## 요약

1. **컴포넌트 분리**: 표시/로직 역할 분리
2. **Props**: 부모 → 자식 단방향 전달
3. **State**: UI가 기억해야 하는 값
4. **상태 끌어올리기(Lifting state up)**: 공유/동기화가 필요하면 부모로
5. **불변성**: 복사 후 변경 → 히스토리/undo/최적화에 유리
6. **리스트 + key**: map 렌더링 시 key 필수

## 개선 과제

- 현재 move 텍스트 표시 (조건 렌더링) : show “You are at move #…” instead of a button.
- Board 2중 루프 (컴포넌트 렌더링 패턴)
- 정렬 토글 (state + 불변성)
- 승리 하이라이트/무승부 (데이터 모델 변경 + UI 반영) : 이겼을 때 3칸 강조, 무승부 시 메시지 표시
- 좌표 기록 (state 구조 설계/props 설계)
