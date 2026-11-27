/* 에코 제로 — 던전별 안개·보스 「모양」 표 (2026-11-24 대표 지시: 던전마다 일반 안개·보스 모양을 다르게)
   · 전부 three.js 기본 도형 조합(크레딧 0) — 기존 툰 재질·외곽선·얼굴 셰이더를 그대로 쓰고 「몸 모양」만 바꿔 끼움(js/fogs.js F.setLook).
   · 그림만: 판정 반지름(RAD)·튼튼함·규칙·난수는 손대지 않음. 기록 재생과 무관.
   · 색: 안개 재질은 한 색(몸 색 × 단계 색) → 부품 색은 정점 색(color 속성)으로 — 「원하는 색 ÷ 몸 색」을 정점에 넣어 한 드로콜로 두 색 이상(값이 1 을 넘어도 됨, 상한 2.4).
   · 모양 한 줄 = TG.LOOKS.<던전 id> = { bubble, clump, echo, boss(몸), parts(보스 부품), spin(부품 돌림), bossC(보스 얼굴 중심), walk(걸음 7종 — 규칙, fogs.js), names(층 띠·시험용 이름) }. 없는 던전은 pipe(기존 모양). 지오메트리는 처음 쓸 때 한 번만 만들어 둠(fogs.js).
   · 11-27 던전 개선(대표 OK): 1층 A = bubble 슬롯 / 2층 B = clump 슬롯 / 3층 C = echo 슬롯 — 던전마다 A·B·C 색·실루엣·걸음이 다르고 던전 바닥과 대비되게. 보스 3체 교체(세포 졸린 뜀틀 안개·허조교 잠꾸러기 나팔 안개·모쉬 꺼진 DJ 큐브), 황동 태엽은 파이프 굴 「큰 침묵 안개」만.
   · 걸음(walk) 7종 = float(둥실, 기존) · hop(박마다 한 칸) · zig(S 자) · roll(똑바로 굴러오다 벽에 튕김) · spin(제자리 빙글 → 짧게 접근) · dash(짧게 달렸다 멈춤) · march(줄 행진 = 허조교 line 규칙). 전부 난수 호출 0(시간·자리만). 규칙이라 REC_V 8 */
