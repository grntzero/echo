/* 에코 제로 — 서버 모드 이음(카드 2단계 · 랭킹 3종, 2026-11-27 게임팀 서버 담당, 계획 v8 11·13·14·18쪽)
   · 서버 주소(js/net_config.js TG_NET.apiBase)가 비어 있으면 이 파일은 아무것도 안 함 → 1단계(이 기기 저장) 그대로. 주소가 있어도 로그인 전엔 1단계 그대로.
     시험용: 이 기기(127.0.0.1·localhost)에서 열었을 때만 ?api=same(같은 주소) / ?api=http://127.0.0.1:포트 허용. 바깥 주소는 설정 파일로만.
   · 서버 모드(로그인 뒤) = 톱니·카드·점수를 서버가 검산 뒤 지급(기기 지급 X). 카드·지갑 조작(장착·바꾸기·올리기·합치기·레벨 올리기)도 서버가 하고 돌려준 값으로 기기 사본을 덮음.
   · 판: 시작 때 서버에서 판 번호·시드(TG.netRun) → game.js startPlay 가 그 시드·던전으로 → 끝나면 기록(REC_V 8)+결과 제출 → 「확인 중」 → 서버 검산(맥미니) 뒤 상태를 몇 번 물어 결과 화면 갱신.
   · 끝까지 모드(순위) = 그날의 3던전(서버가 06시에 뽑음) · 단계 고정 · 던전마다 하루 5번 · 표준 수치 + 카드 능력치(합계 상한) · 레벨 효과 X. 순위판 = 광장 「순위판」 단추 → 일·주·월 탭.
   · 기기 저장 → 서버 옮기기(한 번): 처음 로그인 때 기기에 카드·톱니가 있으면 쎌이 물어봄 → 「옮기기」 누르면 POST /api/ez/migrate. 옮기기 전 기기 사본은 ez_net_backup 에 보관.
   · 쎌 말 = 게임 안 반말(세계관 정본). 금지어·돈 글 없음. 아이 이름·전화번호 안 받음(닉네임만). */
