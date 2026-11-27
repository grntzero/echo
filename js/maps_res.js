/* 에코 제로 — 주민 던전 맵 3개 (2026-11-28 주민던전, 던전 아트 작업자 · 설계 `_AI/작업/게임_톱니골던전/주민3명_20261128/던전설계.md` 대표 OK 그대로)
   · js/maps.js 바로 뒤. maps.js 틀(AR.mapKit)·arena.js 도우미(AR.kit add/addFar/mergeLists)를 그대로 씀 — 전부 기본 도형 + 캔버스 텍스처(크레딧 0)
   · 규칙 0 변경: 충돌 자리(AR.SPOTS)·범위 공통, 그 자리에 설계서 소품(그림은 충돌 반지름 안). 남쪽 벽 ≤ 1.6. 층별 그룹 1개씩(flGroup/flMesh). 꾸밈 난수는 TG.fr/fra 만
   · 규칙 장치 자리(game.js 와 맞춤): POY 다이얼 발판 = AR.vents2[0..2](바닥 격자 자리, 밟는 납작한 판) · 구석 AR.vents 4곳 = 김 나는 밸브 · KILLATON 정글 북 = 스피커 자리 6곳 · LOKI 말풍선 구멍 = 분출구 자리 */
(function () {
  'use strict';
  const TG = window.TG, T = THREE;
  const AR = TG.AR, PI = Math.PI;
  if (!AR || !AR.mapKit) return;
  const MK = AR.mapKit, { start, floor, deco, ground, center, finish, flGroup, flMesh, walls, groundShadows, barMid, seeded } = MK;
  // 자리 + 방향(ry) 기준 지역 좌표 → 세계 좌표
  const L = (x, z, ry, lx, lz) => [x + Math.cos(ry) * lx + Math.sin(ry) * lz, z - Math.sin(ry) * lx + Math.cos(ry) * lz];
  const halfG = () => new T.CylinderGeometry(1, 1, 1, 16, 1, false, PI / 2, PI); // 반원 판(rx = PI/2 면 위 반원이 +z 를 봄)

  // ═══ ① POY 「다이얼 기관실」 — 회백색 금속판·연초록 눈금 원 3겹·나무 줄, 북 계기판 벽·동서 흰 파이프·남 난간, 흰 기계 함·다이얼 노브·페이더 레일·압력계·초록 신호등·김 밸브·다이얼 발판(vents2 0~2), 가운데 메인 콘솔
  AR.mapBuilders.push(function (scene) {
    const K = AR.kit, R = TG.R, { box, cyl, cylBig, sph } = K.geos, add = K.add, addFar = K.addFar, S = AR.SPOTS;
    const { g, rec } = start(scene, 'poy_dial');
    const WH = 0xeef1f4, WH2 = 0xdfe4e8, SIL = 0xc4cbd3, SIL2 = 0x9aa3ad, STEEL = 0x66707a, MINT = 0x5fd38a, MINTD = 0x2f9a5c, CREAM = 0xf4ecd8, INK = 0x2a3238, LAMP_OFF = 0x4d6b5a;
    const GLOW = { hex: 0x7dffb0, k: 1.8 }, FACE_ON = { hex: 0xfff8e4, k: 1.25 };
    const tex = R.canvasTex(512, 512, (c) => { // 금속판(4칸) + 판 사이 짙은 나무 줄 + 리벳
      const rnd = seeded(31);
      c.fillStyle = '#5a3e28'; c.fillRect(0, 0, 512, 512);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const x = i * 128, y = j * 128;
        c.fillStyle = ['#8e9896', '#87918f', '#949e9b'][(rnd() * 3) | 0]; c.fillRect(x + 2, y + 2, 124, j % 2 ? 108 : 124);
        if (j % 2) { for (let k = 0; k < 3; k++) { c.fillStyle = ['#6a4a30', '#5a3e28', '#72503a'][k]; c.fillRect(x, y + 110 + k * 6, 128, 6); } c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 63, y + 110, 2, 18); }
        c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x + 2, y + 2, 124, 3);
        c.fillStyle = 'rgba(60,70,70,0.10)'; for (let k = 0; k < 18; k++) c.fillRect(x + 6 + rnd() * 110, y + 6 + rnd() * 90, 10 + rnd() * 20, 2);
        c.fillStyle = '#b4bcba'; [[10, 10], [118, 10], [10, j % 2 ? 100 : 118], [118, j % 2 ? 100 : 118]].forEach(([a, b2]) => { c.beginPath(); c.arc(x + a, y + b2, 3.2, 0, 6.3); c.fill(); });
        c.fillStyle = 'rgba(40,50,50,0.35)'; [[10, 10], [118, 10]].forEach(([a, b2]) => { c.beginPath(); c.arc(x + a + 1, y + b2 + 1, 3.2, 0, 3.2); c.fill(); });
      }
    }, { repeat: true });
    rec.floorMat = floor(g, tex, K.W / 8, K.D / 8, 'vec3(0.24, 0.27, 0.26)');
    const tp = S.tower;
    deco(g, (c, X, Z, u, w, h) => {
      groundShadows(c, X, Z, u, w, h, 0.32, '30,40,40');
      // 연초록 눈금 원 3겹(가운데 탑 자리 중심)
      [7.0, 10.2, 13.4].forEach((r, k) => { c.strokeStyle = 'rgba(95,211,138,' + (0.5 - k * 0.08) + ')'; c.lineWidth = 0.14 * u; c.beginPath(); c.arc(X(tp.x), Z(tp.z), r * u, 0, 6.3); c.stroke();
        const n = 36 + k * 12; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, l = i % 6 ? 0.35 : 0.8; c.lineWidth = (i % 6 ? 0.08 : 0.14) * u; c.beginPath(); c.moveTo(X(tp.x + Math.cos(a) * r), Z(tp.z + Math.sin(a) * r)); c.lineTo(X(tp.x + Math.cos(a) * (r + l)), Z(tp.z + Math.sin(a) * (r + l))); c.stroke(); } });
      // 다이얼 발판 3곳(vents2 0~2) 둘레 표시: 바깥 초록 원 + 「딸깍」 화살 고리
      S.vents2.slice(0, 3).forEach(([x, z]) => { const q = c.createRadialGradient(X(x), Z(z), 0.9 * u, X(x), Z(z), 2.4 * u); q.addColorStop(0, 'rgba(95,211,138,0.35)'); q.addColorStop(1, 'rgba(95,211,138,0)'); c.fillStyle = q; c.beginPath(); c.arc(X(x), Z(z), 2.4 * u, 0, 6.3); c.fill();
        c.strokeStyle = 'rgba(47,154,92,0.8)'; c.lineWidth = 0.12 * u; c.beginPath(); c.arc(X(x), Z(z), 1.75 * u, -2.6, 1.6); c.stroke();
        c.fillStyle = 'rgba(47,154,92,0.85)'; const a = 1.6, px = X(x + Math.cos(a) * 1.75), pz = Z(z + Math.sin(a) * 1.75); c.beginPath(); c.moveTo(px - 0.35 * u, pz - 0.25 * u); c.lineTo(px + 0.1 * u, pz + 0.4 * u); c.lineTo(px + 0.38 * u, pz - 0.3 * u); c.closePath(); c.fill(); });
      // 벽 따라 노란·흰 안전 줄(옅게) + 보스 자리 원
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.1 * u; c.setLineDash([0.8 * u, 0.6 * u]); c.strokeRect(X(-18.6), Z(-12.6), 37.2 * u, 25.2 * u); c.setLineDash([]);
      c.strokeStyle = 'rgba(95,211,138,0.55)'; c.lineWidth = 0.16 * u; c.beginPath(); c.arc(X(0), Z(1), 4.0 * u, 0, 6.3); c.stroke();
    });
    ground(g, 0x8c9694);
    // 벽: 북 = 계기판 벽(반원 계기 6개 — 바늘 0·불 꺼짐), 동서 = 흰 파이프 다발, 남 = 낮은 난간
    const GX = [-15, -9, -3, 3, 9, 15], gz = -K.fz + 0.4, gy = 1.75;
    walls((side, cx, cz, len, ry, h) => {
      if (side === 's') { add(STEEL, box, cx, 0.12, cz, ry, len, 0.24, 0.5); for (let x = -K.fx; x <= K.fx + 0.01; x += 2.6) add(SIL, cyl, x, 0.62, cz, 0, 0.07, 1.0, 0.07); [0.62, 1.12].forEach((y) => add(SIL, cyl, cx, y, cz, 0, 0.06, len, 0.06, 0, PI / 2)); add(MINT, box, cx, 1.15, cz, ry, len, 0.05, 0.14); return; }
      add(WH2, box, cx, h / 2, cz, ry, len + 1.0, h, 0.7); add(MINT, box, cx, h + 0.06, cz, ry, len + 1.1, 0.12, 0.78); add(STEEL, box, cx, 0.16, cz, ry, len + 1.0, 0.32, 0.76);
      if (side === 'n') { GX.forEach((x) => { add(SIL2, halfG(), x, gy - 0.6, gz, 0, 1.45, 0.16, 1.45, PI / 2, 0); add(CREAM, halfG(), x, gy - 0.6, gz + 0.1, 0, 1.25, 0.06, 1.25, PI / 2, 0); add(SIL2, box, x, gy - 0.66, gz + 0.06, 0, 2.95, 0.16, 0.2);
          for (let i = 0; i <= 10; i++) { const a = PI - (i / 10) * PI; add(i > 7 ? MINTD : INK, box, x + Math.cos(a) * 1.05, gy - 0.6 + Math.sin(a) * 1.05, gz + 0.14, 0, 0.05, i % 5 ? 0.14 : 0.26, 0.03, 0, a - PI / 2); }
          add(INK, box, x - 0.45, gy - 0.55, gz + 0.16, 0, 0.9, 0.06, 0.04, 0, 0.12); add(INK, cyl, x, gy - 0.6, gz + 0.15, 0, 0.1, 0.05, 0.1, PI / 2, 0); add(LAMP_OFF, sph, x, gy - 1.05, gz + 0.12, 0, 0.12); });
        for (let x = -18; x <= 18; x += 3) add(SIL, cyl, x, 3.1, gz, 0, 0.18, 0.6, 0.18); add(SIL, cyl, 0, 3.1, gz + 0.05, 0, 0.12, K.W, 0.12, 0, PI / 2); return; }
      const sx = cx < 0 ? 1 : -1; // 동서: 흰 파이프 다발 + 받침
      [0.7, 1.35, 2.0, 2.65].forEach((y, k) => add(k % 2 ? WH : 0xf8fafb, cyl, cx + sx * (0.5 + (k % 2) * 0.12), y, 0, 0, 0.26, len, 0.26, PI / 2, 0));
      for (let z = -12; z <= 12; z += 4) { add(SIL2, box, cx + sx * 0.55, 1.65, z, 0, 0.2, 2.6, 0.3); add(MINT, box, cx + sx * 0.82, 2.3, z, 0, 0.06, 0.3, 0.32); }
    }, 3.4, 1.2);
    { const rnd = seeded(71); // 멀리: 큰 기계(보일러 통·굴뚝 파이프·큰 톱니 판)
      for (let k = 0; k < 10; k++) { const a = PI + (k / 9) * PI, x = Math.cos(a) * 34, z = -6 + Math.sin(a) * 22, hh = 5 + rnd() * 5; addFar(k % 2 ? WH2 : SIL, cylBig, x, hh / 2, z, 0, 2 + rnd() * 1.5, hh, 2 + rnd() * 1.5); addFar(MINT, cylBig, x, hh + 0.1, z, 0, 2.2, 0.2, 2.2); addFar(SIL2, cyl, x, hh + 2, z, 0, 0.4, 4, 0.4); }
      for (let k = 0; k < 6; k++) addFar(k % 2 ? SIL : WH2, K.gearGeo(3.2, 2.5, 12, 0.6), -28 + k * 11, 9 + rnd() * 3, -26 - rnd() * 4, 0, 1, 1, 1, 0, rnd() * 0.5);
    }
    // 흰 기계 함(상자 자리)
    S.crates.forEach(([x, z, ry]) => { add(STEEL, box, x, 0.05, z, ry, 1.8, 0.1, 1.4); add(WH, box, x, 0.65, z, ry, 1.65, 1.15, 1.25); add(SIL, box, x, 1.27, z, ry, 1.72, 0.08, 1.32);
      [0.42, 0.6, 0.78].forEach((y) => { const [px, pz] = L(x, z, ry, -0.2, 0.63); add(0x7d8890, box, px, y, pz, ry, 0.8, 0.06, 0.03); });
      { const [px, pz] = L(x, z, ry, 0.55, 0.64); add(GLOW, sph, px, 0.95, pz, 0, 0.09); } { const [px, pz] = L(x, z, ry, 0.3, 0.64); add(LAMP_OFF, sph, px, 0.95, pz, 0, 0.08); }
      [-0.45, 0.45].forEach((lx) => { const [px, pz] = L(x, z, ry, lx, 0); add(SIL2, box, px, 1.42, pz, ry, 0.08, 0.22, 0.08); }); add(SIL2, box, x, 1.53, z, ry, 1.0, 0.07, 0.08); });
    // 세운 큰 다이얼 노브(스피커 자리)
    S.speakers.forEach(([x, z, ry], i) => { add(SIL2, cylBig, x, 0.07, z, 0, 0.98, 0.14, 0.98); for (let k = 0; k < 12; k++) { const a = (k / 12) * PI * 2; add(k % 3 ? 0xa9e8c0 : MINTD, box, x + Math.cos(a) * 0.9, 0.16, z + Math.sin(a) * 0.9, -a, 0.22, 0.04, 0.06); }
      add(SIL, new T.CylinderGeometry(0.7, 0.76, 1.3, 16), x, 0.8, z, i * 0.3, 1); add(WH, cyl, x, 1.5, z, 0, 0.6, 0.1, 0.6); add(MINT, new T.TorusGeometry(0.6, 0.04, 4, 18), x, 1.5, z, 0, 1, 1, 1, PI / 2, 0);
      { const a = ry + i; add(MINTD, box, x + Math.sin(a) * 0.3, 1.57, z + Math.cos(a) * 0.3, a, 0.1, 0.05, 0.5); } });
    // 페이더 레일(난간 자리)
    S.bars.forEach((b, i) => { const m = barMid(b); add(0x5f6a6e, box, m.x, 0.16, m.z, m.ry, 3.1, 0.32, 0.6); add(INK, box, m.x, 0.33, m.z, m.ry, 2.7, 0.03, 0.12);
      for (let k = -5; k <= 5; k++) add(k % 5 ? 0xb9c3c6 : MINT, box, m.x + m.dx * k * 0.25, 0.33, m.z + m.dz * k * 0.25, m.ry, 0.03, 0.02, k % 5 ? 0.3 : 0.45);
      const o = (i - 1) * 0.7; add(WH, box, m.x + m.dx * o, 0.55, m.z + m.dz * o, m.ry, 0.42, 0.42, 0.62); add(MINTD, box, m.x + m.dx * o, 0.77, m.z + m.dz * o, m.ry, 0.06, 0.03, 0.62); });
    // 압력계 기둥(화분 자리)
    S.planters.forEach(([x, z]) => { add(STEEL, cyl, x, 0.08, z, 0, 0.5, 0.16, 0.5); add(SIL, cyl, x, 0.7, z, 0, 0.14, 1.3, 0.14); add(SIL2, cyl, x, 1.45, z, 0, 0.46, 0.14, 0.46, PI / 2 - 0.5, 0); add(CREAM, cyl, x, 1.48, z + 0.05, 0, 0.38, 0.06, 0.38, PI / 2 - 0.5, 0); add(MINT, new T.TorusGeometry(0.42, 0.03, 4, 16), x, 1.48, z + 0.08, 0, 1, 1, 1, -0.5, 0); add(INK, box, x - 0.12, 1.52, z + 0.1, 0, 0.26, 0.04, 0.03, -0.5, 0.5); });
    // 초록 불 신호등 기둥(가로등 자리)
    S.lamps.forEach(([x, z, ry]) => { add(STEEL, cyl, x, 1.6, z, 0, 0.09, 3.2, 0.09); add(SIL2, cyl, x, 0.06, z, 0, 0.35, 0.12, 0.35); add(0x3c444c, box, x, 3.0, z, ry, 0.46, 1.1, 0.36);
      [[3.25, GLOW], [2.85, LAMP_OFF]].forEach(([y, col]) => { const [px, pz] = L(x, z, ry, 0, 0.2); add(col, sph, px, y, pz, 0, 0.15); }); add(WH, box, x, 3.6, z, ry, 0.56, 0.1, 0.46); });
    // 구석 김 밸브(AR.vents 4곳 — 충돌 턱): 파이프 + 손바퀴
    S.vents.forEach(([x, z]) => { add(SIL2, cylBig, x, 0.1, z, 0, 0.92, 0.2, 0.92); add(WH, cyl, x, 0.6, z, 0, 0.3, 1.0, 0.3); add(SIL, cyl, x, 1.12, z, 0, 0.42, 0.12, 0.42); add(MINT, new T.TorusGeometry(0.55, 0.07, 5, 16), x, 1.35, z, 0, 1, 1, 1, PI / 2, 0); add(SIL2, box, x, 1.35, z, 0, 1.1, 0.06, 0.08); add(SIL2, box, x, 1.35, z, PI / 2, 1.1, 0.06, 0.08); add(WH, cyl, x, 1.42, z, 0, 0.12, 0.12, 0.12); });
    // 다이얼 발판(AR.vents2 0~2 — 밟고 지나감, 납작 ≤ 0.1): 은 판 + 크림 눈금 면 + 초록 바늘 / vents2[3] = 작은 계기 판
    S.vents2.forEach(([x, z], i) => { if (i < 3) { add(SIL2, cylBig, x, 0.03, z, 0, 1.28, 0.06, 1.28); add(CREAM, cylBig, x, 0.065, z, 0, 1.08, 0.02, 1.08); add(MINT, new T.TorusGeometry(1.18, 0.04, 4, 30), x, 0.07, z, 0, 1, 1, 0.4, PI / 2, 0);
        for (let k = 0; k < 11; k++) { const a = PI * 0.75 + (k / 10) * PI * 1.5; add(k > 7 ? MINTD : INK, box, x + Math.cos(a) * 0.9, 0.08, z + Math.sin(a) * 0.9, -a, 0.24, 0.01, 0.05); }
        add(WH, cyl, x, 0.085, z, 0, 0.3, 0.03, 0.3); add(MINTD, box, x - 0.28, 0.09, z + 0.28, PI / 4, 0.08, 0.01, 0.75); }
      else { add(SIL2, cylBig, x, 0.025, z, 0, 0.92, 0.05, 0.92); add(MINT, new T.TorusGeometry(0.8, 0.04, 4, 24), x, 0.055, z, 0, 1, 1, 0.4, PI / 2, 0); } });
    K.mergeLists(g, null);
    // 가운데: 메인 콘솔(턴테이블 2·큰 크로스페이더·노브 줄) + 뒤 큰 VU 계기판
    { add(SIL2, cylBig, tp.x, 0.2, tp.z, 0, 4.1, 0.4, 4.1); add(MINT, new T.TorusGeometry(4.1, 0.1, 5, 40), tp.x, 0.42, tp.z, 0, 1, 1, 1, PI / 2, 0); add(WH2, cylBig, tp.x, 0.48, tp.z, 0, 3.4, 0.12, 3.4);
      add(WH, box, tp.x, 1.05, tp.z + 0.4, 0, 5.8, 1.1, 2.2); add(MINT, box, tp.x, 0.7, tp.z + 1.52, 0, 5.8, 0.1, 0.04); add(SIL, box, tp.x, 1.7, tp.z + 0.35, 0, 6.0, 0.22, 2.4, -0.18, 0);
      [-1.75, 1.75].forEach((x) => { add(INK, cyl, tp.x + x, 1.88, tp.z + 0.4, 0, 0.82, 0.1, 0.82, -0.18, 0); add(SIL, cyl, tp.x + x, 1.95, tp.z + 0.4, 0, 0.32, 0.06, 0.32, -0.18, 0); add(MINT, cyl, tp.x + x, 1.99, tp.z + 0.4, 0, 0.12, 0.04, 0.12, -0.18, 0); add(SIL2, box, tp.x + x + 0.65, 2.0, tp.z + 0.1, 0.5, 0.08, 0.08, 0.9, -0.18, 0); });
      add(INK, box, tp.x, 1.86, tp.z + 1.05, 0, 1.4, 0.04, 0.14, -0.18, 0); add(WH, box, tp.x + 0.2, 1.95, tp.z + 1.05, 0, 0.3, 0.2, 0.38, -0.18, 0); add(MINTD, box, tp.x + 0.2, 2.06, tp.z + 1.05, 0, 0.04, 0.02, 0.38, -0.18, 0);
      for (let k = 0; k < 6; k++) add(k % 2 ? MINT : WH, cyl, tp.x - 0.75 + k * 0.3, 1.9, tp.z - 0.25, 0, 0.1, 0.16, 0.1, -0.18, 0);
      add(SIL2, box, tp.x, 2.5, tp.z - 1.35, 0, 4.4, 3.4, 0.4); add(WH, box, tp.x, 2.55, tp.z - 1.12, 0, 4.0, 3.0, 0.1);
      add(CREAM, halfG(), tp.x, 2.0, tp.z - 1.05, 0, 1.5, 0.06, 1.5, PI / 2, 0); add(INK, box, tp.x - 0.55, 2.4, tp.z - 1.0, 0, 1.3, 0.07, 0.04, 0, 0.6); add(INK, cyl, tp.x, 2.0, tp.z - 1.0, 0, 0.14, 0.05, 0.14, PI / 2, 0);
      for (let i = 0; i <= 12; i++) { const a = PI - (i / 12) * PI; add(i > 8 ? MINTD : INK, box, tp.x + Math.cos(a) * 1.25, 2.0 + Math.sin(a) * 1.25, tp.z - 1.02, 0, 0.05, i % 4 ? 0.16 : 0.3, 0.03, 0, a - PI / 2); }
      [-1.6, 1.6].forEach((x) => { add(SIL, cyl, tp.x + x, 3.55, tp.z - 1.05, 0, 0.3, 0.12, 0.3, PI / 2, 0); add(LAMP_OFF, sph, tp.x + x, 3.55, tp.z - 0.98, 0, 0.18); });
      [-2.6, 2.6].forEach((x) => { add(WH, cyl, tp.x + x, 2.5, tp.z - 1.6, 0, 0.28, 5.0, 0.28); add(MINT, cyl, tp.x + x, 4.4, tp.z - 1.6, 0, 0.32, 0.12, 0.32); });
    }
    center(g, rec);
    { // 층별: 1층 바늘 0·불 꺼짐 → 2층 계기 절반 켜짐 + 천장 파이프 초록 불 줄 → 3층 전부 켜짐 + 바닥 눈금 고리가 박자에 한 칸씩 돎 → 보스 초록 스포트 + 바닥 큰 눈금 원 밝게
      const lit = (list) => list.forEach((x, k) => { add(FACE_ON, halfG(), x, gy - 0.6, gz + 0.13, 0, 1.18, 0.02, 1.18, PI / 2, 0); const a = PI * (0.25 + 0.18 * ((k * 7) % 3)); add(MINTD, box, x + Math.cos(a) * 0.45, gy - 0.6 + Math.sin(a) * 0.45, gz + 0.17, 0, 0.9, 0.06, 0.04, 0, a); add(GLOW, sph, x, gy - 1.05, gz + 0.14, 0, 0.13); for (let i = 8; i <= 10; i++) { const b = PI - (i / 10) * PI; add(GLOW, box, x + Math.cos(b) * 1.05, gy - 0.6 + Math.sin(b) * 1.05, gz + 0.16, 0, 0.06, 0.16, 0.03, 0, b - PI / 2); } });
      const pipes = () => { add(GLOW, box, 0, 3.0, -K.fz + 0.4, 0, K.W - 1, 0.07, 0.06); [-K.fx + 0.45, K.fx - 0.45].forEach((x) => add(GLOW, box, x, 3.0, 0, 0, 0.06, 0.07, K.D - 1)); };
      lit([GX[0], GX[2], GX[4]]); pipes(); flMesh(flGroup(g, rec, 'half'));
      lit(GX); pipes(); S.crates.forEach(([x, z, ry]) => { const [px, pz] = L(x, z, ry, 0.3, 0.645); add(GLOW, sph, px, 0.95, pz, 0, 0.085); }); S.lamps.forEach(([x, z, ry]) => { const [px, pz] = L(x, z, ry, 0, 0.21); add({ hex: 0xb8ffd0, k: 1.6 }, sph, px, 2.85, pz, 0, 0.15); }); flMesh(flGroup(g, rec, 'all'));
      for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; add(i % 4 ? { hex: 0x9cebb8, k: 1.3 } : GLOW, box, Math.cos(a) * 8.6, 0.03, Math.sin(a) * 8.6, -a, i % 4 ? 0.7 : 1.2, 0.03, 0.14); }
      const ringM = flMesh(flGroup(g, rec, 'ring')); if (ringM) ringM.position.set(tp.x, 0, tp.z); rec.ringM = ringM;
      add(GLOW, new T.TorusGeometry(4.6, 0.14, 5, 48), 0, 0.06, 1, 0, 1, 1, 1, PI / 2, 0); add({ hex: 0xb8ffd0, k: 1.6 }, new T.TorusGeometry(3.4, 0.08, 4, 40), 0, 0.06, 1, 0, 1, 1, 1, PI / 2, 0);
      add(SIL2, cyl, tp.x, 8.6, tp.z + 1.5, 0, 0.1, 3, 0.1); add(STEEL, new T.CylinderGeometry(0.9, 0.55, 1.0, 12), tp.x, 7.0, tp.z + 1.5, 0, 1); add(GLOW, new T.CylinderGeometry(0.78, 0.78, 0.1, 12), tp.x, 6.48, tp.z + 1.5, 0, 1); flMesh(flGroup(g, rec, 'spot'));
      rec.flShow = [null, [], ['half'], ['all', 'ring'], ['all', 'spot']];
      rec.flLook = [null, { hemi: 1.0, sun: 1.02, sunCol: 0xf2fff6 }, { hemi: 1.0, sun: 1.0, sunCol: 0xeafff2 }, { hemi: 1.02, sun: 1.04, sunCol: 0xf0fff4 }, { hemi: 0.92, sun: 0.86, sunCol: 0xd4ffe4 }];
      rec.onFloor = (n) => { rec.fl3 = n; };
    }
    rec.ambient = (dt, t) => { // 구석 밸브 흰 김 + 3층 눈금 고리 딸깍(박마다 7.5°) — 꾸밈 난수 fr 만
      rec.t = (rec.t || 0) + dt; if (rec.t > 1.1) { rec.t = 0; const v = S.vents[(TG.fr() * S.vents.length) | 0]; TG.FX.steam(v[0], v[1], 1.45, rec.fl3 === 1 ? 0.6 : 0.85); }
      if (rec.ringM) { const k = (t || 0) * 2, f = k - Math.floor(k); rec.ringM.rotation.y = -(Math.floor(k) + Math.min(1, f / 0.15)) * (PI / 24); }
    };
    finish(rec);
  });

  // ═══ ② LOKI 「말풍선 객차」 — 나무 마루·노란 안전선·남색 카펫, 북 창문 줄(창밖 풍경 흐름)·동서 연결 문·남 좌석 등받이, 여행 가방·2인 좌석·손잡이 봉·짐칸 기둥·손잡이 고리·말풍선 구멍, 가운데 운전석 겸 방송 부스
  AR.mapBuilders.push(function (scene) {
    const K = AR.kit, R = TG.R, { box, cyl, cylBig, sph } = K.geos, add = K.add, addFar = K.addFar, S = AR.SPOTS;
    const { g, rec } = start(scene, 'loki_train');
    const YEL = 0xffc21c, YEL2 = 0xffd65a, NAVY = 0x2f3a7a, NAVY2 = 0x4a5cb0, RED = 0xe5352b, GOLD = 0xe0ae2c, CREAM = 0xfff3d6, BROWN = 0xa8743f, INK = 0x24243a;
    const tex = R.canvasTex(512, 512, (c) => { // 나무 마루(가로 판자) + 못 자국
      const rnd = seeded(52);
      for (let j = 0; j < 16; j++) { const y = j * 32, off = (j % 2) * 96; for (let i = -1; i < 3; i++) { const x = i * 256 + off; c.fillStyle = ['#c99a62', '#bf8f58', '#d2a46c', '#c49560'][(rnd() * 4) | 0]; c.fillRect(x, y, 256, 32);
          c.strokeStyle = 'rgba(120,80,40,0.18)'; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + 6, y + 6 + k * 9 + rnd() * 3); c.bezierCurveTo(x + 80, y + 4 + k * 9, x + 170, y + 12 + k * 9, x + 250, y + 6 + k * 9); c.stroke(); }
          c.fillStyle = 'rgba(80,50,25,0.55)'; c.fillRect(x, y, 2, 32); c.fillStyle = 'rgba(70,45,25,0.5)'; [10, 22].forEach((yy) => { c.beginPath(); c.arc(x + 8, y + yy, 1.8, 0, 6.3); c.fill(); }); }
        c.fillStyle = 'rgba(70,40,20,0.45)'; c.fillRect(0, y + 30, 512, 2); c.fillStyle = 'rgba(255,240,210,0.15)'; c.fillRect(0, y, 512, 2); }
    }, { repeat: true });
    rec.floorMat = floor(g, tex, K.W / 8, K.D / 8, 'vec3(0.45, 0.30, 0.17)');
    deco(g, (c, X, Z, u, w, h) => {
      groundShadows(c, X, Z, u, w, h, 0.3, '60,35,15');
      c.fillStyle = 'rgba(47,58,122,0.72)'; c.fillRect(X(-20), Z(-14), 40 * u, 3.3 * u); c.fillRect(X(-20), Z(10.9), 40 * u, 3.1 * u); // 양쪽 남색 카펫 띠
      c.fillStyle = 'rgba(255,214,90,0.35)'; for (let x = -19; x < 20; x += 2) { c.fillRect(X(x), Z(-11.6), 1.0 * u, 0.16 * u); c.fillRect(X(x), Z(11.5), 1.0 * u, 0.16 * u); }
      c.strokeStyle = 'rgba(255,194,28,0.92)'; c.lineWidth = 0.28 * u; [-9.4, 9.6].forEach((z) => { c.beginPath(); c.moveTo(X(-19.5), Z(z)); c.lineTo(X(19.5), Z(z)); c.stroke(); }); // 노란 안전선 2줄
      c.fillStyle = 'rgba(36,36,58,0.55)'; [-9.4, 9.6].forEach((z) => { for (let x = -19; x < 19.5; x += 1.4) c.fillRect(X(x), Z(z) - 0.06 * u, 0.6 * u, 0.12 * u); });
      c.fillStyle = 'rgba(255,194,28,0.55)'; [[-12, 0], [12, 0], [-3.5, -7], [5, 7.5]].forEach(([x, z], k) => { const s = k % 2 ? -1 : 1; c.beginPath(); c.moveTo(X(x + s * 1.3), Z(z)); c.lineTo(X(x), Z(z - 0.8)); c.lineTo(X(x), Z(z - 0.3)); c.lineTo(X(x - s * 1.4), Z(z - 0.3)); c.lineTo(X(x - s * 1.4), Z(z + 0.3)); c.lineTo(X(x), Z(z + 0.3)); c.lineTo(X(x), Z(z + 0.8)); c.closePath(); c.fill(); }); // 진행 방향 화살표
      c.strokeStyle = 'rgba(255,243,214,0.7)'; c.lineWidth = 0.18 * u; c.setLineDash([0.6 * u, 0.4 * u]); c.beginPath(); c.arc(X(0), Z(1), 4.2 * u, 0, 6.3); c.stroke(); c.setLineDash([]);
    });
    ground(g, 0x6b4a2e);
    // 창밖 풍경 띠(북쪽 창 뒤, 천천히 흐름 — 텍스처 offset, 그림만)
    const land = R.canvasTex(1024, 256, (c) => {
      const q = c.createLinearGradient(0, 0, 0, 256); q.addColorStop(0, '#a9dcff'); q.addColorStop(1, '#e8f7ff'); c.fillStyle = q; c.fillRect(0, 0, 1024, 256);
      const rnd = seeded(9); c.fillStyle = 'rgba(255,255,255,0.95)'; for (let k = 0; k < 7; k++) { const x = rnd() * 1024, y = 30 + rnd() * 50; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + j * 22, y + (j % 2) * 6, 18 + rnd() * 8, 0, 6.3); c.fill(); } }
      c.fillStyle = '#9fd27f'; c.beginPath(); c.moveTo(0, 190); for (let x = 0; x <= 1024; x += 64) c.quadraticCurveTo(x + 32, 140 + Math.sin(x * 0.02) * 22, x + 64, 180); c.lineTo(1024, 256); c.lineTo(0, 256); c.fill();
      c.fillStyle = '#7fc06a'; c.beginPath(); c.moveTo(0, 215); for (let x = 0; x <= 1024; x += 128) c.quadraticCurveTo(x + 64, 180, x + 128, 210); c.lineTo(1024, 256); c.lineTo(0, 256); c.fill();
      for (let k = 0; k < 9; k++) { const x = 40 + k * 112 + rnd() * 30, hh = 26 + rnd() * 18; c.fillStyle = ['#ff8a7a', '#ffd65a', '#8fb8ff', '#ffb3d9'][k % 4]; c.fillRect(x, 205 - hh, 34, hh); c.fillStyle = ['#c84a3a', '#2f3a7a', '#e5352b'][k % 3]; c.beginPath(); c.moveTo(x - 4, 205 - hh); c.lineTo(x + 17, 205 - hh - 16); c.lineTo(x + 38, 205 - hh); c.fill(); c.fillStyle = '#fff6d0'; c.fillRect(x + 12, 205 - hh + 8, 10, 10); }
      for (let k = 0; k < 14; k++) { const x = rnd() * 1024; c.fillStyle = '#8a5a36'; c.fillRect(x + 6, 212, 5, 18); c.fillStyle = k % 2 ? '#4fae5a' : '#62b85e'; c.beginPath(); c.arc(x + 8, 206, 13, 0, 6.3); c.fill(); }
      c.fillStyle = '#d8b48a'; c.fillRect(0, 236, 1024, 6); c.fillStyle = '#9a6a3e'; for (let x = 0; x < 1024; x += 24) c.fillRect(x, 228, 4, 18);
    }, { repeat: true });
    land.repeat.set(3, 1);
    { const pm = new T.MeshBasicMaterial({ map: land }); const pl = new T.Mesh(new T.PlaneGeometry(K.W + 6, 2.3), pm); pl.position.set(0, 2.35, -K.fz - 0.28); g.add(pl); rec.land = land; }
    // 벽: 북 = 창문 줄(아래 벽·기둥·위 벽), 동서 = 연결 문, 남 = 좌석 등받이 줄(≤ 1.4)
    walls((side, cx, cz, len, ry, h) => {
      if (side === 's') { add(NAVY, box, cx, 0.35, cz, ry, len, 0.7, 0.6); for (let x = -18; x <= 18.1; x += 3) { add(NAVY2, box, x, 0.95, cz - 0.05, 0, 2.6, 0.75, 0.42); add(YEL, box, x, 1.36, cz - 0.05, 0, 2.7, 0.1, 0.5); add(0xe8e0f8, box, x, 1.12, cz - 0.28, 0, 0.9, 0.24, 0.04); } return; }
      if (side === 'n') { add(YEL, box, cx, 0.6, cz, ry, len + 1.0, 1.2, 0.6); add(RED, box, cx, 1.22, cz, ry, len + 1.0, 0.1, 0.66); add(YEL, box, cx, 3.85, cz, ry, len + 1.0, 1.1, 0.6); add(NAVY, box, cx, 3.35, cz + 0.02, ry, len + 1.0, 0.1, 0.64); add(GOLD, box, cx, 4.44, cz, ry, len + 1.1, 0.1, 0.7);
        for (let x = -20.5; x <= 20.6; x += 4.1) { add(YEL2, box, x, 2.3, cz, 0, 0.7, 2.1, 0.56); add(GOLD, box, x, 2.3, cz + 0.29, 0, 0.12, 2.1, 0.04); }
        for (let x = -18.45; x <= 18.5; x += 4.1) { add(CREAM, box, x, 1.32, cz + 0.32, 0, 3.4, 0.08, 0.12); add(0xf4f0e8, box, x, 3.28, cz + 0.32, 0, 3.4, 0.06, 0.08); } return; }
      add(YEL, box, cx, h / 2, cz, ry, len + 1.0, h, 0.6); add(NAVY, box, cx, 0.3, cz, ry, len + 1.0, 0.6, 0.66); add(GOLD, box, cx, h + 0.05, cz, ry, len + 1.1, 0.1, 0.7);
      const sx = cx < 0 ? 1 : -1; add(NAVY, box, cx + sx * 0.32, 1.75, 0, 0, 0.08, 3.5, 2.7); add(YEL2, box, cx + sx * 0.38, 1.7, 0, 0, 0.1, 3.3, 2.4); add(0x9fd0f6, cyl, cx + sx * 0.44, 2.4, 0, 0, 0.55, 0.06, 0.55, 0, PI / 2); add(GOLD, new T.TorusGeometry(0.58, 0.07, 5, 18), cx + sx * 0.45, 2.4, 0, PI / 2, 1, 1, 1); add(GOLD, sph, cx + sx * 0.48, 1.6, 0.85, 0, 0.12); add(GOLD, box, cx + sx * 0.4, 1.7, 0, 0, 0.04, 3.3, 0.06);
      for (let z = -11; z <= 11; z += 5.5) if (Math.abs(z) > 2) add(NAVY2, box, cx + sx * 0.33, 2.3, z, 0, 0.05, 1.2, 1.8); // 노선도 판
    }, 4.5, 1.4);
    { const rnd = seeded(33); // 멀리: 이웃 객차 지붕·전신주(남쪽 X)
      for (let k = 0; k < 2; k++) { const x = k ? 34 : -34; addFar(YEL, box, x, 2.2, -2, 0, 22, 4.4, 26); addFar(RED, box, x, 4.6, -2, 0, 22.4, 0.4, 26.4); }
      for (let k = 0; k < 8; k++) { const x = -40 + k * 11.5; addFar(0x8a5a36, cyl, x, 5, -24 - rnd() * 3, 0, 0.25, 10, 0.25); addFar(0x8a5a36, box, x, 9.3, -24, 0, 2.2, 0.2, 0.2); }
    }
    // 여행 가방 더미(상자 자리)
    S.crates.forEach(([x, z, ry], i) => { const c1 = [RED, NAVY2, BROWN][i % 3], c2 = [YEL2, RED, NAVY2][i % 3];
      add(c1, box, x, 0.38, z, ry, 1.55, 0.72, 1.05); add(CREAM, box, x, 0.38, z, ry, 1.57, 0.74, 0.1); { const [px, pz] = L(x, z, ry, 0.4, 0); add(CREAM, box, px, 0.38, pz, ry, 0.1, 0.74, 1.07); }
      add(c2, box, x + 0.05, 0.98, z - 0.05, ry + 0.25, 1.1, 0.48, 0.78); add(GOLD, new T.TorusGeometry(0.2, 0.045, 4, 10), x + 0.05, 1.27, z - 0.05, ry + 0.25, 1, 1, 1, 0, 0);
      { const [px, pz] = L(x, z, ry, -0.45, 0.53); add([0xfff3d6, 0x9fd0f6, 0x7fd06e][i % 3], cyl, px, 0.45, pz, ry, 0.16, 0.03, 0.16, PI / 2, 0); } });
    // 남색 2인 좌석(스피커 자리)
    S.speakers.forEach(([x, z, ry]) => { add(GOLD, box, x, 0.2, z, ry, 1.9, 0.4, 0.8); add(NAVY2, box, x, 0.52, z, ry, 2.0, 0.24, 0.95); { const [px, pz] = L(x, z, ry, 0, -0.42); add(NAVY2, box, px, 1.05, pz, ry, 2.0, 1.0, 0.24); add(YEL, box, px, 1.6, pz, ry, 2.06, 0.12, 0.3); add(0xe8e0f8, box, px, 1.35, pz + 0.01, ry, 0.7, 0.24, 0.27); } [-1.02, 1.02].forEach((lx) => { const [px, pz] = L(x, z, ry, lx, 0); add(YEL, box, px, 0.72, pz, ry, 0.12, 0.3, 0.9); }); add(NAVY, box, x, 0.65, z, ry, 0.04, 0.02, 0.9); });
    // 손잡이 봉(난간 자리)
    S.bars.forEach((b) => { const m = barMid(b); for (let i = -1; i <= 1; i++) { add(GOLD, cyl, m.x + m.dx * 1.2 * i, 1.2, m.z + m.dz * 1.2 * i, 0, 0.07, 2.4, 0.07); add(NAVY, cyl, m.x + m.dx * 1.2 * i, 0.05, m.z + m.dz * 1.2 * i, 0, 0.26, 0.1, 0.26); add(YEL, cyl, m.x + m.dx * 1.2 * i, 1.05, m.z + m.dz * 1.2 * i, 0, 0.1, 0.24, 0.1); } add(GOLD, cyl, m.x, 2.4, m.z, 0, 0.06, 2.6, 0.06, m.dx ? 0 : PI / 2, m.dx ? PI / 2 : 0); add(GOLD, cyl, m.x, 0.6, m.z, 0, 0.05, 2.5, 0.05, m.dx ? 0 : PI / 2, m.dx ? PI / 2 : 0); });
    // 짐칸 기둥(화분 자리)
    S.planters.forEach(([x, z], i) => { add(GOLD, cyl, x, 1.4, z, 0, 0.08, 2.8, 0.08); add(NAVY, cyl, x, 0.05, z, 0, 0.32, 0.1, 0.32); add(NAVY, box, x, 2.45, z, 0, 1.1, 0.08, 0.7); add(GOLD, box, x, 2.52, z, 0, 1.1, 0.06, 0.06); add([RED, NAVY2, BROWN, YEL2][i % 4], box, x + 0.1, 2.72, z, 0.2, 0.7, 0.4, 0.5); });
    // 천장 손잡이 고리 줄(가로등 자리): 기둥 + 위 봉 + 노란 고리 3
    S.lamps.forEach(([x, z, ry]) => { add(GOLD, cyl, x, 2.0, z, 0, 0.08, 4.0, 0.08); const [ax, az] = L(x, z, ry, 0, 0.6); add(GOLD, cyl, ax, 3.9, az, 0, 0.05, 2.6, 0.05, 0, PI / 2 + ry); add(GOLD, box, (x + ax) / 2, 3.95, (z + az) / 2, ry, 0.06, 0.06, 0.65);
      [-0.9, 0, 0.9].forEach((o) => { const [sx2, sz2] = L(x, z, ry, o, 0.6); add(CREAM, box, sx2, 3.6, sz2, ry, 0.05, 0.55, 0.05); add(YEL, new T.TorusGeometry(0.17, 0.045, 4, 12), sx2, 3.2, sz2, ry, 1, 1, 1); }); });
    // 말풍선 구멍(분출구 자리): 크림 말풍선 테 + 안쪽 + 「…」 / 안쪽 분출구 = 작은 말풍선 판
    const bubbleHole = (x, z, r, hgt) => { add(CREAM, cylBig, x, hgt / 2, z, 0, r, hgt, r * 0.82); add(0xe8d6b0, cylBig, x, hgt + 0.005, z, 0, r * 0.78, 0.02, r * 0.62); add(CREAM, new T.ConeGeometry(0.32 * r, 0.7 * r, 3), x - r * 0.55, hgt / 2, z + r * 0.75, 0.6, 1, 1, Math.min(1, hgt * 2.5), PI / 2, 0); [-0.32, 0, 0.32].forEach((o) => add(NAVY, cyl, x + o * r, hgt + 0.02, z, 0, 0.09 * r, 0.03, 0.09 * r)); };
    S.vents.forEach(([x, z]) => bubbleHole(x, z, 1.05, 0.16)); S.vents2.forEach(([x, z]) => bubbleHole(x, z, 0.85, 0.05));
    K.mergeLists(g, null);
    // 가운데: 운전석 겸 방송 부스 — 남색 단 + 노란 운전대 책상(계기·레버) + 금 마이크 스탠드 + 큰 말풍선 간판 「…」 + 뒤 꼬마 기관차 앞면
    { const tp = S.tower;
      add(NAVY, box, tp.x, 0.2, tp.z, 0, 7.2, 0.4, 5.2); add(GOLD, box, tp.x, 0.42, tp.z + 2.6, 0, 7.2, 0.06, 0.08); add(BROWN, box, tp.x, 0.45, tp.z, 0, 6.8, 0.06, 4.8);
      add(YEL, box, tp.x, 1.0, tp.z + 1.2, 0, 4.4, 1.1, 1.3); add(NAVY2, box, tp.x, 1.62, tp.z + 1.1, 0, 4.4, 0.16, 1.4, -0.25, 0); add(RED, box, tp.x, 0.62, tp.z + 1.86, 0, 4.4, 0.1, 0.04);
      [-1.3, -0.4, 0.5].forEach((x) => { add(0xfff3d6, cyl, tp.x + x, 1.75, tp.z + 1.0, 0, 0.26, 0.05, 0.26, -0.25, 0); add(INK, box, tp.x + x - 0.05, 1.78, tp.z + 1.0, 0, 0.2, 0.03, 0.03, -0.25, 0.6); });
      [1.3, 1.6].forEach((x, k) => { add(SILVER_C, cyl, tp.x + x, 2.0, tp.z + 1.05, 0, 0.05, 0.55, 0.05, -0.5 + k * 0.4, 0); add(k ? RED : GOLD, sph, tp.x + x, 2.27, tp.z + 1.0 - k * 0.1, 0, 0.11); });
      add(GOLD, cyl, tp.x - 2.6, 0.48, tp.z + 1.0, 0, 0.35, 0.06, 0.35); add(GOLD, cyl, tp.x - 2.6, 1.3, tp.z + 1.0, 0, 0.05, 1.7, 0.05); add(GOLD, cyl, tp.x - 2.45, 2.25, tp.z + 1.15, 0, 0.04, 0.5, 0.04, 0.6, 0); add(GOLD, sph, tp.x - 2.3, 2.42, tp.z + 1.32, 0, 0.22, 0.3, 0.22); add(NAVY, new T.TorusGeometry(0.2, 0.03, 4, 12), tp.x - 2.3, 2.3, tp.z + 1.32, 0, 1, 1, 1, PI / 2, 0);
      add(YEL2, box, tp.x, 2.1, tp.z - 1.4, 0, 3.8, 3.4, 1.8); add(NAVY, box, tp.x, 3.9, tp.z - 1.4, 0, 4.1, 0.24, 2.1); add(0x9fd0f6, cyl, tp.x - 0.9, 2.6, tp.z - 0.48, 0, 0.5, 0.05, 0.5, PI / 2, 0); add(0x9fd0f6, cyl, tp.x + 0.9, 2.6, tp.z - 0.48, 0, 0.5, 0.05, 0.5, PI / 2, 0); add(GOLD, new T.TorusGeometry(0.52, 0.06, 4, 16), tp.x - 0.9, 2.6, tp.z - 0.46, 0, 1); add(GOLD, new T.TorusGeometry(0.52, 0.06, 4, 16), tp.x + 0.9, 2.6, tp.z - 0.46, 0, 1);
      add(GOLD, cyl, tp.x + 2.4, 2.6, tp.z - 1.6, 0, 0.08, 4.4, 0.08); add(CREAM, sph, tp.x + 2.4, 5.0, tp.z - 1.6, 0, 1.6, 0.95, 0.35); add(CREAM, new T.ConeGeometry(0.3, 0.7, 4), tp.x + 1.7, 4.1, tp.z - 1.6, 0, 1, 1, 0.3, 0, 0.5); add(YEL, new T.TorusGeometry(1.6, 0.06, 4, 30), tp.x + 2.4, 5.0, tp.z - 1.25, 0, 1, 0.6, 1);
      [-0.5, 0, 0.5].forEach((o) => add(NAVY, sph, tp.x + 2.4 + o, 5.0, tp.z - 1.24, 0, 0.14, 0.14, 0.06));
    }
    center(g, rec);
    { // 층별: 1층 간판 「…」·창밖 천천히 → 2층 천장 손잡이 고리가 박자에 흔들(기울임 행렬) + 창밖 조금 빨리 → 3층 간판 「!」 불 + 천장 노란 줄 조명 → 보스 창밖 터널(어두운 띠·작은 불) + 운전석 앞 금빛 스포트
      const straps = () => { [-11.9].forEach((z) => { add(GOLD, cyl, 0, 0, z, 0, 0.05, K.W - 2, 0.05, 0, PI / 2); for (let x = -17.5; x <= 17.6; x += 1.75) { add(CREAM, box, x, -0.3, z, 0, 0.05, 0.6, 0.05); add(YEL, new T.TorusGeometry(0.17, 0.045, 4, 12), x, -0.72, z, 0, 1); } }); };
      straps(); const sm = flMesh(flGroup(g, rec, 'straps')); if (sm) { sm.position.y = 4.1; sm.matrixAutoUpdate = false; sm.updateMatrix(); } rec.strapM = sm;
      { const tp = S.tower; add({ hex: 0xff4d3a, k: 1.7 }, box, tp.x + 2.4, 5.12, tp.z - 1.22, 0, 0.2, 0.75, 0.06); add({ hex: 0xff4d3a, k: 1.7 }, sph, tp.x + 2.4, 4.55, tp.z - 1.22, 0, 0.13, 0.13, 0.05);
        add({ hex: 0xfff0a0, k: 1.7 }, box, 0, 4.3, -K.fz + 0.36, 0, K.W - 1, 0.1, 0.06); [-K.fx + 0.36, K.fx - 0.36].forEach((x) => add({ hex: 0xfff0a0, k: 1.7 }, box, x, 4.3, 0, 0, 0.06, 0.1, K.D - 1)); }
      flMesh(flGroup(g, rec, 'bang'));
      add(0x3a3a5c, box, 0, 2.35, -K.fz + 0.02, 0, K.W + 4, 2.25, 0.04); for (let x = -18; x <= 18; x += 4.1) add({ hex: 0xffd27a, k: 1.7 }, sph, x + 2, 2.9, -K.fz + 0.06, 0, 0.12, 0.12, 0.04);
      { const tp = S.tower; add(GOLD, cyl, tp.x, 8.4, tp.z + 2.6, 0, 0.1, 3, 0.1); add(NAVY, new T.CylinderGeometry(0.9, 0.55, 1.0, 12), tp.x, 6.8, tp.z + 2.6, 0, 1); add({ hex: 0xffe08a, k: 1.9 }, new T.CylinderGeometry(0.78, 0.78, 0.1, 12), tp.x, 6.28, tp.z + 2.6, 0, 1); }
      add({ hex: 0xffd65a, k: 1.6 }, new T.TorusGeometry(4.4, 0.13, 5, 48), 0, 0.06, 1, 0, 1, 1, 1, PI / 2, 0); flMesh(flGroup(g, rec, 'tunnel'));
      rec.flShow = [null, [], ['straps'], ['straps', 'bang'], ['tunnel']];
      rec.flLook = [null, { hemi: 1.0, sun: 1.04, sunCol: 0xfff4dc }, { hemi: 1.0, sun: 1.0, sunCol: 0xfff0d0 }, { hemi: 1.02, sun: 1.04, sunCol: 0xfff2c8 }, { hemi: 0.92, sun: 0.84, sunCol: 0xffe2a8 }];
      rec.onFloor = (n) => { rec.fln = n; };
    }
    rec.ambient = (dt, t) => { // 창밖 흐름 + 손잡이 고리 흔들(그림만)
      const sp = [0.025, 0.025, 0.05, 0.07, 0.12][rec.fln || 0]; if (rec.land) rec.land.offset.x = (rec.land.offset.x + dt * sp) % 1;
      if (rec.strapM && rec.strapM.parent && rec.strapM.parent.visible) { const k = Math.sin((t || 0) * PI * 2 * 1.1) * 0.22, m = rec.strapM.matrix; m.set(1, -k, 0, 0, 0, 1, 0, 4.1, 0, 0, 1, 0, 0, 0, 0, 1); rec.strapM.matrixWorldNeedsUpdate = true; }
    };
    finish(rec);
  });
  const SILVER_C = 0xc9d0d8;

  // ═══ ③ KILLATON 「정글 온실」 — 이끼 바닥·돌 징검 길·LP 연잎 무늬, 북 흰 유리 온실 벽·동서 덩굴 커튼·남 낮은 고사리, 나무 화분 상자·정글 북(스피커 자리 6)·쓰러진 통나무·라벤더 버섯·유리 랜턴 기둥·김 나는 웅덩이, 가운데 큰 나무 DJ 부스
  AR.mapBuilders.push(function (scene) {
    const K = AR.kit, R = TG.R, { box, cyl, cylBig, sph, ico, knob } = K.geos, add = K.add, addFar = K.addFar, S = AR.SPOTS;
    const { g, rec } = start(scene, 'killaton_jungle');
    const LEAF = 0x4fae5a, LEAF2 = 0x3f9a4e, LEAF3 = 0x7fd06e, WOOD = 0x9a6a3e, WOOD2 = 0x7a5232, WOOD_L = 0xc89a64, PERI = 0x8999e8, LAV = 0xc6a8ff, LAV2 = 0xa888ee, LP = 0x2a2533, GLASS = 0xe2f4ef, WHITE = 0xf6f8f4, STONE = 0xc8ccc4, SKIN_OFF = 0xa6a8b8, WATER = 0x86cfe0;
    const tex = R.canvasTex(512, 512, (c) => { // 이끼 초록 + 밝은 이끼 뭉치 + 작은 잎 결
      const rnd = seeded(17);
      c.fillStyle = '#5f9a5e'; c.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 300; k++) { c.fillStyle = rnd() < 0.5 ? 'rgba(60,120,60,0.30)' : 'rgba(140,200,110,0.28)'; c.beginPath(); c.arc(rnd() * 512, rnd() * 512, 4 + rnd() * 14, 0, 6.3); c.fill(); }
      for (let k = 0; k < 60; k++) { const x = rnd() * 512, y = rnd() * 512, a = rnd() * 6.3; c.fillStyle = rnd() < 0.5 ? 'rgba(120,190,100,0.55)' : 'rgba(70,140,70,0.5)'; c.beginPath(); c.ellipse(x, y, 9, 3.5, a, 0, 6.3); c.fill(); }
      c.fillStyle = 'rgba(198,168,255,0.35)'; for (let k = 0; k < 20; k++) { c.beginPath(); c.arc(rnd() * 512, rnd() * 512, 2.2, 0, 6.3); c.fill(); }
    }, { repeat: true });
    rec.floorMat = floor(g, tex, K.W / 8, K.D / 8, 'vec3(0.12, 0.30, 0.13)');
    const LPS = [[-12, 8.6], [-5, -9.5], [3.5, -10.6], [12.5, 7.2], [-15.5, -1.2], [16, 2.2], [9.5, -2.0], [-11, -6.5], [15.2, -10.0], [-17.2, 11.4]];
    deco(g, (c, X, Z, u, w, h) => {
      groundShadows(c, X, Z, u, w, h, 0.32, '20,50,20');
      const rnd = seeded(4);
      // 돌 징검 길: 남쪽 → 가운데, 동서로 갈래
      const path = []; for (let t = 0; t <= 1.0001; t += 0.07) path.push([Math.sin(t * 5) * 2.2, 13 - t * 12]); for (let t = 0.1; t <= 1; t += 0.12) { path.push([-3 - t * 14, 2 + Math.sin(t * 6) * 1.5]); path.push([3 + t * 14, 0.5 - Math.sin(t * 6) * 1.5]); }
      path.forEach(([x, z]) => { c.fillStyle = 'rgba(60,70,60,0.25)'; c.beginPath(); c.ellipse(X(x + 0.08), Z(z + 0.1), 0.62 * u, 0.48 * u, rnd(), 0, 6.3); c.fill(); c.fillStyle = 'rgba(214,218,206,0.92)'; c.beginPath(); c.ellipse(X(x), Z(z), (0.52 + rnd() * 0.15) * u, (0.4 + rnd() * 0.1) * u, rnd() * 3, 0, 6.3); c.fill(); });
      // LP 연잎(검정 원반 잎 + 홈 + 라벤더 라벨 + 잎 갈래)
      LPS.forEach(([x, z], k) => { const r = (0.8 + (k % 3) * 0.2) * u; c.fillStyle = 'rgba(30,26,40,0.9)'; c.beginPath(); c.arc(X(x), Z(z), r, 0, 6.3); c.fill(); c.fillStyle = 'rgba(79,174,90,0.85)'; c.beginPath(); c.ellipse(X(x) + r * 0.95, Z(z) - r * 0.2, r * 0.32, r * 0.14, -0.4, 0, 6.3); c.fill();
        c.strokeStyle = 'rgba(110,100,130,0.6)'; c.lineWidth = 0.04 * u; [0.55, 0.75].forEach((f) => { c.beginPath(); c.arc(X(x), Z(z), r * f, 0, 6.3); c.stroke(); }); c.fillStyle = 'rgba(198,168,255,0.95)'; c.beginPath(); c.arc(X(x), Z(z), r * 0.3, 0, 6.3); c.fill(); c.fillStyle = 'rgba(30,26,40,0.9)'; c.beginPath(); c.arc(X(x), Z(z), r * 0.06, 0, 6.3); c.fill(); });
      // 작은 꽃
      for (let k = 0; k < 40; k++) { const x = -19 + rnd() * 38, z = -12.5 + rnd() * 25; c.fillStyle = ['rgba(198,168,255,0.9)', 'rgba(255,255,255,0.85)', 'rgba(255,226,122,0.85)'][k % 3]; for (let p = 0; p < 5; p++) { const a = (p / 5) * 6.283; c.beginPath(); c.arc(X(x) + Math.cos(a) * 0.12 * u, Z(z) + Math.sin(a) * 0.12 * u, 0.08 * u, 0, 6.3); c.fill(); } }
      c.strokeStyle = 'rgba(137,153,232,0.6)'; c.lineWidth = 0.16 * u; c.beginPath(); c.arc(X(0), Z(1), 4.4 * u, 0, 6.3); c.stroke();
    });
    ground(g, 0x3f7a4a);
    // 벽: 북 = 흰 유리 온실 벽(격자 틀·연한 유리), 동서 = 덩굴 커튼, 남 = 낮은 고사리 덤불(≤ 1.2)
    walls((side, cx, cz, len, ry, h) => {
      if (side === 's') { for (let x = -20; x <= 20.1; x += 1.25) { add(x % 2.5 ? LEAF : LEAF2, sph, x, 0.35, cz, x, 0.9, 0.6, 0.6); add(LEAF3, new T.ConeGeometry(0.35, 1.0, 5), x + 0.4, 0.6, cz - 0.2, x, 1, 1, 0.4, 0.5, 0.6); } return; }
      if (side === 'n') { add(GLASS, box, cx, h / 2, cz - 0.05, ry, len + 1.0, h, 0.15); add(WHITE, box, cx, 0.3, cz, ry, len + 1.0, 0.6, 0.5); add(WHITE, box, cx, h, cz, ry, len + 1.2, 0.18, 0.4);
        for (let x = -20.5; x <= 20.6; x += 2.5) add(WHITE, box, x, h / 2, cz + 0.1, 0, 0.14, h, 0.2); [1.6, 2.9].forEach((y) => add(WHITE, box, cx, y, cz + 0.1, ry, len + 1.0, 0.1, 0.2));
        for (let x = -18; x <= 18; x += 4.5) { add(0xd0eee6, box, x + 1.25, 2.25, cz + 0.02, 0, 2.2, 1.1, 0.04); } return; }
      const sx = cx < 0 ? 1 : -1; add(LEAF2, box, cx, h / 2, cz, ry, len + 1.0, h, 0.5); add(WOOD2, box, cx, h + 0.1, cz, ry, len + 1.0, 0.2, 0.6);
      for (let z = -13; z <= 13.1; z += 1.3) { const hh = 2.2 + Math.abs(Math.sin(z * 1.7)) * 1.6; add(LEAF, cyl, cx + sx * 0.3, h - hh / 2, z, 0, 0.05, hh, 0.05); for (let k = 0; k < 3; k++) add(k % 2 ? LEAF3 : LEAF, knob, cx + sx * 0.36, h - 0.4 - k * hh / 3, z + 0.12, z + k, 0.26, 0.12, 0.2); }
    }, 4.0, 1.2);
    { const rnd = seeded(83); // 멀리: 온실 밖 큰 잎·야자·둥근 유리 지붕 뼈대
      for (let k = 0; k < 16; k++) { const x = -38 + k * 5, z = -20 - rnd() * 8, hh = 4 + rnd() * 5; addFar(WOOD2, cyl, x, hh / 2, z, 0, 0.3, hh, 0.3); for (let j = 0; j < 4; j++) { const a = (j / 4) * PI * 2 + rnd(); addFar(j % 2 ? LEAF : LEAF2, sph, x + Math.cos(a) * 1.6, hh + 0.2, z + Math.sin(a) * 1.0, a, 2.2, 0.25, 0.8, 0, -0.35); } }
      for (let k = 0; k < 8; k++) { const a = PI + (k / 7) * PI; addFar(WHITE, cyl, Math.cos(a) * 30, 10, -8 + Math.sin(a) * 20, 0, 0.25, 20, 0.25); }
      for (const [x, z] of [[-34, -2], [34, 0], [-30, 14], [30, 14]]) addFar(LEAF2, ico, x, 2, z, x, 6, 4, 5);
    }
    // 나무 화분 상자 + 큰 잎(상자 자리)
    S.crates.forEach(([x, z, ry], i) => { add(WOOD, box, x, 0.42, z, ry, 1.6, 0.84, 1.2); [0.2, 0.62].forEach((y) => add(WOOD2, box, x, y, z, ry, 1.64, 0.05, 1.24)); add(0x5a3a22, box, x, 0.86, z, ry, 1.45, 0.04, 1.05);
      for (let k = 0; k < 4; k++) { const a = ry + k * 1.57 + 0.4; add(k % 2 ? LEAF : LEAF3, sph, x + Math.sin(a) * 0.5, 1.25 + k * 0.08, z + Math.cos(a) * 0.4, a, 0.95, 0.12, 0.42, 0, -0.5); } add(LAV, knob, x + 0.2, 1.15, z, 0, 0.18); });
    // 정글 북(스피커 자리 6 — KILLATON 장치): 나무 몸 + 나무 테 + 북면(1층 회색 = 잠듦) + 끈 무늬 + 덩굴
    S.speakers.forEach(([x, z]) => { add(WOOD, new T.CylinderGeometry(0.78, 0.6, 1.25, 14), x, 0.63, z, 0, 1); add(WOOD2, new T.TorusGeometry(0.78, 0.08, 5, 18), x, 1.24, z, 0, 1, 1, 1, PI / 2, 0); add(SKIN_OFF, cylBig, x, 1.27, z, 0, 0.74, 0.04, 0.74);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * PI * 2; add(0xf3dfbf, box, x + Math.cos(a) * 0.7, 0.8, z + Math.sin(a) * 0.7, -a, 0.05, 0.7, 0.05, 0, k % 2 ? 0.35 : -0.35); }
      add(LEAF, new T.TorusGeometry(0.66, 0.05, 4, 16), x, 0.35, z, 0, 1, 1, 1, PI / 2 - 0.1, 0); add(LEAF3, knob, x + 0.62, 0.42, z + 0.2, 0, 0.18, 0.08, 0.12); });
    // 쓰러진 통나무(난간 자리)
    S.bars.forEach((b) => { const m = barMid(b); add(WOOD, cyl, m.x, 0.42, m.z, 0, 0.42, 3.0, 0.42, m.dx ? 0 : PI / 2, m.dx ? PI / 2 : 0); [-1.5, 1.5].forEach((o) => add(WOOD_L, cyl, m.x + m.dx * o, 0.42, m.z + m.dz * o, 0, 0.36, 0.04, 0.36, m.dx ? 0 : PI / 2, m.dx ? PI / 2 : 0)); add(LEAF3, knob, m.x + m.dx * 0.4, 0.82, m.z + m.dz * 0.4, 0, 0.45, 0.14, 0.35); add(LEAF, knob, m.x - m.dx * 0.7, 0.8, m.z - m.dz * 0.7, 0, 0.35, 0.12, 0.3); add(LAV, knob, m.x - m.dx * 0.9, 0.9, m.z - m.dz * 0.9, 0, 0.14); });
    // 라벤더 큰 버섯(화분 자리)
    S.planters.forEach(([x, z], i) => { add(WHITE, new T.CylinderGeometry(0.2, 0.27, 0.95, 8), x, 0.48, z, 0, 1); add(i % 2 ? LAV : LAV2, new T.SphereGeometry(1, 12, 6, 0, PI * 2, 0, PI / 2), x, 0.85, z, 0, 0.68, 0.48, 0.68); add(0xfff6ff, knob, x + 0.3, 1.2, z + 0.15, 0, 0.09); add(0xfff6ff, knob, x - 0.2, 1.28, z - 0.2, 0, 0.08); add(0xfff6ff, knob, x - 0.05, 1.3, z + 0.32, 0, 0.07); add(LEAF3, knob, x + 0.35, 0.08, z + 0.2, 0, 0.3, 0.08, 0.2); });
    // 유리 랜턴 덩굴 기둥(가로등 자리): 나무 기둥 + 감긴 덩굴 + 위 유리 랜턴(1층 꺼짐)
    S.lamps.forEach(([x, z]) => { add(WOOD2, cyl, x, 1.7, z, 0, 0.1, 3.4, 0.1); for (let k = 0; k < 4; k++) add(LEAF, new T.TorusGeometry(0.14, 0.04, 4, 10), x, 0.6 + k * 0.7, z, k, 1, 1, 1, PI / 2 - 0.5, 0); add(LEAF3, knob, x + 0.15, 1.4, z, 0, 0.2, 0.08, 0.14); add(LEAF3, knob, x - 0.15, 2.4, z, 0, 0.2, 0.08, 0.14);
      add(WHITE, box, x, 3.55, z, 0, 0.5, 0.06, 0.5); add(WHITE, box, x, 3.05, z, 0, 0.5, 0.06, 0.5); add(0xe8e4f4, sph, x, 3.3, z, 0, 0.26); add(WHITE, new T.ConeGeometry(0.36, 0.3, 4), x, 3.72, z, PI / 4, 1); });
    // 김 나는 웅덩이(분출구 자리) + 안쪽 작은 연못
    const pond = (x, z, r, hh) => { add(WATER, cylBig, x, hh / 2, z, 0, r, hh, r); add(0xb8e8f2, cylBig, x, hh + 0.005, z, 0, r * 0.5, 0.01, r * 0.5); for (let k = 0; k < 7; k++) { const a = (k / 7) * PI * 2; add(STONE, knob, x + Math.cos(a) * r, 0.08, z + Math.sin(a) * r, a, 0.28, 0.14, 0.22); } add(LEAF3, knob, x + r * 0.35, hh + 0.02, z - r * 0.2, 0, 0.26, 0.03, 0.18); };
    S.vents.forEach(([x, z]) => pond(x, z, 0.9, 0.08)); S.vents2.forEach(([x, z]) => pond(x, z, 0.8, 0.04));
    K.mergeLists(g, null);
    // 가운데: 큰 나무 DJ 부스 — 뿌리 둔덕 + 나무 그루터기 책상(덩굴 감긴 턴테이블 2) + 뒤 나무 줄기·가지·잎 + 헤드폰 걸린 가지
    { const tp = S.tower;
      add(WOOD2, cylBig, tp.x, 0.25, tp.z, 0, 3.9, 0.5, 3.9); add(LEAF3, new T.TorusGeometry(3.9, 0.14, 5, 40), tp.x, 0.5, tp.z, 0, 1, 1, 1, PI / 2, 0);
      for (let k = 0; k < 7; k++) { const a = (k / 7) * PI * 2; add(WOOD, cyl, tp.x + Math.cos(a) * 2.6, 0.5, tp.z + Math.sin(a) * 2.6, -a, 0.3, 2.2, 0.3, 0, PI / 2 - 0.25); }
      add(WOOD, cylBig, tp.x, 1.25, tp.z + 0.5, 0, 2.3, 1.5, 1.8); add(WOOD_L, cylBig, tp.x, 2.02, tp.z + 0.5, 0, 2.25, 0.06, 1.75); for (let k = 0; k < 3; k++) add(0xb5875a, new T.TorusGeometry(0.5 + k * 0.5, 0.03, 3, 28), tp.x, 2.06, tp.z + 0.5, 0, 1, 1, 0.78, PI / 2, 0);
      [[-1.15, 0.2], [0.95, 1.0]].forEach(([x, z2]) => { add(LP, cyl, tp.x + x, 2.12, tp.z + z2, 0, 0.6, 0.08, 0.6); add(LAV_D2, cyl, tp.x + x, 2.17, tp.z + z2, 0, 0.2, 0.04, 0.2); add(0x5a5266, new T.TorusGeometry(0.42, 0.02, 3, 20), tp.x + x, 2.17, tp.z + z2, 0, 1, 1, 1, PI / 2, 0); add(0xd8dce0, box, tp.x + x + 0.55, 2.2, tp.z + z2 - 0.1, 0.5, 0.07, 0.07, 0.7); });
      add(WOOD2, box, tp.x - 0.1, 2.2, tp.z + 1.4, 0.3, 0.9, 0.18, 0.5); [-0.35, -0.1, 0.15].forEach((o, k) => add(k % 2 ? LAV : LEAF3, cyl, tp.x - 0.1 + o, 2.33, tp.z + 1.45 + o * 0.3, 0, 0.07, 0.08, 0.07));
      add(LEAF, new T.TorusGeometry(2.3, 0.08, 4, 32), tp.x, 0.62, tp.z + 0.5, 0, 1, 0.8, 1, PI / 2, 0); add(LEAF3, knob, tp.x + 1.2, 1.45, tp.z + 1.9, 0, 0.3, 0.12, 0.2); add(LAV, knob, tp.x - 1.4, 1.2, tp.z + 1.7, 0, 0.16);
      add(WOOD, new T.CylinderGeometry(0.55, 0.85, 4.4, 12), tp.x, 2.4, tp.z - 1.6, 0, 1); add(WOOD, cyl, tp.x + 1.3, 4.2, tp.z - 1.5, 0, 0.18, 2.4, 0.18, 0, -0.9); add(WOOD, cyl, tp.x - 1.3, 4.0, tp.z - 1.5, 0, 0.16, 2.2, 0.16, 0, 0.9);
      [[0, 5.0, -1.7, 1.6], [1.9, 4.9, -1.5, 1.1], [-1.9, 4.7, -1.5, 1.1], [0.9, 5.7, -1.9, 0.9], [-0.9, 5.6, -1.8, 0.9]].forEach(([x, y, z, s], k) => add(k % 2 ? LEAF : LEAF3, ico, tp.x + x, y, tp.z + z, k, s, s * 0.75, s));
      add(PURP_C, new T.TorusGeometry(0.42, 0.07, 5, 14, PI), tp.x + 2.1, 4.65, tp.z - 1.3, 0, 1, 1, 1, PI, 0); [1.68, 2.52].forEach((x) => add(PURP_C, cyl, tp.x + x, 4.62, tp.z - 1.3, 0, 0.16, 0.14, 0.16, 0, PI / 2));
    }
    center(g, rec);
    { // 층별: 1층 북 회색·랜턴 꺼짐 → 2층 랜턴 라벤더 불 + 덩굴 작은 꽃 → 3층 북면 페리윙클 빛남 + 바닥 햇살 조각 → 보스 부스 둘레 LP 연잎 크게 빛남 + 반딧불
      const lanterns = () => { S.lamps.forEach(([x, z]) => add({ hex: 0xd6b8ff, k: 1.8 }, sph, x, 3.3, z, 0, 0.28)); };
      lanterns(); for (let z = -12; z <= 12; z += 2.6) [-K.fx + 0.45, K.fx - 0.45].forEach((x, k) => add(k ? 0xffb3e0 : LAV, knob, x, 1.6 + Math.abs(Math.sin(z)) * 1.6, z, 0, 0.16)); flMesh(flGroup(g, rec, 'lantern'));
      lanterns(); S.speakers.forEach(([x, z]) => { add({ hex: PERI, k: 1.55 }, cylBig, x, 1.3, z, 0, 0.72, 0.03, 0.72); add({ hex: 0xd6dcff, k: 1.6 }, new T.TorusGeometry(0.5, 0.04, 4, 18), x, 1.33, z, 0, 1, 1, 1, PI / 2, 0); });
      [[-8, -3], [6, -6], [-13, 6], [12, 9], [2, 7]].forEach(([x, z]) => add({ hex: 0xa8d884, k: 1.0 }, cylBig, x, 0.012, z, 0, 2.0, 0.01, 1.1)); flMesh(flGroup(g, rec, 'drums'));
      for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2, x = Math.cos(a) * 5.6, z = 1 + Math.sin(a) * 4.6; add(LP, cylBig, x, 0.03, z, 0, 0.75, 0.04, 0.75); add({ hex: 0x9f7ae8, k: 1.5 }, cylBig, x, 0.06, z, 0, 0.2, 0.02, 0.2); add(0x5a5266, new T.TorusGeometry(0.5, 0.025, 3, 20), x, 0.06, z, 0, 1, 1, 1, PI / 2, 0); add({ hex: 0xb8c4ff, k: 1.7 }, new T.TorusGeometry(0.8, 0.05, 4, 20), x, 0.06, z, 0, 1, 1, 1, PI / 2, 0); add({ hex: 0x9cf08a, k: 1.4 }, sph, x + 0.75, 0.08, z - 0.2, -0.4, 0.3, 0.04, 0.14); }
      flMesh(flGroup(g, rec, 'boss'));
      rec.flShow = [null, [], ['lantern'], ['lantern', 'drums'], ['lantern', 'boss']];
      rec.flLook = [null, { hemi: 1.0, sun: 1.02, sunCol: 0xf0fff0 }, { hemi: 1.0, sun: 1.0, sunCol: 0xf4ecff }, { hemi: 1.02, sun: 1.08, sunCol: 0xfffbe6 }, { hemi: 0.92, sun: 0.86, sunCol: 0xdcd8ff }];
      rec.onFloor = (n) => { rec.fln = n; };
    }
    rec.ambient = (dt) => { // 웅덩이 김 + 보스 층 반딧불(꾸밈 난수 fr 만)
      rec.t = (rec.t || 0) + dt; if (rec.t > 1.4) { rec.t = 0; const v = S.vents[(TG.fr() * S.vents.length) | 0]; TG.FX.steam(v[0], v[1], 0.2, 0.55); }
      if (rec.fln === 4) { rec.ff = (rec.ff || 0) + dt; if (rec.ff > 0.16) { rec.ff = 0; TG.FX.emit(TG.FX.CELL.glow, TG.fra(-17, 17), 0.6 + TG.fra(0, 3), TG.fra(-11, 12), { vy: 0.3, vx: TG.fra(-0.4, 0.4), life: 1.6, size: 0.32, size1: 0.1, color: [1.8, 2.4, 0.9], alpha: 0.9 }); } }
    };
    finish(rec);
  });
  const PURP_C = 0x7d4fd0, LAV_D2 = 0x8f6ad8;

  // ── 미니맵 바탕(hud.js 가 합침) ──
  TG.MAPBG_RES = Object.assign(TG.MAPBG_RES || {}, {
    poy_dial(c, X, Z, sx, sz, W, Hh) { // 회백 금속판 + 연초록 눈금 원 3겹 + 다이얼 발판 3 + 북 계기판 벽
      c.fillStyle = '#909a98'; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(110,78,52,0.45)'; for (let j = 0; j < 7; j++) c.fillRect(0, Z(-14 + j * 4 + 3.4), W, 0.6 * sz);
      c.strokeStyle = 'rgba(47,154,92,0.75)'; c.lineWidth = 1.2; [7.0, 10.2, 13.4].forEach((r) => { c.beginPath(); c.arc(X(0), Z(-5.2), r * sx, 0, 6.3); c.stroke(); });
      c.fillStyle = '#f4ecd8'; c.strokeStyle = '#2f9a5c'; c.lineWidth = 1.5; (TG.AR.vents2 || []).slice(0, 3).forEach(([x, z]) => { c.beginPath(); c.arc(X(x), Z(z), 1.3 * sx, 0, 6.3); c.fill(); c.stroke(); });
      c.strokeStyle = '#dfe4e8'; c.lineWidth = 6; c.beginPath(); c.moveTo(X(-20), Z(-14)); c.lineTo(X(20), Z(-14)); c.stroke(); c.strokeStyle = '#5fd38a'; c.lineWidth = 3; c.strokeRect(X(-20), Z(-14), 40 * sx, 28 * sz);
    },
    loki_train(c, X, Z, sx, sz, W, Hh) { // 나무 마루 + 남색 카펫 띠 + 노란 안전선 2 + 노란 객차 벽
      c.fillStyle = '#c99a62'; c.fillRect(0, 0, W, Hh);
      c.strokeStyle = 'rgba(110,70,35,0.35)'; c.lineWidth = 1; for (let j = 0; j < 14; j++) { c.beginPath(); c.moveTo(0, Z(-14 + j * 2)); c.lineTo(W, Z(-14 + j * 2)); c.stroke(); }
      c.fillStyle = '#2f3a7a'; c.fillRect(0, Z(-14), W, 3.3 * sz); c.fillRect(0, Z(10.9), W, 3.1 * sz);
      c.strokeStyle = '#ffc21c'; c.lineWidth = 2; [-9.4, 9.6].forEach((z) => { c.beginPath(); c.moveTo(X(-19.5), Z(z)); c.lineTo(X(19.5), Z(z)); c.stroke(); });
      c.fillStyle = '#fff3d6'; TG.AR.vents.forEach(([x, z]) => { c.beginPath(); c.ellipse(X(x), Z(z), 1.1 * sx, 0.9 * sz, 0, 0, 6.3); c.fill(); });
      c.strokeStyle = '#ffc21c'; c.lineWidth = 5; c.strokeRect(X(-20), Z(-14), 40 * sx, 28 * sz);
    },
    killaton_jungle(c, X, Z, sx, sz, W, Hh) { // 이끼 초록 + 돌 징검 길 + LP 연잎 + 흰 유리 벽(북)·덩굴(동서)
      c.fillStyle = '#5f9a5e'; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(214,218,206,0.9)'; for (let t = 0; t <= 1.0001; t += 0.1) { c.beginPath(); c.arc(X(Math.sin(t * 5) * 2.2), Z(13 - t * 12), 0.6 * sx, 0, 6.3); c.fill(); }
      [[-12, 8.6], [-5, -9.5], [3.5, -10.6], [12.5, 7.2], [-15.5, -1.2], [16, 2.2], [9.5, -2.0], [-11, -6.5]].forEach(([x, z]) => { c.fillStyle = '#2a2533'; c.beginPath(); c.arc(X(x), Z(z), 1.0 * sx, 0, 6.3); c.fill(); c.fillStyle = '#c6a8ff'; c.beginPath(); c.arc(X(x), Z(z), 0.35 * sx, 0, 6.3); c.fill(); });
      c.fillStyle = '#8999e8'; TG.AR.SPOTS.speakers.forEach(([x, z]) => { c.beginPath(); c.arc(X(x), Z(z), 0.8 * sx, 0, 6.3); c.fill(); });
      c.strokeStyle = '#3f9a4e'; c.lineWidth = 6; c.strokeRect(X(-20), Z(-14), 40 * sx, 28 * sz); c.strokeStyle = '#f6f8f4'; c.lineWidth = 5; c.beginPath(); c.moveTo(X(-20), Z(-14)); c.lineTo(X(20), Z(-14)); c.stroke();
    },
  });
})();
