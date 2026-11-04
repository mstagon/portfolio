# 전체 프로젝트 아카이브

공개 경로: https://devcms.me/projects/

회사 6개, 개인·사이드 7개, 팀 10개를 탐색하는 정적 페이지와 상세 페이지 23개입니다. 기존 메인, 당근·토스·백엔드 전용 페이지는 같은 GitHub Pages 사이트 안에 유지합니다.

## 수정

1. `projects/data/projects.json`에서 프로젝트 내용을 수정합니다.
2. `python3 tools/build-projects.py`를 실행합니다.
3. 데이터와 생성된 HTML을 함께 커밋합니다. 생성된 HTML을 직접 편집하지 않습니다.

이미지는 기존 사이트의 추적된 `img/` 자산과 온체인 프로젝트의 실제 로컬 실행 캡처를 사용합니다. 앱 소개 이미지, 앱 화면, 개발 도구 화면의 성격을 캡션에서 구분합니다. 화면이 없는 프로젝트에는 실제 구현 흐름을 표시하며 가상의 제품 화면을 만들지 않습니다.

## 내용의 출처와 범위

- 이전 사이버 포트폴리오: https://github.com/mstagon/cms/tree/develop/app/lib/api/projectDetails
- 최신 공개 포트폴리오: 이 저장소 `1f9052a`의 메인 페이지와 추적 이미지.
- 사용자가 확인한 역할 및 기존 이력서 검토의 코드 근거를 반영했습니다. Forge Studio는 회사 프로젝트입니다.
- DOSS는 확인된 로그인·설정·관심 종목·API 기여만 기재합니다.
- 미네르바는 게임·서버의 팀 작업과 본인의 웹·SDK 구조 전환 역할을 구분합니다.
- 실험과 내부 테스트 배포, 일시 중단된 프로젝트를 정식 출시 실적으로 바꾸지 않습니다.
- 커밋 수·코드 줄 수를 성과 지표로 사용하지 않습니다.

## 검증

```sh
python3 tools/build-projects.py --check
python3 -m unittest discover -s tests -p '*_test.py'
python3 -m http.server 4318 --bind 127.0.0.1
```

별도 터미널에서 Playwright를 설치한 환경으로:

```sh
# 기본은 node 모듈 검색 경로의 playwright, 필요하면 모듈 경로를 지정
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/projects_browser.mjs
```

`CHROME_PATH`, `PORTFOLIO_URL`, `QA_OUTPUT`으로 브라우저 실행 파일·사이트 주소·결과 경로를 바꿀 수 있습니다. 검색·분류 교집합, 한글 IME, URL 복원, 빈 결과, 뒤로가기, 이미지 확대와 포커스 복원, JavaScript 없는 탐색, 전체 상세 페이지·이미지 경로, 반응형 넘침을 검사합니다.

런타임 프레임워크, 외부 API, CDN 스크립트 없이 동작합니다. CSS·JS·폰트와 데이터는 같은 사이트에 있습니다.
