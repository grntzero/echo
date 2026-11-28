/* 에코 제로 — 끝까지 모드 「3던전 이어 달리기」 흐름 화면 (2026-11-28 카드2단계화면, 게임팀 · 계획 v8 11·12·18쪽 「10분·하루 5번·매일 무작위 3던전」)
   · 서버 주소(js/net_config.js apiBase)가 비어 있으면 이 파일은 아무것도 안 함(TG.relay.on = false 로만 있음) → 지금 공개본 그대로.
   · 서버 규칙은 그대로(던전마다 판 번호·시드·하루 5번 · 점수 = 다리마다 검산 뒤): 이어 달리기 = 그날 3던전을 순서대로 한 판씩 이어서 → 한 번 하면 던전마다 1번씩 씀(하루 5번 = 이어 달리기 5번).
   · 흐름: 순위판 「3던전 이어 달리기」 → 다리 1 판 → 결과 화면에 진행 줄(1·2·3 다리 · 깸/쓰러짐 · 시간 · 확인 중/점수) + 「다음 던전」 5초 뒤 저절로(누르면 바로) · 「그만하기」
           → 다리 3 끝 → 끝 화면(#relayEnd): 3던전 다 깨면 「3던전 완주!」 환호(색종이·쎌 환호·주인공 승리 동작) · 다리별 점수(검산 뒤 채워짐) · 오늘 내 순위.
   · 쓰러진 다리도 다음 던전으로 이어 감(점수는 깬 다리만 — ez_rank.js legScore 그대로) [대표 확인].
   · 서버가 안 될 때: 다리 시작이 안 되면(연결 끊김 등) 거기서 멈추고 끝 화면에 「연결이 끊겼어」 + 그때까지 한 다리. 기록 제출 실패는 net.js 가 「연결되면 보낼게」 그대로.
   · 판 도중 멈춤 → 「광장으로」 누르면 이어 달리기도 멈춤(그 다리 1번은 쓴 것 — 서버 표 그대로).
   · 쎌 말 = 게임 안 반말(세계관 정본). 금지어·돈 글 없음. */
