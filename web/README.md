# 원/달러 환율 대시보드 (web/)

## 폴더 구성
```
web/
├── index.html      # 대시보드 화면
├── style.css        # 스타일 (환율 전광판 컨셉)
├── script.js         # 차트 렌더링, 기간 필터, AI 해설 호출 로직
├── data.json          # analysis.ipynb에서 export한 분석 데이터 (이미 있음)
└── api/
    └── explain.js       # Vercel 서버리스 함수 - 코디세이 API 호출 (AI 해설 생성)
```

## 로컬에서 미리보기

`index.html`을 더블클릭해서 바로 열면 `fetch("data.json")`이 브라우저 보안 정책 때문에 막혀서 **그래프가 안 뜰 수 있습니다.** 반드시 아래처럼 "로컬 서버"를 통해 열어야 합니다.

### 방법 A — VS Code Live Server 확장 (추천, 가장 쉬움)
1. VS Code 확장(Extensions)에서 **"Live Server"** 검색해서 설치
2. `web/index.html` 파일을 열어놓은 상태에서, 우클릭 → **"Open with Live Server"**
3. 브라우저가 자동으로 열리며 대시보드가 보입니다

이 방법으로는 차트와 기간 필터까지는 확인 가능합니다. 다만 **"AI 해설 보기" 버튼은 로컬에서는 동작하지 않습니다** (서버리스 함수는 Vercel에 배포해야 실행됩니다). 이건 정상이니 당황하지 않으셔도 됩니다 — 아래 "Vercel 배포 후"에서 확인하시면 됩니다.

### 방법 B — 터미널에서 간단 서버 실행
`web` 폴더 안에서:
```bash
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속

## Vercel 배포 방법

1. GitHub에 이미 올라간 M1-1 저장소를 Vercel과 연동합니다 (vercel.com 로그인 → New Project → GitHub 저장소 선택)
2. **Root Directory**를 반드시 `web`으로 설정하세요 (전체 저장소가 아니라 web 폴더만 배포 대상으로 지정)
3. **Environment Variables**에 아래를 추가하세요:
   - `CODYSSEY_API_KEY` = 발급받은 코디세이 API 키
4. Deploy 클릭

## 배포 후 확인할 것

- 배포된 URL 접속 → 그래프 3개(추이/이동평균, 변동성)와 기간 필터가 정상 동작하는지
- "AI 해설 보기" 버튼을 눌러서 실제로 코디세이 API가 호출되어 문장이 나오는지
- 기간을 이상하게 설정(시작일 > 종료일 등)해서 에러 메시지가 잘 뜨는지
