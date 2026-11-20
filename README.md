# Anatomy Studio — 아이소메트릭 기계 일러스트 웹앱

> **개념을 직접 만져보는 3D 아이소메트릭 기계 일러스트로 구현하는 웹 도구**  
> 원작: [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (오픈소스 기술 일러스트레이션 엔진)

서버 설치나 복잡한 빌드 과정 없이, 링크 클릭이나 파일 더블클릭만으로 브라우저에서 100% 동작하는 **서버리스(Serverless) 정적 웹 애플리케이션**입니다.

---

## ⚡ 10초 요약: 3단계 사용법

1. **1단계: 개념 선택 & 입력**
   - 상단 **[개념 스튜디오]** 탭에서 토큰 버킷, LRU 캐시, WAL 엔진, GPU 파이프라인, 카프카 큐, ZK 락, Raft 합의 등 **9대 핵심 프리셋**을 원클릭 선택하거나 자연어로 내 아이디어를 입력합니다.
2. **2단계: 인터랙티브 조작 & 4x 검증**
   - 마우스 드래그로 장치를 구동하고 실시간 수치(Live Readout)를 확인합니다.
   - **Solid(기본 4톤)**, **Blueprint X-Ray(청사진 투시)**, **Exploded View(부품 분해 뷰)** 모드 전환과 **4x 크리티컬 줌**으로 세부 부품을 검증합니다.
3. **3단계: 원클릭 자산 내보내기**
   - 상단 **[내보내기]** 탭에서 **단독 실행 HTML**, **Figma용 순수 벡터 SVG**, **React/Next.js TSX 컴포넌트**, **A4 특허 청사진 문서**로 0초 만에 추출합니다.

---

## 🚀 로컬 실행 방법

별도의 서버 설치나 패키지 설치(`npm install`) 없이 더블클릭으로 즉시 실행됩니다:

### 방법 1: 윈도우 원클릭 실행
프로젝트 루트의 **`실행.bat`** 파일을 더블클릭하면 기본 웹 브라우저가 열리며 즉시 실행됩니다.

### 방법 2: 브라우저로 직접 열기
`site/index.html` 파일을 브라우저로 드래그앤드롭하거나 더블클릭하여 바로 엽니다.

### 방법 3: 로컬 웹 서버 (선택)
```bash
# Python
python -m http.server 3400 --directory site

# Node.js
npx serve site
```
브라우저에서 `http://localhost:3400` 접속

---

## 🌐 GitHub Pages 배포 방법 (서버 없음)

본 프로젝트는 모든 정적 파일이 `site/` 폴더에 완벽하게 패키징되어 있어 GitHub Pages로 단 1분 만에 무료 배포할 수 있습니다:

1. 본 저장소를 GitHub에 푸시합니다.
2. GitHub 저장소의 **Settings** → **Pages** 메뉴로 이동합니다.
3. **Build and deployment** 항목의 **Source**를 `Deploy from a branch`로 설정합니다.
4. **Branch**를 `main` 브랜치, 폴더를 **`/site`** (또는 루트로 변경 시 `/`)로 선택하고 **Save**를 누릅니다.
5. 약 1분 후 생성되는 `https://<username>.github.io/<repo>/` 링크를 공유하면 누구나 즉시 사용할 수 있습니다.

---

## 🔑 Google Gemini API 연동 (Bring Your Own Key)

* **완전한 프라이버시**: 사용자가 입력한 API 키는 오직 브라우저의 `localStorage`에만 보관되며, 어떠한 외부 서버로도 전송되지 않고 Google Gemini API 엔드포인트와 직접 1:1 통신합니다.
* **무료 무제한 기본 제공**: **API 키가 없어도 9종의 모든 마스터피스 프리셋과 내장 룰베이스 기계 합성 엔진은 100% 무료로 무제한 사용**할 수 있습니다.
* 키를 등록하시면 임의의 자연어 프롬프트를 Gemini 2.0 Flash가 더욱 심도 있는 기계 메타포로 분석하여 생성합니다.

---

## 📁 디렉터리 구조

```
1031 anatomy/
├── site/                     # [GitHub Pages 배포 대상 정적 폴더]
│   ├── index.html            # 웹앱 메인 화면 (3단계 가이드, 모달, UI)
│   ├── style.css             # 테크니컬 디자인 시스템 & 그리드 스타일
│   ├── app.js                # 100% 클라이언트 사이드 엔진 번들
│   └── examples/             # 8대 공식 쇼케이스 독립 실행 HTML 파일들
├── kit/                      # Anatomy 오픈소스 기하학 원본 모듈
├── examples/                 # 공식 쇼케이스 원본 자산
├── 실행.bat                  # 윈도우 더블클릭 로컬 실행 스크립트
├── package.json              # 프로젝트 설정
└── README.md                 # 본 문서
```
