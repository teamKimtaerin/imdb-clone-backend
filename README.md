# **백엔드 프로젝트 (IMDB 클론)**

이 문서는 프로젝트 개발 환경 설정, 실행 방법, 그리고 API 테스트 방법을 안내합니다.

### **📦 초기 설치**

프로젝트를 시작하기 전에 Node.js와 npm을 설치해야 합니다. 효율적인 버전 관리를 위해 **NVM(Node Version Manager)** 사용을 권장합니다. NVM을 사용하면 프로젝트마다 Node 버전을 바꿔가며 실행 가능합니다😃

1. NVM 다운로드 및 설치
    
    아래 명령어를 터미널에 입력하여 NVM을 설치합니다.
    
    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    ```
    
    설치 후 터미널을 **재시작**해야 NVM이 정상적으로 로드됩니다.
    
2. Node.js 다운로드 및 설치
    
    프로젝트에 필요한 Node.js 버전을 설치합니다.
    
    ```
    nvm install 22
    ```
    
3. 버전 확인
    
    설치가 완료되었는지 다음 명령어로 확인합니다.
    
    ```
    node -v
    npm -v
    ```
    
    - `node -v`는 `v22.18.0`와 같은 버전이, `npm -v`는 `10.9.3`와 같은 버전이 출력되어야 합니다.

### **⚙️ 패키지 설치**

프로젝트에 필요한 모든 의존성 패키지를 설치합니다.

```
npm install
```

이 명령어는 `package.json` 파일을 기반으로 `express`, `nodemon`, `cors` 등을 포함한 모든 패키지를 자동으로 설치합니다.

### **📂 디렉토리 구조**

프로젝트의 주요 디렉토리 구조는 다음과 같습니다.

```
backend/
├── package.json
├── src/
│   ├── app.js           # Express 애플리케이션 초기화
│   ├── server.js        # 서버 실행
│   ├── routes/          # API 엔드포인트 정의
│   │   └── user.routes.js
│   ├── controllers/     # 요청 처리 로직
│   │   └── user.controller.js
│   ├── services/        # 비즈니스 로직
│   ├── models/          # DB 모델
│   ├── middlewares/     # 미들웨어
│   └── config/          # DB 연결 및 환경 변수
└── tests/               # 테스트 코드
```

### **🚀 실행 방법**

`package.json` 파일에 정의된 스크립트를 사용하여 서버를 실행합니다.

- **개발 모드(자동 재시작)**
    
    ```
    npm run dev
    ```
    
    **nodemon**을 사용하면, 소스 코드가 변경될 때마다 서버가 자동으로 재시작(reload)됩니다😃 Node.js로 서버를 실행합니다.
    

### **🧪 API curl 테스트**

서버 구동이 성공했는지, 터미널에서 아래 `curl` 명령어를 사용하여 간단한 API를 테스트할 수 있습니다!

- **모든 사용자 정보 가져오기 (GET)**
    
    ```
    curl -X GET http://localhost:4000/api/users
    ```
    
    성공 결과:
    
    ```bash
    [{"id":1,"name":"Alice"}]
    ```
    
- **새로운 사용자 생성 (POST)**
    
    ```
    curl -X POST -H "Content-Type: application/json" -d '{"name":"hi"}' http://localhost:4000/api/users
    ```
    
    성공 결과:
    
    ```bash
    {"id":id값,"name":"hi"}
    ```
