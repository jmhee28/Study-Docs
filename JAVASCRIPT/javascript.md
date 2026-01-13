# javascript

# var, let, const

## var

```jsx
var a = 5; 
console.log(a); // 5

var a = 10;
console.log(a); // 10

a = 15;
console.log(a); // 15
```

중복 선언과 재할당이 모두 가능

함수단위 스코프

호이스팅(변수 및 함수 선언이 코드 실행 전에 메모리에 미리 저장되는 것) 발생

## let

```jsx
let a = 5;
let a = 10;
cnosole.log(a); // SyntaxError: Identifier 'a' has already been declared
```

중복 선언을 허용하지 않는다.

재할당가능

블록단위 스코프

`let`과 `const`도 선언은 호이스팅되지만, **초기화되지 않음**.

TDZ(Temporal Dead Zone, 일시적 사각지대)**에 있기 때문에 선언 전에 접근하면 에러가 발생.

## const

```jsx
const a = 5;
const a = 10;
cnosole.log(a); // SyntaxError: Identifier 'a' has already been declared
```

중복선언, 재할당 모두 불가

블록단위 스코프

| 선언 방식 | 호이스팅 여부 | 초기화 여부 | TDZ(Temporal Dead Zone) 영향 |
| --- | --- | --- | --- |
| **var** | O | O (`undefined` 할당) | X |
| **let** | O | X | O |
| **let** | O | X | O |

### **📌 var의 단점과 문제점**

### **1. 변수 스코프 문제 (함수 스코프 vs 블록 스코프)**

`var`는 **함수 스코프(function scope)**를 가지며, **블록({})을 무시**하는 특성이 있어.

```jsx
if (true) {
  var x = 10;
}
console.log(x); // 10 (블록 바깥에서도 접근 가능)
```

📌 **문제점:**

- `var`로 선언한 변수는 **블록(`{}`)을 무시**하고, **함수 내부가 아니라면 전역 변수처럼 동작**함.
- 예상치 못한 변수 변경이 발생할 위험이 있음.

### **2. 호이스팅 문제 (`undefined` 발생)**

`var`는 **호이스팅(hoisting)**되며, 선언과 동시에 `undefined`로 초기화됨.

```jsx
console.log(a); // undefined
var a = 5;
console.log(a); // 5
```

📌 **문제점:**

- `var`로 선언한 변수는 **코드 실행 전에 선언이 끌어올려지지만(`hoisting`), 값 할당은 그대로 둠**.
- 따라서, **변수에 접근할 때 `undefined`가 나오는 예기치 않은 동작**이 발생할 수 있음.

🔹 **해결 방법:**

- `let`과 `const`는 선언만 호이스팅되고, 초기화는 안 되므로 **TDZ(Temporal Dead Zone, 일시적 사각지대)**를 통해 오류를 방지할 수 있음.

```jsx
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 10;
```

---

### **3. 중복 선언 허용 (버그 발생 가능성 높음)**

`var`로 동일한 변수를 여러 번 선언해도 오류가 발생하지 않음.

```jsx
var name = "Alice";
var name = "Bob";
console.log(name); // "Bob"
```

📌 **문제점:**

- 동일한 변수를 여러 번 선언해도 오류가 발생하지 않기 때문에 **예상치 못한 값 변경이 발생할 가능성이 높음**.
- 특히 **큰 코드베이스에서 실수로 같은 변수를 선언하면 디버깅이 어려움**.

🔹 **해결 방법:**

- `let`과 `const`는 중복 선언을 허용하지 않음.

```jsx
let name = "Alice";
let name = "Bob"; // SyntaxError: Identifier 'name' has already been declared

```

---

### **4. 전역 오염 문제 (`window` 객체에 등록됨)**

`var`로 선언한 변수는 **전역 스코프에서 선언될 경우, `window` 객체의 속성이 됨**.

```jsx
var age = 30;
console.log(window.age); // 30
```

📌 **문제점:**

- 전역에서 선언된 `var` 변수는 **`window` 객체의 속성이 되므로, 다른 코드에서 의도치 않게 변경될 가능성이 있음**.
- **전역 변수가 많아지면 관리가 어려워지고, 유지보수성이 떨어짐**.

🔹 **해결 방법:**

- `let`과 `const`는 전역에서 선언해도 `window` 객체에 등록되지 않음.

```jsx
let height = 180;
console.log(window.height); // undefined
```

---

### **📌 결론: var 대신 let과 const를 사용하자!**

| 단점 | 문제점 | 해결책 |
| --- | --- | --- |
| 함수 스코프 | `{}` 내부에서 선언해도 블록 무시 | `let`, `const` 사용 (블록 스코프 적용) |
| 호이스팅 문제 | `undefined` 발생 | `let`, `const` 사용 (TDZ 적용) |
| 중복 선언 허용 | 변수 값이 예상치 못하게 변경될 가능성 | `let`, `const` 사용 (중복 선언 금지) |
| 전역 오염 문제 | `window` 객체에 등록됨 | `let`, `const` 사용 (전역 오염 방지) |