(function () {
  'use strict';
  const W = window, TG = W.TG, net = TG.net;
  const R = (TG.relay = { on: false, legs: [], i: 0, ended: null, CD: 5 });
  if (!net || !net.on) return; // 서버 모드 꺼짐 = 아무것도 안 함
  const H = TG.H, $ = (id) => document.getElementById(id);
  const fmt = (t) => TG.fmtTime(t || 0);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dName = (id) => (TG.DUNGEONS[id] ? TG.DUNGEONS[id].name : id);
  const num = (n) => (n | 0).toLocaleString('en-US');
  let cdTO = null, cdIv = null, endTO = null, tickIv = null;
  const stopTimers = () => { clearTimeout(cdTO); clearInterval(cdIv); clearTimeout(endTO); cdTO = cdIv = endTO = null; };

  // 오늘 이어 달리기 몇 번 남았나 = 3던전 남은 횟수 중 가장 적은 것
  R.left = function () { const rk = net.me && net.me.rank; if (!rk || !rk.duns || !rk.tries) return null; return Math.min.apply(null, rk.duns.map((d) => (rk.tries[d] == null ? 0 : rk.tries[d]))); };
  R.start = function () {
    if (R.on) return false;
    const me = net.me, rk = me && me.rank;
    if (!net.active() || !me || me.needNick || !rk || !rk.duns || rk.duns.length < 1) return false;
    if (R.left() === 0) { if (H.rankSay) H.rankSay('오늘 이어 달리기는 다 했어! 내일 06시에 또 하자~', 'ok'); return false; }
    R.on = true; R.i = 0; R.date = rk.date; R.t0 = Date.now(); R.ended = null; R.sel0 = Object.assign({}, TG.DN.sel);
    R.legs = rk.duns.map((d) => ({ dun: d, st: 'wait' }));
    document.body.classList.add('relayOn');
    tickIv = setInterval(tick, 400);
    R.leg();
    return true;
  };
  // 다리 하나 시작: 서버 판 번호·시드 → 게임 시작(광장이면 「시작」, 결과 화면이면 「다시 한번」과 같은 길 — 둘 다 startIntro → startPlay 가 TG.netRun 을 씀)
  R.leg = function () {
    stopTimers();
    const L = R.legs[R.i]; if (!L) return R.end('done');
    L.st = 'start';
    return net.startRun('rank', L.dun).then((j) => {
      if (!R.on) return;
      L.runId = j.runId; L.st = 'play'; L.at = Date.now();
      if (H.rankPick) H.show(H.rankPick, false);
      const res = H.result && !H.result.classList.contains('hide');
      const b = $(res ? 'againBtn' : 'startBtn'); if (b) b.click();
      chip();
    }).catch((e) => {
      if (!R.on) return;
      if (e && e.status === 429) { L.st = 'skip'; L.why = '오늘 다 함'; R.i++; return R.i < R.legs.length ? R.leg() : R.end('done'); } // 그 던전만 다 했으면(따로 한 판 등) 건너뜀
      L.st = 'skip'; L.why = e && e.status ? '못 감' : '연결 끊김';
      R.end(e && e.status ? 'fail' : 'net');
    });
  };
  // 결과 화면이 뜰 때(game.js finish → H.showResult) — 이어 달리기 다리면 진행 줄 + 다음 단추
  R.onResult = function (r) {
    const L = R.legs[R.i];
    if (!L || L.st !== 'play' || !r || !r.rank || r.dungeon !== L.dun || (r.net && L.runId && r.net.runId !== L.runId)) return;
    Object.assign(L, { st: 'done', doneAt: Date.now(), clear: !!r.clear, time: r.time || 0, fogs: r.fogs | 0, notes: r.notes | 0, combo: r.combo | 0, net: !!r.net });
    if (!r.net) L.ver = 'offline';
    R.renderStrip(true);
    const last = R.i >= R.legs.length - 1;
    if (last) endTO = setTimeout(() => R.end('done'), 2800);
    else { let n = R.CD; const go = $('rlGo'); cdIv = setInterval(() => { n--; const s = go && go.querySelector('.rlCd'); if (s) s.textContent = Math.max(0, n); if (n <= 0) { clearInterval(cdIv); cdIv = null; } }, 1000); cdTO = setTimeout(R.next, R.CD * 1000); }
  };
  R.next = function () { if (!R.on) return; stopTimers(); R.i++; if (R.i >= R.legs.length) return R.end('done'); R.renderStrip(false); return R.leg(); };
  R.stop = function () { if (!R.on) return; stopTimers(); R.end('stop'); };
  // 검산 결과(H.netResult) — 다리 점수·확인 채우고 화면 갱신
  R.onNet = function (r) {
    const legs = R.on ? R.legs : R.ended ? R.ended.legs : []; const L = legs.find((x) => x.runId && x.runId === r.id); if (!L) return false;
    L.ver = r.status; L.score = r.score | 0; L.gear = (r.reward && r.reward.gear) || null;
    if (R.on) R.renderStrip(false); if (R.ended) { R.renderEnd(); if (legs.every((x) => !x.runId || x.ver === 'verified' || x.ver === 'rejected')) R.mine(); }
    return true;
  };
  // 끝: why = done(3다리 다) · stop(그만하기) · quit(판 도중 광장으로) · net(연결 끊김) · fail(서버가 거절)
  R.end = function (why) {
    if (!R.on) return;
    stopTimers(); clearInterval(tickIv); tickIv = null;
    R.on = false; document.body.classList.remove('relayOn'); chip();
    const legs = R.legs.map((x) => Object.assign({}, x));
    R.ended = { why, legs, date: R.date, t: Date.now() - R.t0 };
    if (R.sel0 && TG.DN.select) TG.DN.select(R.sel0.dun, R.sel0.lv); // 광장 던전 고르기는 이어 달리기 전 것으로(끝까지 모드 단계 5가 남지 않게)
    if (H.result) H.show(H.result, false);
    if (H.rankPick) H.show(H.rankPick, false);
    R.renderEnd(true); H.show($('relayEnd'), true);
    R.mine();
    return R.ended;
  };
  R.allClear = () => !!R.ended && R.ended.legs.length > 0 && R.ended.legs.every((x) => x.clear);
  // 오늘 내 순위(검산된 다리만 들어감)
  R.mine = function () { net.board('day').then((j) => { if (!R.ended) return; R.ended.board = { me: j.me, n: j.n }; R.renderEnd(); }).catch(() => {}); };

  // ── 결과 화면 진행 줄 ──
  function legHtml(L, i, cur) {
    const st = L.st === 'done' ? (L.clear ? 'ok' : 'fall') : L.st === 'skip' ? 'skip' : i === cur ? 'now' : 'wait';
    const sc = L.ver === 'verified' ? (L.score ? num(L.score) + '점' : '점수 0') : L.ver === 'rejected' ? '못 올림' : L.ver === 'offline' ? '연결되면' : L.st === 'done' && L.net ? '확인 중' : '';
    const sub = L.st === 'done' ? (L.clear ? '깸 ' : '쓰러짐 ') + fmt(L.time) + (sc ? ' · ' + sc : '') : L.st === 'skip' ? (L.why || '건너뜀') : i === cur ? '지금' : '다음';
    return '<span class="rlLeg ' + st + '" style="--dc:' + ((TG.DUNGEONS[L.dun] || {}).color || '#888') + '"><i>' + (st === 'ok' ? '✓' : i + 1) + '</i><span class="rlTx"><b>' + esc(dName(L.dun)) + '</b><small>' + sub + '</small></span></span>';
  }
  R.renderStrip = function (withBtns) {
    const el = $('rRelay'); if (!el) return;
    const n = R.legs.length, cur = R.i, last = cur >= n - 1, doneN = R.legs.filter((x) => x.st === 'done').length;
    let h = '<div class="rlHead"><b>3던전 이어 달리기</b><span>' + doneN + ' / ' + n + '</span><small>' + fmt(sumTime(R.legs)) + '</small></div><div class="rlLegs">' + R.legs.map((L, i) => legHtml(L, i, cur)).join('<em class="rlArr">›</em>') + '</div>';
    if (withBtns || el.querySelector('.rlBtns')) h += last ? '<div class="rlBtns"><button id="rlEnd" class="bub yel" type="button"><span class="ol">끝 화면 보기</span></button></div>'
      : '<div class="rlBtns"><button id="rlGo" class="bub yel" type="button"><span class="ol">다음 던전 · ' + esc(dName(R.legs[cur + 1].dun)) + ' <i class="rlCd">' + R.CD + '</i></span></button><button id="rlStop" class="bub sky" type="button"><span class="ol">그만하기</span></button></div>';
    const cd = el.querySelector('.rlCd'), keep = cd ? cd.textContent : null;
    el.innerHTML = h; H.show(el, true);
    if (keep != null && !withBtns) { const c2 = el.querySelector('.rlCd'); if (c2) c2.textContent = keep; }
    bind('rlGo', () => R.next()); bind('rlStop', () => R.stop()); bind('rlEnd', () => R.end('done'));
  };
  function bind(id, fn) { const b = $(id); if (b) b.addEventListener('click', (e) => { e.stopPropagation(); if (TG.A) { TG.A.unlock(); TG.A.ui(1.1); } fn(); }); }
  const sumTime = (legs) => legs.reduce((a, x) => a + (x.st === 'done' ? x.time || 0 : 0), 0);

  // ── 끝 화면(순위판 끝) ──
  R.renderEnd = function (first) {
    const E = R.ended; if (!E) return;
    const legs = E.legs, all = R.allClear(), clr = legs.filter((x) => x.clear).length, done = legs.filter((x) => x.st === 'done').length;
    const T = all ? '3던전 완주!' : E.why === 'net' ? '연결이 끊겼어' : E.why === 'quit' || E.why === 'stop' ? '이어 달리기 멈춤' : '끝까지 달렸어!';
    const sub = all ? '오늘의 3던전을 전부 깼어!' : E.why === 'net' ? '한 다리까지는 기록이 남아 · 연결되면 다시 해 보자' : clr ? clr + '던전 깸 · 깬 던전 점수가 순위에 들어가' : '이번엔 못 깼어 · 톱니는 챙겼어';
    $('rlTitle').textContent = T; $('rlSub').textContent = sub;
    $('rlList').innerHTML = legs.map((L, i) => { const s = L.st === 'done' ? (L.clear ? 'ok' : 'fall') : 'skip';
      const sc = L.ver === 'verified' ? (L.score ? '<b class="rlSc" data-to="' + (L.score | 0) + '">' + num(L.score) + '</b>점' : '점수 0') : L.ver === 'rejected' ? '못 올림' : L.ver === 'offline' ? '연결되면 올라가' : L.st === 'done' && L.net ? '<span class="rlWait">확인 중…</span>' : '—';
      return '<div class="rlRow ' + s + '" style="--dc:' + ((TG.DUNGEONS[L.dun] || {}).color || '#888') + '"><span class="rlN">' + (s === 'ok' ? '✓' : i + 1) + '</span><span class="rlNm">' + esc(dName(L.dun)) + '</span><span class="rlSt">' + (s === 'ok' ? '깸' : s === 'fall' ? '쓰러짐' : '안 함') + (L.st === 'done' ? ' · ' + fmt(L.time) : '') + '</span><span class="rlS">' + sc + '</span></div>'; }).join('');
    const ver = legs.filter((x) => x.ver === 'verified'), wait = legs.some((x) => x.st === 'done' && x.net && !x.ver);
    const tot = ver.reduce((a, x) => a + (x.score | 0), 0);
    $('rlSum').innerHTML = '<span>걸린 시간 <b>' + fmt(sumTime(legs)) + '</b></span><span>점수 합 <b>' + (wait && !ver.length ? '확인 중' : num(tot) + (wait ? '+' : '')) + '</b></span><span>' + done + ' / ' + legs.length + ' 다리</span>';
    const b = E.board; $('rlMine').textContent = b && b.me ? '오늘 내 순위 ' + b.me.rank + '위 / ' + b.n + '명 · ' + num(b.me.score) + '점' + (b.me.finished ? ' · 완주!' : '') : wait ? '맥미니가 기록을 확인하면 순위판에 올라가~' : '';
    const left = R.left(); $('rlLeft').textContent = left == null ? '' : left > 0 ? '오늘 이어 달리기 ' + left + '번 더 할 수 있어' : '오늘 이어 달리기는 다 했어 · 내일 06시에 새 3던전';
    const box = $('rlSsel'), tx = $('rlSselTxt');
    if (first && box && tx) {
      const say = all ? '와아! 3던전 완주! 오늘의 메아리 노려 보자!' : E.why === 'net' ? '연결이 끊겼어. 잠깐 뒤에 다시 해 보자!' : clr ? '끝까지 왔어! 깬 던전 점수가 올라갈 거야~' : '괜찮아, 다음 이어 달리기는 꼭 될 거야!';
      tx.textContent = say; H.sselFace(box, all ? 'cheer' : clr ? 'smile' : 'bow', true); if (H.sselVoice) H.sselVoice(say);
    }
    const end = $('relayEnd'); end.classList.toggle('allClear', all);
    if (first) {
      confetti(all);
      if (all) { try { if (TG.PL && TG.PL.playSpecial) TG.PL.playSpecial('victory'); if (TG.A) { TG.A.play('sfx_bossend', { gain: 0.6 }); [0, 1, 2].forEach((k) => setTimeout(() => TG.A.play('sfx_pick', { rate: 1 + k * 0.25, gain: 0.7 }), 500 + k * 260)); } } catch (e) { /* 무시 */ } }
    }
  };
  // 색종이(완주만) — 그림만, 깜빡임 없음(천천히 떨어지며 돌기), 3.6초 뒤 사라짐
  function confetti(on) {
    const c = $('rlConf'); if (!c) return; c.innerHTML = ''; if (!on) return;
    const cols = ['#ffd23f', '#e5352b', '#4fc3f7', '#7a5cff', '#5fd068', '#ff8fc7'];
    let h = ''; for (let i = 0; i < 36; i++) { const x = (i * 37) % 100, d = (i % 6) * 0.12, r = 380 + ((i * 53) % 320), s = 0.7 + ((i * 7) % 5) * 0.12; h += '<i style="left:' + x + '%;--d:' + d.toFixed(2) + 's;--r:' + r + 'deg;--k:' + s.toFixed(2) + ';background:' + cols[i % cols.length] + '"></i>'; }
    c.innerHTML = h; setTimeout(() => { if (c) c.innerHTML = ''; }, 4200);
  }
  // ── 판 도중 진행 칩(HUD 미니맵 아래) + 도중에 광장으로 갔는지 ──
  function chip() {
    const c = $('relayChip'); if (!c) return;
    if (!R.on) { H.show(c, false); return; }
    const L = R.legs[R.i];
    c.innerHTML = '<b>이어 달리기 ' + (R.i + 1) + ' / ' + R.legs.length + '</b><span>' + R.legs.map((x, i) => '<i class="' + (x.st === 'done' ? (x.clear ? 'ok' : 'fall') : i === R.i ? 'now' : '') + '"></i>').join('') + '</span><small>' + (L ? esc(dName(L.dun)) : '') + ' · ' + fmt((Date.now() - R.t0) / 1000) + '</small>';
    H.show(c, true);
  }
  function tick() {
    if (!R.on) return; chip();
    const L = R.legs[R.i];
    if (L && L.st === 'play' && H.title && !H.title.classList.contains('hide') && Date.now() - (L.at || 0) > 1500) { L.st = 'skip'; L.why = '멈춤'; R.end('quit'); } // 멈춤 화면 「광장으로」
  }

  // ── 단추·끼우기 ──
  function init() {
    bind('rlBoard', () => { H.show($('relayEnd'), false); toHub(); if (H.rankOpen) H.rankOpen(); });
    bind('rlHome', () => { H.show($('relayEnd'), false); toHub(); });
  }
  function toHub() { if (H.title && H.title.classList.contains('hide')) { const b = $('resHomeBtn'); if (b) b.click(); } else if (H.hubRefresh) H.hubRefresh(true, true); }
  const show0 = H.showResult; H.showResult = function (r) { show0.call(H, r); const el = $('rRelay'); if (R.on) R.onResult(r); else if (el) H.show(el, false); };
  const net0 = H.netResult; H.netResult = function (r) { R.onNet(r); return net0.call(H, r); };
  if (document.readyState !== 'loading') init(); else W.addEventListener('DOMContentLoaded', init);
})();
