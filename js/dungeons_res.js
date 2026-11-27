/* 에코 제로 — 주민 던전 3개 (2026-11-28 주민던전, 설계 `_AI/작업/게임_톱니골던전/주민3명_20261128/던전설계.md` 대표 OK 그대로)
   · js/dungeons.js 바로 뒤에서 읽음. 표에 줄만 더함(dungeons.js 주석 「주민 8명 던전은 이 표에 줄만 더하면 됨」) → 지금 6던전 규칙·기록 영향 0, REC_V 8 그대로
   · 주민은 플레이 캐릭터가 아니라 던전 주인: 입구·끝에 주민 3D 가 나와 반김(js/resident.js) + 카드 주인(js/collect.js K.ARTISTS dun)
   · rule = 던전 고유 규칙(game.js·fogs.js 가 읽음, 기록 dun 으로 재생 때 같음). 장치 세기 숫자는 [추정] — measure 로 1층 28~36초·보스전 45~85초 띠에 맞춤
     dial  = POY 다이얼 발판(분출구 자리 3곳, 1.5초 서 있으면 「딸깍!」 둘레 반지름 4 안개 2초 느려짐 ×0.6, 발판마다 쿨 6초) — 시간·자리만, 난수 0
     bubble = LOKI 말풍선 안개(3번째 A마다, 차례 셈). 퐁 하면 둘레 3.5 안개가 0.8초 「점프(멈춤)」, 그동안 맞으면 피해 ×1.2 — 차례 셈만, 난수 0
     drum  = KILLATON 정글 북(스피커 자리 6곳): 소리 파동이 북에 닿으면 「둥!」 둘레 반지름 3 링 — 링 안 안개에 기본 소리의 30% 피해, 북마다 쿨 4초 — 자리만, 난수 0
   · 보스 행동 새 키(fogs.js): sweep(squeeze 난수 수) · rush/rush3(roll/rolls) · rail_rain(rain) · drum4(slam, 추가 난수 0). order9 = 9단계 이상 「보스 두 단계」 순서(game.js scaleBoss)
   · 음악: 임시 합성 루프(js/audio.js A.TEMP_LOOPS). 본인 음원 오면 assets/audio/<키>.mp3 만(권리 확인 뒤) */
