/* The visitor's colour theme, shared by every page. Same five themes as the intro.
   Loaded in <head> so the saved theme is in place before the page paints. */
(function () {
  var THEMES = {
    cobalt: { name: 'Cobalt', brand: '#1d5cff', lift: '#4c7dff', rgb: '76, 125, 255',  onBrand: '#ffffff', bg: '#16191d', bgDark: '#101317', bgLift: '#1b1f25', ink: '#f3f6fb', muted: '#a8b2c4', dim: '#8b95a8' },
    brass:  { name: 'Brass',  brand: '#e8b678', lift: '#f0c58c', rgb: '240, 197, 140', onBrand: '#1a1410', bg: '#262a2c', bgDark: '#1e2123', bgLift: '#2d3234', ink: '#f2ebe1', muted: '#cabfb1', dim: '#ab9f90' },
    acid:   { name: 'Acid',   brand: '#a9e000', lift: '#c8ff3a', rgb: '200, 255, 58',  onBrand: '#101408', bg: '#101408', bgDark: '#0a0d04', bgLift: '#161b0c', ink: '#f3f7e9', muted: '#b0ba9e', dim: '#939d82' },
    signal: { name: 'Signal', brand: '#ff2e5f', lift: '#ff6688', rgb: '255, 102, 136', onBrand: '#1a0810', bg: '#171015', bgDark: '#110b10', bgLift: '#1e161c', ink: '#fcf0f4', muted: '#c7aeb8', dim: '#a8929c' },
    ice:    { name: 'Ice',    brand: '#00c8dc', lift: '#3ae0f0', rgb: '58, 224, 240',  onBrand: '#04181c', bg: '#0b1417', bgDark: '#061013', bgLift: '#101b1f', ink: '#eaf7fa', muted: '#a2b7be', dim: '#889ca3' }
  };
  function apply(key, save) {
    var t = THEMES[key];
    if (!t) return;
    var r = document.documentElement.style;
    r.setProperty('--brand', t.brand); r.setProperty('--brand-lift', t.lift); r.setProperty('--brand-rgb', t.rgb);
    r.setProperty('--on-brand', t.onBrand); r.setProperty('--bg', t.bg); r.setProperty('--bg-dark', t.bgDark);
    r.setProperty('--bg-lift', t.bgLift); r.setProperty('--ink', t.ink); r.setProperty('--muted', t.muted); r.setProperty('--dim', t.dim);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
    if (save) { try { localStorage.setItem('brb-theme', key); } catch (e) {} }
    window.BRB_THEME = key;
  }
  var saved = null;
  try { saved = localStorage.getItem('brb-theme'); } catch (e) {}
  window.BRB_THEMES = THEMES;
  window.BRB_applyTheme = apply;
  apply(THEMES[saved] ? saved : 'cobalt', false);
})();
