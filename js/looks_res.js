/* 에코 제로 — 주민 던전 3개 안개·보스 「모양」 (2026-11-28 주민던전, 던전 아트 작업자 · 설계 `_AI/작업/게임_톱니골던전/주민3명_20261128/던전설계.md` 대표 OK 그대로)
   · js/looks.js 바로 뒤에서 읽음. looks.js 도우미(LK._kit: P·merge·mk·BASE)를 그대로 씀 — 전부 three.js 기본 도형(크레딧 0), 그림만.
   · 판정 반지름·튼튼함·규칙·난수는 손대지 않음. walk(걸음)는 규칙 값 = 설계 표 그대로(바꾸지 말 것).
   · 정점 색: looks.js 와 같은 「원하는 색 ÷ 몸 색」. 단 상한을 2.4 → 6 으로(이 파일만) — 진한 몸 색(LOKI 노랑 tint·메아리 파랑) 위에 흰·크림을 그대로 내기 위해.
     몸 색 × 정점 색 = 원하는 색(1 이하) 이라 빛·단계 색 계산은 기존과 같음.
   · 보스 3체 실루엣(5보스와 안 겹침): POY = 세로로 선 바퀴살 고리(가운데 뚫림·손잡이 8개 별테) / LOKI = 낮고 긴 기관차+객차 위 큰 크림 말풍선 / KILLATON = 바닥에 납작한 5잎 별 꽃 + 가운데 정글 북.
   · 보스 몸짓(bossDraw, 그림만 — 규칙 상태 b 는 읽기만): POY 고리 딸깍 30° 끊어 돎(허브 중심) / LOKI 피스톤 들썩 + 말풍선 반 박 늦게 둥실 + 돌진 땐 기차 코가 달리는 쪽 + 「…」→「!」 / KILLATON 꽃잎 접혔다 폈다(정점 애니, 원본 위치 캐시) + 북 통통 + 꽃 왕관 천천히 돎. */
