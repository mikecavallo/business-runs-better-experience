/* The first screen. Each visit gets one of four short, interactive ways in, picked at random
   and never the same one twice in a row:
     gate   Hyperspace Gate   stars stream out of the ENTER gate; clicking jumps to light speed
     sweep  Busywork Sweep    floating to-dos the cursor pushes around; "Clear it" sorts and sweeps them
     night  9:47 PM           a late text from a new customer; "Answer it" types the reply
     power  Power On          hold the ring to charge it; the grid lights up cell by cell
   It lives in a shadow root on #splash, so its class names can't collide with the intro's.
   index.html starts it (BRBSplash.start) once it knows the visitor isn't skipping the splash,
   and hands it what Enter and Skip should do. Returning visitors never see it (index.html
   sends them to the landing page). Add ?splash=gate|sweep|night|power to the address to see
   one on purpose, or just ?splash for a random one. */
(function () {
  'use strict';
  var host = document.getElementById('splash');
  if (!host || document.documentElement.classList.contains('returning')) return;
  if (!host.attachShadow || !window.requestAnimationFrame) return;   // the plain fallback in #splash stays

  var KEYS = ['gate', 'sweep', 'night', 'power'];
  function stored(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  var forced = null;
  try { forced = new URLSearchParams(location.search).get('splash'); } catch (e) { /* old browser */ }
  var last = stored('brb-splash-last');
  var pool = KEYS.filter(function (k) { return k !== last; });
  var KEY = KEYS.indexOf(forced) >= 0 ? forced : pool[Math.floor(Math.random() * pool.length)];

  var MARK = '<svg class="mark" viewBox="0 0 300 300" aria-hidden="true"><rect width="300" height="300" rx="66" fill="var(--brand)"/><g transform="translate(-9 -3)"><rect x="78" y="52" width="38" height="196" rx="19" fill="var(--on-brand)"/><circle cx="165" cy="180" r="56" fill="none" stroke="var(--on-brand)" stroke-width="38"/><circle cx="165" cy="180" r="15" fill="var(--bg)"/></g></svg>';
  var SKIP = '<button class="skip" type="button">Skip the intro <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.8 2.4 5.4 6 1.8 9.6M6.6 2.4 10.2 6 6.6 9.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  var TAG = '<p class="tag">Websites, marketing &amp; AI for local business</p>';

  var CSS = `
:host {
  /* rgb triplets of --ink, --bg and --bg-dark for rgba(); the script keeps them in step with the theme */
  --ink-rgb: 243, 246, 251; --bg-rgb: 22, 25, 29; --dark-rgb: 16, 19, 23;
  --line: rgba(var(--ink-rgb), .13);
  --hi: rgba(var(--ink-rgb), .24);
  --shade: rgba(var(--dark-rgb), .88);
  --gutter: 16px;
}
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
button { font: inherit; color: inherit; }
:where(button, a, [tabindex]):focus-visible { outline: 2px solid var(--brand-lift); outline-offset: 4px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.stage {
  position: absolute; inset: 0; overflow: hidden; isolation: isolate;
  color: var(--ink); font-family: var(--font-body); font-size: 15px; line-height: 1.5;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; -webkit-tap-highlight-color: transparent;
}
.concept { position: absolute; inset: 0; overflow: hidden; background: var(--bg-dark); animation: conceptIn .6s var(--ease-out) both; }
@keyframes conceptIn { from { opacity: 0; } to { opacity: 1; } }
.fx { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
.scene {
  position: absolute; inset: 0; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  padding: 24px var(--gutter) 34px;
  pointer-events: none;
}
.scene > * { pointer-events: auto; }
.fit { transform: scale(var(--fit, 1)); transform-origin: 50% 50%; max-width: 100%; }

.mark { display: block; width: 30px; height: 30px; flex: none; }
.brand-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
.wordmark { margin: 0; font: 400 12px/1.4 var(--font-display); letter-spacing: .2em; text-transform: uppercase; color: var(--ink); }
.tag { margin: 0; font: 400 13px/1.6 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); text-wrap: balance; }
.actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }

.btn {
  appearance: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 50px; padding: 0 28px; border-radius: 10px;
  font: 500 12px/1 var(--font-mono); letter-spacing: .16em; text-transform: uppercase;
  color: var(--on-brand);
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-lift) 30%, var(--brand)), var(--brand));
  border: 1px solid color-mix(in srgb, var(--brand-lift) 75%, var(--ink));
  box-shadow: inset 0 1px 0 rgba(var(--ink-rgb), .45), inset 0 -2px 0 rgba(var(--dark-rgb), .3), 0 2px 4px rgba(var(--dark-rgb), .45), 0 16px 36px -14px rgba(var(--brand-rgb), .75);
  transition: transform .15s ease, box-shadow .35s ease, filter .35s ease;
}
.btn:hover { filter: brightness(1.08); box-shadow: inset 0 1px 0 rgba(var(--ink-rgb), .45), inset 0 -2px 0 rgba(var(--dark-rgb), .3), 0 2px 4px rgba(var(--dark-rgb), .45), 0 20px 46px -12px rgba(var(--brand-rgb), .95); }
.btn:active { transform: translateY(1px); }
.btn[aria-disabled="true"] { cursor: default; filter: saturate(.7); }

/* the way out: a real button, second only to the main one */
.skip {
  appearance: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 44px; padding: 0 20px; border-radius: 10px;
  font: 400 13px/1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink);
  background: rgba(var(--brand-rgb), .07);
  border: 1px solid rgba(var(--brand-rgb), .5);
  transition: border-color .25s ease, background .25s ease;
}
.skip svg { width: 12px; height: 12px; color: var(--brand-lift); transition: transform .35s var(--ease-out); }
.skip:hover { border-color: var(--brand-lift); background: rgba(var(--brand-rgb), .15); }
.skip:hover svg { transform: translateX(3px); }

/* ============ 1. HYPERSPACE GATE ============ */
.c-gate { background: radial-gradient(120% 95% at 50% 64%, var(--bg) 0%, var(--bg-dark) 72%); }
.g-flash {
  position: absolute; inset: 0; z-index: 4; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at var(--vx, 50%) var(--vy, 62%), var(--ink) 0%, var(--brand-lift) 16%, var(--brand) 46%, color-mix(in srgb, var(--brand) 70%, var(--bg-dark)) 100%);
}
.g-stack { display: flex; flex-direction: column; align-items: center; gap: clamp(30px, 6.4svh, 54px); text-align: center; }
.g-top { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.g-mark { width: 50px; height: 50px; filter: drop-shadow(0 10px 26px rgba(var(--brand-rgb), .38)); }
.g-word {
  margin: 0; max-width: 22ch;
  font: 400 clamp(26px, 3.2vw, 46px)/1.22 var(--font-display);
  letter-spacing: .1em; text-transform: uppercase; text-wrap: balance; color: var(--ink);
  text-shadow: 0 0 42px rgba(var(--brand-rgb), .4);
}
.g-word span { white-space: nowrap; }
.gate {
  --gs: 124px;
  appearance: none; cursor: pointer; position: relative; flex: none;
  width: var(--gs); height: var(--gs); border-radius: 30px; padding: 0;
  display: grid; place-items: center; color: var(--ink);
  background: radial-gradient(circle at 50% 50%, rgba(var(--brand-rgb), .2), rgba(var(--brand-rgb), .05) 62%, rgba(var(--dark-rgb), .35));
  border: 1.5px solid rgba(var(--brand-rgb), .72);
  box-shadow: inset 0 0 22px rgba(var(--brand-rgb), .28), inset 0 1px 0 var(--hi), 0 0 0 1px rgba(var(--dark-rgb), .6), 0 0 34px rgba(var(--brand-rgb), .26);
  -webkit-backdrop-filter: blur(1.5px); backdrop-filter: blur(1.5px);
  transition: border-color .4s ease, box-shadow .5s ease;
}
.gate-label {
  position: relative; z-index: 1;
  font: 400 12px/1 var(--font-display); letter-spacing: .26em; padding-left: .26em; text-transform: uppercase;
  transition: letter-spacing .6s var(--ease-out), padding .6s var(--ease-out);
}
.gate-ring { position: absolute; border-radius: 40px; border: 1px solid rgba(var(--brand-rgb), .4); pointer-events: none; }
.gate-ring.r1 { inset: -13px; border-radius: 40px; opacity: .55; }
.gate-ring.r2 { inset: -28px; border-radius: 52px; opacity: .28; }
.gate-ring.r3 { inset: -45px; border-radius: 66px; opacity: .12; }
.gate:hover, .gate.is-hot, .gate:focus-visible {
  border-color: var(--brand-lift);
  box-shadow: inset 0 0 34px rgba(var(--brand-rgb), .5), inset 0 1px 0 var(--hi), 0 0 0 1px rgba(var(--dark-rgb), .6), 0 0 70px rgba(var(--brand-rgb), .55);
}
.gate:hover .gate-label, .gate.is-hot .gate-label, .gate:focus-visible .gate-label { letter-spacing: .42em; padding-left: .42em; }
.gate:hover .gate-ring, .gate.is-hot .gate-ring, .gate:focus-visible .gate-ring { animation: gateRing 1.5s cubic-bezier(.2, .6, .3, 1) infinite; }
.gate .r2 { animation-delay: .5s !important; }
.gate .r3 { animation-delay: 1s !important; }
@keyframes gateRing { 0% { transform: scale(.82); opacity: 0; } 30% { opacity: .6; } 100% { transform: scale(1.5); opacity: 0; } }
.gate:focus-visible { outline-offset: 8px; }

/* ============ 2. BUSYWORK SWEEP ============ */
.c-sweep { background: radial-gradient(110% 85% at 50% 46%, var(--bg-lift) 0%, var(--bg) 42%, var(--bg-dark) 100%); touch-action: none; }
.s-floor {
  position: absolute; inset: 0; pointer-events: none; opacity: .55;
  background-image: radial-gradient(circle at center, rgba(var(--brand-rgb), .2) 1px, transparent 1.6px);
  background-size: 26px 26px; background-position: 50% 50%;
  -webkit-mask-image: radial-gradient(ellipse at 50% 46%, var(--ink) 15%, transparent 78%);
  mask-image: radial-gradient(ellipse at 50% 46%, var(--ink) 15%, transparent 78%);
}
.s-halo {
  position: absolute; left: 0; top: 0; z-index: 1; pointer-events: none;
  width: 300px; height: 300px; margin: -150px 0 0 -150px; border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--brand-rgb), .12), rgba(var(--brand-rgb), .035) 48%, transparent 70%);
  opacity: 0; transition: opacity .35s ease;
}
.s-halo.on { opacity: 1; }
.s-chips { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.chip {
  position: absolute; left: 0; top: 0;
  display: inline-flex; align-items: center; gap: 9px;
  padding: 9px 13px 9px 11px; border-radius: 11px; white-space: nowrap;
  font: 400 12.5px/1 var(--font-mono); letter-spacing: .01em; color: var(--ink);
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-lift) 94%, var(--ink)), var(--bg-lift));
  border: 1px solid rgba(var(--ink-rgb), .13);
  box-shadow: inset 0 1px 0 rgba(var(--ink-rgb), .09), 0 2px 4px rgba(var(--dark-rgb), .4), 0 12px 24px -12px var(--shade);
  will-change: transform;
  transition: border-color .3s ease, background .3s ease;
}
.chip-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--dim) 75%, transparent); }
.chip.is-alert .chip-dot { background: var(--brand-lift); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), .2); }
.chip-tag { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--dim); padding-right: 9px; border-right: 1px solid var(--line); }
.chip-txt { color: rgba(var(--ink-rgb), .92); text-decoration: line-through; text-decoration-color: transparent; text-decoration-thickness: 1.5px; transition: color .3s ease, text-decoration-color .3s ease; }
.chip.ping { animation: chipPing 1s var(--ease-out); }
@keyframes chipPing {
  0% { box-shadow: inset 0 0 0 1px rgba(var(--brand-rgb), .9), 0 0 0 0 rgba(var(--brand-rgb), .55), 0 12px 24px -12px var(--shade); }
  100% { box-shadow: inset 0 0 0 1px rgba(var(--brand-rgb), 0), 0 0 0 16px rgba(var(--brand-rgb), 0), 0 12px 24px -12px var(--shade); }
}
.chip.done { border-color: rgba(var(--brand-rgb), .42); background: linear-gradient(180deg, rgba(var(--brand-rgb), .13), rgba(var(--brand-rgb), .05)), var(--bg-lift); }
.chip.done .chip-dot { width: 10px; height: 6px; margin: -3px -1px 0 0; border-radius: 0; background: transparent; box-shadow: none; border: solid var(--brand-lift); border-width: 0 0 2px 2px; transform: rotate(-45deg); }
.chip.done .chip-txt { color: var(--muted); text-decoration-color: rgba(var(--brand-rgb), .9); }
.s-band {
  position: absolute; top: 0; bottom: 0; left: 0; width: 42vw; z-index: 2; pointer-events: none; opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(var(--brand-rgb), .07) 38%, rgba(var(--brand-rgb), .22) 50%, rgba(var(--brand-rgb), .07) 62%, transparent);
}
.s-stack { position: relative; isolation: isolate; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }
.s-stack::before { content: ""; position: absolute; inset: -48px -70px; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(var(--bg-rgb), .82), transparent); }
.s-head { margin: 4px 0 0; max-width: 16ch; font: 400 clamp(23px, 3vw, 40px)/1.22 var(--font-display); letter-spacing: -.01em; text-wrap: balance; }
.s-stack .actions { margin-top: 10px; }
.s-payoff {
  position: absolute; inset: 0; z-index: 3; pointer-events: none;
  display: flex; align-items: center; justify-content: center; text-align: center;
  padding: 24px var(--gutter) 34px; opacity: 0;
}
.s-payoff p { margin: 0; max-width: 18ch; font: 400 clamp(23px, 3vw, 40px)/1.25 var(--font-display); letter-spacing: -.01em; text-wrap: balance; }
.s-payoff p span { color: var(--brand-lift); }

/* ============ 3. 9:47 PM ============ */
.c-night { background: radial-gradient(90% 80% at 68% 50%, color-mix(in srgb, var(--bg) 70%, var(--bg-dark)) 0%, var(--bg-dark) 70%); }
.c-night .fit { width: 100%; }
.n-layout {
  width: min(100%, 1240px); margin-inline: auto;
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center; column-gap: clamp(36px, 5vw, 88px);
  transition: opacity .4s ease;
}
.n-left { justify-self: end; min-width: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 16px; text-align: right; }
.n-left .brand-row { justify-content: flex-end; }
.n-left .wordmark { letter-spacing: .16em; white-space: nowrap; }
.n-left .tag { margin-bottom: 26px; }
.n-head { margin: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 14px; font-weight: 400; }
.n-time { font: 400 clamp(30px, 3.3vw, 50px)/1.05 var(--font-display); letter-spacing: -.02em; color: var(--ink); white-space: nowrap; }
.n-line { font: 600 clamp(19px, 1.9vw, 27px)/1.25 var(--font-body); letter-spacing: -.01em; color: var(--muted); text-wrap: balance; }
.n-right { justify-self: start; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 26px; }
.n-q { margin: 0; font: 400 clamp(24px, 3vw, 44px)/1.1 var(--font-display); letter-spacing: -.02em; color: var(--brand-lift); white-space: nowrap; }
.n-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; }
.is-gone .n-layout { opacity: 0; }

.ph-win { position: relative; display: flex; justify-content: center; }
.ph-wrap { position: relative; isolation: isolate; }
.ph-wrap::before {
  content: ""; position: absolute; left: 50%; top: 44%; z-index: -1; pointer-events: none;
  width: 190%; height: 92%; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(var(--brand-rgb), .34), rgba(var(--brand-rgb), .1) 55%, transparent);
  opacity: 0; transition: opacity 1.2s ease, transform 1s ease;
}
.is-awake .ph-wrap::before { opacity: .9; }
.ph-wrap.buzz::before { animation: deskGlow .9s ease-out; }
@keyframes deskGlow { 30% { opacity: 1; } }
.vib { position: absolute; top: 24%; width: 12px; height: 40px; opacity: 0; pointer-events: none; }
.vib::before, .vib::after { content: ""; position: absolute; top: 50%; width: 2.5px; border-radius: 3px; background: var(--brand-lift); transform: translateY(-50%); }
.vib::before { height: 20px; }
.vib::after { height: 34px; }
.vib-l { right: calc(100% + 12px); }
.vib-l::before { right: 0; } .vib-l::after { right: 8px; }
.vib-r { left: calc(100% + 12px); }
.vib-r::before { left: 0; } .vib-r::after { left: 8px; }
.ph-wrap.buzz .vib { animation: vib .75s ease-out; }
.ph-wrap.buzz .vib-l { --vx: -5px; } .ph-wrap.buzz .vib-r { --vx: 5px; }
@keyframes vib { 0% { opacity: 0; transform: translateX(0); } 20%, 60% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--vx)); } }
.ph-lift { transform: translateY(var(--lift, 0px)); transition: transform .45s var(--ease-out); }
.ph-wrap.buzz .phone { animation: buzz .62s linear; }
@keyframes buzz {
  0%, 100% { transform: none; }
  8% { transform: translateX(-2px) rotate(-1.4deg); } 16% { transform: translateX(2px) rotate(1.4deg); }
  24% { transform: translateX(-2px) rotate(-1.2deg); } 32% { transform: translateX(2px) rotate(1.2deg); }
  40% { transform: translateX(-1px) rotate(-.8deg); } 48% { transform: translateX(1px) rotate(.8deg); }
  56% { transform: none; }
}
.phone {
  --pw: 280px;
  position: relative; width: var(--pw); aspect-ratio: 9 / 19.2;
  padding: calc(var(--pw) * .034); border-radius: calc(var(--pw) * .165);
  background: linear-gradient(150deg, color-mix(in srgb, var(--ink) 20%, var(--bg-lift)) 0%, var(--bg-lift) 22%, var(--bg-dark) 62%, color-mix(in srgb, var(--ink) 9%, var(--bg-dark)) 100%);
  border: 1px solid rgba(var(--ink-rgb), .2);
  box-shadow: inset 0 1px 0 var(--hi), inset 0 0 0 2px rgba(var(--dark-rgb), .7), 0 44px 80px -34px var(--shade), 0 0 0 0 rgba(var(--brand-rgb), 0);
  transition: border-color .7s ease, box-shadow .8s ease;
}
.ph-side { position: absolute; width: 3px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 16%, var(--bg-lift)); }
.ph-side-l { left: -3px; top: 22%; height: 9%; }
.ph-side-r { right: -3px; top: 27%; height: 14%; }
.ph-screen { position: relative; height: 100%; overflow: hidden; border-radius: calc(var(--pw) * .132); background: var(--bg-dark); container-type: inline-size; }
.ph-screen::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: rgba(var(--brand-rgb), .14); opacity: 0; transition: opacity .8s ease; }
.ph-wall {
  position: absolute; inset: 0; opacity: 0; transition: opacity .8s ease;
  background: radial-gradient(120% 70% at 15% -5%, rgba(var(--brand-rgb), .42), transparent 62%), radial-gradient(100% 60% at 105% 105%, rgba(var(--brand-rgb), .26), transparent 60%), linear-gradient(180deg, var(--bg-lift), var(--bg-dark));
}
.is-awake .ph-wall { opacity: 1; }
.ph-island { position: absolute; z-index: 5; top: 3.4cqw; left: 50%; width: 31cqw; height: 8.6cqw; transform: translateX(-50%); border-radius: 99px; background: var(--bg-dark); box-shadow: inset 0 0 0 1px rgba(var(--ink-rgb), .06); }
.ph-status { position: absolute; z-index: 4; top: 5.1cqw; left: 9cqw; right: 8cqw; display: flex; justify-content: space-between; align-items: center; font: 700 4.4cqw/1 var(--font-body); color: var(--ink); opacity: 0; transition: opacity .6s ease; }
.is-awake .ph-status { opacity: 1; }
.ph-icons { display: flex; align-items: center; gap: 1.6cqw; }
.ph-sig { display: flex; align-items: flex-end; gap: .6cqw; height: 3.2cqw; }
.ph-sig b { width: .9cqw; border-radius: 1px; background: var(--ink); }
.ph-sig b:nth-child(1) { height: 35%; } .ph-sig b:nth-child(2) { height: 55%; } .ph-sig b:nth-child(3) { height: 78%; } .ph-sig b:nth-child(4) { height: 100%; }
.ph-bat { position: relative; width: 6.6cqw; height: 3.3cqw; border-radius: 1cqw; border: 1px solid rgba(var(--ink-rgb), .6); padding: .45cqw; }
.ph-bat::after { content: ""; position: absolute; right: -1.1cqw; top: 30%; height: 40%; width: .7cqw; border-radius: 0 1px 1px 0; background: rgba(var(--ink-rgb), .6); }
.ph-bat b { display: block; height: 100%; width: 38%; border-radius: .4cqw; background: var(--ink); }
.ph-lock { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; padding-top: 17cqw; opacity: 0; transition: opacity .6s ease, transform .5s var(--ease-out); }
.is-awake .ph-lock { opacity: 1; }
.ph-date { font: 600 4.6cqw/1.2 var(--font-body); color: rgba(var(--ink-rgb), .82); }
.ph-clock { margin-top: 1.5cqw; font: 400 21cqw/1 var(--font-display); letter-spacing: -.03em; color: var(--ink); }
.ph-notif {
  margin-top: 9cqw; width: 90cqw; padding: 3.6cqw 4.2cqw 4cqw; border-radius: 6.4cqw;
  background: color-mix(in srgb, var(--bg-lift) 74%, transparent);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--ink-rgb), .11); box-shadow: 0 10px 26px -12px var(--shade);
  opacity: 0; transform: translateY(-16cqw) scale(.94); transition: transform .7s var(--ease-out), opacity .45s ease;
}
.has-notif .ph-notif { opacity: 1; transform: none; }
.pn-top { display: flex; align-items: center; gap: 2.2cqw; font: 500 3.5cqw/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.pn-app { position: relative; width: 6.6cqw; height: 6.6cqw; border-radius: 1.8cqw; background: linear-gradient(180deg, var(--brand-lift), var(--brand)); flex: none; }
.pn-app::before { content: ""; position: absolute; left: 22%; top: 25%; width: 56%; height: 42%; border-radius: 50%; background: var(--on-brand); }
.pn-app::after { content: ""; position: absolute; left: 28%; top: 58%; width: 18%; height: 18%; background: var(--on-brand); clip-path: polygon(0 100%, 30% 0, 100% 0); }
.pn-when { margin-left: auto; text-transform: none; letter-spacing: .02em; }
.pn-from { margin-top: 2.6cqw; font: 700 5cqw/1.2 var(--font-body); color: var(--ink); }
.pn-msg { margin-top: .8cqw; font: 500 5.2cqw/1.34 var(--font-body); color: rgba(var(--ink-rgb), .88); }
.ph-lockbar { position: absolute; left: 8cqw; right: 8cqw; bottom: 10cqw; display: flex; justify-content: space-between; }
.ph-round { width: 12cqw; height: 12cqw; border-radius: 50%; background: rgba(var(--dark-rgb), .55); border: 1px solid rgba(var(--ink-rgb), .08); }
.ph-home { position: absolute; z-index: 6; left: 50%; bottom: 2.6cqw; width: 36cqw; height: 1.4cqw; transform: translateX(-50%); border-radius: 99px; background: rgba(var(--ink-rgb), .7); opacity: 0; transition: opacity .6s ease; }
.is-awake .ph-home { opacity: 1; }
.ph-thread {
  position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; padding-top: 13cqw;
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-lift) 92%, var(--ink)), var(--bg-dark) 30%);
  opacity: 0; transform: translateY(5%); transition: opacity .45s ease, transform .55s var(--ease-out);
}
.is-open .ph-thread { opacity: 1; transform: none; }
.is-open .ph-lock { opacity: 0; transform: translateY(-6%) scale(.97); }
.t-head { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.2cqw; padding: 1cqw 0 3.2cqw; border-bottom: 1px solid var(--line); }
.t-back { position: absolute; left: 6cqw; top: 4.2cqw; width: 3.4cqw; height: 3.4cqw; border: solid var(--brand-lift); border-width: 0 0 2px 2px; transform: rotate(45deg); }
.t-avatar { position: relative; width: 11.5cqw; height: 11.5cqw; border-radius: 50%; overflow: hidden; background: linear-gradient(180deg, color-mix(in srgb, var(--dim) 75%, var(--bg-lift)), color-mix(in srgb, var(--dim) 45%, var(--bg-dark))); }
.t-avatar::before { content: ""; position: absolute; left: 34%; top: 20%; width: 32%; height: 32%; border-radius: 50%; background: rgba(var(--ink-rgb), .75); }
.t-avatar::after { content: ""; position: absolute; left: 18%; top: 60%; width: 64%; height: 60%; border-radius: 50%; background: rgba(var(--ink-rgb), .75); }
.t-name { font: 700 4.6cqw/1.15 var(--font-body); color: var(--ink); }
.t-kind { font: 500 3.3cqw/1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--dim); }
.t-body { flex: 1; display: flex; flex-direction: column; gap: 2.4cqw; padding: 4cqw 4.4cqw; min-height: 0; }
.t-stamp { align-self: center; font: 500 3.3cqw/1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--dim); margin-bottom: 1cqw; }
.bub { max-width: 80%; padding: 2.6cqw 3.8cqw; border-radius: 5cqw; font: 500 5.4cqw/1.36 var(--font-body); overflow-wrap: break-word; }
.bub.in { align-self: flex-start; background: color-mix(in srgb, var(--ink) 11%, var(--bg-lift)); color: var(--ink); border-bottom-left-radius: 1.6cqw; }
.bub.out {
  align-self: flex-end; min-width: 14cqw; min-height: 10.5cqw; margin-top: 1.4cqw;
  background: rgba(var(--brand-rgb), .14); color: var(--ink);
  border: 1px dashed rgba(var(--brand-rgb), .65); border-bottom-right-radius: 1.6cqw;
  opacity: 0; transform: translateY(8px) scale(.94); transform-origin: 100% 100%;
  transition: opacity .35s ease, transform .45s var(--ease-out), background .35s ease, color .35s ease, border-color .35s ease;
}
.is-drafting .bub.out { opacity: 1; transform: none; }
.is-sent .bub.out { background: var(--brand); color: var(--on-brand); border-style: solid; border-color: var(--brand); animation: sentPop .45s var(--ease-out); }
@keyframes sentPop { 40% { transform: scale(1.04); } }
.caret { display: inline-block; width: 2px; height: 1.08em; margin-left: 1px; vertical-align: -.17em; border-radius: 1px; background: var(--brand-lift); animation: caretBlink 1s steps(2, start) infinite; }
.is-sent .caret { display: none; }
@keyframes caretBlink { to { visibility: hidden; } }
.t-label { align-self: flex-end; font: 500 3.3cqw/1.2 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--brand-lift); opacity: 0; transition: opacity .3s ease; text-align: right; }
.is-drafting .t-label { opacity: 1; }
.t-compose { margin: 0 4cqw 7.5cqw; height: 10cqw; border-radius: 99px; border: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 0 1.3cqw 0 4cqw; font: 500 3.9cqw/1 var(--font-body); color: var(--dim); }
.t-send { width: 7.2cqw; height: 7.2cqw; border-radius: 50%; background: linear-gradient(180deg, var(--brand-lift), var(--brand)); position: relative; }
.t-send::before { content: ""; position: absolute; left: 50%; top: 32%; width: 2.2cqw; height: 2.2cqw; border: solid var(--on-brand); border-width: 2px 0 0 2px; transform: translateX(-50%) rotate(45deg); }
.is-glow .phone {
  border-color: var(--brand-lift);
  box-shadow: inset 0 1px 0 var(--hi), inset 0 0 0 2px rgba(var(--dark-rgb), .7), 0 44px 80px -34px var(--shade), 0 0 0 1px rgba(var(--brand-rgb), .7), 0 0 60px 6px rgba(var(--brand-rgb), .55), 0 0 140px 30px rgba(var(--brand-rgb), .28);
}
.is-glow .ph-screen::after { opacity: 1; }
.is-glow .ph-wrap::before { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
.n-bloom {
  position: absolute; left: 50%; top: 50%; z-index: 6; pointer-events: none;
  width: 100px; height: 100px; border-radius: 50%; transform: translate(-50%, -50%) scale(0); opacity: 0;
  background: radial-gradient(circle, var(--ink) 0%, var(--brand-lift) 16%, var(--brand) 42%, color-mix(in srgb, var(--brand) 82%, var(--bg-dark)) 60%, rgba(var(--brand-rgb), 0) 72%);
}

/* ============ 4. POWER ON ============ */
.c-power { background: var(--bg-dark); transition: background-color 1.1s ease; }
.c-power::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(60% 60% at 50% 46%, rgba(var(--brand-rgb), .16), transparent 72%); opacity: 0; transition: opacity 1.2s ease; }
.c-power.powered { background-color: var(--bg); }
.c-power.powered::after { opacity: 1; }
.p-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; padding: 10px; transition: opacity 1.4s ease; }
@media (orientation: portrait) { .p-grid { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(6, 1fr); } }
.cell { position: relative; border-radius: 10px; border: 1px solid rgba(var(--brand-rgb), .075); background: rgba(var(--brand-rgb), .012); }
.cell.pulse { animation: cellPulse 4.6s ease-in-out infinite; animation-delay: var(--pd, 0s); }
@keyframes cellPulse { 0%, 100% { border-color: rgba(var(--brand-rgb), .075); } 50% { border-color: rgba(var(--brand-rgb), .2); } }
.cell::before {
  content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none;
  border: 1px solid rgba(var(--brand-rgb), .62);
  background: radial-gradient(120% 120% at 50% 50%, rgba(var(--brand-rgb), .16), rgba(var(--brand-rgb), .05));
  box-shadow: inset 0 0 28px rgba(var(--brand-rgb), .18), 0 0 24px rgba(var(--brand-rgb), .14);
  opacity: 0;
}
.cell.on::before { animation: cellOn .56s linear both; animation-delay: var(--d, 0ms); }
@keyframes cellOn { 0% { opacity: 0; } 14% { opacity: .95; } 26% { opacity: .12; } 40% { opacity: .85; } 52% { opacity: .38; } 100% { opacity: 1; } }
.p-grid.settled { opacity: .5; }
.p-scan { position: absolute; left: 0; right: 0; top: 0; z-index: 3; height: 2px; pointer-events: none; opacity: 0; background: linear-gradient(90deg, transparent, rgba(var(--brand-rgb), .9), transparent); box-shadow: 0 0 18px rgba(var(--brand-rgb), .7); }
.p-stack { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; transition: opacity .6s ease, transform .9s var(--ease-out); }
.powered .p-stack { opacity: 0; transform: scale(.96); }
.p-stack .tag { margin-bottom: clamp(18px, 5svh, 42px); }
.p-ring {
  --c: 0; --g: 0; --rs: 180px;
  position: relative; width: var(--rs); height: var(--rs); flex: none;
  appearance: none; border: 0; padding: 0; border-radius: 50%; background: none; cursor: pointer;
  display: grid; place-items: center; color: var(--ink);
  touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
}
.p-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.p-ticks line { stroke: rgba(var(--brand-rgb), .24); stroke-width: 1.6; stroke-linecap: round; transition: stroke .25s ease; }
.p-ticks line.on { stroke: var(--brand-lift); }
.p-track { fill: none; stroke: rgba(var(--brand-rgb), .16); stroke-width: 3; }
.p-prog { fill: none; stroke: var(--brand-lift); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; transform: rotate(-90deg); transform-origin: 100px 100px; filter: drop-shadow(0 0 4px rgba(var(--brand-rgb), .9)); }
.p-face {
  position: relative; width: 64%; height: 64%; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
  background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--bg-lift) 86%, var(--ink)) 0%, var(--bg-lift) 42%, var(--bg-dark) 100%);
  border: 1px solid rgba(var(--brand-rgb), calc(.3 + var(--c) * .6));
  box-shadow: inset 0 1px 0 var(--hi), inset 0 -2px 0 rgba(var(--dark-rgb), .7), 0 0 calc(12px + var(--c) * 46px + var(--g) * 30px) rgba(var(--brand-rgb), calc(.14 + var(--c) * .45 + var(--g) * .25));
  transition: transform .25s var(--ease-out), background .4s ease;
}
.p-ring:not(.charging):not(.full) .p-face { animation: breathe 3.8s ease-in-out infinite; }
@keyframes breathe {
  0%, 100% { box-shadow: inset 0 1px 0 var(--hi), inset 0 -2px 0 rgba(var(--dark-rgb), .7), 0 0 12px rgba(var(--brand-rgb), .14); }
  50% { box-shadow: inset 0 1px 0 var(--hi), inset 0 -2px 0 rgba(var(--dark-rgb), .7), 0 0 34px rgba(var(--brand-rgb), .34); }
}
.p-ring.charging .p-face { transform: scale(.96); }
.p-label { font: 400 12px/1 var(--font-display); letter-spacing: .26em; padding-left: .26em; text-transform: uppercase; }
.p-pct { font: 500 10px/1 var(--font-mono); letter-spacing: .1em; color: var(--brand-lift); font-variant-numeric: tabular-nums; opacity: 0; transition: opacity .2s ease; }
.p-ring.charging .p-pct, .p-ring.full .p-pct { opacity: 1; }
.p-ring.full .p-face { background: radial-gradient(circle at 50% 30%, var(--brand-lift), var(--brand) 72%); color: var(--on-brand); border-color: var(--brand-lift); transform: scale(1.02); }
.p-ring.full .p-pct { color: var(--on-brand); }
.p-ring:focus-visible { outline-offset: 6px; }
.p-hint { margin: 4px 0 0; min-height: 1.2em; font: 400 11px/1.2 var(--font-mono); letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }

/* ============ SMALL SCREENS ============ */
@media (max-width: 999px), (max-height: 560px) {
  .n-layout { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .n-left, .n-right { display: contents; }
  .n-left .brand-row { order: 1; justify-content: center; margin-bottom: 4px; }
  .n-head { order: 2; align-items: center; text-align: center; gap: 8px; }
  .n-q { order: 3; }
  .ph-win { order: 4; }
  .n-actions { order: 5; justify-content: center; }
  .n-left .tag { display: none; }
  .ph-win {
    --crop: 1;
    width: 100vw; flex: none; height: clamp(250px, 42svh, 316px); padding-top: 20px;
    -webkit-mask-image: linear-gradient(180deg, transparent 0, var(--ink) 18px, var(--ink) calc(100% - 70px), transparent 100%);
    mask-image: linear-gradient(180deg, transparent 0, var(--ink) 18px, var(--ink) calc(100% - 70px), transparent 100%);
  }
  .phone { --pw: min(252px, 68vw); }
  .vib-l { right: calc(100% + 8px); } .vib-r { left: calc(100% + 8px); }
}
@media (max-width: 560px) {
  .g-word { font-size: clamp(24px, 7.4vw, 32px); letter-spacing: .08em; }
  .g-mark { width: 44px; height: 44px; }
  .gate { --gs: 108px; border-radius: 27px; }
  .g-stack { gap: 30px; }
  .tag { font-size: 12px; letter-spacing: .1em; }
  .chip { font-size: 10.5px; padding: 7px 10px 7px 9px; gap: 7px; border-radius: 9px; }
  .chip-tag { font-size: 8px; padding-right: 7px; letter-spacing: .12em; }
  .chip-dot { width: 5px; height: 5px; }
  .s-stack { gap: 14px; }
  .s-stack .actions { margin-top: 4px; }
  .n-time { font-size: clamp(26px, 7.6vw, 34px); }
  .n-line { font-size: clamp(17px, 5vw, 21px); }
  .n-q { font-size: clamp(21px, 6.2vw, 27px); }
  .n-actions { gap: 10px; }
  .n-actions .btn { min-height: 46px; padding: 0 22px; }
  .p-ring { --rs: 156px; }
}
@media (min-width: 1000px) and (min-height: 561px) {
  .phone { --pw: min(280px, calc((100svh - 90px) * .468)); }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .gate-ring, .gate:hover .gate-ring, .gate.is-hot .gate-ring, .gate:focus-visible .gate-ring { animation: none !important; }
  .gate-label { transition: none; }
  .ph-wrap.buzz .phone, .ph-wrap.buzz .vib, .ph-wrap.buzz::before { animation: none; }
  .p-ring:not(.charging):not(.full) .p-face { animation: none; }
  .cell.pulse { animation: none; }
  .cell.on::before { animation: cellFade .5s ease both; animation-delay: 0ms; }
  @keyframes cellFade { from { opacity: 0; } to { opacity: 1; } }
  .chip.ping, .is-sent .bub.out { animation: none; }
  .concept { animation-duration: .3s; }
  .ph-notif { transform: none; }
  .ph-thread { transform: none; }
}
`;

  var MARKUP = {
    gate: `
<section class="concept c-gate" aria-labelledby="g-title">
  <canvas class="fx" aria-hidden="true"></canvas>
  <div class="g-flash" aria-hidden="true"></div>
  <div class="scene"><div class="fit">
    <div class="g-stack">
      <div class="g-top">
        ${MARK.replace('class="mark"', 'class="mark g-mark"')}
        <h2 class="g-word" id="g-title"><span>Business</span> <span>Runs Better</span></h2>
        ${TAG}
      </div>
      <button class="gate" type="button">
        <span class="gate-ring r1" aria-hidden="true"></span>
        <span class="gate-ring r2" aria-hidden="true"></span>
        <span class="gate-ring r3" aria-hidden="true"></span>
        <span class="gate-label">Enter</span>
      </button>
      ${SKIP}
    </div>
  </div></div>
</section>`,
    sweep: `
<section class="concept c-sweep" aria-labelledby="s-title">
  <div class="s-floor" aria-hidden="true"></div>
  <div class="s-halo" aria-hidden="true"></div>
  <div class="s-chips" aria-hidden="true"></div>
  <div class="s-band" aria-hidden="true"></div>
  <div class="scene"><div class="fit">
    <div class="s-stack">
      <div class="brand-row">${MARK}<span class="wordmark">Business Runs Better</span></div>
      <h2 class="s-head" id="s-title">Sound like your week?</h2>
      ${TAG}
      <div class="actions">
        <button class="btn s-clear" type="button">Clear it</button>
        ${SKIP}
      </div>
    </div>
  </div></div>
  <div class="s-payoff" aria-hidden="true"><p>Your week, <span>minus the busywork.</span></p></div>
  <p class="sr-only">The screen is covered in busywork: missed calls, unread email, overdue invoices and reminders.</p>
</section>`,
    night: `
<section class="concept c-night" aria-labelledby="n-title">
  <div class="scene"><div class="fit">
    <div class="n-layout">
      <div class="n-left">
        <div class="brand-row">${MARK}<span class="wordmark">Business Runs Better</span></div>
        ${TAG}
        <h2 class="n-head" id="n-title"><span class="n-time">It&rsquo;s 9:47 PM.</span><span class="n-line">A customer just texted.</span></h2>
      </div>
      <div class="ph-win" aria-hidden="true">
        <div class="ph-wrap">
          <i class="vib vib-l"></i><i class="vib vib-r"></i>
          <div class="ph-lift">
            <div class="phone">
              <span class="ph-side ph-side-l"></span><span class="ph-side ph-side-r"></span>
              <div class="ph-screen">
                <div class="ph-wall"></div>
                <div class="ph-island"></div>
                <div class="ph-status"><span>9:47</span><span class="ph-icons"><i class="ph-sig"><b></b><b></b><b></b><b></b></i><i class="ph-bat"><b></b></i></span></div>
                <div class="ph-lock">
                  <div class="ph-date">Tuesday, March 3</div>
                  <div class="ph-clock">9:47</div>
                  <div class="ph-notif">
                    <div class="pn-top"><span class="pn-app"></span><span>Messages</span><span class="pn-when">now</span></div>
                    <div class="pn-from">(910) 555-0147</div>
                    <div class="pn-msg">Hi, are you still taking new customers this week?</div>
                  </div>
                  <div class="ph-lockbar"><span class="ph-round"></span><span class="ph-round"></span></div>
                </div>
                <div class="ph-thread">
                  <div class="t-head"><span class="t-back"></span><span class="t-avatar"></span><span class="t-name">(910) 555-0147</span><span class="t-kind">Text message</span></div>
                  <div class="t-body">
                    <div class="t-stamp">Today 9:47 PM</div>
                    <div class="bub in">Hi, are you still taking new customers this week?</div>
                    <div class="bub out"><span class="t-typed"></span><i class="caret"></i></div>
                    <div class="t-label">Drafting a reply</div>
                  </div>
                  <div class="t-compose"><span>Text message</span><i class="t-send"></i></div>
                </div>
                <div class="ph-home"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="n-right">
        <p class="n-q">Who answers?</p>
        <div class="n-actions">
          <button class="btn n-answer" type="button"><span class="n-answer-txt">Answer it</span></button>
          ${SKIP}
        </div>
      </div>
    </div>
  </div></div>
  <div class="n-bloom" aria-hidden="true"></div>
  <p class="sr-only n-live" aria-live="polite"></p>
</section>`,
    power: `
<section class="concept c-power" aria-labelledby="p-title">
  <div class="p-grid" aria-hidden="true"></div>
  <canvas class="fx" aria-hidden="true"></canvas>
  <div class="p-scan" aria-hidden="true"></div>
  <div class="scene"><div class="fit">
    <div class="p-stack">
      <div class="brand-row">${MARK}<h2 class="wordmark" id="p-title">Business Runs Better</h2></div>
      ${TAG}
      <button class="p-ring" type="button" aria-describedby="p-hint">
        <svg class="p-svg" viewBox="0 0 200 200" aria-hidden="true">
          <g class="p-ticks"></g>
          <circle class="p-track" cx="100" cy="100" r="80"/>
          <circle class="p-prog" cx="100" cy="100" r="80" pathLength="100"/>
        </svg>
        <span class="p-face"><span class="p-label">Enter</span><span class="p-pct" aria-hidden="true">0%</span></span>
      </button>
      <p class="p-hint" id="p-hint" aria-live="polite">Hold to power on</p>
      ${SKIP}
    </div>
  </div></div>
</section>`
  };

  var root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>' + CSS + '</style><div class="stage">' + MARKUP[KEY] + '</div>';
  host.setAttribute('data-splash', KEY);

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var now = function () { return performance.now(); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var ease = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { return t * t * t; },
    outBack: function (t) { var c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  };
  var mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  var RM = mqRM.matches;
  var lastInput = 'pointer';
  addEventListener('keydown', function () { lastInput = 'key'; }, true);
  addEventListener('pointerdown', function () { lastInput = 'pointer'; }, true);

  function makeLoop(fn) {
    var id = 0, lastT = 0, on = false;
    function tick(t) {
      if (!on) return;
      var dt = Math.min(.05, Math.max(0, (t - lastT) / 1000));
      lastT = t;
      fn(dt, t);
      if (on) id = requestAnimationFrame(tick);
    }
    return {
      start: function () { if (on) return; on = true; lastT = now(); id = requestAnimationFrame(tick); },
      stop: function () { on = false; cancelAnimationFrame(id); },
      get on() { return on; }
    };
  }
  function makeTimers() {
    var ids = [];
    return {
      set: function (fn, ms) { var id = setTimeout(function () { fn(); }, ms); ids.push(id); return id; },
      clear: function () { ids.forEach(clearTimeout); ids = []; }
    };
  }
  function makeAnims() {
    var list = [];
    return {
      play: function (el, kf, opts) { var a = el.animate(kf, opts); list.push(a); return a; },
      cancel: function () { list.splice(0).forEach(function (a) { try { a.cancel(); } catch (e) { /* gone */ } }); }
    };
  }
  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w: Math.max(1, r.width), h: Math.max(1, r.height), dpr: w / Math.max(1, r.width) };
  }
  /* Shrinks a concept's content block if a short screen cannot hold it. */
  function fitStack(scene, box) {
    box.style.setProperty('--fit', '1');
    var cs = getComputedStyle(scene);
    var aw = scene.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var ah = scene.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var s = Math.min(1, aw / Math.max(1, box.offsetWidth), ah / Math.max(1, box.offsetHeight));
    box.style.setProperty('--fit', s < 1 ? Math.max(.62, s).toFixed(3) : '1');
  }

  /* ---------- theme: canvases read these live, and the rgb triplets follow the visitor's theme ---------- */
  var TOK = { brand: '76,125,255', ink: '243,246,251', bg: '22,25,29', bgDark: '16,19,23' };
  function hexToRgb(hex) {
    var h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    if (isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }
  var cur = null;
  function readTokens() {
    var cs = getComputedStyle(document.documentElement);
    TOK.brand = cs.getPropertyValue('--brand-rgb').replace(/\s+/g, '') || TOK.brand;
    TOK.ink = hexToRgb(cs.getPropertyValue('--ink')) || TOK.ink;
    TOK.bg = hexToRgb(cs.getPropertyValue('--bg')) || TOK.bg;
    TOK.bgDark = hexToRgb(cs.getPropertyValue('--bg-dark')) || TOK.bgDark;
    host.style.setProperty('--ink-rgb', TOK.ink);
    host.style.setProperty('--bg-rgb', TOK.bg);
    host.style.setProperty('--dark-rgb', TOK.bgDark);
  }
  readTokens();
  new MutationObserver(function () { readTokens(); if (cur && cur.redraw) cur.redraw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

  /* what Enter and Skip do, handed over by index.html */
  var hooks = { enter: function () {}, skip: function () {}, unlock: function () {} };
  var finished = false;
  function finish() { if (finished) return; finished = true; hooks.enter(); }
  function unlock() { try { hooks.unlock(); } catch (e) { /* audio is optional */ } }

  /* ======================================================
     1. HYPERSPACE GATE
     ====================================================== */
  function makeGate() {
    var el = $('.c-gate'), cv = $('canvas', el), ctx = cv.getContext('2d');
    var scene = $('.scene', el), fit = $('.fit', el), top = $('.g-top', el), gate = $('.gate', el), label = $('.gate-label', el), skipBtn = $('.skip', el), flash = $('.g-flash', el);
    var T = makeTimers(), A = makeAnims(), loop = makeLoop(frame);
    var ZMAX = 4, CRUISE = .3, HOVER = 2.6;
    var W = 1, H = 1, DPR = 1, stars = [], dust = [], speed = CRUISE, target = CRUISE, mode = 'ready', jumpAt = 0;
    var vp = { x: 0, y: 0 }, base = { x: 0, y: 0 }, par = { x: 0, y: 0, tx: 0, ty: 0 };

    function newStar(s, far) {
      do { s.x = rand(-1, 1); s.y = rand(-1, 1); } while (Math.abs(s.x) < .025 && Math.abs(s.y) < .025);
      s.z = far ? rand(ZMAX * .82, ZMAX) : rand(.12, ZMAX);
      return s;
    }
    function seed() {
      var n = Math.round(clamp(W * H / 1150, 230, 860));
      stars = [];
      for (var i = 0; i < n; i++) {
        var s = newStar({}, false);
        s.brand = i < n * .3; s.tw = rand(0, 6.283); s.r = rand(.55, 1.35);
        stars.push(s);
      }
      /* a far layer that barely moves: it gives the field depth at rest */
      var m = Math.round(clamp(W * H / 2600, 120, 420));
      dust = [];
      for (var j = 0; j < m; j++) dust.push({ x: Math.random(), y: Math.random(), s: rand(.6, 1.5), a: rand(.12, .5), tw: rand(0, 6.283), brand: j < m * .25 });
    }
    function measure() {
      var c = el.getBoundingClientRect(), g = gate.getBoundingClientRect();
      base.x = g.left + g.width / 2 - c.left;
      base.y = g.top + g.height / 2 - c.top;
      vp.x = base.x + par.x; vp.y = base.y + par.y;
    }
    function resize() {
      fitStack(scene, fit);
      var s = fitCanvas(cv);
      var changed = Math.abs(s.w - W) > 2 || Math.abs(s.h - H) > 2;
      W = s.w; H = s.h; DPR = s.dpr;
      if (mode === 'ready' || mode === 'ended') measure();
      if (changed || !stars.length) seed();
      if (!loop.on) draw(0, now());
    }
    function frame(dt, t) {
      if (mode === 'jump') {
        var e = now() - jumpAt;
        speed = e < 220 ? lerp(speed, .05, 1 - Math.exp(-dt * 14)) : .05 + Math.pow(Math.min(1, (e - 220) / 900), 3) * 70;
      } else {
        speed = lerp(speed, target, 1 - Math.exp(-dt * (target > speed ? 2.4 : 1.5)));
      }
      par.x = lerp(par.x, par.tx, 1 - Math.exp(-dt * 2.5));
      par.y = lerp(par.y, par.ty, 1 - Math.exp(-dt * 2.5));
      vp.x = base.x + par.x; vp.y = base.y + par.y;
      draw(dt, t);
    }
    function draw(dt, t) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var F = Math.max(W, H) * .5;
      var dz = RM ? 0 : speed * dt;
      var trail = RM ? 0 : Math.pow(speed, 1.5) * .03 + .002;
      var heat = clamp((speed - CRUISE) / 8, 0, 1);
      /* the glow you are flying into */
      var R = Math.max(W, H) * (.3 + heat * .45);
      var g = ctx.createRadialGradient(vp.x, vp.y, 0, vp.x, vp.y, R);
      g.addColorStop(0, 'rgba(' + TOK.brand + ',' + (.13 + heat * .42) + ')');
      g.addColorStop(.35, 'rgba(' + TOK.brand + ',' + (.035 + heat * .12) + ')');
      g.addColorStop(1, 'rgba(' + TOK.brand + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      var ts = t / 1000;
      /* far dust: fades out as you speed up */
      var da = 1 - heat;
      if (da > .02) {
        var ox = par.x * .25, oy = par.y * .25;
        for (var pass = 0; pass < 2; pass++) {
          ctx.fillStyle = 'rgb(' + (pass ? TOK.brand : TOK.ink) + ')';
          for (var k = 0; k < dust.length; k++) {
            var d = dust[k];
            if (d.brand !== !!pass) continue;
            ctx.globalAlpha = d.a * da * (RM ? 1 : .75 + .25 * Math.sin(ts * 1.3 + d.tw));
            ctx.fillRect(d.x * W + ox, d.y * H + oy, d.s, d.s);
          }
        }
      }
      ctx.lineCap = 'round';
      var col = '';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.z -= dz;
        if (s.z < .035) { newStar(s, true); continue; }
        var px = vp.x + s.x / s.z * F, py = vp.y + s.y / s.z * F;
        if (px < -60 || px > W + 60 || py < -60 || py > H + 60) { newStar(s, true); continue; }
        var z2 = Math.min(ZMAX, s.z + trail);
        var qx = vp.x + s.x / z2 * F, qy = vp.y + s.y / z2 * F;
        var depth = clamp((ZMAX - s.z) / (ZMAX - .4), 0, 1);
        var tw = RM ? 1 : .72 + .28 * Math.sin(ts * 2.1 + s.tw);
        var fadeIn = clamp((ZMAX - s.z) / .5, 0, 1);
        var a = (.16 + .84 * Math.pow(depth, 1.6)) * fadeIn * tw * (1 + heat * .6);
        if (a < .02) continue;
        var c = s.brand ? TOK.brand : TOK.ink;
        if (c !== col) { col = c; ctx.strokeStyle = 'rgb(' + c + ')'; }
        ctx.globalAlpha = Math.min(1, a);
        ctx.lineWidth = clamp(s.r / s.z * .85, .5, 3.4) * (1 + heat * .4);
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(px + .01, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function heatUp(on) {
      if (mode !== 'ready') return;
      target = on ? HOVER : CRUISE;
      gate.classList.toggle('is-hot', on);
    }
    function jump() {
      if (mode !== 'ready') return;
      unlock();
      gate.classList.add('is-hot');
      flash.style.setProperty('--vx', vp.x + 'px');
      flash.style.setProperty('--vy', vp.y + 'px');
      if (RM) {
        mode = 'ended';
        A.play(fit, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' });
        A.play(flash, [{ opacity: 0 }, { opacity: .35, offset: .45 }, { opacity: 0 }], { duration: 1200, fill: 'forwards' });
        T.set(finish, 600);
        return;
      }
      mode = 'jump';
      jumpAt = now();
      A.play(top, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.16)' }], { duration: 560, delay: 150, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      A.play(skipBtn, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      A.play(label, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 200, fill: 'forwards' });
      A.play(gate, [
        { transform: 'scale(1)', opacity: 1, easing: 'cubic-bezier(.3,0,.4,1)' },
        { transform: 'scale(.9)', opacity: 1, offset: .18, easing: 'cubic-bezier(.65,0,.9,.4)' },
        { transform: 'scale(15)', opacity: 0 }
      ], { duration: 1180, fill: 'forwards' });
      A.play(flash, [{ opacity: 0 }, { opacity: 0, offset: .5 }, { opacity: 1, offset: .62 }, { opacity: 0 }], { duration: 1950, easing: 'linear', fill: 'forwards' });
      T.set(function () { mode = 'ended'; speed = .08; target = .16; par.tx = par.ty = 0; seed(); }, 1200);
      T.set(finish, 1500);
    }
    gate.addEventListener('pointerenter', function () { heatUp(true); });
    gate.addEventListener('pointerleave', function () { heatUp(false); });
    gate.addEventListener('pointerdown', function () { heatUp(true); });
    gate.addEventListener('focus', function () { if (lastInput === 'key') heatUp(true); });
    gate.addEventListener('blur', function () { heatUp(false); });
    gate.addEventListener('click', jump);
    el.addEventListener('pointermove', function (e) {
      if (RM || mode !== 'ready') return;
      var r = el.getBoundingClientRect();
      par.tx = -((e.clientX - r.left) / r.width - .5) * 40;
      par.ty = -((e.clientY - r.top) / r.height - .5) * 26;
    });
    return {
      reset: function () { T.clear(); A.cancel(); mode = 'ready'; speed = CRUISE; target = CRUISE; par.x = par.y = par.tx = par.ty = 0; gate.classList.remove('is-hot'); resize(); seed(); },
      start: function () { if (!RM) loop.start(); draw(0, now()); },
      stop: function () { loop.stop(); T.clear(); },
      resize: resize,
      redraw: function () { if (!loop.on) draw(0, now()); },
      primary: jump,
      focusEl: gate,
      busy: function () { return mode !== 'ready'; },
      onSkip: function () { mode = 'skipped'; }
    };
  }

  /* ======================================================
     2. BUSYWORK SWEEP
     ====================================================== */
  function makeSweep() {
    var el = $('.c-sweep'), layer = $('.s-chips', el), scene = $('.scene', el), fit = $('.fit', el), stack = $('.s-stack', el);
    var clearBtn = $('.s-clear', el), payoff = $('.s-payoff', el), band = $('.s-band', el), halo = $('.s-halo', el);
    var T = makeTimers(), A = makeAnims(), loop = makeLoop(frame);
    var DATA = [
      { tag: 'Call', alert: 1, count: 2, fmt: function (n) { return 'Missed call (' + n + ')'; } },
      { tag: 'Mail', alert: 1, count: 47, fmt: function (n) { return n + ' unread'; } },
      { tag: 'To do', alert: 1, text: 'Quote due today' },
      { tag: 'Text', text: 'Follow up?' },
      { tag: 'Bill', alert: 1, text: 'Invoice #208 overdue' },
      { tag: 'Call', count: 3, fmt: function (n) { return 'Voicemail (' + n + ')'; } },
      { tag: 'Web', text: 'Update the website' },
      { tag: 'Review', text: 'Reply to review' },
      { tag: 'Cal', alert: 1, text: 'Schedule conflict' },
      { tag: 'Social', text: 'Post on Facebook' },
      { tag: 'File', text: 'Where’s that file?' },
      { tag: 'Call', text: 'Call back Tom' },
      { tag: 'Text', text: 'Running late?' },
      { tag: 'Web', alert: 1, text: 'Hours wrong on Google' },
      { tag: 'Mail', text: 'Re: Re: estimate' },
      { tag: 'To do', text: 'Copy leads into sheet' },
      { tag: 'Bill', text: 'Chase the deposit' },
      { tag: 'Cal', text: 'Double-booked Thursday' },
      { tag: 'File', text: 'Price list v7 FINAL' },
      { tag: 'Social', count: 2, fmt: function (n) { return n + ' new comments'; } },
      { tag: 'Text', text: 'Is the quote ready?' },
      { tag: 'Web', alert: 1, text: 'Form not sending?' },
      { tag: 'Mail', text: 'Password reset' },
      { tag: 'To do', text: 'Order more cards' },
      { tag: 'Call', text: 'Unknown number' },
      { tag: 'To do', text: 'Payroll Friday' },
      { tag: 'Review', text: 'New 3-star review' }
    ];
    var KIND = ['Call', 'Text', 'Mail', 'Cal', 'To do', 'Bill', 'Web', 'Social', 'Review', 'File'];
    var chips = DATA.map(function (d, i) {
      var node = document.createElement('div');
      node.className = 'chip' + (d.alert ? ' is-alert' : '');
      node.innerHTML = '<i class="chip-dot"></i><span class="chip-tag"></span><span class="chip-txt"></span>';
      node.querySelector('.chip-tag').textContent = d.tag;
      layer.appendChild(node);
      return { node: node, txt: node.querySelector('.chip-txt'), d: d, i: i, n: d.count || 0, on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, base: 0, w: 0, h: 0,
        f1: rand(.22, .48), f2: rand(.18, .42), p1: rand(0, 6.28), p2: rand(0, 6.28), tx: 0, ty: 0, fx: 0, fy: 0, fa: 0, delay: 0, row: 0, marked: false };
    });
    var live = [], W = 1, H = 1, mode = 'ready', obstacles = [], rows = [], pingAt = 0, sweepAt = 0, holdUntil = 0, exitAt = 0, pairGap = 10;
    var ptr = { x: -999, y: -999, on: false, touch: false };

    function setText(c) { c.txt.textContent = c.d.fmt ? c.d.fmt(c.n) : c.d.text; }
    function measureObstacles() {
      var r0 = el.getBoundingClientRect(), s = stack.getBoundingClientRect();
      obstacles = [{ cx: s.left + s.width / 2 - r0.left, cy: s.top + s.height / 2 - r0.top, w: s.width + 30, h: s.height + 26 }];
    }
    function overlaps(x, y, c, list, pad) {
      for (var k = 0; k < list.length; k++) {
        var o = list[k], ox = o.cx !== undefined ? o.cx : o.x, oy = o.cy !== undefined ? o.cy : o.y;
        if (Math.abs(x - ox) < (c.w + o.w) / 2 + pad && Math.abs(y - oy) < (c.h + o.h) / 2 + pad) return true;
      }
      return false;
    }
    function layout() {
      W = el.clientWidth; H = el.clientHeight;
      chips.forEach(function (c) { c.node.hidden = false; c.node.classList.remove('done', 'ping'); c.node.style.opacity = ''; c.n = c.d.count || 0; setText(c); c.marked = false; });
      chips.forEach(function (c) { c.w = c.node.offsetWidth; c.h = c.node.offsetHeight; });
      measureObstacles();
      var free = W * H - obstacles.reduce(function (s, o) { return s + o.w * o.h; }, 0);
      var avg = chips.reduce(function (s, c) { return s + (c.w + 12) * (c.h + 12); }, 0) / chips.length;
      pairGap = W < 560 ? 5 : 10;
      var n = clamp(Math.round(free * (W < 560 ? .46 : .34) / avg), 8, chips.length);
      live = [];
      chips.forEach(function (c, i) {
        c.on = i < n;
        c.node.hidden = !c.on;
        if (!c.on) return;
        var ok = false;
        for (var k = 0; k < 260 && !ok; k++) {
          var x = rand(c.w / 2 + 10, W - c.w / 2 - 10), y = rand(c.h / 2 + 10, H - c.h / 2 - 10);
          if (!overlaps(x, y, c, obstacles, 6) && !overlaps(x, y, c, live, pairGap - 2)) { c.x = x; c.y = y; ok = true; }
        }
        if (!ok) { c.x = rand(c.w / 2, Math.max(c.w / 2, W - c.w / 2)); c.y = rand(c.h / 2, Math.max(c.h / 2, H - c.h / 2)); }
        c.vx = c.vy = c.va = 0;
        c.base = rand(-6, 6);
        c.a = c.base;
        live.push(c);
      });
      for (var k = 0; k < 120; k++) physics(1 / 60, 0, true);
      render();
    }
    function physics(dt, t, settle) {
      var k = Math.min(2.5, dt * 60), R = ptr.touch ? 120 : 160, ts = t / 1000, i, j, c;
      for (i = 0; i < live.length; i++) {
        c = live[i];
        if (!settle && !RM) {
          c.vx += Math.sin(ts * c.f1 + c.p1) * .022 * k;
          c.vy += Math.cos(ts * c.f2 + c.p2) * .022 * k;
        }
        if (ptr.on && !settle && !RM) {
          var nx = clamp(ptr.x, c.x - c.w / 2, c.x + c.w / 2), ny = clamp(ptr.y, c.y - c.h / 2, c.y + c.h / 2);
          var d = Math.hypot(ptr.x - nx, ptr.y - ny);
          if (d < R) {
            var dx = c.x - ptr.x, dy = c.y - ptr.y, len = Math.hypot(dx, dy) || 1;
            var f = Math.pow(1 - d / R, 2) * 1.7 * k;
            c.vx += dx / len * f; c.vy += dy / len * f;
            c.va += f * .55 * (dx * dy > 0 ? 1 : -1);
          }
        }
      }
      for (i = 0; i < live.length; i++) {
        var a = live[i];
        for (j = i + 1; j < live.length; j++) {
          var b = live[j], ddx = b.x - a.x, ddy = b.y - a.y;
          var ox = (a.w + b.w) / 2 + pairGap - Math.abs(ddx);
          if (ox <= 0) continue;
          var oy = (a.h + b.h) / 2 + pairGap - Math.abs(ddy);
          if (oy <= 0) continue;
          var ff;
          if (ox < oy) { ff = ox * .07 * k * (ddx < 0 ? -1 : 1); a.vx -= ff; b.vx += ff; }
          else { ff = oy * .07 * k * (ddy < 0 ? -1 : 1); a.vy -= ff; b.vy += ff; }
        }
      }
      for (i = 0; i < live.length; i++) {
        c = live[i];
        for (j = 0; j < obstacles.length; j++) {
          var o = obstacles[j], qx = c.x - o.cx, qy = c.y - o.cy;
          var px = (c.w + o.w) / 2 - Math.abs(qx);
          if (px <= 0) continue;
          var py = (c.h + o.h) / 2 - Math.abs(qy);
          if (py <= 0) continue;
          if (px < py) c.vx += px * .14 * k * (qx < 0 ? -1 : 1);
          else c.vy += py * .14 * k * (qy < 0 ? -1 : 1);
        }
        var m = 8;
        var l = c.x - c.w / 2 - m, r = W - m - (c.x + c.w / 2), tp = c.y - c.h / 2 - m, bt = H - m - (c.y + c.h / 2);
        if (l < 0) c.vx -= l * .12 * k;
        if (r < 0) c.vx += r * .12 * k;
        if (tp < 0) c.vy -= tp * .12 * k;
        if (bt < 0) c.vy += bt * .12 * k;
        var damp = Math.pow(.9, k);
        c.vx *= damp; c.vy *= damp;
        var sp = Math.hypot(c.vx, c.vy);
        if (sp > 16) { c.vx *= 16 / sp; c.vy *= 16 / sp; }
        c.x += c.vx * k; c.y += c.vy * k;
        c.va += (c.base - c.a) * .03 * k;
        c.va *= Math.pow(.85, k);
        c.a = clamp(c.a + c.va * k, -28, 28);
      }
    }
    function render() {
      for (var i = 0; i < live.length; i++) {
        var c = live[i];
        c.node.style.transform = 'translate3d(' + (c.x - c.w / 2).toFixed(1) + 'px,' + (c.y - c.h / 2).toFixed(1) + 'px,0) rotate(' + c.a.toFixed(2) + 'deg)';
      }
    }
    function ping(t) {
      if (t < pingAt) return;
      pingAt = t + rand(2200, 3800);
      var pool2 = live.filter(function (c) { return c.d.count || c.d.alert; });
      var c = pool2[Math.floor(Math.random() * pool2.length)];
      if (!c) return;
      if (c.d.count && c.n < c.d.count + 6) { c.n += 1; setText(c); c.w = c.node.offsetWidth; }
      c.node.classList.remove('ping');
      void c.node.offsetWidth;
      c.node.classList.add('ping');
      c.vx += rand(-1.6, 1.6); c.vy += rand(-1.6, 1.6); c.va += rand(-4, 4);
    }
    function frame(dt, t) {
      var i, c, p;
      if (mode === 'ready') {
        physics(dt, t, false);
        render();
        ping(t);
        if (ptr.on) halo.style.transform = 'translate3d(' + ptr.x + 'px,' + ptr.y + 'px,0)';
        return;
      }
      if (mode === 'sweep') {
        var e = now() - sweepAt, allIn = true;
        for (i = 0; i < live.length; i++) {
          c = live[i];
          p = clamp((e - c.delay) / 540, 0, 1);
          if (p < 1) allIn = false;
          var q = ease.outBack(p), qa = ease.outCubic(p);
          c.x = lerp(c.fx, c.tx, q); c.y = lerp(c.fy, c.ty, q); c.a = lerp(c.fa, 0, qa);
          if (p > .3 && !c.marked) { c.marked = true; c.node.classList.add('done'); }
        }
        render();
        if (allIn) { mode = 'hold'; holdUntil = now() + 260; }
        return;
      }
      if (mode === 'hold') { if (now() >= holdUntil) { mode = 'exit'; exitAt = now(); } return; }
      if (mode === 'exit') {
        var ex = now() - exitAt, done = true;
        for (i = 0; i < live.length; i++) {
          c = live[i];
          p = clamp((ex - c.row * 50) / 400, 0, 1);
          if (p < 1) done = false;
          c.x = c.tx + ease.inCubic(p) * (W - rows[c.row].x0 + 40);
          c.node.style.opacity = String(1 - p * .5);
        }
        render();
        if (done) { live.forEach(function (c2) { c2.node.hidden = true; }); mode = 'calm'; loop.stop(); showPayoff(); }
      }
    }
    function packRows(items, maxW, gap) {
      var out = [], row = [], rw = 0;
      items.forEach(function (c) {
        if (row.length && rw + gap + c.w > maxW) { out.push({ items: row, w: rw }); row = []; rw = 0; }
        rw += (row.length ? gap : 0) + c.w;
        row.push(c);
      });
      if (row.length) out.push({ items: row, w: rw });
      return out;
    }
    function clear() {
      if (mode !== 'ready') return;
      unlock();
      mode = 'sweep';
      sweepAt = now();
      ptr.on = false;
      halo.classList.remove('on');
      A.play(stack, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
      if (RM) {
        mode = 'calm';
        loop.stop();
        live.forEach(function (c) { A.play(c.node, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }); });
        T.set(showPayoff, 460);
        return;
      }
      A.play(band, [{ transform: 'translateX(-45vw)', opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .75 }, { transform: 'translateX(105vw)', opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.45,0,.25,1)' });
      /* sorted by kind, packed into rows, then evened out so no chip sits alone */
      var sorted = live.slice().sort(function (a, b) { return (KIND.indexOf(a.d.tag) - KIND.indexOf(b.d.tag)) || (a.i - b.i); });
      var tight = W < 560, maxW = Math.min(W - 32, 960), gap = tight ? 8 : 10, rowGap = tight ? 9 : 12;
      rows = packRows(sorted, maxW, gap);
      var total = sorted.reduce(function (s, c) { return s + c.w; }, 0) + gap * (sorted.length - rows.length);
      for (var target = total / rows.length; target < maxW; target += 10) {
        var r = packRows(sorted, target, gap);
        if (r.length <= rows.length) { rows = r; break; }
      }
      var rh = Math.max.apply(null, live.map(function (c) { return c.h; }));
      var blockH = rows.length * rh + (rows.length - 1) * rowGap;
      var y = Math.max(14, (H - blockH) / 2) + rh / 2;
      rows.forEach(function (row, ri) {
        row.x0 = (W - row.w) / 2;
        var x = row.x0;
        row.items.forEach(function (c) { c.tx = x + c.w / 2; c.ty = y; c.row = ri; x += c.w + gap; });
        y += rh + rowGap;
      });
      live.forEach(function (c) { c.fx = c.x; c.fy = c.y; c.fa = c.a; c.delay = clamp(c.x / W, 0, 1) * 320; });
    }
    function showPayoff() {
      A.play(payoff, [{ opacity: 0, transform: RM ? 'none' : 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: RM ? 400 : 600, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      T.set(finish, 950);   // the payoff line stays up while the intro fades in
    }
    function setPtr(e) {
      var r = el.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
      ptr.touch = e.pointerType !== 'mouse';
    }
    el.addEventListener('pointermove', function (e) {
      setPtr(e);
      if (mode !== 'ready' || RM) return;
      if (e.pointerType === 'mouse' || e.buttons) { ptr.on = true; halo.classList.add('on'); }
    });
    el.addEventListener('pointerdown', function (e) { setPtr(e); if (mode === 'ready' && !RM) { ptr.on = true; halo.classList.add('on'); } });
    el.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { ptr.on = false; halo.classList.remove('on'); } });
    el.addEventListener('pointerleave', function () { ptr.on = false; halo.classList.remove('on'); });
    el.addEventListener('pointercancel', function () { ptr.on = false; halo.classList.remove('on'); });
    clearBtn.addEventListener('click', clear);
    return {
      reset: function () { T.clear(); A.cancel(); mode = 'ready'; ptr.on = false; halo.classList.remove('on'); fitStack(scene, fit); layout(); pingAt = now() + 1600; },
      start: function () { if (!RM) loop.start(); },
      stop: function () { loop.stop(); T.clear(); },
      resize: function () {
        W = el.clientWidth; H = el.clientHeight;
        fitStack(scene, fit);
        if (mode === 'ready') {
          live.forEach(function (c) { c.w = c.node.offsetWidth; c.h = c.node.offsetHeight; });
          measureObstacles();
          if (RM) { for (var k = 0; k < 120; k++) physics(1 / 60, 0, true); render(); }
        }
      },
      relayout: function () { if (mode === 'ready') layout(); },
      primary: clear,
      focusEl: clearBtn,
      busy: function () { return mode !== 'ready'; },
      onSkip: function () { mode = 'skipped'; ptr.on = false; halo.classList.remove('on'); }
    };
  }

  /* ======================================================
     3. 9:47 PM
     ====================================================== */
  function makeNight() {
    var el = $('.c-night'), scene = $('.scene', el), fit = $('.fit', el);
    var btn = $('.n-answer', el), btnTxt = $('.n-answer-txt', el);
    var win = $('.ph-win', el), wrap = $('.ph-wrap', el), lift = $('.ph-lift', el), phone = $('.phone', el);
    var typed = $('.t-typed', el), outBub = $('.bub.out', el), label = $('.t-label', el), bloom = $('.n-bloom', el), liveEl = $('.n-live', el);
    var T = makeTimers(), A = makeAnims();
    var REPLY = 'Yes we are! I can get you on the calendar. Does Tuesday morning work?';
    var STATES = ['is-awake', 'has-notif', 'is-open', 'is-drafting', 'is-sent', 'is-glow', 'is-gone'];
    var mode = 'ready';
    try { $('.ph-date', el).textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch (e) { /* keep the default */ }

    function cropped() { return getComputedStyle(win).getPropertyValue('--crop').trim() === '1'; }
    /* On phones only the top of the handset shows, so slide it up as the reply grows. */
    function follow() {
      if (!cropped()) { lift.style.setProperty('--lift', '0px'); return; }
      var w = win.getBoundingClientRect(), b = outBub.getBoundingClientRect(), l = label.getBoundingClientRect();
      var cur0 = parseFloat(lift.style.getPropertyValue('--lift')) || 0;
      var need = Math.max(b.bottom, l.bottom) - (w.bottom - 46);
      if (need > 0) lift.style.setProperty('--lift', (cur0 - need).toFixed(1) + 'px');
    }
    function buzz() {
      if (mode !== 'ready') return;
      if (!RM) { wrap.classList.remove('buzz'); void wrap.offsetWidth; wrap.classList.add('buzz'); }
      T.set(buzz, 4600);
    }
    function answer() {
      if (mode !== 'ready') return;
      unlock();
      mode = 'answering';
      btn.setAttribute('aria-disabled', 'true');
      btnTxt.textContent = 'Answering';
      wrap.classList.remove('buzz');
      el.classList.add('is-awake', 'has-notif', 'is-open');
      if (RM) {
        T.set(function () { el.classList.add('is-drafting'); typed.textContent = REPLY; follow(); }, 200);
        T.set(sent, 600);
        T.set(function () { el.classList.add('is-glow'); }, 900);
        T.set(function () { el.classList.add('is-gone'); finish(); }, 1500);
        return;
      }
      T.set(function () { el.classList.add('is-drafting'); follow(); }, 250);
      var at = 380;
      for (var i = 1; i <= REPLY.length; i++) {
        var ch = REPLY[i - 1];
        at += /[.!?]/.test(ch) ? 70 : ch === ' ' ? 16 : rand(8, 14);
        (function (n) { T.set(function () { typed.textContent = REPLY.slice(0, n); if (n % 6 === 0 || n === REPLY.length) follow(); }, at); })(i);
      }
      T.set(sent, at + 120);
      T.set(function () { el.classList.add('is-glow'); }, at + 300);
      T.set(bloomOut, at + 650);
    }
    function sent() {
      el.classList.add('is-sent');
      label.textContent = 'Delivered · Answered for you';
      liveEl.textContent = 'Reply sent: ' + REPLY;
      follow();
    }
    function bloomOut() {
      var r0 = el.getBoundingClientRect(), p = phone.getBoundingClientRect(), w = win.getBoundingClientRect();
      var top = Math.max(p.top, w.top), bottom = Math.min(p.bottom, w.bottom);
      var cx = p.left + p.width / 2 - r0.left, cy = (top + bottom) / 2 - r0.top;
      var far = Math.hypot(Math.max(cx, r0.width - cx), Math.max(cy, r0.height - cy));
      bloom.style.left = cx + 'px';
      bloom.style.top = cy + 'px';
      var S = far / 30 * 1.12;
      A.play(bloom, [
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: 'translate(-50%,-50%) scale(' + (S * .08).toFixed(2) + ')', opacity: 1, offset: .25 },
        { transform: 'translate(-50%,-50%) scale(' + S.toFixed(2) + ')', opacity: 1 }
      ], { duration: 620, easing: 'cubic-bezier(.55,0,.75,.35)', fill: 'forwards' });
      T.set(function () { el.classList.add('is-gone'); finish(); }, 630);
    }
    btn.addEventListener('click', answer);
    return {
      reset: function () {
        T.clear(); A.cancel(); mode = 'ready';
        el.classList.remove.apply(el.classList, STATES);
        wrap.classList.remove('buzz');
        typed.textContent = ''; label.textContent = 'Drafting a reply';
        lift.style.setProperty('--lift', '0px');
        btn.removeAttribute('aria-disabled'); btnTxt.textContent = 'Answer it';
        liveEl.textContent = '';
        fitStack(scene, fit);
      },
      start: function () {
        T.set(function () { el.classList.add('is-awake'); }, RM ? 0 : 420);
        T.set(function () {
          el.classList.add('has-notif');
          liveEl.textContent = 'New text at 9:47 PM. Hi, are you still taking new customers this week?';
          buzz();
        }, RM ? 0 : 900);
      },
      stop: function () { T.clear(); },
      resize: function () { fitStack(scene, fit); if (mode !== 'ready') follow(); },
      primary: answer,
      focusEl: btn,
      busy: function () { return mode !== 'ready'; },
      onSkip: function () { mode = 'skipped'; T.clear(); wrap.classList.remove('buzz'); }
    };
  }

  /* ======================================================
     4. POWER ON
     ====================================================== */
  function makePower() {
    var el = $('.c-power'), cv = $('canvas', el), ctx = cv.getContext('2d');
    var scene = $('.scene', el), fit = $('.fit', el), ring = $('.p-ring', el), pct = $('.p-pct', el), hint = $('.p-hint', el);
    var grid = $('.p-grid', el), ticksG = $('.p-ticks', el), prog = $('.p-prog', el), scan = $('.p-scan', el);
    var T = makeTimers(), A = makeAnims(), loop = makeLoop(frame);
    var NT = 60, ticks = [], cells = [], i;
    for (i = 0; i < NT; i++) {
      var ang = i / NT * Math.PI * 2 - Math.PI / 2;
      var ln = document.createElementNS(SVGNS, 'line');
      ln.setAttribute('x1', (100 + Math.cos(ang) * 91).toFixed(2));
      ln.setAttribute('y1', (100 + Math.sin(ang) * 91).toFixed(2));
      ln.setAttribute('x2', (100 + Math.cos(ang) * (i % 5 === 0 ? 99 : 96)).toFixed(2));
      ln.setAttribute('y2', (100 + Math.sin(ang) * (i % 5 === 0 ? 99 : 96)).toFixed(2));
      ticksG.appendChild(ln);
      ticks.push(ln);
    }
    for (i = 0; i < 24; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell' + (Math.random() > .55 ? ' pulse' : '');
      cell.style.setProperty('--pd', rand(0, 4.5).toFixed(2) + 's');
      grid.appendChild(cell);
      cells.push(cell);
    }
    var W = 1, H = 1, DPR = 1, cx = 0, cy = 0, ringR = 60, charge = 0, mode = 'idle', pressAt = 0;
    var parts = [], dust = [], waves = [], spawnAcc = 0, lastLit = -1, glow = 0, density = 1;

    function setCharge(v) {
      charge = v;
      prog.style.strokeDashoffset = (100 - v * 100).toFixed(2);
      prog.style.opacity = v > .004 ? '1' : '0';
      var lit = Math.round(v * NT);
      if (lit !== lastLit) { for (var k = 0; k < NT; k++) ticks[k].classList.toggle('on', k < lit); lastLit = lit; }
      ring.style.setProperty('--c', v.toFixed(3));
      pct.textContent = Math.round(v * 100) + '%';
    }
    var HINTS = { idle: 'Hold to power on', hold: 'Keep holding', drain: 'Hold a little longer', auto: 'Powering on', done: 'Powering on', ended: 'Powering on' };
    function setHint() { var t = HINTS[mode] || HINTS.idle; if (hint.textContent !== t) hint.textContent = t; }
    function press(kind) {
      if (mode === 'done' || mode === 'ended' || mode === 'skipped') return;
      unlock();
      if (kind === 'auto') mode = 'auto';
      else { mode = 'hold'; pressAt = now(); }
      ring.classList.add('charging');
      setHint();
      loop.start();
    }
    function release() {
      if (mode !== 'hold') return;
      mode = now() - pressAt < 240 ? 'auto' : 'drain';
      setHint();
    }
    ring.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      e.preventDefault();
      try { ring.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      press('hold');
    });
    ring.addEventListener('pointerup', release);
    ring.addEventListener('pointercancel', function () { if (mode === 'hold') { mode = 'drain'; setHint(); } });
    ring.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (e.repeat) return;
      press(e.key === ' ' ? 'hold' : 'auto');
    });
    ring.addEventListener('keyup', function (e) { if (e.key === ' ') { e.preventDefault(); release(); } });
    ring.addEventListener('click', function (e) { if (e.detail === 0 && (mode === 'idle' || mode === 'drain')) press('auto'); });
    ring.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    function measure() {
      var r0 = el.getBoundingClientRect(), r = ring.getBoundingClientRect();
      cx = r.left + r.width / 2 - r0.left;
      cy = r.top + r.height / 2 - r0.top;
      ringR = r.width / 2 * .8;
    }
    function seedDust() {
      var n = Math.round(clamp(W * H / 42000, 10, 28));
      dust = [];
      for (var k = 0; k < n; k++) dust.push({ x: rand(0, W), y: rand(0, H), vx: rand(-5, 5), vy: rand(-9, -2), s: rand(1, 2), a: rand(.08, .24) });
    }
    function resize() {
      fitStack(scene, fit);
      var s = fitCanvas(cv);
      W = s.w; H = s.h; DPR = s.dpr;
      density = clamp(W * H / (1280 * 760), .55, 1);
      measure();
      if (!dust.length) seedDust();
      if (!loop.on) draw(0, now());
    }
    function spawn() {
      var u = Math.random() * 2 * (W + H), x, y;
      if (u < W) { x = u; y = -6; }
      else if ((u -= W) < H) { x = W + 6; y = u; }
      else if ((u -= H) < W) { x = W - u; y = H + 6; }
      else { u -= W; x = -6; y = H - u; }
      var dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy) || 1;
      var tan = rand(140, 320) * (Math.random() < .5 ? 1 : -1), rad = rand(30, 90);
      return { x: x, y: y, vx: dx / d * rad - dy / d * tan, vy: dy / d * rad + dx / d * tan, life: .15, brand: Math.random() < .72, w: rand(.8, 2), hx: [x], hy: [y] };
    }
    function segDist(ax, ay, bx, by, px, py) {
      var vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
      var t = l2 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0;
      t = clamp(t, 0, 1);
      return Math.hypot(ax + vx * t - px, ay + vy * t - py);
    }
    function frame(dt, t) {
      if (mode === 'hold') setCharge(Math.min(1, charge + dt / .8));
      else if (mode === 'auto') setCharge(Math.min(1, charge + dt / .45));
      else if (mode === 'drain') {
        setCharge(Math.max(0, charge - dt / .7));
        if (charge <= 0) { mode = 'idle'; ring.classList.remove('charging'); setHint(); }
      }
      if (charge >= 1 && (mode === 'hold' || mode === 'auto')) powerOn();
      glow *= Math.pow(.15, dt);
      ring.style.setProperty('--g', glow.toFixed(3));
      draw(dt, t);
      if ((mode === 'ended' || mode === 'skipped') && !parts.length && !waves.length) loop.stop();
    }
    function draw(dt) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var charging = mode === 'hold' || mode === 'auto', k, p;
      if (!RM) {
        ctx.fillStyle = 'rgb(' + TOK.ink + ')';
        var dm = mode === 'ended' ? .4 : 1;
        for (k = 0; k < dust.length; k++) {
          var d = dust[k];
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.y < -4) { d.y = H + 4; d.x = rand(0, W); }
          if (d.x < -4) d.x = W + 4; else if (d.x > W + 4) d.x = -4;
          ctx.globalAlpha = d.a * dm;
          ctx.fillRect(d.x, d.y, d.s, d.s);
        }
      }
      if (charging && !RM) {
        spawnAcc += (60 + 230 * charge) * density * dt;
        while (spawnAcc >= 1) { spawnAcc -= 1; if (parts.length < 360) parts.push(spawn()); }
      }
      ctx.lineCap = 'round';
      for (k = parts.length - 1; k >= 0; k--) {
        p = parts[k];
        var dx = cx - p.x, dy = cy - p.y, dd = Math.hypot(dx, dy) || 1;
        if (charging) {
          var acc = (560 + 2300 * charge) / Math.sqrt(Math.max(dd, 40) / 120);
          p.vx += dx / dd * acc * dt; p.vy += dy / dd * acc * dt;
          p.life = Math.min(1, p.life + dt * 2.6);
        } else if (mode === 'drain' || mode === 'idle') {
          p.vx -= dx / dd * 170 * dt; p.vy -= dy / dd * 170 * dt;
          p.life -= dt * 1.5;
        } else {
          p.life -= dt * 1.3;
        }
        var damp = Math.pow(charging ? .42 : .3, dt);
        p.vx *= damp; p.vy *= damp;
        var ox = p.x, oy = p.y;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.hx.push(p.x); p.hy.push(p.y);
        if (p.hx.length > 7) { p.hx.shift(); p.hy.shift(); }
        if (charging && segDist(ox, oy, p.x, p.y, cx, cy) < ringR * .9) { parts.splice(k, 1); glow = Math.min(1, glow + .04); continue; }
        if (p.life <= 0) { parts.splice(k, 1); continue; }
        var sp = Math.hypot(p.vx, p.vy);
        ctx.globalAlpha = p.life * clamp(.3 + sp / 900, .3, .95);
        ctx.strokeStyle = p.brand ? 'rgb(' + TOK.brand + ')' : 'rgb(' + TOK.ink + ')';
        ctx.lineWidth = p.w;
        ctx.beginPath();
        ctx.moveTo(p.hx[0], p.hy[0]);
        for (var h = 1; h < p.hx.length; h++) ctx.lineTo(p.hx[h], p.hy[h]);
        if (p.hx.length < 2) ctx.lineTo(p.x + .01, p.y);
        ctx.stroke();
      }
      var tn = now();
      for (k = waves.length - 1; k >= 0; k--) {
        var wv = waves[k], q = (tn - wv.t0) / wv.dur;
        if (q >= 1) { waves.splice(k, 1); continue; }
        if (q < 0) continue;
        ctx.globalAlpha = (1 - q) * .6;
        ctx.strokeStyle = 'rgb(' + TOK.brand + ')';
        ctx.lineWidth = 1 + (1 - q) * 6;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR + ease.outCubic(q) * Math.hypot(W, H) * .75, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function powerOn() {
      mode = 'done';
      setCharge(1);
      ring.classList.add('full');
      setHint();
      parts.forEach(function (p) { var dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, v = rand(320, 900); p.vx = dx / d * v; p.vy = dy / d * v; p.hx = [p.x]; p.hy = [p.y]; });
      if (!RM) { var t0 = now(); waves.push({ t0: t0, dur: 900 }, { t0: t0 + 120, dur: 1100 }); }
      var r0 = el.getBoundingClientRect();
      var order = cells.map(function (c) {
        var r = c.getBoundingClientRect();
        return { c: c, d: Math.hypot(r.left + r.width / 2 - r0.left - cx, r.top + r.height / 2 - r0.top - cy) };
      }).sort(function (a, b) { return a.d - b.d; });
      order.forEach(function (o, k) { o.c.style.setProperty('--d', (RM ? 0 : 80 + k * 14) + 'ms'); o.c.classList.add('on'); });
      var total = RM ? 350 : 80 + order.length * 14 + 360;
      T.set(function () {
        el.classList.add('powered');
        if (!RM) A.play(scan, [{ transform: 'translateY(-10px)', opacity: 0 }, { opacity: 1, offset: .12 }, { transform: 'translateY(' + Math.round(H + 10) + 'px)', opacity: .25 }], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)' });
      }, Math.round(total * .55));
      T.set(function () { mode = 'ended'; grid.classList.add('settled'); finish(); }, total + 150);
    }
    return {
      reset: function () {
        T.clear(); A.cancel();
        mode = 'idle'; parts = []; waves = []; spawnAcc = 0; glow = 0; lastLit = -1;
        ring.classList.remove('charging', 'full');
        el.classList.remove('powered');
        grid.classList.remove('settled');
        cells.forEach(function (c) { c.classList.remove('on'); });
        setCharge(0); setHint(); resize(); seedDust();
      },
      start: function () { loop.start(); },
      stop: function () { loop.stop(); T.clear(); },
      resize: resize,
      redraw: function () { if (!loop.on) draw(0); },
      primary: function () { press('auto'); },
      focusEl: ring,
      busy: function () { return mode === 'done' || mode === 'ended'; },
      onSkip: function () { mode = 'skipped'; ring.classList.remove('charging'); }
    };
  }

  /* ======================================================
     CONTROLLER
     ====================================================== */
  var MAKE = { gate: makeGate, sweep: makeSweep, night: makeNight, power: makePower };
  cur = MAKE[KEY]();
  cur.reset();        // laid out and drawn at rest straight away; it starts moving on BRBSplash.start
  var running = false;

  function skipNow() {
    if (!running || finished || cur.busy()) return;
    finished = true;
    cur.onSkip();
    hooks.skip();
  }
  $$('.skip').forEach(function (b) { b.addEventListener('click', skipNow); });

  /* Enter on the keyboard does the screen's main action, as long as focus isn't on a control */
  document.addEventListener('keydown', function (e) {
    if (!running || finished || e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    var a = document.activeElement;
    if (a && a !== document.body && a !== document.documentElement) return;
    e.preventDefault();
    cur.primary();
  });

  var rz = 0;
  addEventListener('resize', function () {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(function () { if (!finished) cur.resize(); });
  });
  if (mqRM.addEventListener) mqRM.addEventListener('change', function (e) { RM = e.matches; if (!finished) { cur.stop(); cur.reset(); if (running) cur.start(); } });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (finished) return; cur.resize(); if (cur.relayout) cur.relayout(); });
  }

  window.BRBSplash = {
    key: KEY,
    /* opts: { enter, skip, unlock } from index.html */
    start: function (opts) {
      if (running) return;
      running = true;
      store('brb-splash-last', KEY);   // only counts once someone has actually seen it
      hooks.enter = opts && opts.enter || hooks.enter;
      hooks.skip = opts && opts.skip || hooks.skip;
      hooks.unlock = opts && opts.unlock || hooks.unlock;
      cur.start();
    },
    /* the site has taken over: stop every loop and timer */
    stop: function () { finished = true; running = false; cur.stop(); }
  };
})();
