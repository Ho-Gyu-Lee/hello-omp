# 축적 지식 (로컬 전용)

이 PC에만 두는 지식의 진입점이다. concept 파일은 설정 폴더의 `<configdir>/okf/learned/`에만 두며 레포에 커밋하지 않는다. setup은 이 디렉터리의 concept을 옮기거나 덮어쓰거나 지우지 않는다. 이 `index.md`만 레포 파일로 교체하므로 배포본의 이 파일은 직접 고치지 않는다. 다른 PC로 동기화되지 않는다.

여기에 두는 것은 공개하기 어려운 개인 선호와, 공개 범위를 검토 중인 지식뿐이다. 사용자 개발 방향은 공개 [direction.md](/direction.md), 프로젝트 한정 결정·용어는 그 프로젝트 레포가 정본이다. 기록 기준(세 질문)과 위치는 [OKF 학습 축적](/learning/accumulation.md)을 따른다.

발견은 정적 목록이 아니라 이 디렉터리를 직접 읽어 각 concept의 frontmatter 요약으로 한다. concept은 YAML frontmatter와 non-empty `type`을 갖추고, 비밀정보·PII·내부 접속정보는 기록하지 않는다. 만들거나 고치거나 지운 뒤에는 `bun <레포>/scripts/deploy-okf.ts --record <configdir>`를 실행한다.