---

### **setTimeout 함수에 대해 아는가?**

`setTimeout`은 특정 시간이 지난 후 콜백 함수를 실행하도록 예약하는 함수다.

- `setTimeout`은 **비동기 함수**이므로 바로 실행되지 않고 **이벤트 루프를 통해 일정 시간 후 실행됨**.
- 실제로 **정확한 시간 후 실행되는 것이 아니라, 최소한 그 시간이 지나야 실행될 수 있음** (이벤트 루프 상태에 따라 달라짐).

```jsx
console.log('A');
setTimeout(() => console.log('B'), 1000);
console.log('C');

A  
C  
B  (1초 후 실행)
```

### **setTimeout에 시간을 0으로 하는데 왜 그런지 아는가?**

```jsx
setTimeout(() => console.log('Hello'), 0);
console.log('World');

World
Hello
```

- `setTimeout(() => console.log('Hello'), 0);`는 **즉시 실행되는 것이 아니라, 최소한 0ms 후 실행 대기 상태가 됨**.
- 즉, 콜백은 **Call Stack이 비워진 후 이벤트 루프를 통해 실행되므로, 동기 코드가 먼저 실행됨**.
- 주로 **현재 실행 중인 코드가 끝난 후 실행되도록 예약할 때** 사용됨.

## Eventloop

![image.png](javascript/image.png)

- **Heap**: 메모리 할당이 발생하는 곳
- **Call Stack** : 실행된 코드의 환경을 저장하는 자료구조, 함수 호출 시 Call Stack에 push 됩니다. (Call Stack에 대한 자세한 설명은 [**여기**](https://medium.com/sjk5766/call-stack%EA%B3%BC-execution-context-%EB%A5%BC-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90-3c877072db79))
- **Web APIs**: DOM, AJAX, setTimeout 등 브라우저가 제공하는 API
- **Callback Queue,** **Event Loop, Event Table**(그림엔 없음) 은 아래에서 설명하겠습니다.
- **Callback Queue**: ****이벤트 발생 시 실행해야 할 callback 함수가 **`Callback Queue`**에 추가됩니다.
- **Event Loop**: ****Event Loop의 역할은 간단합니다.1. **`Call Stack`**과 **`Callback Queue`**를 감시합니다.2. Call Stack이 **`비어있을 경우`**, Callback queue에서 함수를 꺼내 Call Stack에 추가 합니다.

예제를 보면서 확인하도록 하겠습니다.

위 코드가 실행될 때 각 구성요소들이 어떻게 동작하는지 순서대로 보겠습니다.

1.console.log(‘first’)가 **`Call Stack`**에 추가(push) 됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*4EaPBPfpIL6utcDx3p8ADQ.png)

2. console.log(‘first’)가 실행되어 화면에 출력한 뒤, **`Call Stack`**에서 제거(pop) 됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*PwakYdn4mtjuICaSc-ZdRA.png)

3.setTimeout(function cb() {..}) 이 **`Call Stack`**에 추가됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*xg5kgdQ7MCZg3KQHofkOfw.png)

4. setTimeout 함수가 실행되면서 Browser가 제공하는 timer Web API 를 호출합니다. 그 후 Call Stack에서 제거됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*ArTCRvwxJb6unp8mrrdKuw.png)

5. console.log(‘third’)가 **`Call Stack`**에 추가됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*T5YHeQPhKYILSJzhxCI0kA.png)

6. console.log(‘third’)가 실행되어 화면에 출력되고 Call Stack에서 제거됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*dtermel81JQyAyx5maKloA.png)

7. setTimeout 함수에 전달한 0ms 시간이 지난뒤 Callback으로 전달한 cb 함수가 **`Callback Queue`**에 추가됩니다. (이 부분은 다른예시와 함께 뒤에서 설명하겠습니다.)

![](https://miro.medium.com/v2/resize:fit:700/1*-cWDDiLfk3sS6tp-SdAbbQ.png)

8. **`Event Loop`**는 **`Call Stack`**이 **비어있는 것을 확인**하고 **`Callback Queue`**를 살펴봅니다. cb를 발견한 **`Event Loop`**는 **`Call Stack`**에 cb를 추가합니다.

![](https://miro.medium.com/v2/resize:fit:700/1*EuSA9pVVfJFoyud9-fll7Q.png)

9. cb 함수가 실행 되고 내부의 console.log(‘second’)가 **`Call Stack`**에 추가됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*JnU8RLPuDBPBvi3qUem2sA.png)

10. console.log(‘second’)가 화면에 출력되고 Call Stack에서 제거됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*AdQGGlDmTTaH6Q1U7t4tSw.png)

11. cb가 **`Call Stack`**에서 제거됩니다.

![](https://miro.medium.com/v2/resize:fit:700/1*EUykFXdjzZE-X5hMBd15Qg.png)

**`Event Loop` -** Call Stack이 비어있을 경우, Callback queue에서 함수를 꺼내 Call Stack에 추가 합니다