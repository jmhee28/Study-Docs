# ConfigMap and Secret

- ConfigMap: 일반 설정 값 저장 (예: 환경변수, 설정파일)
- Secret: 민감한 정보 저장 (예: 비밀번호, API 키)

- Pod에서 ConfigMap과 Secret을 환경변수 또는 Volume 형태로 주입 가능

```yaml
apiVersion: v1
kind: Pod 
metadata:
    name: config-demo
spec:
    containers:
        - name: app
          image: nginx
          envFrom:
            - configMapRef:
              name: app-config
            - secretRef:
              name: app-secret
```

```yaml
apiVersion: v1
kind: Pod
metadata:
    name: config-volume-demo
spec:
    volumes:
    - name: config-vol
      configMap:
        name: app-config
    containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
```