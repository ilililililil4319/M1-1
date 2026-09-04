# 원/달러 환율 시계열 트렌드 분석 (M1-1)

원/달러 환율 데이터를 시계열 분석하여 인사이트 리포트를 작성하고, 기간별로 탐색 가능한 웹 대시보드로 구현한 프로젝트입니다.

- 분석 리포트: [`REPORT.md`](./REPORT.md)
- 기획서: [`docs/1. 기획서_원달러 환율 시계열 트렌드 분석.pdf`](./docs)
- 배포된 대시보드: **https://m1-1-gray.vercel.app**

## 폴더 구조

```
M1-1/
├── data/                 # 원본/정제 데이터 (CSV)
├── docs/                 # 기획서, 결과보고서 (PDF+md)
├── notebook/             # 분석 코드 (Jupyter Notebook)
│   └── analysis.ipynb
├── output/               # 분석 시각화 결과 (PNG 3종)
├── screenshots/          # 작업 과정 증빙 스크린샷
├── web/                  # 대시보드 (HTML/CSS/JS + Vercel 서버리스 함수)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── data.json         # 분석 결과 export (대시보드용)
│   └── api/
│       └── explain.js    # AI 해설 생성 서버리스 함수
├── REPORT.md              # 분석 리포트 (최종 결과물)
├── requirements.txt
└── codyssey_api.py         # 코디세이 API 연동 모듈
```

## 사용 기술

| 구분 | 내용 |
|---|---|
| 분석 | Python 3.10+, pandas, numpy, matplotlib |
| 대시보드 프론트 | HTML / CSS / JavaScript (바닐라), Chart.js |
| AI 해설 API | 코디세이 API (`gpt-5-mini`, OpenAI 호환) |
| 배포 | Vercel (정적 페이지 + 서버리스 함수) |
| 데이터 출처 | 한국은행 경제통계시스템(ECOS) 원/달러 매매기준율 |

## 로컬에서 분석 코드 실행하기

```bash
# 1. 가상환경 생성 및 활성화 (Windows 기준)
python -m venv venv
venv\Scripts\activate

# 2. 패키지 설치
pip install -r requirements.txt

# 3. Jupyter Notebook 실행
#    VS Code에서 notebook/analysis.ipynb 열고 "모두 실행"
```

`analysis.ipynb`를 처음부터 끝까지 실행하면:
- 데이터 로드 → 결측치/이상치 처리 → 시계열 분석(이동평균/변화율/변동성) → 시각화 3종(`output/`) → 대시보드용 `web/data.json` 까지 순서대로 생성됩니다.

## 로컬에서 대시보드 미리보기

`web/index.html`을 더블클릭으로 직접 열면 `data.json`을 못 불러옵니다 (브라우저 보안 정책). 반드시 로컬 서버로 열어야 합니다.

- **VS Code Live Server 확장** 설치 → `web/index.html` 우클릭 → "Open with Live Server"

로컬 미리보기에서는 그래프·기간 필터까지는 확인 가능하지만, **"AI 해설 보기" 버튼은 동작하지 않습니다** (서버리스 함수는 Vercel 배포 환경에서만 실행됩니다).

## 배포 방법 (Vercel)

1. GitHub 저장소를 Vercel과 연동 (Import Project)
2. **Root Directory를 `web`으로 지정** (저장소 전체가 아니라 `web` 폴더만 배포 대상)
3. **Environment Variables**에 `CODYSSEY_API_KEY` 추가 (코디세이에서 발급받은 키)
4. Deploy

## 환경 변수 설정

| 변수명 | 설명 | 사용 위치 |
|---|---|---|
| `CODYSSEY_API_KEY` | 코디세이 API 인증 키 | 로컬: `.env` (커밋 안 됨) / Vercel: Environment Variables |

로컬 개발 시 프로젝트 루트에 `.env` 파일을 만들고 아래처럼 작성합니다 (`.env.example` 참고):
```
CODYSSEY_API_KEY=발급받은_키
```
이 파일은 `.gitignore`에 등록되어 있어 GitHub에는 올라가지 않습니다.

## 작업 중 겪은 오류와 해결

| 오류 | 원인 | 해결 |
|---|---|---|
| Jupyter 커널 재시작 후 `NameError` | 커널 메모리가 초기화되어 이전 실행 결과(변수)가 사라짐 | "모두 실행"으로 처음부터 재실행 |
| `data.json` 파싱 실패 (`NaN` 관련) | 이동평균 초반 구간의 결측값이 표준 JSON에 없는 `NaN`으로 저장됨 | `pd.notnull` 처리로 `NaN`을 `null`로 변환 후 저장 |
| 대시보드 최저가가 0으로 표시 | `Math.min()` 계산 시 `null` 값이 0으로 취급됨 | 통계 계산 전 `null` 값을 배열에서 필터링 |
| Vercel 배포 시 "Python 프로젝트"로 잘못 인식 | 저장소 루트에 `requirements.txt`, `codyssey_api.py`가 있어 Vercel이 오판 | Root Directory를 `web`으로 지정해 해결 |
| AI 해설 401 인증 오류 | Vercel 환경변수에 입력한 API 키 값 오류 | 환경변수 값 재확인 후 Redeploy |

## AI 코딩 도구 사용

이 프로젝트는 Claude(Anthropic)를 활용해 분석 코드 작성, 오류 디버깅, 대시보드 구현, 그리고 인사이트 관련 사실관계를 웹 검색으로 검증하는 데 도움을 받았습니다. 자세한 내용은 [`REPORT.md`의 AI 사용 로그](./REPORT.md#7-ai-사용-로그) 섹션을 참고하세요.

## 데이터 출처 및 라이선스 주의사항

- 데이터 출처: [한국은행 경제통계시스템(ECOS)](https://ecos.bok.or.kr) — 3.1.1.3. 원화의 대미달러, 원화의 대위안/대엔 환율 (원/달러 종가)
- 본 프로젝트는 학습 목적의 분석이며, 투자 조언이 아닙니다.
