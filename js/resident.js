/* 에코 제로 — 주민 던전 주인 3D (2026-11-28 주민던전): 포이·로키·킬라톤은 플레이 캐릭터가 아니라 던전 주인 → 입구에서 반기고(손 흔듦) 끝 확대 때 옆에서 같이 환호.
   · 그림만: 규칙·난수(TG.sr)·기록과 무관(꾸밈 난수 TG.fr 만). 충돌 없음(서 있는 자리는 맨홀 옆 빈 자리).
   · 모델 = js/pack_hero_<id>.js(tools/pack_assets.py HERO_SPLIT, 주인공과 같은 Meshy 24뼈 + 옛 SEFO 동작 9개 — tools/build_res.py). 묶음이 없거나 못 풀면 2D 초상(hud.js H.resSay)만 나옴
   · 키: 어른 주민 2.75(허조교 2.78·모쉬 2.7 과 같은 무리, 2.4등신 — 주민던전_20261128/3D/라인업_3D_비교.png) */
(function () {
  'use strict';
  const TG = window.TG, T = THREE;
  const RS = (TG.RES = { on: false, id: null, mode: null, t: 0, ready: {}, vis: null });
  const HEIGHT = { poy: 2.75, loki: 2.75, killaton: 2.62 }; // 킬라톤은 3D 머리가 작게 나와(2.71등신) 머리 1.15배 + 키를 낮춰 같은 키로(세포 0.82 때와 같은 방식, 3D_기록.md)
  const HEADS = { killaton: 1.15 };
  // 손 소품(3D 생성에서 빠짐 → 코드 도형으로, 크레딧 0): 포이 은색 다이얼(왼손) · 로키 금 마이크(오른손) · 킬라톤 LP(왼손). 뼈 자식(모델 단위 — 키 1 기준)
  function prop(id) {
    const R = TG.R, g = new T.Group();
    const M = (c, o) => R.toon(Object.assign({ color: c, rim: 0.5, spec: 0.5, gain: 1.1 }, o || {}));
    if (id === 'poy') { const d = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.022, 20), M(0xdfe4ec)); d.rotation.z = Math.PI / 2; const k = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.03, 10), M(0x5fe08a)); k.rotation.z = Math.PI / 2; k.position.x = -0.018; g.add(d, k); }
    else if (id === 'loki') { const h = new T.Mesh(new T.CylinderGeometry(0.012, 0.016, 0.11, 10), M(0xe0ae2c)); h.position.y = -0.02; const b = new T.Mesh(new T.SphereGeometry(0.028, 12, 9), M(0xf2c84b, { spec: 0.7 })); b.position.y = 0.05; g.add(h, b); }
    else if (id === 'killaton') { const d = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.008, 28), M(0x22222c, { spec: 0.8 })); d.rotation.z = Math.PI / 2; const l = new T.Mesh(new T.CylinderGeometry(0.026, 0.026, 0.01, 16), M(0xc39bff)); l.rotation.z = Math.PI / 2; g.add(d, l); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; R.addOutline(o, 1.15); } });
    return g;
  }
  const PROP_BONE = { poy: 'LeftHand', loki: 'RightHand', killaton: 'LeftHand' };
  let scene = null; const cache = {};
  RS.init = function (sc) { scene = sc; };
  function load(id) {
    if (cache[id]) return cache[id];
    cache[id] = TG.M.ensure(id).then(() => TG.M.parse(id)).then((gltf) => {
      const R = TG.R, root = new T.Group(), model = gltf.scene; root.visible = false; root.add(model); scene.add(root);
      model.scale.setScalar(HEIGHT[id] || 2.75);
      const meshes = []; model.traverse((o) => { if (o.isMesh && !o.userData.isOutline) meshes.push(o); });
      meshes.forEach((o) => { const map = o.material.map || null; if (map) { map.anisotropy = R.maxAniso || 4; map.colorSpace = T.SRGBColorSpace; } o.material = R.toon({ map, gain: 1.12, gamma: 0.95, sat: 1.1, rim: 0.5, spec: 0.12 }); o.castShadow = true; o.frustumCulled = false; R.addOutline(o, 1.15).renderOrder = 1; });
      let head = null, hand = null; model.traverse((o) => { if (o.isBone && /Head$/.test(o.name) && !head) head = o; if (o.isBone && o.name.endsWith(PROP_BONE[id]) && !hand) hand = o; });
      const head0 = head ? head.scale.x : 1;
      if (hand) { model.updateMatrixWorld(true); const pg = prop(id), ws = new T.Vector3(); hand.getWorldScale(ws); pg.scale.setScalar((HEIGHT[id] || 2.75) / (ws.x || 1)); hand.add(pg); RS.propOk = (RS.propOk || 0) + 1; } // 소품 크기 = 키 1 기준 → 세계 크기(키 배)
      const mixer = new T.AnimationMixer(model), clips = {};
      gltf.animations.forEach((c) => { c.tracks.forEach((tr) => { if (/Hips\.position$/.test(tr.name)) { const v = tr.values, x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } } }); clips[c.name] = c; });
      const act = {}; ['idle', 'cheer', 'victory', 'joy'].forEach((n) => { if (clips[n]) act[n] = mixer.clipAction(clips[n]); });
      const ring = new T.Mesh(new T.RingGeometry(0.75, 0.95, 36), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; root.add(ring);
      const v = { id, root, model, mixer, act, ring, head, head0, hs: HEADS[id] || 1 }; RS.ready[id] = v; return v;
    }).catch(() => null);
    return cache[id];
  }
  RS.preload = function (id) { if (id && HEIGHT[id] && scene) load(id); };
  function play(v, name) { for (const k in v.act) v.act[k].stop(); const a = v.act[name] || v.act.cheer || v.act.idle; if (!a) return; a.reset(); a.setLoop(T.LoopRepeat, Infinity); a.play(); }
  // mode: 'welcome'(입구 — 맨홀 옆에서 손 흔들고 4.5초 뒤 폴짝 사라짐) | 'cheer'(끝 확대 — 주인공 옆에서 같이 환호, 끝날 때까지)
  RS.show = function (id, mode, P) {
    RS.hide(); if (!id || !HEIGHT[id] || !scene) return;
    RS.on = true; RS.id = id; RS.mode = mode; RS.t = 0;
    const px = P ? P.x : 0, pz = P ? P.z : 3.2;
    RS.x = mode === 'cheer' ? px + 2.0 : 3.0; RS.z = mode === 'cheer' ? pz + 0.4 : 4.6;
    load(id).then((v) => { if (!v || !RS.on || RS.id !== id) return; v.root.position.set(RS.x, 0, RS.z); v.root.rotation.y = mode === 'cheer' ? -0.3 : -0.45; v.root.scale.setScalar(0.01); v.root.visible = true; play(v, mode === 'cheer' ? (v.act.victory ? 'victory' : 'cheer') : 'cheer'); RS.vis = v; });
  };
  RS.hide = function () { RS.on = false; if (RS.vis) RS.vis.root.visible = false; RS.vis = null; RS.id = null; };
  RS.draw = function (dt) {
    const v = RS.vis; if (!RS.on || !v) return;
    RS.t += dt; v.mixer.update(dt); if (v.head && v.hs !== 1) v.head.scale.setScalar(v.head0 * v.hs); // 동작 클립엔 머리 크기 트랙이 없어 매번 다시
    const k = Math.min(1, RS.t / 0.35), pop = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.18 : 1;
    let s = k * pop;
    if (RS.mode === 'welcome') { if (RS.t > 4.2) s *= Math.max(0, 1 - (RS.t - 4.2) / 0.35); if (RS.t > 4.6) { TG.FX.popBurst(RS.x, 1.6, RS.z, 1.0); RS.hide(); return; } }
    v.root.scale.setScalar(Math.max(0.01, s)); v.root.position.y = RS.mode === 'cheer' ? Math.abs(Math.sin(RS.t * 5.2)) * 0.25 : 0;
    v.ring.material.opacity = 0.5 + 0.3 * Math.sin(RS.t * 6);
    if (TG.fr() < 0.05) TG.FX.emit(TG.FX.CELL.note, RS.x + TG.fra(-0.8, 0.8), 3.2 + TG.fra(0, 0.8), RS.z, { vy: TG.fra(1, 2), life: 0.8, size: 0.5, size1: 0.2, color: [2.4, 2.0, 0.6], rot: 0, pop: true });
  };
})();