(function () {
  'use strict';
  const TG = window.TG, T = THREE;
  const LK = TG.LOOKS, { P, merge, mk } = LK._kit;
  const PI = Math.PI;
  // ── 정점 색(상한 6) ── 조각마다 색을 직접 넣고 vc 표시 → merge 가 다시 칠하지 않음
  const c0 = new T.Color(), c1 = new T.Color();
  function vc(g, base) {
    const ng = g.index ? g.toNonIndexed() : g, hex = g.userData.col;
    const n = ng.getAttribute('position').count, a = new Float32Array(n * 3);
    let r = 1, gg = 1, b = 1;
    if (hex != null) { c0.set(hex); c1.set(base == null ? 0xffffff : base); r = Math.min(6, c0.r / Math.max(0.03, c1.r)); gg = Math.min(6, c0.g / Math.max(0.03, c1.g)); b = Math.min(6, c0.b / Math.max(0.03, c1.b)); }
    for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; }
    ng.setAttribute('color', new T.BufferAttribute(a, 3));
    if (!ng.getAttribute('uv')) ng.setAttribute('uv', new T.BufferAttribute(new Float32Array(n * 2), 2));
    ng.userData.vc = true; return ng;
  }
  const U = (parts, base) => merge(parts.map((g) => vc(g, base)), base);
  // 이름 붙인 조각 묶음 → 합칠 때 정점 범위 기억(정점 애니·켜고 끄기용)
  function tagged(list, base) { // list = [[tag|null, geo], ...] → { geos(vc), rng: { tag: [시작, 개수] } }
    const geos = [], rng = {}; let at = 0;
    for (const [tag, g] of list) { const v = vc(g, base), n = v.getAttribute('position').count; if (tag) { const r = rng[tag] || (rng[tag] = [at, 0]); r[1] = at + n - r[0]; } geos.push(v); at += n; }
    return { geos, rng, n: at };
  }
  // 도형 더(looks.js P 에 없는 것)
  const half = (x, y, z, r, d, col, rot, seg) => mk(new T.CylinderGeometry(r, r, d, seg || 16, 1, false, PI / 2, PI), x, y, z, col, rot); // 반원 판(rot [PI/2,0,0] 이면 위쪽 반원이 +z 를 봄)
  const torA = (x, y, z, R, r, arc, col, rot, seg) => mk(new T.TorusGeometry(R, r, 6, seg || 16, arc), x, y, z, col, rot); // 활 모양 고리
  const starY = (x, y, z, R, r, d, col, ry, n) => { // 별(앞면 +z) 을 y 축으로 돌려 세움
    const s = new T.Shape(); n = n || 5;
    for (let i = 0; i < n * 2; i++) { const a = PI / 2 + (i / (n * 2)) * PI * 2, rr = i % 2 ? r : R; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -d / 2);
    return mk(g, x, y, z, col, [0, ry || 0, 0]);
  };
  const gear = (x, y, z, R, d, teeth, col, rot) => { // 톱니(앞면 +z 기준 → rot 로 돌림)
    const s = new T.Shape(), N = teeth * 4;
    for (let i = 0; i <= N; i++) { const a = (i / N) * PI * 2, k = i % 4, rr = k === 0 || k === 3 ? R * 0.8 : R; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -d / 2);
    return mk(g, x, y, z, col, rot);
  };
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  // 정점 애니 도우미: 원본 위치·법선·외곽선 법선을 한 번 캐시
  function orig(geo) {
    let c = geo.userData._orig; if (c) return c;
    const p = geo.getAttribute('position'), n = geo.getAttribute('normal'), o = geo.getAttribute('outlineNormal');
    c = geo.userData._orig = { p: p.array.slice(), n: n ? n.array.slice() : null, o: o ? o.array.slice() : null };
    return c;
  }

  // ── 색 ──
  const WHITE = 0xf3f5f8, SILVER = 0xc9d0d8, SILVER_D = 0x9aa3ae, STEEL = 0x6c7680, MINT = 0x5fd38a, MINT_L = 0x9cebb8, MINT_D = 0x2f9a5c, CREAM = 0xf6eedb, INK = 0x26303a;
  const YEL = 0xffc21c, YEL2 = 0xffd65a, NAVY = 0x2f3a7a, NAVY2 = 0x4a5cb0, RED = 0xe5352b, GOLD = 0xe0ae2c, BCREAM = 0xfff3d6, SKYW = 0x9fd0f6;
  const PERI = 0x8999e8, PERI_L = 0x9eabf0, LAV = 0xc6a8ff, LAV_D = 0x8f6ad8, WOOD = 0x9a6a3e, WOOD_L = 0xd8b48a, WOOD_D = 0x6e4628, LEAF = 0x4fae5a, LEAF_L = 0x7fd06e, LPK = 0x2a2533, SKIN = 0xf3dfbf, PURP = 0x7d4fd0;

  // ═══ ① POY 「다이얼 기관실」 ═══ 흰·은·연초록. A 노브 안개(ratchet) · B 계기판 뭉치(slide) · C 스위치 메아리(hop) · 보스 멈춘 조타 다이얼
  const POY_TINT = 0xe4e8ee, POY_H = 3.75; // 보스 몸 색(dungeons_res tint 와 같게) · 허브 높이
  LK.poy_dial = { name: '다이얼 안개', names: { bubble: '노브 안개', clump: '계기판 뭉치', echo: '스위치 메아리' },
    walk: { bubble: 'ratchet', clump: 'slide', echo: 'hop' }, // ★ 규칙(기록 재생) — 설계 그대로
    bubble: (b) => { const out = [P.sph(0, 0.0, 0, 0.66, 14, WHITE, [1, 0.94, 1]), P.sph(0.6, -0.12, 0.05, 0.2, 7, WHITE), P.sph(-0.6, -0.12, 0.05, 0.2, 7, WHITE), P.sph(0, -0.06, -0.55, 0.3, 7, WHITE),
        P.cyl(0, 0.66, -0.05, 0.4, 0.46, 0.3, SILVER, null, 14), P.cyl(0, 0.83, -0.05, 0.33, 0.38, 0.08, 0xe9edf2, null, 14), P.tor(0, 0.53, -0.05, 0.46, 0.04, MINT, null, 18), P.sph(0, 0.9, 0.22, 0.07, 6, MINT_D)];
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; out.push(P.box(Math.sin(a) * 0.42, 0.66, -0.05 + Math.cos(a) * 0.42, [0.05, 0.28, 0.05], SILVER_D, [0, a, 0])); } // 노브 손잡이 홈
      return U(out, b); }, // 흰 둥근 몸 + 은색 노브 뚜껑(눈금 테·초록 점) + 작은 팔 둘
    clump: (b) => { const out = [half(0, 0.42, 0.0, 1.12, 0.78, 0xdfe3e8, [PI / 2, 0, 0], 20), half(0, 0.44, 0.4, 0.98, 0.04, CREAM, [PI / 2, 0, 0], 20), P.tor(0, 0.42, 0.0, 1.12, 0.07, SILVER_D, [0, 0, 0], 24),
        P.box(0, 0.4, 0.0, [2.3, 0.16, 0.86], SILVER_D), P.box(-0.55, 0.15, 0.05, [0.34, 0.3, 0.5], STEEL), P.box(0.55, 0.15, 0.05, [0.34, 0.3, 0.5], STEEL), P.box(-0.55, 0.02, 0.2, [0.42, 0.06, 0.62], INK), P.box(0.55, 0.02, 0.2, [0.42, 0.06, 0.62], INK),
        P.box(-0.48, 0.58, 0.44, [0.9, 0.07, 0.04], MINT_D, [0, 0, 0.32]), P.cyl(0, 0.48, 0.44, 0.09, 0.09, 0.05, INK, [PI / 2, 0, 0], 8), P.sph(0.85, 1.25, -0.1, 0.11, 6, MINT)];
      for (let i = 0; i <= 8; i++) { const a = PI - (i / 8) * PI; out.push(P.box(Math.cos(a) * 0.86, 0.44 + Math.sin(a) * 0.86, 0.43, [0.05, i % 4 ? 0.12 : 0.2, 0.03], i > 6 ? MINT_D : 0x8a929c, [0, 0, a - PI / 2])); }
      return U(out, b); }, // 반원 계기판 몸(크림 면·눈금·초록 바늘은 0 쪽) + 짧은 발 둘
    echo: (b) => { const out = [P.sph(0, 0.02, 0, 0.6, 14, 0xdde3ea, [1, 1.08, 1]), P.tor(0, -0.18, 0, 0.6, 0.035, MINT, null, 18), P.box(0, 0.68, -0.05, [0.5, 0.16, 0.36], STEEL), P.cyl(0.1, 0.92, -0.05, 0.05, 0.05, 0.45, SILVER, [0, 0, -0.5], 6), P.sph(0.22, 1.12, -0.05, 0.11, 8, MINT_L)];
      for (let i = 0; i < 5; i++) out.push(P.cyl(0, -0.15 + Math.sin(i * 1.3) * 0.12, -0.6 - i * 0.2, 0.05, 0.05, 0.22, i % 2 ? MINT_D : INK, [PI / 2, 0, 0], 5)); // 꼬리 전선
      return U(out, b); }, // 은 캡슐 + 위 토글 스위치(똑딱) + 꼬리 전선
    boss: (b) => { // 몸(안 돎): 고리 뒤 받침 + 기둥 + 허브(얼굴·계기판 눈 테·슬라이더 입) + 「0」 표시창
      const H = POY_H, out = [P.box(0, 0.24, -1.05, [3.4, 0.48, 1.3], SILVER_D), P.box(0, 0.52, -1.05, [3.0, 0.1, 1.1], 0xe9edf2), P.box(0, 0.24, -0.39, [3.0, 0.1, 0.03], MINT),
        P.cyl(0, (0.5 + H + 1.4) / 2, -0.95, 0.26, 0.32, H + 0.9, 0xc4cbd4, null, 10), P.cyl(0, H, -0.45, 0.24, 0.24, 1.0, SILVER_D, [PI / 2, 0, 0], 10),
        P.cyl(0, H, 0.08, 0.95, 0.95, 0.66, 0xf4f6f8, [PI / 2, 0, 0], 26), P.sph(0, H, 0.41, 0.95, 20, 0xf6f8fa, [1, 1, 0.28]), P.tor(0, H, 0.41, 0.96, 0.08, SILVER, [0, 0, 0], 26),
        P.tor(-0.41, H + 0.14, 0.64, 0.42, 0.05, MINT, [0, -0.28, 0], 18), P.tor(0.41, H + 0.14, 0.64, 0.42, 0.05, MINT, [0, 0.28, 0], 18),
        P.box(0, H - 0.27, 0.66, [0.8, 0.07, 0.04], 0x55606a), P.box(-0.26, H - 0.27, 0.69, [0.14, 0.15, 0.05], MINT_D), // 슬라이더 홈 입(손잡이는 0 쪽)
        P.box(0, H + 1.38, -0.78, [0.9, 0.56, 0.24], CREAM), P.box(0, H + 1.38, -0.86, [1.04, 0.7, 0.12], SILVER_D), P.tor(0, H + 1.38, -0.64, 0.15, 0.045, INK, [0, 0, 0], 12), P.cone(0, H + 1.0, -0.72, 0.1, 0.2, MINT, [PI, 0, 0], 6)];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; out.push(P.box(Math.cos(a) * 0.82, H + Math.sin(a) * 0.82, 0.62, [0.04, 0.12, 0.03], i % 3 ? 0x9aa3ae : MINT_D, [0, 0, a - PI / 2])); } // 허브 둘레 눈금
      return U(out, b); },
    parts: () => { // 도는 고리(허브 중심 z 축): 테·안쪽 초록 테·눈금 24·바퀴살 8·손잡이 8(별테)
      const H = POY_H, out = [P.tor(0, H, 0, 2.5, 0.24, 0xeef1f5, [0, 0, 0], 48), P.tor(0, H, 0.12, 2.22, 0.07, MINT, [0, 0, 0], 40), P.tor(0, H, -0.1, 2.72, 0.05, SILVER_D, [0, 0, 0], 40)];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; out.push(P.box(Math.cos(a) * 2.5, H + Math.sin(a) * 2.5, 0.22, [0.08, i % 6 ? 0.22 : 0.4, 0.06], i % 6 ? MINT_L : MINT_D, [0, 0, a - PI / 2])); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8, c = Math.cos(a), s = Math.sin(a);
        out.push(P.box(c * 1.65, H + s * 1.65, 0, [0.22, 1.42, 0.2], 0xd2d8e0, [0, 0, a - PI / 2]), P.cyl(c * 2.98, H + s * 2.98, 0, 0.12, 0.16, 0.5, SILVER, [0, 0, a - PI / 2], 8), P.sph(c * 3.28, H + s * 3.28, 0, 0.27, 10, i % 2 ? MINT_L : WHITE)); }
      return out; },
    spin: true,
    bossC: [0, POY_H, -0.6],
    bossFace: { var: 'dial', mat: { color: POY_TINT, key: 'bossdial', rim: 0.45, spec: 0.5, flashCol: 'vec3(0.9, 1.0, 0.95)', gy0: '0.0', gy1: '4.0', cx: '0.0', cy: String(POY_H), cz: '-0.6', sep: 0.31, ey: 0.1, size: 0.23,
      faces: [{ mouth: 'flat' }, { brow: 'worry', mouth: 'o', sweat: true }, { lid: 0.55, brow: 'worry', mouth: 'wavy', sweat: true }] } }, // 기본(멀뚱 계기판 눈·일자 슬라이더) → 당황 → 지침(바늘이 0으로 축)
    bossDraw: (function () {
      let acc = 0;
      return function (o, b, t, dt, ph) { // 박마다 딸깍 30° (부드럽게 X) — 맞으면 반대로 덜컥
        const beat = 0.5 / (1 + ph * 0.3); acc += dt / beat;
        const k = Math.floor(acc), f = acc - k, e = f < 0.16 ? (1 - Math.cos((f / 0.16) * PI)) / 2 : 1;
        const kick = b.flash > 0.3 ? (b.flash - 0.3) * 0.6 : 0, a = -((k % 12) + e) * (PI / 6) + kick, h = POY_H;
        o.pgr.rotation.set(0, 0, a); o.pgr.position.set(h * Math.sin(a), h - h * Math.cos(a), 0); o.pgr.scale.set(1, 1, 1);
      };
    })(),
  };

  // ═══ ② LOKI 「말풍선 객차」 ═══ 노랑·남색·크림·빨강·금. A 말풍선 안개(jump) · B 꼬마 객차 뭉치(rail) · C 마이크 유성(dash) · 보스 말문 막힌 말풍선 기관차
  const LOKI_TINT = 0xf6cf55, BUB = [0.7, 5.35, 0.15]; // 말풍선 가운데(몸·얼굴)
  let lokiRng = null;
  LK.loki_train = { name: '말풍선 안개', names: { bubble: '말풍선 안개', clump: '꼬마 객차 뭉치', echo: '마이크 유성' },
    walk: { bubble: 'jump', clump: 'rail', echo: 'dash' }, // ★ 규칙 — 설계 그대로
    bubble: (b) => U([P.sph(0, 0.06, 0, 0.66, 14, BCREAM, [1.18, 0.9, 0.95]), P.sph(0.55, 0.38, -0.12, 0.3, 8, BCREAM), P.sph(-0.6, 0.3, -0.1, 0.28, 8, BCREAM), P.cone(-0.42, -0.62, 0.1, 0.2, 0.5, BCREAM, [PI, 0, -0.5], 7),
      P.sph(-0.2, -0.33, 0.55, 0.075, 6, NAVY), P.sph(0, -0.36, 0.57, 0.075, 6, NAVY), P.sph(0.2, -0.33, 0.55, 0.075, 6, NAVY), P.tor(0, 0.06, -0.05, 0.74, 0.03, YEL, [PI / 2, 0, 0], 20)], b), // 크림 말풍선 몸 + 아래 꼬리 + 앞 「…」 점 셋
    clump: (b) => { const out = [P.box(0, 0.88, 0, [2.0, 1.05, 1.15], YEL), P.box(0, 1.47, 0, [2.15, 0.16, 1.3], NAVY), P.box(0, 0.36, 0, [2.05, 0.18, 1.0], NAVY),
        P.box(-0.38, 0.98, 0.58, [0.66, 0.6, 0.04], NAVY2), P.box(0.38, 0.98, 0.58, [0.66, 0.6, 0.04], NAVY2), P.box(-1.0, 0.95, 0.0, [0.04, 0.5, 0.6], SKYW), P.box(1.0, 0.95, 0.0, [0.04, 0.5, 0.6], SKYW),
        gear(0, 1.78, 0, 0.42, 0.16, 8, GOLD, [0, 0, 0]), P.cyl(0, 1.6, 0, 0.1, 0.1, 0.3, GOLD, null, 6), P.box(0, 0.6, 0.58, [1.9, 0.08, 0.04], RED)];
      [-0.65, 0.65].forEach((x) => [-0.52, 0.52].forEach((z) => out.push(P.cyl(x, 0.26, z, 0.26, 0.26, 0.14, RED, [PI / 2, 0, 0], 12), P.cyl(x, 0.26, z * 1.15, 0.1, 0.1, 0.06, GOLD, [PI / 2, 0, 0], 8))));
      return U(out, b); }, // 작은 노란 객차(앞 창 2개 = 눈 테, 남색 지붕·금 톱니) + 빨간 바퀴 4
    echo: (b) => { const out = [P.sph(0, 0.06, 0.05, 0.62, 14, GOLD, [1, 1.05, 1]), P.tor(0, 0.06, 0.05, 0.63, 0.04, 0xb8862a, [PI / 2, 0, 0], 20), P.tor(0, 0.06, 0.05, 0.63, 0.04, 0xb8862a, [0, 0, 0], 20), P.tor(0, -0.4, 0.05, 0.5, 0.06, NAVY, [PI / 2, 0, 0], 16),
        P.cone(0, -0.3, -0.85, 0.34, 1.2, NAVY, [-PI / 2 - 0.25, 0, 0], 10)];
      [[-0.35, 0.2], [0.35, 0.1], [0, -0.25]].forEach(([x, y], i) => out.push(P.box(x, y, -1.2 - i * 0.12, [0.06, 0.06, 0.8 - i * 0.15], 0xffffff)));
      return U(out, b); }, // 금 마이크 머리(그물 띠) + 남색 뾰족 손잡이 꼬리 + 속도선 3줄
    boss: (b) => { // 몸 = 큰 크림 말풍선(얼굴) — 기차는 부품(parts). 「…」 점 셋 · 「!」 는 정점 켜고 끄기
      const [x, y, z] = BUB, list = [[null, P.sph(x, y, z, 1.0, 22, BCREAM, [1.55, 1.0, 0.86])], [null, P.sph(x - 1.3, y + 0.45, z - 0.15, 0.5, 10, BCREAM)], [null, P.sph(x + 1.35, y + 0.4, z - 0.15, 0.52, 10, BCREAM)], [null, P.sph(x + 0.2, y + 0.95, z - 0.2, 0.5, 10, BCREAM)],
        [null, P.cone(x + 0.25, y - 1.15, z + 0.05, 0.32, 0.9, BCREAM, [PI, 0, 0.35], 8)], 
        ['dots', P.sph(x - 0.36, y - 0.46, z + 0.73, 0.13, 8, NAVY, [1, 1, 0.5])], ['dots', P.sph(x, y - 0.5, z + 0.75, 0.13, 8, NAVY, [1, 1, 0.5])], ['dots', P.sph(x + 0.36, y - 0.46, z + 0.73, 0.13, 8, NAVY, [1, 1, 0.5])],
        ['bang', P.box(x, y - 0.32, z + 0.8, [0.17, 0.34, 0.08], RED)], ['bang', P.sph(x, y - 0.66, z + 0.75, 0.1, 8, RED, [1, 1, 0.5])]];
      const tg = tagged(list, b), g = merge(tg.geos, b); g.userData.rng = tg.rng; return g; },
    parts: () => { // 기차(코 = +x): 기관차(노랑 보일러·남색 굴뚝·금 헤드라이트 하나·금 톱니 범퍼, 얼굴 없음) + 객차 1량(빨간 지붕·창 3) — 길이 약 5.5
      const out = [P.box(0.05, 0.72, 0, [5.3, 0.28, 1.6], NAVY),
        P.cyl(1.55, 1.5, 0, 0.72, 0.72, 2.1, YEL, [0, 0, PI / 2], 18), P.tor(1.0, 1.5, 0, 0.73, 0.06, GOLD, [0, PI / 2, 0], 22), P.tor(2.0, 1.5, 0, 0.73, 0.06, GOLD, [0, PI / 2, 0], 22),
        P.cyl(2.62, 1.5, 0, 0.66, 0.66, 0.08, NAVY, [0, 0, PI / 2], 18), P.cyl(2.68, 1.72, 0, 0.27, 0.27, 0.14, GOLD, [0, 0, PI / 2], 14), P.sph(2.76, 1.72, 0, 0.21, 10, 0xfff8d0, [0.45, 1, 1]),
        gear(2.82, 0.72, 0, 0.5, 0.16, 10, GOLD, [0, PI / 2, 0]), P.cyl(1.05, 2.45, 0, 0.2, 0.28, 0.75, NAVY, null, 10), P.cyl(1.05, 2.88, 0, 0.36, 0.26, 0.16, GOLD, null, 12), P.sph(1.9, 2.15, 0, 0.26, 10, GOLD, [1, 0.7, 1]),
        P.box(0.0, 1.72, 0, [1.05, 1.5, 1.66], YEL2), P.box(0.0, 2.55, 0, [1.3, 0.16, 1.86], NAVY), P.box(0.0, 1.95, 0.84, [0.6, 0.5, 0.04], 0x7aa6e0), P.box(0.0, 1.95, -0.84, [0.6, 0.5, 0.04], 0x7aa6e0),
        gear(0.0, 1.25, 0.86, 0.26, 0.06, 8, GOLD, [0, 0, 0]),
        P.box(-1.72, 1.5, 0, [1.85, 1.26, 1.5], YEL2), P.box(-1.72, 2.2, 0, [2.0, 0.18, 1.7], RED), P.cyl(-1.72, 2.3, 0, 0.72, 0.72, 1.9, RED, [0, 0, PI / 2], 14), P.box(-1.72, 1.0, 0.76, [1.85, 0.1, 0.04], RED), P.box(-1.72, 1.0, -0.76, [1.85, 0.1, 0.04], RED),
        P.box(-0.68, 0.82, 0, [0.4, 0.14, 0.22], GOLD), P.sph(0.98, 3.2, 0, 0.18, 8, 0xfff6e6), P.sph(0.9, 3.55, 0, 0.14, 8, 0xfff6e6), P.sph(0.95, 3.85, 0, 0.11, 8, 0xfff6e6)];
      [-2.3, -1.72, -1.14].forEach((x) => [0.76, -0.76].forEach((z) => out.push(P.box(x, 1.65, z, [0.38, 0.42, 0.04], 0x3d4f9a))));
      [0.45, 1.25, 2.05].forEach((x) => [0.86, -0.86].forEach((z) => out.push(P.cyl(x, 0.44, z, 0.42, 0.42, 0.14, RED, [PI / 2, 0, 0], 16), P.cyl(x, 0.44, z * 1.08, 0.13, 0.13, 0.06, GOLD, [PI / 2, 0, 0], 8))));
      [-2.3, -1.15].forEach((x) => [0.78, -0.78].forEach((z) => out.push(P.cyl(x, 0.34, z, 0.32, 0.32, 0.12, RED, [PI / 2, 0, 0], 14))));
      [0.95, -0.95].forEach((z) => out.push(P.box(1.25, 0.44, z, [1.7, 0.1, 0.06], SILVER), P.cyl(2.35, 0.75, z * 0.95, 0.12, 0.12, 0.5, SILVER, [0, 0, PI / 2], 8))); // 연결 막대·피스톤
      return out; },
    spin: false,
    bossC: [BUB[0], BUB[1], BUB[2] - 1.1],
    bossFace: { var: 'train', mat: { color: LOKI_TINT, key: 'bosstrain', rim: 0.4, spec: 0.2, flashCol: 'vec3(1.0, 0.95, 0.8)', gy0: '3.6', gy1: '5.8', cx: String(BUB[0]), cy: String(BUB[1]), cz: String(BUB[2] - 1.1), sep: 0.3, ey: 0.14, size: 0.19,
      faces: [{ brow: true }, { brow: true, sweat: true }, { brow: 'worry', lid: 0.4, sweat: true }] } }, // 날카로운 눈썹 + 눈, 입 대신 「…」(정점) → 맞으면 「!」
    bossDraw: (function () {
      let rr = 0, cyc = 0, steam = 0; const v = new T.Vector3();
      return function (o, b, t, dt, ph) {
        const beat = 0.5 / (1 + ph * 0.2); cyc += dt / beat;
        const rush = !!(b.pat && b.pat.type === 'roll' && b.pat.rush);
        const piston = Math.abs(Math.sin(PI * cyc)) * 0.1, fwd = Math.sin(2 * PI * cyc) * 0.06, flt = Math.sin(PI * (cyc - 0.5)) * 0.2; // 말풍선은 반 박 늦게 둥실
        o.group.position.y += flt; rr = damp(rr, rush ? -PI / 2 : 0, 10, dt);
        o.pgr.rotation.set(0, rr, 0); o.pgr.position.set(fwd, piston - flt, 0); o.pgr.scale.set(1, 1, 1);
        // 「…」 ↔ 「!」 (맞으면·2단계부터 깜빡)
        const g = o.mesh.geometry, R = g.userData.rng;
        if (R && R.dots) {
          const bang = b.flash > 0.15 || (ph >= 1 && Math.sin(t * 2.6) > 0.2), key = bang ? 1 : 0;
          if (g.userData._bang !== key) { g.userData._bang = key; const c = orig(g), pa = g.getAttribute('position').array;
            const put = (rg, on) => { for (let i = rg[0] * 3, e = (rg[0] + rg[1]) * 3; i < e; i += 3) { pa[i] = on ? c.p[i] : BUB[0]; pa[i + 1] = on ? c.p[i + 1] : BUB[1]; pa[i + 2] = on ? c.p[i + 2] : BUB[2]; } };
            put(R.dots, !bang); put(R.bang, bang); g.getAttribute('position').needsUpdate = true; }
        }
        steam -= dt; if (steam <= 0 && o.group.visible && b.scale > 0.6) { steam = rush ? 0.25 : 0.7; o.pgr.updateMatrixWorld(true); v.set(1.05, 3.0, 0); o.pgr.localToWorld(v); TG.FX.emit(TG.FX.CELL.bubble, v.x, v.y, v.z, { vy: 2.2, vx: TG.fra(-0.4, 0.4), vz: TG.fra(-0.4, 0.4), life: 0.9, size: 0.42, size1: 0.15, color: [2.4, 2.3, 2.0], alpha: 0.9, drag: 1.5 }); } // 굴뚝에서 작은 말풍선(꾸밈 난수 fra)
      };
    })(),
  };

  // ═══ ③ KILLATON 「정글 온실」 ═══ 초록 잎·페리윙클·라벤더·검정 LP. A LP 연잎 안개(orbit) · B 봉고 북 뭉치(roll) · C 헤드폰 새싹 메아리(swing) · 보스 잠꾸러기 북 꽃
  const KIL_TINT = 0x9aa6ee, PET_N = 5, HINGE = 1.3; // 보스 몸 색 · 꽃잎 수 · 꽃잎 접힘 축(반지름)
  let kilRng = null;
  LK.killaton_jungle = { name: '정글 안개', names: { bubble: 'LP 연잎 안개', clump: '봉고 북 뭉치', echo: '헤드폰 새싹 메아리' },
    walk: { bubble: 'orbit', clump: 'roll', echo: 'swing' }, // ★ 규칙 — 설계 그대로
    bubble: (b) => { const tl = [-0.42, 0, 0], out = [mk(new T.CylinderGeometry(0.92, 0.92, 0.16, 26), 0, 0.02, -0.12, LPK, [PI / 2 + tl[0], 0, 0]), mk(new T.TorusGeometry(0.62, 0.025, 4, 24), 0, 0.02, -0.03, 0x4a4256, [tl[0], 0, 0]), mk(new T.TorusGeometry(0.78, 0.025, 4, 26), 0, 0.02, -0.03, 0x4a4256, [tl[0], 0, 0]),
        P.sph(0, 0.02, 0.0, 0.56, 14, LAV, [1, 1, 0.95]), P.tor(0, 0.02, 0.0, 0.57, 0.035, LAV_D, [tl[0], 0, 0], 20), P.cyl(0.1, 0.86, -0.42, 0.04, 0.05, 0.42, LEAF, [0.3, 0, -0.25], 6), P.sph(0.32, 1.12, -0.5, 0.36, 8, LEAF_L, [1.4, 0.22, 0.8])];
      return U(out, b); }, // 검정 LP 원반(뒤로 기움·홈 두 줄) + 가운데 볼록 라벤더 라벨(얼굴) + 위 잎 하나
    clump: (b) => { const out = [];
      [[-0.56, 0.62, 1.15], [0.6, 0.55, 1.0]].forEach(([x, r, h]) => out.push(P.cyl(x, h / 2 + 0.12, 0.05, r, r * 0.85, h, WOOD, null, 14), P.cyl(x, h + 0.14, 0.05, r * 0.98, r * 0.98, 0.06, PERI, null, 14), P.tor(x, h + 0.12, 0.05, r, 0.06, WOOD_D, null, 16), P.tor(x, 0.35, 0.05, r * 0.92, 0.05, WOOD_D, null, 16)));
      out.push(P.box(0, 0.42, 0.05, [2.3, 0.2, 0.9], SKIN), P.box(0, 0.42, 0.51, [2.3, 0.05, 0.04], LAV_D), P.cyl(-0.05, 1.55, 0, 0.05, 0.06, 0.5, LEAF, null, 6), P.sph(0.25, 1.85, 0, 0.34, 8, LEAF_L, [1.5, 0.22, 0.75]), P.sph(-0.3, 1.8, 0, 0.32, 8, LEAF, [1.5, 0.22, 0.75]));
      return U(out, b); }, // 나란한 봉고 북 2개(페리윙클 북면·나무 테) + 크림 가죽 띠 + 잎 머리
    echo: (b) => { const out = [P.sph(0, 0.02, 0, 0.6, 14, LEAF_L, [1, 1.05, 1]), torA(0, 0.15, -0.05, 0.66, 0.06, PI, PURP, [0, 0, 0], 16), P.cyl(0.66, 0.1, -0.05, 0.22, 0.22, 0.22, PURP, [0, 0, PI / 2], 12), P.cyl(-0.66, 0.1, -0.05, 0.22, 0.22, 0.22, PURP, [0, 0, PI / 2], 12),
        P.cyl(0.77, 0.1, -0.05, 0.15, 0.15, 0.04, LAV, [0, 0, PI / 2], 10), P.cyl(-0.77, 0.1, -0.05, 0.15, 0.15, 0.04, LAV, [0, 0, PI / 2], 10), P.cyl(0, 0.75, 0, 0.04, 0.05, 0.3, LEAF, null, 6), P.sph(0.2, 0.92, 0, 0.22, 8, LEAF, [1.5, 0.22, 0.75]), P.sph(-0.2, 0.95, 0, 0.2, 8, LEAF_L, [1.5, 0.22, 0.75])];
      for (let i = 0; i < 5; i++) out.push(P.sph(Math.sin(i * 1.1) * 0.22, -0.2 + i * 0.06, -0.62 - i * 0.2, 0.11 - i * 0.012, 6, i % 2 ? LEAF : LEAF_L)); // 덩굴 꼬리
      return U(out, b); }, // 초록 싹 몸 + 보라 헤드폰 + 덩굴 꼬리
    boss: (b) => U([ // 몸 = 가운데 큰 정글 북(크림 가죽 옆면 = 얼굴, 나무 테·받침, 페리윙클 북면, 아래 덩굴) + 큰 O 입 + 별 모양 눈꼬리
      P.cyl(0, 1.35, 0, 1.2, 1.12, 2.0, SKIN, null, 28), P.tor(0, 2.36, 0, 1.2, 0.13, WOOD, null, 30), P.tor(0, 0.36, 0, 1.13, 0.13, WOOD, null, 30), P.cyl(0, 0.17, 0, 1.0, 1.15, 0.34, WOOD_D, null, 22), P.cyl(0, 2.4, 0, 1.12, 1.12, 0.07, PERI, null, 26),
      P.tor(0, 0.62, 0, 1.16, 0.07, LEAF, [PI / 2 - 0.12, 0, 0.05], 28), P.sph(0.9, 0.72, 0.75, 0.2, 7, LEAF_L, [1.4, 0.25, 0.8]), P.sph(-1.05, 0.55, 0.5, 0.22, 7, LEAF, [1.4, 0.25, 0.8]), P.sph(-0.3, 0.55, 1.12, 0.18, 7, LEAF_L, [1.4, 0.25, 0.8]),
      P.tor(0, 0.98, 1.13, 0.23, 0.07, 0xa04a5a, [0.06, 0, 0], 16), P.cyl(0, 0.98, 1.1, 0.22, 0.22, 0.05, 0x5a2034, [PI / 2 + 0.06, 0, 0], 14), P.sph(0, 0.9, 1.14, 0.1, 8, 0xff8aa8, [1, 0.6, 0.4]),
      starY(0.98, 1.86, 0.66, 0.17, 0.07, 0.05, LAV, 0.98), starY(-0.98, 1.86, 0.66, 0.17, 0.07, 0.05, LAV, -0.98)], b),
    parts: () => { // 꽃잎 5장(바닥에 납작·연한 페리윙클 북면·연한 나무 테·끝에 작은 LP 연잎) + 꽃 왕관(돎) — 정점 범위 기억
      const list = [];
      for (let i = 0; i < PET_N; i++) { const a = -PI / 2 + PI / PET_N + (i / PET_N) * PI * 2, c = Math.cos(a), s = Math.sin(a), tag = 'p' + i, rc = 2.35;
        list.push([tag, mk(new T.CylinderGeometry(1, 1, 0.14, 20), c * rc, 0.1, s * rc, PERI_L, [0, -a, 0], [1.2, 1, 0.9])], [tag, mk(new T.TorusGeometry(1, 0.075, 4, 20), c * rc, 0.17, s * rc, WOOD_L, [PI / 2, -a, 0], [1.2, 0.9, 1])],
          [tag, mk(new T.CylinderGeometry(1, 1, 0.03, 18), c * (rc + 0.15), 0.18, s * (rc + 0.15), 0xc9d0fa, [0, -a, 0], [0.75, 1, 0.5])], [tag, mk(new T.CylinderGeometry(0.36, 0.36, 0.06, 12), c * 3.28, 0.24, s * 3.28, LPK)], [tag, mk(new T.CylinderGeometry(0.12, 0.12, 0.04, 10), c * 3.28, 0.28, s * 3.28, LAV_D)], [tag, mk(new T.TorusGeometry(0.25, 0.018, 3, 10), c * 3.28, 0.28, s * 3.28, 0x5a5266, [PI / 2, 0, 0])]); }
      list.push(['crown', P.sph(0, 2.47, 0, 0.18, 8, 0xffe27a)]);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; list.push(['crown', P.sph(Math.cos(a) * 0.42, 2.55, Math.sin(a) * 0.42, 0.3, 8, k % 2 ? LAV : 0xe2cfff, [1, 0.45, 1])]); }
      for (let k = 0; k < 3; k++) { const a = (k / 3) * PI * 2 + 0.5; list.push(['crown', P.sph(Math.cos(a) * 0.8, 2.48, Math.sin(a) * 0.8, 0.3, 8, LEAF_L, [1.5, 0.2, 0.7])]); }
      const tg = tagged(list, 0xffffff); kilRng = tg; return tg.geos; },
    spin: false,
    bossC: [0, 1.5, -0.75],
    bossFace: { var: 'drum', mat: { color: KIL_TINT, key: 'bossdrum', rim: 0.35, spec: 0.15, flashCol: 'vec3(1.0, 0.92, 0.85)', gy0: '0.0', gy1: '2.6', cx: '0.0', cy: '1.5', cz: '-0.75', sep: 0.3, ey: 0.1, size: 0.2,
      faces: [{ lid: 0.88 }, { lid: 0.25, brow: 'worry', sweat: true }, { lid: 0.6, brow: 'worry', sweat: true }] } }, // 쿨쿨 감은 눈(+ 별 눈꼬리·큰 O 입은 도형) → 깜짝 뜬 눈 → 지침
    bossDraw: (function () {
      let cyc = 0, rot = 0;
      return function (o, b, t, dt, ph) {
        const beat = 0.5 / (1 + ph * 0.25); cyc += dt / beat; rot += dt * (0.5 + ph * 0.3);
        const bob = Math.abs(Math.sin(PI * cyc)) * 0.16, fold = 0.62 * Math.pow(0.5 - 0.5 * Math.cos(PI * cyc), 1.6); // 두 박에 한 번 접혔다 폈다
        o.group.position.y += bob; o.group.scale.y *= 1 - bob * 0.25;
        o.pgr.rotation.set(0, 0, 0); o.pgr.position.set(0, 0, 0); o.pgr.scale.set(1, 1, 1);
        const g = o.parts.geometry, TGR = kilRng; if (!TGR || g.getAttribute('position').count !== TGR.n) return;
        const c = orig(g), pa = g.getAttribute('position').array, na = g.getAttribute('normal').array, on = g.getAttribute('outlineNormal'), oa = on ? on.array : null;
        const cf = Math.cos(fold), sf = Math.sin(fold), cy0 = 0.1, ys = 1 / Math.max(0.6, 1 - bob * 0.25);
        for (let i = 0; i < PET_N; i++) { // 꽃잎: 안쪽 축(반지름 HINGE)에서 바깥이 위로 접힘 + 북이 뛰어도 바닥에 붙어 있게(들썩만큼 내림)
          const a = -PI / 2 + PI / PET_N + (i / PET_N) * PI * 2, ux = Math.cos(a), uz = Math.sin(a), rg = TGR.rng['p' + i];
          for (let j = rg[0] * 3, e = (rg[0] + rg[1]) * 3; j < e; j += 3) {
            const x = c.p[j], y = c.p[j + 1], z = c.p[j + 2], rho = x * ux + z * uz - HINGE, tx = x - (rho + HINGE) * ux, tz = z - (rho + HINGE) * uz, yy = y - cy0;
            const r2 = rho * cf - yy * sf, y2 = rho * sf + yy * cf;
            pa[j] = tx + (r2 + HINGE) * ux; pa[j + 1] = (cy0 + y2) * ys - bob * ys; pa[j + 2] = tz + (r2 + HINGE) * uz;
            const rot2 = (arr, src) => { const nx = src[j], ny = src[j + 1], nz = src[j + 2], nr = nx * ux + nz * uz, ntx = nx - nr * ux, ntz = nz - nr * uz, nr2 = nr * cf - ny * sf, ny2 = nr * sf + ny * cf; arr[j] = ntx + nr2 * ux; arr[j + 1] = ny2; arr[j + 2] = ntz + nr2 * uz; };
            rot2(na, c.n); if (oa) rot2(oa, c.o);
          }
        }
        { const rg = TGR.rng.crown, cr = Math.cos(rot), sr = Math.sin(rot); // 꽃 왕관 천천히 돎
          for (let j = rg[0] * 3, e = (rg[0] + rg[1]) * 3; j < e; j += 3) { const x = c.p[j], z = c.p[j + 2]; pa[j] = x * cr - z * sr; pa[j + 1] = c.p[j + 1]; pa[j + 2] = x * sr + z * cr; const nx = c.n[j], nz = c.n[j + 2]; na[j] = nx * cr - nz * sr; na[j + 2] = nx * sr + nz * cr; if (oa) { const ox = c.o[j], oz = c.o[j + 2]; oa[j] = ox * cr - oz * sr; oa[j + 2] = ox * sr + oz * cr; } } }
        g.getAttribute('position').needsUpdate = true; g.getAttribute('normal').needsUpdate = true; if (on) on.needsUpdate = true;
      };
    })(),
  };
})();