(function () {
  'use strict';
  const TG = window.TG, T = THREE;
  const LK = (TG.LOOKS = {});
  const BASE = { bubble: 0x9c98b8, clump: 0x8c88ac, echo: 0x6f94e4, boss: 0x77729a, parts: 0xffffff }; // 재질 몸 색(fogs.js 와 같아야 함). 보스는 던전 tint 가 몸 색

  // ── 정점 색 ──  hex 색 ÷ 몸 색(base) → 재질 색이 곱해지면 원하는 색이 됨
  const c0 = new T.Color(), c1 = new T.Color();
  function paint(g, hex, base) {
    const n = g.getAttribute('position').count, a = new Float32Array(n * 3);
    let r = 1, gg = 1, b = 1;
    if (hex != null) { c0.set(hex); c1.set(base == null ? 0xffffff : base); r = Math.min(2.4, c0.r / Math.max(0.05, c1.r)); gg = Math.min(2.4, c0.g / Math.max(0.05, c1.g)); b = Math.min(2.4, c0.b / Math.max(0.05, c1.b)); }
    for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; }
    g.setAttribute('color', new T.BufferAttribute(a, 3));
    return g;
  }
  // ── 도형 조각 ── 공통: (x,y,z) 자리, col = 색(없으면 몸 색), rot = [rx,ry,rz](자리 옮기기 전에 돌림), sc = [sx,sy,sz]
  const mk = (g, x, y, z, col, rot, sc) => { if (sc) g.scale(sc[0] || 1, sc[1] || 1, sc[2] || 1); if (rot) { if (rot[0]) g.rotateX(rot[0]); if (rot[1]) g.rotateY(rot[1]); if (rot[2]) g.rotateZ(rot[2]); } g.translate(x, y, z); g.userData.col = col; return g; };
  const P = {
    sph: (x, y, z, r, seg, col, sc) => mk(new T.SphereGeometry(r, seg || 8, Math.max(4, Math.round((seg || 8) * 0.72))), x, y, z, col, null, sc),
    half: (x, y, z, r, col, sy, seg) => mk(new T.SphereGeometry(r, seg || 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), x, y, z, col, null, [1, sy || 1, 1]), // 반구(헬멧)
    tor: (x, y, z, R, r, col, rot, seg) => mk(new T.TorusGeometry(R, r, seg && seg <= 10 ? 5 : 6, seg || 14), x, y, z, col, rot || [Math.PI / 2, 0, 0]), // 기본 = 바닥에 눕힘(축 y)
    cyl: (x, y, z, rt, rb, h, col, rot, seg) => mk(new T.CylinderGeometry(rt, rb, h, seg || 7), x, y, z, col, rot),
    tube: (x, y, z, rt, rb, h, col, rot, seg) => mk(new T.CylinderGeometry(rt, rb, h, seg || 12, 1, true), x, y, z, col, rot), // 뚜껑 없는 통(나팔 입)
    cone: (x, y, z, r, h, col, rot, seg) => mk(new T.ConeGeometry(r, h, seg || 8), x, y, z, col, rot),
    box: (x, y, z, s, col, rot) => mk(Array.isArray(s) ? new T.BoxGeometry(s[0], s[1], s[2]) : new T.BoxGeometry(s, s, s), x, y, z, col, rot),
    oct: (x, y, z, r, col, sc, rot) => mk(new T.OctahedronGeometry(r, 0), x, y, z, col, rot, sc), // 거울 조각
    ico: (x, y, z, r, col) => mk(new T.IcosahedronGeometry(r, 1), x, y, z, col), // 각진 미러볼(면마다 법선 → 반짝 조각)
    star: (x, y, z, R, r, d, col, n, rz) => { // 별(윤곽 돌출) — n 꼭짓점, R 바깥·r 안쪽, d 두께
      const s = new T.Shape(); n = n || 5;
      for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : R; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: d * 0.35, bevelSize: R * 0.1, bevelSegments: 2, curveSegments: 1 });
      g.translate(0, 0, -d / 2);
      return mk(g, x, y, z, col, [0, 0, rz || 0]);
    },
  };
  // 조각들을 한 지오메트리로 (정점 색 포함). base = 그 재질의 몸 색
  function merge(parts, base) {
    const gs = parts.map((g) => { const ng = g.index ? g.toNonIndexed() : g; return g.userData.vc ? g : paint(ng, g.userData.col, base); }); // 11-27 vc = 이미 정점 색을 가진 조각(미러볼 타일 격자)
    for (const g of gs) for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color' && k !== 'uv') g.deleteAttribute(k);
    const m = T.BufferGeometryUtils.mergeGeometries(gs, false);
    m.computeBoundingSphere();
    return m;
  }
  // 11-27 미러볼 타일 격자(쎄니 보스): 공 표면 전체를 작은 정사각 거울 타일로 — 위도 띠 nb 줄 × 띠마다 경도 칸(적도 nl칸, 극으로 갈수록 줄여 타일이 정사각에 가깝게). 타일 = 안쪽 평평한 거울(살짝 도드라짐) + 둘레 줄눈(어두운 테) 사다리꼴 4장.
  //   한 지오메트리(정점 색 포함, 몸 메시와 merge → 드로콜 0 추가). 색은 칸 번호 해시(난수 X, 규칙과 무관). cols = 거울 색 목록(뒤쪽일수록 드묾), grout = 줄눈 색, base = 재질 몸 색
  function DISCO(cx, cy, cz, R, nb, nl, cols, accents, grout, base, sy) {
    const pos = [], col = [], nrm = [], uv = [], q = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
    const toC = (hex) => { c0.set(hex); c1.set(base); return [Math.min(2.4, c0.r / Math.max(0.05, c1.r)), Math.min(2.4, c0.g / Math.max(0.05, c1.g)), Math.min(2.4, c0.b / Math.max(0.05, c1.b))]; };
    const GC = toC(grout), CS = cols.map(toC), AC = accents.map(toC), FC = toC(cols[0]), FG = toC(0xa4a2b8);
    const pt = (la, lo, r) => [cx + Math.cos(la) * Math.sin(lo) * r, cy + Math.sin(la) * r * (sy || 1), cz + Math.cos(la) * Math.cos(lo) * r];
    const tri = (a, b, c, cc) => { e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); q.crossVectors(e1, e2).normalize(); for (const v of [a, b, c]) { pos.push(v[0], v[1], v[2]); col.push(cc[0], cc[1], cc[2]); nrm.push(q.x, q.y, q.z); uv.push(0, 0); } };
    const quad = (a, b, c, d, cc) => { tri(a, b, c, cc); tri(a, c, d, cc); }; // a-b-c-d 반시계(바깥에서 볼 때)
    const hs = (i, j) => { let x = Math.imul((i * 73856093) ^ (j * 19349663), 0x9e3779b1); x ^= x >>> 15; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; return (x >>> 0) / 4294967296; };
    const f = 0.14; // 줄눈 폭(타일 한 변의 비율)
    for (let i = 0; i < nb; i++) {
      const la0 = -Math.PI / 2 + (i / nb) * Math.PI, la1 = -Math.PI / 2 + ((i + 1) / nb) * Math.PI, n = Math.max(6, Math.round(nl * Math.cos((la0 + la1) / 2)));
      for (let j = 0; j < n; j++) {
        const lo0 = (j / n) * Math.PI * 2, lo1 = ((j + 1) / n) * Math.PI * 2, il0 = la0 + (la1 - la0) * f, il1 = la1 - (la1 - la0) * f, io0 = lo0 + (lo1 - lo0) * f, io1 = lo1 - (lo1 - lo0) * f, Ri = R * 1.012;
        const O = [pt(la0, lo0, R), pt(la0, lo1, R), pt(la1, lo1, R), pt(la1, lo0, R)], I = [pt(il0, io0, Ri), pt(il0, io1, Ri), pt(il1, io1, Ri), pt(il1, io0, Ri)];
        const lm = (la0 + la1) / 2, om = (lo0 + lo1) / 2, front = Math.cos(lm) * Math.cos(om) * 0.9 + Math.sin(lm) * 0.1; // 얼굴 쪽(+z 앞면): 줄눈을 옅게·거울을 밝은 은색 한 톤으로 → 삐진 눈썹·입이 격자에 묻히지 않게
        const fz = front > 0.55, h = hs(i, j), cc = fz ? FC : h < 0.09 ? AC[(hs(j, i) * AC.length) | 0] : CS[Math.min(CS.length - 1, (Math.pow(hs(j + 7, i + 3), 1.4) * CS.length) | 0)], gc = fz ? FG : GC;
        quad(I[0], I[1], I[2], I[3], cc);
        quad(O[0], O[1], I[1], I[0], gc); quad(O[1], O[2], I[2], I[1], gc); quad(O[2], O[3], I[3], I[2], gc); quad(O[3], O[0], I[0], I[3], gc);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.userData.vc = true; return g;
  }
  // 기존 안개 구름 조각(fogs.js blob 과 같은 값) — 파이프 굴 = 기존 모양
  const blob = (parts, base) => merge(parts.map(([x, y, z, r, big, sy]) => P.sph(x, y, z, r, big || 7, null, sy ? [1, sy, 1] : null)), base);

  // ── 던전별 모양 표 ── (좌표는 기존 안개 크기 기준: 방울 반지름 약 0.66 · 뭉치 가운데 (0,0.82) · 보스 얼굴 중심 (0,2.015,0.13), 보스 몸 반지름 약 1.95)
  const DISCO_SY = 1.0; // 미러볼 공 세로 비율(그림만) — 캡처 보고 맞춤
  const CREAM = 0xf6e7c9, RED = 0xe5352b, BRASS = 0xe0ae2c, OLIVE_D = 0x4f5530, STRAP = 0x7a6a3a, TIRE = 0x3a3a44, HUB = 0x8c8c96, CYAN = 0x9ff6ff, STARY = 0xfff4b0, SILVER = 0xe6eaf4, ROD = 0x9aa0b8, LEAF = 0x7fcf6a, STEM = 0x8a5a36, BERRY = 0xff6f9c;
  const PINK = 0xff8ac8, PINK2 = 0xff5fa0, WOOD = 0xc9a46a, SKY = 0x9fd0f0, GRAY_L = 0xd8dbe0, NAVY = 0x4a3d96, INK = 0x24243a, MINT = 0xa8ffe0, LIME = 0xa6e07a, YEL = 0xffe27a;
  // 공통 부품: 황동 태엽(큰 침묵 안개 표시 — 11-27 파이프 굴만) · 둘레 고리 16칸
  const KEY = () => [P.cyl(0, 4.95, 0, 0.17, 0.17, 1.3, 0xd9a92e, null, 8), P.cyl(0, 4.55, 0, 0.34, 0.4, 0.22, 0xb8862a, null, 10), P.tor(-0.5, 6.0, 0, 0.44, 0.15, BRASS, [0, 0, 0]), P.tor(0.5, 6.0, 0, 0.44, 0.15, BRASS, [0, 0, 0])];
  const RING = (fn) => { const out = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; out.push(...fn(Math.cos(a) * 3.12, Math.sin(a) * 3.12, i, a)); } return out; };

  LK.pipe = { name: '안개 구름(기존)', names: { bubble: '안개 방울', clump: '안개 뭉치', echo: '메아리 안개' }, walk: { bubble: 'float', clump: 'float', echo: 'float' },
    bubble: (b) => blob([[0, 0.02, 0, 0.66, 12, 0.93], [0.5, -0.2, -0.06, 0.34], [-0.5, -0.2, -0.06, 0.34], [0.14, 0.5, -0.12, 0.31], [-0.22, 0.44, -0.14, 0.27], [0, -0.06, -0.6, 0.3]], b),
    echo: (b) => blob([[0, 0.02, 0, 0.68, 14, 0.96], [0.42, -0.34, -0.05, 0.3], [-0.42, -0.34, -0.05, 0.3], [0, 0.72, -0.05, 0.2], [0.05, 1.0, -0.05, 0.11]], b),
    clump: (b) => blob([[0, 0.82, 0.06, 0.86, 14, 0.95], [0.78, 0.6, -0.1, 0.56], [-0.78, 0.6, -0.1, 0.56], [0.42, 1.42, -0.18, 0.5], [-0.4, 1.38, -0.15, 0.52], [0, 1.6, -0.3, 0.42], [0, 0.45, -0.62, 0.6]], b),
    boss: (b) => { const bp = [[0, 1.55, 0.1, 1.5], [1.35, 1.2, -0.2, 1.0], [-1.35, 1.2, -0.2, 1.0], [0.85, 2.5, -0.3, 0.95], [-0.85, 2.45, -0.3, 0.98], [0, 2.85, -0.5, 0.9], [1.75, 0.55, 0.15, 0.62], [-1.75, 0.55, 0.15, 0.62], [0, 0.55, -1.0, 1.0], [1.0, 0.5, 0.9, 0.55], [-1.0, 0.5, 0.9, 0.55]]; return blob(bp.map(([x, y, z, r], i) => [x * 1.3, y * 1.3, z * 1.3, r * 1.3, i === 0 ? 24 : 14]), b); },
    parts: () => RING((x, z, i) => [P.sph(x, 1.0, z, i % 2 ? 0.26 : 0.36, 8, i % 2 ? 0x8f8ca2 : 0xbcb9cc, [1, 0.84, 1])]).concat([P.tor(0, 1.0, 0, 3.12, 0.13, 0x7b7890, null, 40)], KEY()), spin: true, // 기존 회색 구슬 고리 + 황동 태엽
  };
  // 세포 「메아리 체조 돔」(크림 매트 위라 빨강·황동·분홍으로 대비): A 콩콩 공 안개(빨강 체조 공, hop) · B 훌라후프 안개(크림 몸 + 황동 고리, zig) · C 리본 안개(분홍 + 리본 막대, dash) · 보스 졸린 뜀틀 안개(뜀틀 3단 위에 앉은 큰 안개 + 황동 호루라기 목걸이)
  LK.sefo_dome = { name: '체조 공 안개', names: { bubble: '콩콩 공 안개', clump: '훌라후프 안개', echo: '리본 안개' }, walk: { bubble: 'hop', clump: 'zig', echo: 'dash' },
    bubble: (b) => merge([P.sph(0, 0.02, 0, 0.66, 12, RED, [1, 0.95, 1]), P.tor(0, 0.0, 0, 0.64, 0.085, CREAM, [Math.PI / 2 - 0.22, 0, 0], 18), P.sph(0.3, 0.6, -0.12, 0.22, 7, CREAM), P.sph(-0.28, 0.58, -0.14, 0.2, 7, CREAM), P.sph(0, -0.06, -0.6, 0.28, 7, RED)], b),
    echo: (b) => merge([P.sph(0, 0.02, 0, 0.6, 14, PINK, [1, 0.96, 1]), P.sph(0.4, -0.32, -0.05, 0.26, 7, PINK), P.sph(-0.4, -0.32, -0.05, 0.26, 7, PINK), P.cyl(0.62, 0.62, -0.1, 0.03, 0.03, 0.95, ROD, [0, 0, -0.55], 5),
      P.sph(0.98, 1.12, -0.15, 0.2, 6, PINK2, [1, 0.45, 1.9]), P.sph(1.22, 0.82, -0.18, 0.19, 6, PINK2, [1.1, 0.45, 1.8]), P.sph(1.1, 0.46, -0.2, 0.18, 6, PINK2, [1, 0.45, 1.7]), P.sph(0.78, 0.22, -0.22, 0.17, 6, PINK2, [1.2, 0.45, 1.5])], b), // 분홍 몸 + 리본 막대(3마디 리본)
    clump: (b) => merge([P.sph(0, 0.85, 0.05, 0.9, 14, CREAM, [1, 0.95, 1]), P.tor(0, 0.78, 0.05, 1.32, 0.11, BRASS, [1.15, 0, 0.35], 26), P.sph(0.78, 0.5, -0.1, 0.5, 8, CREAM), P.sph(-0.78, 0.5, -0.1, 0.5, 8, CREAM), P.sph(0, 0.45, -0.62, 0.55, 8, CREAM), P.sph(0.35, 1.68, -0.3, 0.26, 7, RED), P.sph(-0.4, 1.62, -0.25, 0.24, 7, RED)], b), // 크림 몸 + 비스듬한 큰 황동 훌라후프 + 빨간 솜방울
    boss: (b) => merge([P.box(0, 0.4, 0, [4.6, 0.8, 3.2], WOOD), P.box(0, 1.2, 0, [4.2, 0.8, 3.0], RED), P.box(0, 2.0, 0, [3.8, 0.8, 2.8], CREAM), P.box(0, 2.8, 0, [3.5, 0.8, 2.6], RED), P.box(0, 3.6, 0, [3.2, 0.8, 2.4], CREAM), P.box(0, 4.08, 0, [3.4, 0.22, 2.6], 0xd9543f), P.box(0, 4.24, 0, [3.0, 0.12, 2.2], 0x5aa7d9),
      P.sph(2.5, 3.2, 0.2, 0.62, 10, CREAM), P.sph(-2.5, 3.2, 0.2, 0.62, 10, CREAM), P.cyl(2.0, 3.0, 0.3, 0.1, 0.1, 1.1, BRASS, [0, 0, -0.9], 6), P.cyl(-2.0, 3.0, 0.3, 0.1, 0.1, 1.1, BRASS, [0, 0, 0.9], 6),
      P.tor(0, 1.75, 1.3, 1.1, 0.06, BRASS, [0.25, 0, 0], 22), P.cyl(0.1, 0.9, 1.75, 0.2, 0.2, 0.55, BRASS, [0, 0, Math.PI / 2], 8), P.sph(0.4, 0.9, 1.75, 0.28, 8, BRASS)], b), // 11-27 재작업: 몸 = 거대 뜀틀 탑(나무·빨강·크림 5단 사다리꼴 + 위 매트) + 솜방울 팔 + 황동 호루라기 목걸이 — 안개 몸 없음
    parts: () => [P.sph(0, 4.75, 0.1, 0.5, 10, RED), P.tor(0, 4.75, 0.1, 0.5, 0.07, CREAM, [Math.PI / 2 - 0.3, 0, 0], 16), P.cone(1.3, 4.9, -0.4, 0.3, 0.7, BRASS, [0, 0, -1.1], 8)], spin: true, // 위에 체조 공·작은 확성기가 빙글(고리·태엽 없음)
  };
  // 허조교 「연병장 지하」(카키 바닥이라 밝은 회색·검정 타이어·하늘색으로 대비): A 행진 안개(밝은 회색 몸 + 올리브 헬멧, march) · B 타이어 굴림 안개(타이어 몸·얼굴은 허브, roll) · C 통신병 안개(하늘색 몸 + 파란 헬멧·안테나, spin) · 보스 잠꾸러기 나팔 안개(큰 황동 나팔 속 안개 + 헬멧) — 호루라기·구령·타이어만, 총·무기 0
  const HELMET = (x, y, z, r, col) => [P.half(x, y, z, r, col || OLIVE_D, 0.62), P.tor(x, y + 0.02, z, r * 0.98, r * 0.11, col || OLIVE_D, null, 20), P.tor(x, y - r * 0.5, z, r * 1.02, r * 0.06, STRAP, [Math.PI / 2 + 0.4, 0, 0], 16)];
  const TIRE_W = (x, y, z, R, r, ry) => [P.tor(x, y, z, R, r, TIRE, [0, ry, 0], 10), P.cyl(x, y, z, R * 0.48, R * 0.48, r * 0.9, HUB, [0, ry, Math.PI / 2], 6)]; // 서 있는 바퀴(축 = ry 방향)
  LK.gunner_camp = { name: '헬멧 안개', names: { bubble: '행진 안개', clump: '타이어 굴림 안개', echo: '통신병 안개' }, walk: { bubble: 'march', clump: 'roll', echo: 'spin' },
    bubble: (b) => merge([P.sph(0, 0.02, 0, 0.66, 12, GRAY_L, [1, 0.93, 1]), P.sph(0.5, -0.2, -0.06, 0.32, 7, GRAY_L), P.sph(-0.5, -0.2, -0.06, 0.32, 7, GRAY_L), P.sph(0, -0.06, -0.6, 0.3, 7, GRAY_L)].concat(HELMET(0, 0.36, -0.02, 0.62)), b),
    echo: (b) => merge([P.sph(0, 0.02, 0, 0.68, 14, SKY, [1, 0.96, 1]), P.sph(0.42, -0.34, -0.05, 0.3, 7, SKY), P.sph(-0.42, -0.34, -0.05, 0.3, 7, SKY), P.cyl(0.32, 1.0, -0.12, 0.035, 0.035, 0.62, 0x5c5c66, null, 5), P.sph(0.32, 1.33, -0.12, 0.09, 6, RED)].concat(HELMET(0, 0.36, -0.02, 0.64, 0x3f6fa0)), b), // 통신병: 파란 헬멧 + 안테나
    clump: (b) => merge([P.tor(0, 0.9, 0.0, 0.92, 0.4, TIRE, [0, 0, 0], 20), P.cyl(0, 0.9, 0.0, 0.56, 0.56, 0.62, HUB, [Math.PI / 2, 0, 0], 10), P.tor(0, 0.9, 0.34, 0.3, 0.05, 0x5a5a66, [0, 0, 0], 10), P.sph(0, 0.9, -0.52, 0.5, 8, TIRE)].concat(HELMET(0, 1.55, 0.0, 0.5)), b), // 서 있는 큰 타이어(얼굴은 허브) + 작은 헬멧
    boss: (b) => merge([P.cyl(0, 1.5, 0, 1.55, 1.55, 4.6, 0x6f7538, [0, 0, Math.PI / 2], 18), P.tor(2.3, 1.5, 0, 1.55, 0.14, BRASS, [0, Math.PI / 2, 0], 24), P.tor(-2.3, 1.5, 0, 1.55, 0.14, BRASS, [0, Math.PI / 2, 0], 24), P.tor(0, 1.5, 0, 1.58, 0.1, BRASS, [0, Math.PI / 2, 0], 24), P.cyl(2.35, 1.5, 0, 1.4, 1.4, 0.1, CREAM, [0, 0, Math.PI / 2], 16), P.cyl(-2.35, 1.5, 0, 1.4, 1.4, 0.1, CREAM, [0, 0, Math.PI / 2], 16),
      P.box(0, 0.5, 0, [5.2, 0.5, 2.4], 0x565e3e), P.tor(2.75, 0.75, 0.9, 0.7, 0.3, TIRE, [0, Math.PI / 2, 0], 14), P.tor(-2.75, 0.75, 0.9, 0.7, 0.3, TIRE, [0, Math.PI / 2, 0], 14), P.tor(2.75, 0.75, -0.9, 0.7, 0.3, TIRE, [0, Math.PI / 2, 0], 14), P.tor(-2.75, 0.75, -0.9, 0.7, 0.3, TIRE, [0, Math.PI / 2, 0], 14),
      P.tube(0, 3.9, 0.9, 1.3, 0.4, 2.0, BRASS, [Math.PI / 2 + 0.5, 0, 0], 14), P.cyl(0, 3.6, -0.9, 0.4, 0.4, 2.0, BRASS, [Math.PI / 2 + 0.5, 0, 0], 8), P.tor(0, 4.4, -1.6, 0.5, 0.25, BRASS, [0, Math.PI / 2, 0], 12)].concat(HELMET(0, 4.4, 0.6, 1.0, OLIVE_D)), b), // 11-27 재작업: 몸 = 낮고 넓은 행진 북 수레(가로 큰 북 + 타이어 4 + 위 황동 나팔 + 헬멧) — 안개 몸 없음
    parts: () => [P.cyl(0, 3.3, -2.2, 0.06, 0.06, 2.6, 0x6a6f7a, null, 6), P.box(0.55, 4.3, -2.2, [1.1, 0.7, 0.06], 0x9aa24f), P.sph(0, 4.7, -2.2, 0.14, 6, 0xe8c84a), P.sph(1.6, 2.9, 0.3, 0.22, 6, 0xe8c84a), P.sph(-1.6, 2.9, 0.3, 0.22, 6, 0xe8c84a)], spin: false, // 깃발 기둥·북채 구슬(돌지 않음, 고리·태엽 없음)
  };
  // 모쉬 「거울 네온 미로」(남색 바닥·유리 소품이라 안개는 불투명 진한 색): A 거울 큐브 안개(진한 남보라 큐브, float·튕김 체인) · B 깜깜 큐브(검정 큰 큐브, hop·불 끄기) · C 거울 조각 유성(민트 팔면체 + 꼬리, dash) · 보스 꺼진 DJ 큐브(헤드폰 + 턴테이블 2개)
  const CUBE = (x, y, z, s, col) => [P.box(x, y, z, s, col), P.sph(x, y, z, s * 0.63, 12, col)];
  LK.moshee_mirror = { name: '네온 큐브 안개', names: { bubble: '거울 큐브 안개', clump: '깜깜 큐브', echo: '거울 조각 유성' }, walk: { bubble: 'float', clump: 'hop', echo: 'dash' },
    bubble: (b) => merge(CUBE(0, 0.02, 0, 1.0, NAVY).concat([P.box(0.5, 0.56, -0.2, 0.34, CYAN, [0.5, 0.6, 0]), P.box(-0.48, -0.42, -0.3, 0.28, CYAN, [0.4, 0.3, 0])]), b),
    echo: (b) => merge([P.oct(0, 0.02, 0, 0.9, MINT, [1, 1.15, 1]), P.oct(0.5, 0.62, -0.2, 0.3, CYAN, [1, 1.2, 1], [0, 0.4, 0]), P.oct(0, 0.08, -0.95, 0.34, 0xd8fff4, [1, 1.1, 1]), P.oct(0, 0.16, -1.45, 0.24, 0xeefffa, [1, 1.1, 1]), P.oct(0, 0.22, -1.82, 0.15, 0xffffff)], b), // 민트 거울 조각 + 흰 꼬리(유성)
    clump: (b) => merge(CUBE(0, 0.85, 0.05, 1.42, INK).concat(CUBE(0.95, 0.42, -0.2, 0.72, INK), CUBE(-0.95, 0.42, -0.15, 0.72, INK), [P.box(0.42, 1.72, -0.3, 0.34, CYAN, [0.5, 0.7, 0]), P.box(-0.5, 1.6, -0.2, 0.26, 0xff9ce8, [0.3, 0.3, 0]), P.box(0, 0.85, 0.78, [0.5, 0.08, 0.06], CYAN), P.box(0, 0.6, 0.78, [0.5, 0.08, 0.06], CYAN)]), b), // 검정 큰 큐브(반 켜진 픽셀 줄) + 작은 큐브 둘
    boss: (b) => { const R = [-0.2, 0, 0], T2 = (x, y, z, g) => { g.rotateX(R[0]); return g; }; return merge([P.box(0, 2.3, -0.3, [3.6, 4.6, 2.2], 0x3a3a5c, R), P.box(0, 2.3, 0.5, [3.3, 4.3, 0.6], 0x4a4a74, R), P.tor(1.0, 1.35, 1.0, 0.8, 0.14, 0x9a9ab8, [R[0], 0, 0], 20), P.tor(-1.0, 1.35, 1.0, 0.8, 0.14, 0x9a9ab8, [R[0], 0, 0], 20), P.cone(1.0, 1.35, 0.95, 0.68, 0.5, 0x202030, [Math.PI / 2 + R[0], 0, 0], 16), P.cone(-1.0, 1.35, 0.95, 0.68, 0.5, 0x202030, [Math.PI / 2 + R[0], 0, 0], 16),
      P.tor(0.9, 3.3, 1.0, 0.6, 0.11, 0x9a9ab8, [R[0], 0, 0], 18), P.tor(-0.9, 3.3, 1.0, 0.6, 0.11, 0x9a9ab8, [R[0], 0, 0], 18), P.box(0, 4.3, 1.0, [2.4, 0.18, 0.1], CYAN, R), P.box(0, 0.55, 1.1, [2.6, 0.22, 0.1], 0xff9ce8, R),
      P.box(0, 4.75, -0.6, [3.4, 0.3, 2.0], 0x8a8ab0, R), P.cyl(-0.8, 4.98, -0.6, 0.85, 0.85, 0.1, 0x22223a, [R[0], 0, 0], 20), P.cyl(-0.8, 5.05, -0.6, 0.28, 0.28, 0.06, 0xff9ce8, [R[0], 0, 0], 12), P.box(0.9, 4.98, -0.6, [1.0, 0.12, 1.2], 0x30304a, R), P.box(0.7, 5.08, -0.3, 0.16, CYAN, R), P.box(1.1, 5.08, -0.3, 0.16, 0xff9ce8, R),
      P.tor(0, 2.3, -0.3, 2.3, 0.2, 0x8a8ab0, [0, 0, 0], 26), P.cyl(2.2, 2.3, -0.3, 0.6, 0.6, 0.5, 0x8a8ab0, [0, 0, Math.PI / 2], 12), P.cyl(-2.2, 2.3, -0.3, 0.6, 0.6, 0.5, 0x8a8ab0, [0, 0, Math.PI / 2], 12)], b); }, // 11-27 재작업: 몸 = 뒤로 기울인 대형 스피커 캐비닛(앞 우퍼 2개가 눈 자리·트위터·LED 줄) + 위 턴테이블·믹서 + 헤드폰 — 큐브 안개 몸 없음
    parts: () => [P.cyl(0, 5.5, -0.9, 1.1, 1.1, 0.1, 0x22223a, null, 24), P.cyl(0, 5.58, -0.9, 0.36, 0.36, 0.06, CYAN, null, 12), P.box(0.9, 5.56, -0.9, [0.12, 0.05, 0.4], 0xe0e8ff)], spin: true, // 위 LP 판이 빙글(고리·태엽 없음)
  };
  // 쎄니 「별빛 댄스홀」(어두운 보라 타일이라 금·은·시안으로 대비): A 노랑 별 안개(금빛 별 + 보라 몸, spin) · B 미러볼 안개(은빛 미러볼 + 분홍 몸, zig) · C 유성 별(시안 4각 별 + 파란 몸 + 흰 꼬리, dash) · 보스 삐진 먹구름(유지)
  LK.sseni_hall = { name: '별 안개', names: { bubble: '노랑 별 안개', clump: '미러볼 안개', echo: '유성 별' }, walk: { bubble: 'spin', clump: 'zig', echo: 'dash' },
    bubble: (b) => merge([P.sph(0, 0.0, 0, 0.5, 12, 0x7a5ad0), P.star(0, 0.0, 0, 0.98, 0.5, 0.42, 0xffd23f, 5), P.sph(0, -0.02, -0.5, 0.3, 7, 0x7a5ad0)], b), // 금빛 별 + 보라 몸
    echo: (b) => merge([P.sph(0, 0.0, 0, 0.56, 14, 0x3f8fd6), P.star(0, 0.0, 0, 1.08, 0.58, 0.46, 0x9ff4ff, 4, 0.785), P.star(0.55, 0.75, -0.15, 0.3, 0.14, 0.2, 0xffffff, 4), P.sph(0, -0.02, -0.5, 0.32, 7, 0x3f8fd6), P.sph(0, 0.05, -0.95, 0.2, 6, 0xffffff), P.sph(0, 0.1, -1.3, 0.12, 6, 0xffffff)], b), // 시안 4각 별 + 파란 몸 + 흰 꼬리
    clump: (b) => merge([P.ico(0, 0.85, 0.05, 0.95, 0xf4f6ff), P.cyl(0, 1.95, 0.05, 0.04, 0.04, 0.5, ROD, null, 5), P.tor(0, 2.22, 0.05, 0.14, 0.05, ROD, [0, 0, 0], 10), P.sph(0, 0.4, -0.55, 0.5, 8, PINK), P.star(0.95, 1.1, -0.2, 0.3, 0.14, 0.2, 0xffd23f, 5), P.star(-0.9, 0.5, -0.2, 0.26, 0.12, 0.18, 0xffd23f, 5)], b), // 은빛 미러볼 + 분홍 몸 + 금 별
    boss: (b) => merge([DISCO(0, 2.3, 0.1, 2.25, 14, 28, [0xc4c8d6, 0xaeb3c4, 0xd6d9e4, 0x989db0, 0xe8ebf2, 0x83889c], [0xd98cbc, 0x9c7ad8, 0xc28be0], 0x3e3a55, b, DISCO_SY), P.cyl(0, 5.1, 0.1, 0.12, 0.12, 1.4, ROD, null, 6), P.tor(0, 6.0, 0.1, 0.42, 0.1, 0xb8bcd4, [0, 0, 0], 12), P.cyl(0, 6.9, 0.1, 0.07, 0.07, 1.6, ROD, null, 6), P.tor(0, 7.8, 0.1, 0.3, 0.08, 0xb8bcd4, [0, 0, 0], 10),
      P.sph(0, 2.3 + 2.25 * DISCO_SY + 0.05, 0.1, 0.42, 10, 0xd9a92e, [1, 0.45, 1]), P.tor(0, 2.3 + 2.25 * DISCO_SY, 0.1, 0.5, 0.08, 0xd9a92e, null, 16)], b), // 11-27 밤 손질(대표: 흰 달걀 같음): 몸 = 둥근 공 전체를 작은 정사각 거울 타일 격자(14띠 × 적도 28칸 = 256칸 — 정점 9,492 로 모양 하나 상한 10,000 안, 은·연회색 + 분홍·보라 몇 칸, 어두운 줄눈)로 덮은 꺼진 미러볼 + 금 고리 + 줄 — 한 지오메트리(드로콜 그대로)
    parts: () => { const out = [], cols = [0xff9ccb, 0xa46bff, 0x9ff4ff, 0xffffff, 0xffd23f]; for (let k = 0; k < 12; k++) { const la = -0.9 + (k % 4) * 0.55, lo = (k * 2.399) % 6.283, r = 2.62, x = Math.cos(la) * Math.sin(lo) * r, y = 2.3 + Math.sin(la) * r * DISCO_SY, z = 0.1 + Math.cos(la) * Math.cos(lo) * r; out.push(P.box(x, y, z, [0.2, 0.2, 0.04], cols[k % 5], [la, lo, 0.785])); } return out.concat([P.star(2.9, 3.6, 0.3, 0.34, 0.15, 0.2, STARY, 5), P.star(-2.8, 1.4, 0.4, 0.3, 0.13, 0.2, STARY, 5), P.star(0.6, 4.9, 1.6, 0.26, 0.12, 0.18, STARY, 5)]); }, spin: true, // 11-27 밤: 큰 색 조각 30장 → 작은 반짝 빛 조각 12개(공에서 조금 떨어져 빙글) + 별 3
    bossC: [0, 2.3, 0.1],
  };
  // 베리 「베리 과수원」(연두 잔디·분홍 꽃이라 열매 색 연두·분홍·노랑으로): A 씨앗 안개(연두 씨앗, hop) · B 열매 송이 뭉치(분홍 몸 + 열매, roll) · C 새싹 메아리(노랑 몸 + 새싹, float) · 보스 잠꾸러기 큰 나무(유지)
  LK.berri_orchard = { name: '씨앗·열매 안개', names: { bubble: '씨앗 안개', clump: '열매 송이 뭉치', echo: '새싹 메아리' }, walk: { bubble: 'hop', clump: 'roll', echo: 'float' },
    bubble: (b) => merge([P.sph(0, 0.0, 0, 0.64, 12, LIME, [1, 1.08, 1]), P.cyl(0, 0.74, 0, 0.05, 0.07, 0.26, STEM, null, 6), P.sph(0.3, 0.8, -0.02, 0.3, 8, LEAF, [1.5, 0.22, 0.75]), P.sph(0, -0.06, -0.55, 0.26, 7, LIME)], b), // 연두 씨앗: 꼭지 + 잎 하나
    echo: (b) => merge([P.sph(0, 0.0, 0, 0.66, 14, YEL, [1, 0.98, 1]), P.cyl(0, 0.82, 0, 0.05, 0.06, 0.5, LEAF, null, 6), P.sph(0.34, 1.02, 0, 0.32, 8, LEAF, [1.6, 0.2, 0.8]), P.sph(-0.34, 1.07, 0, 0.32, 8, LEAF, [1.6, 0.2, 0.8]), P.sph(0.42, -0.34, -0.05, 0.28, 7, YEL), P.sph(-0.42, -0.34, -0.05, 0.28, 7, YEL)], b), // 노랑 새싹
    clump: (b) => merge([P.sph(0, 0.95, 0.05, 0.86, 14, PINK), P.sph(0.78, 0.5, -0.05, 0.6, 10, BERRY), P.sph(-0.78, 0.5, -0.05, 0.6, 10, BERRY), P.cyl(0, 1.95, 0, 0.06, 0.08, 0.36, STEM, null, 6), P.sph(0.42, 2.0, -0.05, 0.36, 8, LEAF, [1.6, 0.22, 0.8]), P.sph(-0.4, 1.9, -0.05, 0.32, 8, LEAF, [1.5, 0.22, 0.8]), P.sph(0, 0.45, -0.62, 0.5, 8, PINK)], b), // 분홍 열매 송이
    boss: (b) => merge([P.cone(0, 2.9, 0.1, 2.3, 2.4, null, null, 14), P.cone(0, 4.1, 0.0, 1.7, 2.0, 0x95cc74, null, 12), P.cone(0, 5.2, -0.1, 1.1, 1.7, 0x7fb864, null, 10), P.sph(0, 6.1, -0.1, 0.32, 8, 0xf2d26a), P.sph(1.2, 3.0, 1.4, 0.42, 8, BERRY), P.sph(-1.5, 3.4, 0.9, 0.38, 8, BERRY), P.sph(0.3, 4.5, 1.1, 0.34, 8, BERRY), P.sph(-0.6, 5.3, 0.7, 0.3, 8, BERRY), P.sph(1.9, 2.5, -0.5, 0.34, 8, BERRY), P.sph(-1.9, 2.3, 0.3, 0.36, 8, BERRY)], b), // 11-27 재작업: 수관 = 층층 뾰족 나무 3단(둥근 안개 모양 X) + 열매·꼭대기 별
    parts: () => [P.cyl(0, 1.0, 0.1, 0.6, 0.95, 2.2, STEM, null, 10), P.sph(0.85, 0.08, 0.5, 0.38, 7, STEM, [1, 0.5, 1]), P.sph(-0.8, 0.08, 0.55, 0.36, 7, STEM, [1, 0.5, 1]), P.sph(0.1, 0.06, -0.9, 0.38, 7, STEM, [1, 0.5, 1]), P.cyl(1.0, 2.3, 0.5, 0.12, 0.2, 1.1, STEM, [0, 0, -0.75], 6), P.cyl(-0.95, 2.3, 0.4, 0.12, 0.2, 1.1, STEM, [0, 0, 0.75], 6),
      P.sph(1.1, 3.4, 1.0, 0.3, 8, BERRY), P.sph(-1.4, 3.0, 0.9, 0.28, 8, BERRY), P.sph(0.4, 2.3, 1.45, 0.3, 8, BERRY), P.sph(-0.3, 4.3, 0.7, 0.27, 8, BERRY), P.sph(2.0, 2.3, 0.5, 0.26, 8, BERRY), P.sph(-2.1, 2.6, -0.1, 0.26, 8, BERRY), P.sph(0.9, 4.6, -0.2, 0.26, 8, BERRY), P.sph(-0.9, 1.75, 0.95, 0.25, 8, BERRY)], spin: false, // 줄기·뿌리·가지·열매는 돌지 않음
    bossC: [0, 2.9, 0.1],
  };
  // 지오메트리 만들기: kind = bubble|clump|echo|boss|parts. base = 재질 몸 색(보스는 던전 tint). 외곽선 법선까지 붙여 돌려줌
  LK.build = function (id, kind, base) {
    const L = LK[id] && LK[id].bubble ? LK[id] : LK.pipe;
    const b = base != null ? base : BASE[kind];
    let g = kind === 'parts' ? merge(L.parts(), BASE.parts) : L[kind](b);
    TG.R.addOutlineNormals(g);
    return g;
  };
  LK.get = (id) => (LK[id] && LK[id].bubble ? LK[id] : LK.pipe);
  LK.ids = () => Object.keys(LK).filter((k) => LK[k] && LK[k].bubble);
  LK.walk = (id, kind) => { const L = LK.get(id); return (L.walk && L.walk[kind]) || 'float'; }; // 걸음(규칙) — game.js spawnGroup 이 생성 때 한 번 읽음
  LK._kit = { P, merge, blob, RING, paint, DISCO, BASE, mk }; // 11-28 주민 던전(js/looks_res.js)이 같은 도형 도우미를 씀 — 동작 변화 0
})();
