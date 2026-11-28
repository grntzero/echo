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
  // 11-28 포즈판: 주인 대표 포즈(시안1 그대로 — LOKI 오른손 마이크 들기 · KILLATON 오른손 엄지척 · POY 왼손 다이얼 앞으로 내밀기).
  //   그림만·크레딧 0: 동작 클립 위에 「포즈 팔」 위팔·아래팔 뼈만 겹쳐 돌림(반대 팔·몸·다리는 클립 그대로 — 입구 손 흔들기·끝 환호 유지).
  //   방향 = 주인 바닥(root) 기준(앞 +z · 위 +y, 캐릭터 오른쪽 = −x). 소품은 손 뼈 자식 그대로 두고 방향만 바닥 기준으로 맞춤(마이크 머리 위로·다이얼 얼굴 위앞으로·엄지 위로).
  //   KILLATON 엄지척 = 오른손에 코드 도형 주먹+엄지(손가락 뼈가 없음). LP 는 왼손 그대로.
  const POSE = {
    loki: { side: 'Right', up: [-0.85, -0.3, 0.4], fore: [-0.1, 0.9, 0.4], prop: 'loki', ax: [0, 1, 0], dir: [0.3, 0.9, 0.3], off: 0.04, lift: [0, 0, 0.02], wob: 0.06 },
    killaton: { side: 'Right', up: [-0.55, -0.8, 0.25], fore: [-0.1, 0.75, 0.65], prop: 'thumb', ax: [0, 1, 0], dir: [0, 1, 0.12], off: 0.03, lift: [0, 0, 0.02], hand: 0.45, wob: 0.1 },
    poy: { side: 'Left', up: [0.55, -0.8, 0.25], fore: [0.45, 0.1, 0.9], prop: 'poy', ax: [-1, 0, 0], dir: [0.3, 0.55, 0.8], off: 0.04, lift: [0, 0.035, 0.02], wob: 0.03 },
  };
  RS.POSE = POSE;
  function thumbProp() { // 주먹(피부색 공) + 위로 선 엄지(캡슐) — 키 1 기준
    const R = TG.R, g = new T.Group(), M = (c) => R.toon({ color: c, rim: 0.5, spec: 0.2, gain: 1.1 });
    const f = new T.Mesh(new T.SphereGeometry(0.045, 16, 12), M(0xf0b385)); f.scale.set(1, 1.05, 0.95);
    const t = new T.Mesh(new T.CylinderGeometry(0.015, 0.017, 0.055, 10), M(0xf0b385)); t.position.set(0.008, 0.052, 0.016);
    const tt = new T.Mesh(new T.SphereGeometry(0.0155, 10, 8), M(0xf0b385)); tt.position.set(0.008, 0.08, 0.016);
    g.add(f, t, tt); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; R.addOutline(o, 1.15); } }); return g;
  }
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
      let pg = null; if (hand) { model.updateMatrixWorld(true); pg = prop(id); const ws = new T.Vector3(); hand.getWorldScale(ws); pg.scale.setScalar((HEIGHT[id] || 2.75) / (ws.x || 1)); hand.add(pg); RS.propOk = (RS.propOk || 0) + 1; } // 소품 크기 = 키 1 기준 → 세계 크기(키 배)
      let pose = null; const PS = POSE[id];
      if (PS) { const bn = (n) => { let r = null; model.traverse((o) => { if (!r && o.isBone && o.name.endsWith(PS.side + n)) r = o; }); return r; };
        const arm = bn('Arm'), fore = bn('ForeArm'), ph = bn('Hand');
        if (arm && fore && ph) { let pp = PS.prop === 'thumb' ? null : pg;
          if (PS.prop === 'thumb') { model.updateMatrixWorld(true); pp = thumbProp(); const ws = new T.Vector3(); ph.getWorldScale(ws); pp.scale.setScalar((HEIGHT[id] || 2.75) / (ws.x || 1)); ph.add(pp); }
          let chest = null; model.traverse((o) => { if (!chest && o.isBone && /Spine02$/.test(o.name)) chest = o; });
          const c0 = new T.Quaternion(); if (chest) { model.updateMatrixWorld(true); chest.getWorldQuaternion(c0); } // 쉬는 자세 가슴 회전(바닥 기준) — 몸이 돌면 포즈도 같이 돌게
          pose = { arm, fore, hand: ph, prop: pp, chest, c0inv: c0.invert(), h0: ph.scale.x, ps0: pp ? pp.scale.x : 1 }; } }
      const mixer = new T.AnimationMixer(model), clips = {};
      gltf.animations.forEach((c) => { c.tracks.forEach((tr) => { if (/Hips\.position$/.test(tr.name)) { const v = tr.values, x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } } }); clips[c.name] = c; });
      const act = {}; ['idle', 'cheer', 'victory', 'joy'].forEach((n) => { if (clips[n]) act[n] = mixer.clipAction(clips[n]); });
      const ring = new T.Mesh(new T.RingGeometry(0.75, 0.95, 36), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; root.add(ring);
      const v = { id, root, model, mixer, act, ring, head, head0, hs: HEADS[id] || 1, pose, pw: 0 }; RS.ready[id] = v; return v;
    }).catch(() => null);
    return cache[id];
  }
  // 포즈 팔: 뼈(b)→자식(c) 방향을 바닥 기준 dir 로(세계 회전 차이를 부모 기준 지역 회전으로 바꿔 클립 값과 w 만큼 섞음)
  const _a = new T.Vector3(), _b = new T.Vector3(), _d = new T.Vector3(), _q = new T.Quaternion(), _qr = new T.Quaternion(), _qp = new T.Quaternion(), _qb = new T.Quaternion(), _qt = new T.Quaternion();
  function frameQ(v, out) { // 포즈 방향 기준 = 바닥 × (지금 가슴 ÷ 쉬는 가슴) → 환호 동작에서 몸이 돌거나 숙여도 팔이 몸을 따라감
    const po = v.pose; if (po.chest) { po.chest.getWorldQuaternion(out); return out.multiply(po.c0inv); } return v.root.getWorldQuaternion(out);
  }
  function aim(v, bone, child, dir, w) {
    frameQ(v, _qr); _d.set(dir[0], dir[1], dir[2]).normalize().applyQuaternion(_qr);
    bone.getWorldPosition(_a); child.getWorldPosition(_b); _b.sub(_a).normalize();
    _q.setFromUnitVectors(_b, _d); bone.getWorldQuaternion(_qb); _qt.multiplyQuaternions(_q, _qb);
    bone.parent.getWorldQuaternion(_qp); _qt.premultiply(_qp.invert()); bone.quaternion.slerp(_qt, w); bone.updateMatrixWorld(true);
  }
  function applyPose(v, dt) {
    const po = v.pose, PS = POSE[v.id]; if (!po || !PS) return;
    v.pw = Math.min(1, v.pw + dt / 0.35); const w = v.pw * v.pw * (3 - 2 * v.pw); // 0.35초에 부드럽게 포즈로
    v.root.updateMatrixWorld(true);
    const wb = Math.sin(RS.t * 6.5) * PS.wob, f = PS.fore; // 박자 맞춰 살짝(마이크 들썩·엄지 콕·다이얼 내밀기)
    aim(v, po.arm, po.fore, PS.up, w); aim(v, po.fore, po.hand, [f[0], f[1] + wb, f[2] - wb * 0.5], w);
    if (PS.hand) { const k = 1 + (PS.hand - 1) * w; po.hand.scale.setScalar(po.h0 * k); if (po.prop) po.prop.scale.setScalar(po.ps0 / k); po.hand.updateMatrixWorld(true); } // 편 손을 작게 → 주먹 도형이 덮음(킬라톤 엄지척)
    if (po.prop) { // 소품 방향 = 몸 기준 dir(손목 회전과 무관) · 손끝 쪽 off + 몸 기준 lift 만큼(키 배)
      frameQ(v, _qr); _d.set(PS.dir[0], PS.dir[1], PS.dir[2]).normalize(); _a.set(PS.ax[0], PS.ax[1], PS.ax[2]);
      _q.setFromUnitVectors(_a, _d).premultiply(_qr); po.hand.getWorldQuaternion(_qb); const want = _qb.invert().multiply(_q);
      po.prop.quaternion.slerp(want, w);
      const HH = HEIGHT[v.id] || 2.75; po.fore.getWorldPosition(_a); po.hand.getWorldPosition(_b); _d.copy(_b).sub(_a).normalize().multiplyScalar(PS.off * HH).add(_b);
      if (PS.lift) { _a.set(PS.lift[0], PS.lift[1], PS.lift[2]).multiplyScalar(HH).applyQuaternion(_qr); _d.add(_a); }
      po.hand.worldToLocal(_d); po.prop.position.lerp(_d, w);
    }
  }
  // 시험용: 포즈 팔 손·머리·어깨 위치(바닥 기준, 그림만)
  RS.poseInfo = function () {
    const v = RS.vis; if (!v || !v.pose) return null; v.root.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(v.root.matrixWorld).invert(), at = (o) => { const p = new T.Vector3(); o.getWorldPosition(p); p.applyMatrix4(inv); return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)]; };
    const up = new T.Vector3(); if (v.pose.prop) { const q = new T.Quaternion(), qr = new T.Quaternion(); v.pose.prop.getWorldQuaternion(q); v.root.getWorldQuaternion(qr); const ax = POSE[v.id].ax; up.set(ax[0], ax[1], ax[2]).applyQuaternion(q).applyQuaternion(qr.invert()); }
    return { id: v.id, w: v.pw, hand: at(v.pose.hand), elbow: at(v.pose.fore), shoulder: at(v.pose.arm), head: v.head ? at(v.head) : null, propDir: [+up.x.toFixed(3), +up.y.toFixed(3), +up.z.toFixed(3)], prop: !!v.pose.prop };
  };
  RS.preload = function (id) { if (id && HEIGHT[id] && scene) load(id); };
  function play(v, name) { for (const k in v.act) v.act[k].stop(); const a = v.act[name] || v.act.cheer || v.act.idle; if (!a) return; a.reset(); a.setLoop(T.LoopRepeat, Infinity); a.play(); }
  // mode: 'welcome'(입구 — 맨홀 옆에서 손 흔들고 4.5초 뒤 폴짝 사라짐) | 'cheer'(끝 확대 — 주인공 옆에서 같이 환호, 끝날 때까지)
  RS.show = function (id, mode, P) {
    RS.hide(); if (!id || !HEIGHT[id] || !scene) return;
    RS.on = true; RS.id = id; RS.mode = mode; RS.t = 0;
    const px = P ? P.x : 0, pz = P ? P.z : 3.2;
    RS.x = mode === 'cheer' ? px + 2.0 : 3.0; RS.z = mode === 'cheer' ? pz + 0.4 : 4.6;
    load(id).then((v) => { if (!v || !RS.on || RS.id !== id) return; v.root.position.set(RS.x, 0, RS.z); v.root.rotation.y = mode === 'cheer' ? (POSE[id] ? 0.15 : -0.3) : -0.45; /* 포즈판: 끝 확대 땐 카메라 쪽으로 조금 더(환호 동작이 몸을 주인공 쪽으로 30° 돌려 포즈 팔이 가려짐) */ v.root.scale.setScalar(0.01); v.root.visible = true; v.pw = 0; play(v, mode === 'cheer' ? (v.act.victory ? 'victory' : 'cheer') : 'cheer'); RS.vis = v; });
  };
  RS.hide = function () { RS.on = false; if (RS.vis) RS.vis.root.visible = false; RS.vis = null; RS.id = null; };
  RS.draw = function (dt) {
    const v = RS.vis; if (!RS.on || !v) return;
    RS.t += dt; v.mixer.update(dt); if (v.head && v.hs !== 1) v.head.scale.setScalar(v.head0 * v.hs); // 동작 클립엔 머리 크기 트랙이 없어 매번 다시
    applyPose(v, dt); // 11-28 포즈판(멈춤 중에도 — mixer.update(0) 이 클립 자세로 되돌리므로 매번 다시)
    const k = Math.min(1, RS.t / 0.35), pop = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.18 : 1;
    let s = k * pop;
    if (RS.mode === 'welcome') { if (RS.t > 4.2) s *= Math.max(0, 1 - (RS.t - 4.2) / 0.35); if (RS.t > 4.6) { TG.FX.popBurst(RS.x, 1.6, RS.z, 1.0); RS.hide(); return; } }
    v.root.scale.setScalar(Math.max(0.01, s)); v.root.position.y = RS.mode === 'cheer' ? Math.abs(Math.sin(RS.t * 5.2)) * 0.25 : 0;
    v.ring.material.opacity = 0.5 + 0.3 * Math.sin(RS.t * 6);
    if (TG.fr() < 0.05) TG.FX.emit(TG.FX.CELL.note, RS.x + TG.fra(-0.8, 0.8), 3.2 + TG.fra(0, 0.8), RS.z, { vy: TG.fra(1, 2), life: 0.8, size: 0.5, size1: 0.2, color: [2.4, 2.0, 0.6], rot: 0, pop: true });
  };
})();