(function () {
  'use strict';
  const W = window, TG = (W.TG = W.TG || {});
  const C = Object.assign({ apiBase: '', googleClientId: '', gsiSrc: '' }, W.TG_NET || {});
  try { // 시험용 덮어쓰기: 이 기기에서 열었을 때만
    const q = new URLSearchParams(location.search).get('api'), local = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
    if (q && local) C.apiBase = q === 'same' ? location.origin : (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(q) ? q : C.apiBase);
  } catch (e) { /* 무시 */ }
  const net = (TG.net = { on: !!C.apiBase, mode: 'local', token: null, me: null, info: null, pendingIds: [], lastReward: null, say: {} });
  if (!C.apiBase) return; // 1단계 그대로
  const K_TOKEN = 'ez_net_token', K_PEND = 'ez_net_pending', K_BACKUP = 'ez_net_backup';
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } }, del(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } } };
  net.token = LS.get(K_TOKEN); net.mode = net.token ? 'server' : 'local';
  try { net.pendingIds = JSON.parse(LS.get(K_PEND) || '[]'); } catch (e) { net.pendingIds = []; }
  net.active = () => net.mode === 'server' && !!net.token;

  async function call(method, path, body) {
    const h = { 'content-type': 'application/json' };
    if (net.token) h.authorization = 'Bearer ' + net.token;
    const r = await W.fetch(C.apiBase + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    let j = {}; try { j = await r.json(); } catch (e) { j = {}; }
    if (!r.ok) { const e = new Error(j.error || 'http_' + r.status); e.status = r.status; e.info = j; throw e; }
    return j;
  }
  net.call = call;
  // 서버가 준 내 상태로 기기 사본(카드·지갑) 덮기 + 열린 화면 갱신
  net.apply = function (me) {
    if (!me) return;
    net.me = me; net.say = me.say || net.say;
    if (TG.K && me.cards) { TG.K.data = me.cards; TG.K.data.eq = (TG.K.data.eq || [null, null, null]).map((id) => (id && TG.K.has(id) ? id : null)); TG.K.save(); }
    if (TG.W && me.wallet) { TG.W.data = me.wallet; TG.W.save(); }
    net.pendingIds = (me.pending || []).slice();
    LS.set(K_PEND, JSON.stringify(net.pendingIds));
    const H = TG.H; if (!H) return;
    try { if (H.title && !H.title.classList.contains('hide')) H.hubRefresh(true, false); } catch (e) { /* 광장 아님 */ }
    try { if (H.colPick && !H.colPick.classList.contains('hide')) H.colRender(); } catch (e) { /* 무시 */ }
    try { if (H.walPick && !H.walPick.classList.contains('hide')) H.walRender(); } catch (e) { /* 무시 */ }
    try { if (H.rankPick && !H.rankPick.classList.contains('hide') && H.rankRender) H.rankRender(); } catch (e) { /* 무시 */ }
    if (me.inbox && me.inbox.length && H.rankGift) { H.rankGift(me.inbox); call('POST', '/api/ez/inbox/seen').catch(() => {}); }
  };
  net.fetchInfo = async function () { try { net.info = await call('GET', '/api/ez/info'); } catch (e) { net.info = null; } return net.info; };
  // 로그인. idToken = 구글 로그인 버튼이 준 값 / dev = 시험용 이름(서버가 --dev-login 일 때만). ageAck = 보호자·14세 안내 확인
  net.login = async function (o) {
    const b = Object.assign({ ageAck: true }, typeof o === 'string' ? { dev: o } : o || {});
    const hadDevice = !!(TG.K && TG.W && (TG.K.total() > (TG.K.data.betaGift ? TG.K.BETA_LIST.length : 0) || TG.W.total() > (TG.W.data.gift | 0))); // 베타 선물만 있는 기기는 옮길 것 없음(서버도 같은 선물)
    const j = await call('POST', '/api/ez/login', b);
    net.token = j.token; LS.set(K_TOKEN, net.token); net.mode = 'server';
    // 기기 저장 → 서버 옮기기 물음: 서버 계정에 아직 옮긴 적 없고 서버 기록도 없고 기기에 카드·톱니가 있으면
    net.canMigrate = !!(j.me && !j.me.migrated && hadDevice && (!j.me.pending || !j.me.pending.length));
    if (net.canMigrate) { net.deviceSnap = { cards: JSON.parse(JSON.stringify(TG.K.data)), wallet: JSON.parse(JSON.stringify(TG.W.data)), lv: lvSnap(), box: boxSnap() }; LS.set(K_BACKUP, JSON.stringify(net.deviceSnap)); }
    net.apply(j.me);
    return j;
  };
  function lvSnap() { const o = {}; (TG.DUNGEON_ORDER || []).forEach((d) => { const n = TG.DN.cleared(d); if (n) o[d] = n; }); return o; }
  function boxSnap() { const o = {}; (TG.DUNGEON_ORDER || []).forEach((d) => { for (let l = 1; l <= TG.LEVEL_MAX; l++) { let v = null; try { v = localStorage.getItem('ez_box_' + d + '_' + l); } catch (e) { v = null; } if (v) { o[d] = o[d] || {}; o[d][l] = 1; } } }); return o; }
  net.migrate = async function () {
    if (!net.canMigrate || !net.deviceSnap) return null;
    const j = await call('POST', '/api/ez/migrate', net.deviceSnap);
    net.canMigrate = false; net.apply(j.me); return j;
  };
  net.skipMigrate = function () { net.canMigrate = false; };
  net.logout = function () { net.token = null; LS.del(K_TOKEN); net.mode = 'local'; net.me = null; if (TG.K) TG.K.load(); if (TG.W) TG.W.load(); };
  net.setNick = async function (nick) { const j = await call('POST', '/api/ez/nick', { nick }); if (net.me) { net.me.nick = j.nick; net.me.needNick = false; } return j; };
  net.refresh = async function () { if (!net.active()) return null; try { const me = await call('GET', '/api/ez/me'); net.apply(me); return me; } catch (e) { if (e.status === 401) net.logout(); return null; } };

  // 판 시작: 서버가 판 번호·시드 → TG.netRun → 게임 시작 단추와 같은 길(startBtn)
  net.startRun = async function (mode, dun, lv) {
    const j = await call('POST', '/api/ez/runs/start', { mode, dun, lv });
    TG.netRun = { id: j.runId, seed: j.seed, dun: j.dun, lv: j.lv, mode: j.mode, date: j.date };
    return j;
  };
  net.go = function () { const b = document.getElementById('startBtn'); if (b) b.click(); };
  // 11-28 검토수정(독립검토 1·6): 서버 판 표(TG.netRun)가 게임에 안 쓰이고 남으면 다음 일반판이 그 서버 판으로 시작됨 → 못 쓴 표는 바로 버림
  net.dropRun = function (id) { if (TG.netRun && (id == null || TG.netRun.id === id)) TG.netRun = null; };
  net.heroBusy = () => !!(W.document && W.document.body && W.document.body.classList.contains('heroWait')); // 주인공 모델 받는 중 = game.js startIntro 가 아무것도 안 함
  // 판 시작 길(광장 「시작」·결과 「다시 한번」)을 누르고, 게임이 정말 그 표를 받았나 봄. 주인공 모델을 받는 중이면 풀릴 때까지(최대 25초) 기다렸다 누름.
  //   못 쓰면(기다려도 안 풀림·누를 단추 없음·누른 뒤에도 표가 그대로) 표를 버리고 false. cancel() 이 true 면(이어 달리기 그만 등) 버리고 false
  net.launch = function (run, btnId, cancel) {
    return new Promise((ok) => {
      const t0 = Date.now();
      const step = () => {
        if (cancel && cancel()) { net.dropRun(run && run.id); return ok(false); }
        if (net.heroBusy()) { if (Date.now() - t0 < 25000) return setTimeout(step, 250); net.dropRun(run && run.id); return ok(false); }
        const b = document.getElementById(btnId || 'startBtn'); if (b) b.click();
        if (!b || (TG.netRun && run && TG.netRun.id === run.id && !(W.__tg && W.__tg.state && W.__tg.state().phase === 'intro'))) { net.dropRun(run && run.id); return ok(false); }
        ok(true);
      };
      step();
    });
  };
  // 판 끝(game.js finish): 기록+결과 제출 → 「확인 중」. 못 보내면 기기에 모아 두고 다음에
  net.submit = async function (run, rec, result) {
    const res = {}; ['clear', 'tick', 'hash', 'fogs', 'notes', 'combo', 'level', 'floor', 'boss', 'time', 'rank', 'dungeon', 'lv'].forEach((k) => { if (result[k] !== undefined) res[k] = result[k]; });
    return send({ id: run.id, mode: run.mode, rec, res }, result);
  };
  // 11-28 검토수정(독립검토 7): 보내기 하나(처음·다시 보내기 같은 길). 연결 끊김·서버 잠깐 오류(5xx) = 「보내지 못함」(offline) → 기기에 모아 두고 연결되면 다시 보냄(runId 하나에 한 번만 — 보내는 중이면 또 안 보냄).
  //   서버가 받으면 「확인 중」 + 상태 묻기(net.poll) 그대로 · 서버가 거절(4xx, 이미 받은 판 409 포함) = 다시 안 보냄(409 는 상태 묻기로 이어 감)
  const K_RETRY = 'ez_net_retry', sending = {};
  let retryQ = []; try { retryQ = JSON.parse(LS.get(K_RETRY) || '[]'); } catch (e) { retryQ = []; }
  const saveQ = () => { retryQ = retryQ.slice(-5); LS.set(K_RETRY, JSON.stringify(retryQ)); };
  const dropQ = (id) => { const n = retryQ.length; retryQ = retryQ.filter((x) => x.id !== id); if (retryQ.length !== n) saveQ(); };
  const curRes = (id) => { const R = TG.H && TG.H.lastRes; return R && R.net && R.net.runId === id ? R : null; }; // 지금 결과 화면이 그 판일 때만 화면 글을 바꿈
  async function send(item, result) {
    const id = item.id; if (sending[id]) return { status: 'sending' }; sending[id] = 1;
    try {
      const j = await call('POST', '/api/ez/runs', { runId: id, rec: item.rec, result: item.res });
      dropQ(id); accepted(id, result, j.message || net.say.pending); return j;
    } catch (e) {
      if (!e.status || e.status >= 500) { // 보내지 못함 → 모아 두고 연결되면
        if (!retryQ.some((x) => x.id === id)) { retryQ.push(item); saveQ(); }
        const R = result || curRes(id); if (R && R.net && R.net.runId === id) R.net.status = 'offline';
        if (TG.H && TG.H.netResult) TG.H.netResult({ id, status: 'offline' });
        retryLater(); return { status: 'offline', error: e.message };
      }
      dropQ(id);
      if (e.status === 409) { accepted(id, result, net.say.pending); return { status: 'pending' }; } // 이미 받은 판(앞서 보낸 게 닿았음) → 상태 묻기
      const R = result || curRes(id); if (R && R.net && R.net.runId === id) R.net.status = 'rejected';
      if (TG.H && TG.H.netResult) TG.H.netResult({ id, status: 'rejected' });
      if (TG.H && TG.H.netPending && (result || curRes(id))) TG.H.netPending({ id }, (e.info && e.info.message) || '이 기록은 올릴 수 없었어. 다음 판에 또 해 보자!');
      return { status: 'rejected', error: e.message };
    } finally { delete sending[id]; }
  }
  function accepted(id, result, msg) {
    if (net.pendingIds.indexOf(id) < 0) net.pendingIds.push(id); LS.set(K_PEND, JSON.stringify(net.pendingIds.slice(-20)));
    if (!result && TG.H && TG.H.netResult) TG.H.netResult({ id, status: 'pending' }); // 다시 보낸 판: 「보내지 못함」 → 「확인 중」(이어 달리기 다리·지금 결과 화면)
    const R = result || curRes(id); if (R && R.net && R.net.runId === id) { R.net.status = 'pending'; if (TG.H && TG.H.netPending) TG.H.netPending({ id }, msg); }
    net.poll(id);
  }
  // 다시 보내기: 연결되면(online)·켤 때(boot)·20초마다(모아 둔 게 있을 때만). 로그인이 바뀌었으면(다른 계정) 서버가 거절 → 버림
  let retryTO = null;
  function retryLater() { if (!retryTO && retryQ.length) retryTO = setTimeout(() => { retryTO = null; net.retry(); }, 20000); }
  net.retry = async function () {
    if (!net.active() || !retryQ.length) return 0;
    const list = retryQ.slice(); let n = 0;
    for (const it of list) { const j = await send(it, null); if (j && j.status !== 'offline' && j.status !== 'sending') n++; }
    return n;
  };
  net.retryList = () => retryQ.map((x) => x.id);
  W.addEventListener('online', () => { net.retry(); });
  // 상태 묻기(검산은 맥미니가 몇 분 안에) — 5초·10초·20초·40초… 최대 8번. 확인되면 결과 화면 갱신
  net.poll = function (id, n) {
    n = n | 0; if (n >= 8) return;
    setTimeout(async () => {
      try {
        const j = await call('GET', '/api/ez/runs/status?ids=' + encodeURIComponent(id));
        const r = (j.runs || []).find((x) => x.id === id);
        if (r && r.status !== 'pending') { net.lastReward = r; net.apply(j.me); if (TG.H && TG.H.netResult) TG.H.netResult(r); return; }
      } catch (e) { /* 다음에 */ }
      net.poll(id, n + 1);
    }, Math.min(60000, 5000 * Math.pow(2, n)));
  };
  net.checkPending = async function () { if (!net.active() || !net.pendingIds.length) return; try { const j = await call('GET', '/api/ez/runs/status?ids=' + net.pendingIds.map(encodeURIComponent).join(',')); net.apply(j.me); return j.runs; } catch (e) { return null; } };
  net.board = (period, date) => call('GET', '/api/ez/board?period=' + encodeURIComponent(period || 'day') + (date ? '&date=' + encodeURIComponent(date) : ''));
  net.today = () => call('GET', '/api/ez/rank/today');

  // 서버 모드: 카드·지갑 조작은 서버가 — 기기 함수는 바로 흉내(화면 즉시) 뒤 서버 값으로 덮음. 서버가 거절하면 서버 값으로 되돌림
  function wrap(obj, name, path, args) {
    const orig = obj[name];
    obj[name] = function () {
      const a = Array.prototype.slice.call(arguments), r = orig.apply(obj, a);
      if (net.active()) call('POST', path, args.apply(null, a)).then((j) => net.apply(j.me)).catch(() => net.refresh());
      return r;
    };
  }
  if (TG.K) {
    wrap(TG.K, 'equip', '/api/ez/cards/equip', (slot, id) => ({ slot, id }));
    wrap(TG.K, 'swap', '/api/ez/cards/swap', (id) => ({ id }));
    wrap(TG.K, 'upgrade', '/api/ez/cards/up', (id) => ({ id }));
  }
  if (TG.W) {
    wrap(TG.W, 'merge', '/api/ez/wallet/merge', (g) => ({ g }));
    wrap(TG.W, 'levelUp', '/api/ez/wallet/levelup', () => ({}));
  }
  // 구글 로그인 버튼(11-28 카드2단계화면): 설정값 googleClientId 가 들어오면 바로 동작 — 구글 스크립트 주소(gsiSrc)는 비면 구글 공식 주소. 비밀값 X(클라이언트 ID 는 공개값).
  //   스크립트는 한 번만 받고 initialize 도 한 번만, 버튼은 자리마다 그림(폭은 자리 폭에 맞춤). 설정값이 비면 false(화면은 버튼 숨기고 안내)
  const GSI_DEFAULT = 'https://accounts.google.com/gsi/client';
  net.googleReady = () => !!C.googleClientId;
  let gsiLoad = null, gsiCb = null;
  net.showGoogleButton = function (el, onToken) {
    if (!C.googleClientId || !el) return false;
    gsiCb = onToken;
    if (!gsiLoad) gsiLoad = new Promise((ok, no) => { const s = document.createElement('script'); s.src = C.gsiSrc || GSI_DEFAULT; s.async = true; s.onload = ok; s.onerror = no; document.head.appendChild(s); })
      .then(() => { const g = W.google && W.google.accounts && W.google.accounts.id; if (!g) throw new Error('no_gsi'); g.initialize({ client_id: C.googleClientId, callback: (r) => { if (gsiCb && r && r.credential) gsiCb(r.credential); } }); return g; });
    gsiLoad.then((g) => { el.innerHTML = ''; g.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'ko', width: Math.max(200, Math.min(320, el.clientWidth || 240)) }); el.dataset.gsi = 'ok'; })
      .catch(() => { el.dataset.gsi = 'fail'; gsiLoad = null; if (TG.H && TG.H.rankSay) TG.H.rankSay('구글 로그인을 못 불러왔어. 잠깐 뒤에 다시!', 'bow'); });
    return true;
  };
  // 켤 때: 서버 정보 + (로그인돼 있으면) 내 상태·확인 중 판
  net.boot = async function () { await net.fetchInfo(); if (net.active()) { await net.refresh(); await net.checkPending(); await net.retry(); } return net.info; };
  // 11-28 검토수정(독립검토 1·4·6): 광장(타이틀)으로 돌아오면 = 쓰이지 않은 서버 판 표는 버림(멈춤 「광장으로」·결과 「광장으로」·이어 달리기 끝 모두 game.js toTitle → H.sselTitleStart)
  if (TG.H && TG.H.sselTitleStart) { const t0 = TG.H.sselTitleStart; TG.H.sselTitleStart = function () { net.dropRun(); if (TG.H.onTitle) { try { TG.H.onTitle(); } catch (e) { /* 무시 */ } } return t0.apply(this, arguments); }; }
  if (W.document && W.document.readyState !== 'loading') setTimeout(() => { net.boot(); }, 0); else W.addEventListener('DOMContentLoaded', () => { net.boot(); });
})();