(function () {
  'use strict';
  const TG = window.TG;
  const D = TG.DUNGEONS;
  D.poy_dial = { id: 'poy_dial', name: '다이얼 기관실', owner: 'poy', ownerName: '포이', color: '#5fd38a', open: true, dir: '동', res: true,
    tag: '포이 던전 · 멈춘 다이얼을 딱 좋게 돌려 주자', again: '포이 던전 · 부드러운 엔진 박자',
    music: { floor: 'bgm_dial_poy', boss: 'bgm_boss', end: 'sfx_dial_poy' },
    floors: [null,
      { title: '1층 · 다이얼이 다 멈췄어요!', sub: '노브 안개가 딸깍딸깍 — 다이얼 발판에 잠깐 서 있으면 안개가 느려져요' },
      { title: '2층 · 계기판 뭉치 등장!', sub: '노브 안개도 같이 와요 — 계기판은 옆으로 쭉 미끄러져요' },
      { title: '3층 · 스위치 메아리까지 셋이 다 같이!', sub: '스위치는 한 번은 통! 두 번째에 퐁' }],
    bossName: '멈춘 조타 다이얼', bossSub: '바늘이 0에 멈춰 기관실 소리가 작아졌어요 — 다시 딱 좋게 돌려 주자!',
    theme: { bg: 0xdfe8e4, sky: 0xf4fbf7, ground: 0x9aa7a2, pulse: 0x5fd38a },
    welcome: '다이얼이 다 멈췄어… 같이 천천히 돌려 줄래?', cheer: '딱 좋다! 소리가 부드럽게 돌아왔어',
    rule: { dial: { hold: 1.5, r: 4, slow: 0.6 }, boss: { var: 'dial', order: [['roll', 'rain'], ['sweep', 'roll', 'slam', 'rain'], ['rolls', 'sweep', 'slam', 'rain']], tint: 0xe4e8ee,
      bossSay: '헉, 큰 다이얼이 0에 멈췄어! 바늘 조심!', words: { roll: '다이얼 데굴!', rolls: '데굴데굴 세 번!', rain: '나사 비!', slam: '딸깍 쿵!', sweep: '볼륨 바늘 휙~!' } } },
    npc: '기관실 톱니 로봇' };
  D.loki_train = { id: 'loki_train', name: '말풍선 객차', owner: 'loki', ownerName: '로키', color: '#ffc21c', open: true, dir: '동', res: true,
    tag: '로키 던전 · 막힌 말풍선을 뚫고 함성을 되찾자', again: '로키 던전 · 다 같이 뛰어!',
    music: { floor: 'bgm_train_loki', boss: 'bgm_boss', end: 'sfx_train_loki' },
    floors: [null,
      { title: '1층 · 말풍선이 다 막혔어요!', sub: '세 번째 안개는 말풍선 안개 — 퐁 하면 둘레 안개가 깜짝 점프!' },
      { title: '2층 · 꼬마 객차 뭉치 등장!', sub: '말풍선 안개도 같이 와요 — 객차는 ㄱ자 선로로 달려와요' },
      { title: '3층 · 마이크 유성까지 셋이 다 같이!', sub: '유성은 한 번은 통! 두 번째에 퐁' }],
    bossName: '말문 막힌 말풍선 기관차', bossSub: '굴뚝 위 말풍선이 「…」로 막혔어요 — 다 같이 외쳐서 뚫어 주자!',
    theme: { bg: 0xffe9b0, sky: 0xd8f0ff, ground: 0xb98a5a, pulse: 0xffc21c },
    welcome: '말풍선이 다 막혔어! 빨리빨리 같이 뚫자!', cheer: '다 같이 뛰어! — 이거지!',
    rule: { bubble: 3, boss: { var: 'train', order: [['rush', 'rail_rain'], ['rush3', 'rail_rain', 'slam', 'rush'], ['rush3', 'slam', 'rail_rain', 'rush3']], order9: [['rush', 'rail_rain'], ['rush3', 'rail_rain', 'slam', 'rush'], ['rush3', 'rail_rain', 'slam', 'rail_rain', 'rush3']], tint: 0xf6cf55,
      bossSay: '헉, 말풍선이 막힌 기차야! 선로 조심!', words: { rush: '칙칙 돌진!', rush3: '칙칙폭폭 세 번!', rail_rain: '말풍선 비!', slam: '덜컹 쿵!' } } },
    npc: '꼬마 기차 톱니 로봇' };
  D.killaton_jungle = { id: 'killaton_jungle', name: '정글 온실', owner: 'killaton', ownerName: '킬라톤', color: '#8999e8', open: true, dir: '남동', res: true,
    tag: '킬라톤 던전 · 잠든 정글 북을 깨워 떼창 가자', again: '킬라톤 던전 · 정글 떼창',
    music: { floor: 'bgm_jungle_killaton', boss: 'bgm_boss', end: 'sfx_jungle_killaton' },
    floors: [null,
      { title: '1층 · 정글 북이 다 잠들었어요!', sub: 'LP 연잎 안개가 빙글빙글 — 소리를 북에 맞히면 「둥!」' },
      { title: '2층 · 봉고 북 뭉치 등장!', sub: 'LP 연잎 안개도 같이 와요 — 봉고는 데굴데굴 벽에 튕겨요' },
      { title: '3층 · 헤드폰 새싹까지 셋이 다 같이!', sub: '새싹은 한 번은 통! 두 번째에 퐁' }],
    bossName: '잠꾸러기 북 꽃', bossSub: '큰 북 꽃이 잠들어 떼창이 멈췄어요 — 북을 깨워 다 같이 노래하자!',
    theme: { bg: 0xcfeedd, sky: 0xeef9ff, ground: 0x4f8a5a, pulse: 0x8999e8 },
    welcome: '북이 다 잠들었어~ 같이 깨워서 떼창 가자!', cheer: '이 맛이지! 다 같이 한 번 더!',
    rule: { drum: { r: 3, k: 0.3, cd: 4 }, boss: { var: 'drum', order: [['roll', 'rain'], ['drum4', 'roll', 'rain'], ['rolls', 'drum4', 'slam', 'rain']], tint: 0x9aa6ee,
      bossSay: '헉, 큰 북 꽃이 잠꼬대해! 북소리 조심!', words: { roll: '덩굴 데굴!', rolls: '덩굴 세 번!', rain: '꽃가루 비!', slam: '북 쿵!', drum4: '둥·둥·둥·둥 떼창!' } } },
    npc: '정글 톱니 로봇·반딧불' };
  ['poy_dial', 'loki_train', 'killaton_jungle'].forEach((id) => { if (TG.DUNGEON_ORDER.indexOf(id) < 0) TG.DUNGEON_ORDER.push(id); });
  // 단계별 장치 세기(던전설계 각 10단계 표, [추정]) — game.js 가 LV 로 읽음
  TG.RES_LV = function (id, lv) {
    if (id === 'poy_dial') return { cd: lv >= 4 ? 7 : 6, dur: lv >= 7 ? 1.6 : 2.0 };
    if (id === 'loki_train') return { jump: lv >= 7 ? 0.6 : lv >= 4 ? 0.7 : 0.8 };
    if (id === 'killaton_jungle') return { cd: lv >= 4 ? 5 : 4, k: lv >= 7 ? 0.25 : 0.3 };
    return {};
  };
  // DN.load 는 dungeons.js 끝에서 이미 돌았음(그땐 주민 던전이 표에 없어 저장된 ez_dun·?dun= 이 파이프 굴로 바뀜) — 표에 넣은 뒤 다시(지금 6던전 결과는 같음)
  if (TG.DN && TG.DN.load) TG.DN.load();
})();
