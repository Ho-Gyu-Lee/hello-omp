---
type: Concept
title: 연결 경로·릴레이·음성 토폴로지
description: signaling과 데이터 경로, 직접 연결·릴레이의 도달성/주소 노출, 업무 처리와 별개인 음성 mesh·중계·믹싱의 선택 기준입니다.
tags: [development, networking, p2p, relay, nat, voice, topology]
timestamp: 2026-10-15T00:00:00Z
---

# 연결 경로·릴레이·음성 토폴로지

앱·웹 실시간 통신·미디어·게임에서 해당 기능을 선택할 때의 기준입니다. P2P·중계·음성 도입을 의무화하지 않습니다. 본문의 매치/게임 로직은 통신 세션/업무 처리의 사례이며 Valve SDR은 해당 제품의 조건으로 한정합니다. 게임에 적용할 때는 별도의 [서버 권위·인가](/security/game.md)를 유지합니다.

## signaling·데이터 경로·주소 노출

- 로비/상대 검색 성공과 실제 매치 데이터 경로 성립은 다릅니다. signaling, peer 인증, NAT/방화벽을 통과하는 후보 검증, 직접/릴레이 전송을 구분합니다. LAN에서 된다는 사실을 인터넷 도달성으로 확대하지 않습니다([ICE RFC 8445](https://www.rfc-editor.org/rfc/rfc8445.html), [TURN RFC 8656](https://www.rfc-editor.org/rfc/rfc8656.html)).
- 직접 경로가 항상 빠르거나 릴레이가 항상 느리다고 가정하지 않습니다. 목표 지역·회선·배치에서 지연·loss와 relay 수용량/egress를 측정하고 signaling/relay 장애가 신규·기존 매치에 미치는 영향을 나눕니다. Valve SDR도 P2P와 dedicated server를 모두 지원하며 배치에 따라 릴레이 경로가 더 빠르거나 느릴 수 있다고 설명합니다([SDR](https://partner.steamgames.com/doc/features/multiplayer/steamdatagramrelay)).
- IP 비노출이 요구라면 인증/암호화와 주소 은닉을 구분합니다. direct fallback이 상대 주소를 노출하는지 확인하고 비노출 모드에서 무조건 fallback하지 않습니다. 전송 relay는 이동·경제·승패의 권위 판정이나 클라이언트 코드 격리가 아닙니다.

## 음성은 별도 비용 모델

- 게임 데이터가 client/server여도 음성은 다른 세션·경로를 선택할 수 있습니다. 게임 로직 프로세스가 존재한다는 이유만으로 음성을 통과시키지 않습니다. 참가자 수뿐 아니라 동시 발화자·수신 대상 수, client uplink/decoder, server egress/미디어 처리 예산을 비교합니다.
- mesh는 송신자가 대상마다 복제하고, 중계/선택 전달은 서버의 팬아웃과 수신 측의 여러 스트림 처리를 요구합니다. mixer는 decode→수신자별 mix→encode로 단일 스트림 소비를 쉽게 하는 대신 서버 CPU·재인코딩 품질·추가 지연을 소비합니다. 자기 음성을 되돌리지 않는 믹스도 고려합니다([RTP Topologies RFC 7667 §§3.4–3.7](https://www.rfc-editor.org/rfc/rfc7667.html)). 중계와 믹싱을 같은 비용으로 추정하지 않습니다.

## 근거와 적용 범위

『온라인 네트워크 게임 프로그래밍』 제공본 PDF p.553–556, 588–589의 검색/직접 전송·NAT·endpoint 위험과 *Game Programming Gems 3* 한국어판 5.8 PDF p.676–677의 음성 토폴로지를 선별했습니다. DirectPlayVoice·고정 IP 교환·당시 성능 수치는 제외하고 현행 RFC/Valve 문서와 대조했습니다(2026-10-15). 비용·fallback/장애 시나리오는 근거에서 도출한 선택 기준이지 이 작업에서 서비스 성능·연결 성공을 실측한 결과가 아닙니다.
