# Anatomy Studio (웹 애플리케이션)

개념을 인터랙티브한 아이소메트릭 일러스트로 구현하는 오픈소스 프로젝트 **Anatomy**([wheresryan22/anatomy](https://github.com/wheresryan22/anatomy))를 브라우저에서 바로 사용하고 제작할 수 있는 **Anatomy Studio 웹앱**입니다.

---

## 🌟 주요 기능

1. **공식 마스터피스 쇼케이스 갤러리 (Official Showcase)**
   - **SpaceX Raptor 2 Test Stand**: 300 bar 연소 WebGL 셰이더 화염 및 마우스 호버 시 11개 어셈블리 완전 분해(Explode View)
   - **Precision 3D Turning Dial**: 60 FPS 3D 실시간 재투영 및 로봇 손가락 인터랙션
   - **Vintage CRT Desk Computer**: 실시간 키보드 입력이 CRT 모니터에 반영되는 레트로 컴퓨터
   - **Coin-Op Arcade Cabinet**: 30도 경사로를 굴러가는 동전 및 기판 신호 펄스 컷어웨이
   - **Physics Wave Ripple Tank**: 듀얼 WebGL 셰이더 기반 수면 파동 간섭 및 가성 집속광(Caustics)
   - **Dial Indicator Gauge**: 0.1px 단위 계측 다이얼 및 스프링 물리 시뮬레이션
   - **Push-Button Switch**: 산업용 코일 스프링 스위치 메커니즘

2. **AI 개념 시각화 생성 스튜디오 (Concept Studio)**
   - "The object is the explanation (개념을 실물 기계로 치환)" 원칙에 따라 복잡한 CS/SW 개념을 40+ 정밀 부품으로 구성된 인터랙티브 기계로 즉시 생성
   - **내장 개념 프리셋**:
     - *Token Bucket Rate Limiter* (토큰 버킷 속도 제한기)
     - *LRU Cache Memory Rack* (최근 최소 사용 캐시 갠트리)
     - *Database Write-Ahead Logging* (WAL 트랜잭션 듀얼 헤드 레코더)
     - *GPU Shader Execution Pipeline* (3단계 그래픽 파이프라인 프레스)
     - *Kafka Event Stream Partition Bus* (다중 파티션 분류 슈트)
     - *Zero-Knowledge Proof Mystery Lock* (영지식 암호학 편심 텀블러 락)
   - 사용자 정의 자연어 개념 입력 지원

3. **파라메트릭 인스펙터 & 특허 블루프린트 튜너 (Blueprint Tuner)**
   - 아이소메트릭 카메라 투영 각도(Azimuth, Elevation) 슬라이더 미세 조정
   - 장치 물리 파라미터(용량, 압력, 유량) 실시간 조작
   - A4 특허 도면 스타일의 청사진(Blueprint) 모드 원클릭 변환

4. **전문가용 내보내기 스위트 (Export Suite)**
   - **Standalone HTML**: 의존성 없이 더블클릭만으로 동작하는 단일 HTML 파일 다운로드
   - **Pure Vector SVG**: Figma / Illustrator / 발표 슬라이드에 바로 넣는 SVG 다운로드
   - **React (TSX)**: Next.js / React 프로젝트에 붙여넣는 컴포넌트 코드 복사
   - **A4 Blueprint**: 인쇄 및 PDF 저장용 A4 기술 문서 포스터 양식

---

## 🚀 로컬 실행 방법

Node.js(v20 이상) 환경에서 별도의 외부 npm 패키지 설치 없이 즉시 실행됩니다:

```bash
# 1. 서버 시작
npm start
# 또는
node webapp/server.mjs
```

실행 후 웹 브라우저에서 아래 주소로 접속합니다:
👉 **http://localhost:3400**

---

## 🧪 자체 검증 테스트

```bash
npm test
# 또는
node tests/api.test.mjs
```
모든 기하학 엔진과 내보내기 포맷에 대한 무결성 테스트를 수행합니다.
