/* ==========================================================================
   PROFESSORS — 02_Styles.js
   Complete ProffTrack stylesheet (extracted verbatim from workspace proff.html
   <style> block, source lines 11-826). Injected once by InitProfessorsStyles().
   ==========================================================================
*/

export function GetProfessorsStyles() {
  return `
  :root, [data-theme="light"], .prof-light, #ProfessorsApp:not(.prof-dark){
    --paper:#f6f3eb;
    --surface:#fffdf8;
    --surface-2:#f4efe3;
    --ink:#1c2e28;
    --muted:#63756c;
    --line:#e2dcce;
    --teal:#115e54;
    --teal-dark:#0a2923;
    --teal-mid:#14453b;
    --teal-soft:#e5f0ec;
    --gold:#b45309;
    --gold-deep:#854d0e;
    --gold-soft:#fef3c7;
    --danger:#b3372f;
    --danger-soft:#fbeae8;
    --heading:#0c332b;
    --teal-border:#cce3dc;
    --gold-border:#ecd9b0;
    --field:#faf7f0;
    --backdrop:rgba(10,41,35,.5);
    --toast-bg:#0d2822;
    --shadow-card:0 1px 2px rgba(28,46,40,.05),0 10px 28px -20px rgba(28,46,40,.35);
    --shadow-card-hover:0 2px 4px rgba(28,46,40,.06),0 16px 36px -20px rgba(28,46,40,.4);
    --shadow-modal:0 30px 80px -20px rgba(10,41,35,.5);
    --heat-0:#e7e1d0;
    --heat-1:#bfe0d4;
    --heat-2:#78baa8;
    --heat-3:#2d8c7c;
    --heat-4:#0e5b50;
    --serif:Georgia,'Iowan Old Style','Times New Roman',serif;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    --radius:16px;
    --icb-accent:var(--gold);
    --icb-border:rgba(28,46,40,.18);
    --icb-bg:rgba(28,46,40,.04);
  }
  [data-theme="dark"], body.prof-dark, #ProfessorsApp.prof-dark, #root[data-theme="dark"]{
    --paper:#0e1613;
    --surface:#15221d;
    --surface-2:#1b2a24;
    --ink:#e8e4d8;
    --muted:#8ea196;
    --line:#293831;
    --teal:#1fb59f;
    --teal-dark:#081714;
    --teal-mid:#0f332c;
    --teal-soft:rgba(31,181,159,.14);
    --gold:#e5a84b;
    --gold-deep:#f3c47e;
    --gold-soft:rgba(229,168,75,.14);
    --danger:#e56860;
    --danger-soft:rgba(229,104,96,.14);
    --heading:#d5ece5;
    --teal-border:#1a473f;
    --gold-border:#6b5326;
    --field:#131d19;
    --backdrop:rgba(4,10,8,.68);
    --toast-bg:#081a16;
    --shadow-card:0 1px 2px rgba(0,0,0,.35),0 12px 30px -18px rgba(0,0,0,.7);
    --shadow-card-hover:0 2px 4px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.8);
    --shadow-modal:0 30px 90px -20px rgba(0,0,0,.85);
    --heat-0:#1b2722;
    --heat-1:#16433a;
    --heat-2:#197061;
    --heat-3:#1eb19b;
    --heat-4:#62eed6;
    --icb-accent:var(--gold);
    --icb-border:rgba(229,168,75,.28);
    --icb-bg:rgba(229,168,75,.06);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  [hidden]{display:none!important}
  ::selection{background:rgba(17,94,84,.28)}
  body.prof-dark ::selection,#ProfessorsApp.prof-dark ::selection{background:rgba(31,181,159,.32)}
  body{
    font-family:var(--sans);
    color:var(--ink);
    line-height:1.55;
    min-height:100vh;
    background:
      radial-gradient(1200px 500px at 85% -10%, rgba(17,94,84,.07), transparent 60%),
      radial-gradient(900px 420px at -10% 0%, rgba(180,83,9,.06), transparent 55%),
      var(--paper);
    transition:background .3s ease,color .3s ease;
  }
  body.prof-dark{
    background:
      radial-gradient(1200px 500px at 85% -10%, rgba(31,181,159,.08), transparent 60%),
      radial-gradient(900px 420px at -10% 0%, rgba(229,168,75,.06), transparent 55%),
      var(--paper);
  }
  body::-webkit-scrollbar{width:11px}
  body::-webkit-scrollbar-track{background:transparent}
  body::-webkit-scrollbar-thumb{background:#d0c9b6;border-radius:8px;border:3px solid var(--paper)}
  body.prof-dark::-webkit-scrollbar-thumb{background:#2a3d35;border-color:var(--paper)}

  body.modal-open{overflow:hidden}
  button{font-family:inherit;cursor:pointer}
  input,select,textarea{font-family:inherit;color:inherit}
  a{color:var(--teal)}
  :focus-visible{outline:2px solid var(--teal);outline-offset:2px;border-radius:6px}

  .page{min-height:100vh;display:flex;flex-direction:column}

  /* ---------- Header ---------- */
  .site-header{
    background:linear-gradient(135deg,var(--teal-dark) 0%,var(--teal-mid) 100%);
    color:#f5f2ea;
    box-shadow:0 4px 20px -8px rgba(10,41,35,.55);
    border-bottom:1.5px solid var(--gold);
    transition:background .3s ease,box-shadow .3s ease;
  }
  #ProfessorsApp.prof-dark .site-header,body.prof-dark .site-header{
    border-bottom:1.5px solid rgba(229,168,75,.35);
    box-shadow:0 4px 20px -8px rgba(0,0,0,.85);
  }
  .site-header.scrolled{box-shadow:0 10px 28px -12px rgba(10,41,35,.75)}
  #ProfessorsApp.prof-dark .site-header.scrolled,body.prof-dark .site-header.scrolled{box-shadow:0 12px 30px -14px rgba(0,0,0,.92)}
  .header-inner{max-width:1080px;margin:0 auto;padding:18px 24px 14px;display:flex;flex-direction:column;gap:14px}
  .brand-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}
  .logo{
    display:grid;place-items:center;flex:0 0 auto;
    color:#f0d9a8;
    filter:drop-shadow(0 0 10px rgba(240,217,168,.35));
  }
  .logo svg{width:36px;height:36px}
  .brand-text{display:flex;flex-direction:column;line-height:1.15}
  .brand-text strong{font-family:var(--serif);font-size:1.45rem;letter-spacing:.4px}
  .brand-text small{font-size:.78rem;opacity:.78;letter-spacing:.6px;text-transform:uppercase}
  .header-actions{display:flex;gap:10px;flex-wrap:wrap}

  .site-header .icb-btn {
    border-color: rgba(245,242,234,.25);
    background: rgba(255,255,255,.08);
    color: #f5f2ea;
  }
  .site-header .icb-btn:hover:not(:disabled) {
    color: var(--gold);
    border-color: var(--gold);
    background: rgba(229,168,75,.15);
  }
  .site-header .icb-btn.icb-accent {
    background: var(--gold);
    color: #fff;
    border-color: transparent;
  }
  .site-header .icb-btn.icb-accent:hover:not(:disabled) {
    background: var(--gold-deep);
    color: #fff;
    filter: brightness(1.08);
  }

  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:10px 18px;border-radius:12px;border:1px solid transparent;
    font-weight:600;font-size:.92rem;letter-spacing:.2px;
    transition:transform .15s ease,box-shadow .15s ease,background .15s ease,filter .15s ease;
    text-decoration:none;
  }
  .btn svg{width:17px;height:17px;flex:0 0 auto}
  .btn:active{transform:scale(.97)}
  .btn-primary{background:var(--teal);color:#fff;box-shadow:0 8px 18px -10px rgba(17,94,84,.8)}
  .btn-primary:hover{background:#0a453e}
  .btn-accent{background:var(--gold);color:#fff;box-shadow:0 8px 18px -10px rgba(180,83,9,.8)}
  .btn-accent:hover{background:var(--gold-deep)}
  .btn-ghost{background:transparent;border-color:rgba(243,239,228,.35);color:#f3efe4}
  .btn-ghost:hover{background:rgba(255,255,255,.1)}
  .site-header .btn-ghost{border-color:rgba(243,239,228,.35)}
  .btn-line{background:var(--surface);border-color:var(--line);color:var(--ink);box-shadow:var(--shadow-card)}
  .btn-line:hover{border-color:var(--teal-border)}
  .btn-sm{padding:7px 12px;font-size:.84rem;border-radius:10px}
  .btn[disabled]{opacity:.55;cursor:not-allowed}

  .search-wrap{
    flex:1 1 260px;display:flex;align-items:center;gap:9px;
    background:rgba(255,255,255,.12);
    border:1px solid rgba(255,255,255,.22);
    border-radius:12px;padding:9px 13px;
    transition:border-color .15s ease,background .15s ease;
  }
  .search-wrap:focus-within{
    background:rgba(255,255,255,.18);
    border-color:var(--gold);
  }
  .search-wrap svg{width:16px;height:16px;opacity:.75;flex:0 0 auto}
  .search-wrap input{
    background:transparent;border:0;outline:0;color:#f5f2ea;width:100%;font-size:.94rem;
  }
  .search-wrap input::placeholder{color:rgba(245,242,234,.6)}
  .sort-wrap{display:flex;align-items:center;gap:9px;font-size:.86rem;opacity:.95}
  .sort-wrap select{
    background:rgba(255,255,255,.12);color:#f5f2ea;border:1px solid rgba(255,255,255,.22);
    border-radius:10px;padding:8px 10px;font-size:.88rem;outline:0;
    transition:border-color .15s ease;
  }
  .sort-wrap select:focus-visible{border-color:var(--gold)}
  .sort-wrap select option{color:var(--ink);background:var(--surface)}

  /* ---------- Content ---------- */
  .content{max-width:1080px;margin:0 auto;padding:26px 24px 40px;width:100%;flex:1}
  .stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
  .stat-card{
    position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;
    padding:13px 16px;box-shadow:var(--shadow-card);display:flex;align-items:center;gap:12px;
    overflow:hidden;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
  }
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--teal),var(--gold));opacity:.55}
  .stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-card-hover);border-color:var(--teal-border)}
  .stat-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto}
  .stat-ico svg{width:18px;height:18px}
  .stat-ico.teal{background:var(--teal-soft);color:var(--teal-mid)}
  .stat-ico.gold{background:var(--gold-soft);color:var(--gold-deep)}
  .stat-ico.green{background:#eaf3e2;color:#4d6b1f}
  .stat-ico.stone{background:#efece4;color:#57534e}
  .stat-num{font-family:var(--serif);font-size:1.45rem;font-weight:700;line-height:1.1}
  .stat-label{font-size:.76rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
  .stat-sub{font-size:.74rem;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
  input,textarea{caret-color:var(--teal)}

  /* ---------- Group headers ---------- */
  .college-group{
    display:flex;align-items:center;gap:10px;margin:26px 2px 10px;flex-wrap:wrap;
  }
  .college-group:first-child{margin-top:0}
  .college-group svg{width:17px;height:17px;color:var(--gold-deep)}
  .college-group h2{font-family:var(--serif);font-size:1.08rem;color:var(--heading)}
  .college-group .count{font-size:.8rem;color:var(--muted)}
  .college-group .rule{flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent);min-width:30px}

  /* ---------- Professor cards ---------- */
  .prof-list{display:flex;flex-direction:column;gap:14px}
  .prof-card{
    background:var(--surface);border:1px solid var(--line);border-left:3px solid transparent;border-radius:var(--radius);
    box-shadow:var(--shadow-card);overflow:hidden;
    transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease,border-left-color .2s ease;
  }
  .prof-card:hover{box-shadow:var(--shadow-card-hover);border-left-color:var(--teal)}
  .prof-card.open{border-color:var(--teal-border);border-left-color:var(--gold)}
  .prof-head{
    width:100%;display:flex;align-items:center;gap:14px;text-align:left;
    background:transparent;border:0;padding:16px 18px;
  }
  .prof-head:hover{background:var(--surface-2)}
  .avatar{
    width:46px;height:46px;border-radius:50%;flex:0 0 auto;
    display:grid;place-items:center;color:#fff;font-weight:700;font-size:.95rem;letter-spacing:.5px;
    box-shadow:inset 0 -8px 14px rgba(0,0,0,.12),0 0 0 2px var(--surface),0 0 0 3px var(--line);
  }
  .prof-id{flex:1;min-width:0}
  .prof-name{display:block;font-family:var(--serif);font-size:1.13rem;font-weight:700;color:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .prof-sub{display:block;font-size:.82rem;color:var(--muted)}
  .prof-college{display:flex;align-items:center;gap:7px;font-size:.83rem;color:var(--ink);margin-top:2px;min-width:0}
  .prof-college svg{width:14px;height:14px;color:var(--gold-deep);flex:0 0 auto}
  .prof-college .cname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .qs-pill{
    flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;
    background:linear-gradient(180deg,var(--gold-soft),#f7e3bd);
    border:1px solid #ecd9b0;color:var(--gold-deep);
    font-size:.72rem;font-weight:700;border-radius:999px;padding:3px 9px;letter-spacing:.3px;
  }
  .qs-pill.none{background:var(--surface-2);color:var(--muted);border-color:var(--line)}
  .prof-right{display:flex;align-items:center;gap:12px;flex:0 0 auto}
  .count-chip{
    background:var(--teal-soft);color:var(--teal-mid);font-size:.76rem;font-weight:700;
    border-radius:999px;padding:4px 11px;white-space:nowrap;
  }
  .chev{width:18px;height:18px;color:var(--muted);transition:transform .3s ease}
  .prof-card.open .chev,.paper-row.open .chev{transform:rotate(180deg)}

  /* accordion */
  .acc{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s ease}
  .acc.open{grid-template-rows:1fr}
  .acc-inner{overflow:hidden;min-height:0}
  .prof-detail{border-top:1px dashed var(--line);padding:18px;background:var(--surface-2)}

  .prof-meta{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
  .contact-links{display:flex;gap:14px;flex-wrap:wrap;font-size:.86rem}
  .contact-links a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:600}
  .contact-links a:hover{text-decoration:underline}
  .contact-links svg{width:14px;height:14px}
  .areas{display:flex;gap:7px;flex-wrap:wrap}
  .chip{
    background:var(--teal-soft);color:var(--teal);font-size:.76rem;font-weight:600;
    padding:3px 11px;border-radius:999px;border:1px solid var(--teal-border);
  }
  .bio{font-size:.9rem;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--teal);border-radius:10px;padding:11px 14px}
  .added-note{font-size:.76rem;color:var(--muted)}

  .prof-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:18px}
  .prof-actions .spacer{flex:1}
  .icon-btn{
    width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:var(--surface);
    display:inline-grid;place-items:center;color:var(--muted);transition:all .15s ease;flex:0 0 auto;
  }
  .icon-btn svg{width:15px;height:15px}
  .icon-btn:hover{color:var(--teal);border-color:var(--teal-border);background:var(--teal-soft)}
  .icon-btn.danger:hover{color:var(--danger);background:var(--danger-soft);border-color:var(--danger-soft)}
  .icon-btn.armed{background:var(--danger);border-color:var(--danger);color:#fff;width:auto;padding:0 10px;font-size:.78rem;font-weight:700}

  .papers-block{background:var(--surface);border:1px solid var(--line);border-radius:13px;overflow:hidden}
  .papers-head{
    display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
    padding:12px 16px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,var(--surface-2),var(--paper));
  }
  .paper-sort{
    background:var(--field);border:1px solid var(--line);border-radius:8px;
    font-size:.76rem;font-weight:600;padding:4px 8px;color:var(--ink);outline:0;cursor:pointer;
  }
  .paper-sort:focus-visible{border-color:var(--teal)}
  .activity-card{flex-direction:column;align-items:stretch;gap:7px;justify-content:center}
  .activity-card .spark{width:100%;height:30px;display:block}
  .spark rect{transition:opacity .2s ease}
  .papers-head h4{font-family:var(--serif);font-size:.98rem;color:var(--heading);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .papers-head h4 .cnt{background:var(--teal);color:#fff;font-family:var(--sans);font-size:.72rem;border-radius:999px;padding:2px 9px}
  #ProfessorsApp.prof-dark .papers-head h4 .cnt,body.prof-dark .papers-head h4 .cnt{color:#081a16}
  .avg-chip{display:inline-flex;align-items:center;gap:4px;background:var(--surface);border:1px solid var(--gold-border);color:var(--gold-deep);font-family:var(--sans);font-size:.7rem;font-weight:700;border-radius:999px;padding:2px 9px}
  .avg-chip svg{width:10px;height:10px;fill:currentColor;stroke:none}
  #ProfessorsApp.prof-dark .avg-chip,body.prof-dark .avg-chip{color:var(--gold-deep)}
  .papers-list{max-height:440px;overflow-y:auto}
  .papers-list::-webkit-scrollbar{width:9px}
  .papers-list::-webkit-scrollbar-track{background:transparent}
  .papers-list::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px;border:2px solid var(--surface)}
  #ProfessorsApp.prof-dark .papers-list::-webkit-scrollbar-thumb,body.prof-dark .papers-list::-webkit-scrollbar-thumb{background:#2a3d35;border-color:var(--surface)}
  .papers-empty{padding:22px;text-align:center;color:var(--muted);font-size:.88rem}

  /* paper rows */
  .paper-row{border-bottom:1px solid var(--line)}
  .paper-row:last-child{border-bottom:0}
  .paper-head{
    width:100%;display:flex;align-items:center;gap:12px;text-align:left;
    background:transparent;border:0;padding:12px 16px;transition:background .15s ease;
  }
  .paper-head:hover{background:var(--surface-2)}
  .paper-ico{
    width:32px;height:32px;border-radius:9px;background:var(--gold-soft);color:var(--gold-deep);
    display:grid;place-items:center;flex:0 0 auto;border:1px solid #f0e2c4;
  }
  .paper-ico svg{width:15px;height:15px}
  .paper-id{flex:1;min-width:0}
  .paper-title{font-weight:600;font-size:.92rem;color:var(--ink);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .paper-meta{font-size:.78rem;color:var(--muted);display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:1px}
  .stars{color:#d98324;letter-spacing:1px;font-size:.8rem}
  .stars .stars-off{color:#ddd5c2}
  .paper-detail{padding:16px;border-top:1px dashed var(--line);background:var(--surface-2)}
  .detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}
  .detail-cell{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 12px}
  .detail-cell .k{font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)}
  .detail-cell .v{font-size:.86rem;font-weight:600;color:var(--ink);word-break:break-word}
  .note-block{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 13px;font-size:.86rem;margin-bottom:10px}
  .note-block .k{font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:var(--gold-deep);font-weight:700;margin-bottom:3px}
  .paper-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:12px}
  .paper-actions .spacer{flex:1}
  .tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}

  /* ---------- Theme toggle ---------- */
  #themeBtn{width:42px;padding:0}
  #themeBtn .moon{display:none}
  #ProfessorsApp.prof-dark #themeBtn .moon{display:block}
  #ProfessorsApp.prof-dark #themeBtn .sun{display:none}

  /* ---------- Attachment dropzone ---------- */
  .attach-zone{
    display:flex;align-items:center;gap:12px;cursor:pointer;
    border:1.5px dashed var(--line);border-radius:12px;background:var(--field);
    padding:13px 15px;transition:border-color .15s ease,background .15s ease;
  }
  .attach-zone:hover,.attach-zone:focus-visible,.attach-zone.dragover{border-color:var(--teal);background:var(--teal-soft)}
  .attach-zone svg{width:20px;height:20px;color:var(--teal-mid);flex:0 0 auto}
  .attach-zone .attach-txt{display:flex;flex-direction:column;min-width:0}
  .attach-zone .attach-label{font-size:.86rem;font-weight:600}
  .attach-zone .attach-meta{font-size:.74rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .attach-chip{
    display:inline-flex;align-items:center;gap:5px;background:var(--gold-soft);border:1px solid var(--gold-border);
    color:var(--gold-deep);font-size:.72rem;font-weight:700;border-radius:999px;padding:3px 10px;
  }
  .attach-chip svg{width:12px;height:12px}

  /* ---------- Scroll top ---------- */
  .scroll-top{
    position:fixed;left:22px;bottom:22px;z-index:50;width:42px;height:42px;border-radius:50%;
    background:var(--surface);border:1px solid var(--line);color:var(--teal-mid);
    display:grid;place-items:center;box-shadow:var(--shadow-card-hover);cursor:pointer;
    transition:transform .18s ease,opacity .18s ease;
  }
  .scroll-top:hover{transform:translateY(-3px);color:var(--teal)}
  .scroll-top svg{width:18px;height:18px}

  /* ---------- Continue reading (quick resume) ---------- */
  .resume-card{
    background:var(--surface);border:1px solid var(--teal-border);border-radius:14px;
    box-shadow:var(--shadow-card);overflow:hidden;margin-bottom:24px;
  }
  .resume-card::before{content:'';display:block;height:3px;background:linear-gradient(90deg,var(--teal),var(--gold));opacity:.55}
  .resume-head{display:flex;align-items:center;gap:9px;padding:12px 18px;border-bottom:1px dashed var(--line);flex-wrap:wrap}
  .resume-head svg{width:16px;height:16px;color:var(--teal);flex:0 0 auto}
  #ProfessorsApp.prof-dark .resume-head svg,body.prof-dark .resume-head svg{color:var(--teal)}
  .resume-head h3{font-family:var(--serif);font-size:1.02rem;color:var(--heading);display:flex;align-items:center;gap:8px}
  .resume-head .cnt{background:var(--teal);color:#fff;font-family:var(--sans);font-size:.72rem;border-radius:999px;padding:2px 9px}
  #ProfessorsApp.prof-dark .resume-head .cnt,body.prof-dark .resume-head .cnt{color:#081a16}
  .resume-hint{font-size:.78rem;color:var(--muted);font-style:italic;margin-left:auto}
  .resume-list{display:flex;flex-direction:column;max-height:275px;overflow-y:auto}
  .resume-list::-webkit-scrollbar{width:9px}
  .resume-list::-webkit-scrollbar-track{background:transparent}
  .resume-list::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px;border:2px solid var(--surface)}
  #ProfessorsApp.prof-dark .resume-list::-webkit-scrollbar-thumb,body.prof-dark .resume-list::-webkit-scrollbar-thumb{background:#2a3d35;border-color:var(--surface)}
  .resume-row{display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--line);transition:background .15s ease}
  .resume-row:last-child{border-bottom:0}
  .resume-row:hover{background:var(--surface-2)}
  .resume-row .avatar{width:32px;height:32px;font-size:.72rem}
  .resume-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
  .resume-title{
    background:transparent;border:0;padding:0;text-align:left;cursor:pointer;
    font-family:var(--sans);font-size:.92rem;font-weight:700;color:var(--heading);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:6px;
  }
  .resume-title:hover{color:var(--teal);text-decoration:underline}
  #ProfessorsApp.prof-dark .resume-title:hover,body.prof-dark .resume-title:hover{color:var(--teal)}
  .resume-meta{font-size:.76rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .days-chip{
    flex:0 0 auto;display:inline-flex;align-items:center;gap:5px;
    background:var(--gold-soft);border:1px solid var(--gold-border);color:var(--gold-deep);
    font-size:.7rem;font-weight:700;border-radius:999px;padding:3px 9px;letter-spacing:.3px;white-space:nowrap;
  }
  .days-chip svg{width:11px;height:11px}
  #ProfessorsApp.prof-dark .days-chip,body.prof-dark .days-chip{color:var(--gold-deep)}
  .resume-read{flex:0 0 auto}
  @media (max-width:760px){
    .resume-row{flex-wrap:wrap;row-gap:8px}
    .resume-row .avatar{order:0}
    .resume-main{order:1;flex:1 1 auto;min-width:calc(100% - 130px)}
    .days-chip{order:3}
    .resume-read{order:4;margin-left:auto}
    .resume-hint{display:none}
  }
  /* jump-to-professor flash highlight */
  .prof-card.flash{animation:flashRing 1.1s ease-in-out 2}
  @keyframes flashRing{0%,100%{box-shadow:var(--shadow-card)}40%{box-shadow:0 0 0 3px var(--gold-border),var(--shadow-card-hover)}}

  /* ---------- Empty state ---------- */
  .empty-state{
    background:var(--surface);border:1px dashed #d4ccb6;border-radius:20px;
    padding:56px 24px;text-align:center;box-shadow:var(--shadow-card);
  }
  .empty-ico{
    width:74px;height:74px;border-radius:50%;background:var(--teal-soft);color:var(--teal-mid);
    display:grid;place-items:center;margin:0 auto 18px;border:1px solid var(--teal-border);
  }
  .empty-ico svg{width:34px;height:34px}
  @media (prefers-reduced-motion:no-preference){
    .empty-ico{animation:floaty 3.4s ease-in-out infinite}
  }
  @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .empty-state h2{font-family:var(--serif);font-size:1.5rem;color:var(--heading);margin-bottom:8px}
  .empty-state p{color:var(--muted);font-size:.94rem;max-width:460px;margin:0 auto 22px}
  .empty-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

  /* ---------- Footer ---------- */
  .site-footer{
    margin-top:auto;border-top:1px solid var(--line);
    background:linear-gradient(180deg,transparent,rgba(15,118,110,.05));
  }
  .footer-inner{
    max-width:1080px;margin:0 auto;padding:18px 24px 26px;
    display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;
  }
  .footer-note{font-size:.82rem;color:var(--muted);max-width:560px;display:flex;gap:8px;align-items:flex-start}
  .footer-note svg{width:15px;height:15px;flex:0 0 auto;margin-top:2px;color:var(--gold-deep)}
  .footer-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .link-btn{
    background:transparent;border:0;color:var(--teal-mid);font-size:.82rem;font-weight:600;
    text-decoration:underline dotted;padding:6px 8px;border-radius:8px;
  }
  .link-btn:hover{background:var(--teal-soft)}
  .link-btn.danger{color:var(--danger)}
  .link-btn.danger:hover{background:var(--danger-soft)}
  .link-btn.armed{background:var(--danger);color:#fff;text-decoration:none}

  /* ---------- Modal ---------- */
  .modal{
    position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:18px;
    background:var(--backdrop);backdrop-filter:blur(3px);
    animation:fadeIn .18s ease;
  }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
  .modal-card{
    background:var(--surface);border-radius:20px;width:100%;max-width:660px;max-height:92vh;
    display:flex;flex-direction:column;box-shadow:var(--shadow-modal);
    animation:pop .26s cubic-bezier(.2,.9,.3,1.12);border:1px solid var(--line);
  }
  .modal-head{
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:18px 22px;border-bottom:1.5px solid var(--gold);
    background:linear-gradient(135deg,var(--teal-dark),var(--teal-mid));
    color:#f5f2ea;border-radius:20px 20px 0 0;
  }
  #ProfessorsApp.prof-dark .modal-head,body.prof-dark .modal-head{
    border-bottom:1.5px solid rgba(229,168,75,.35);
  }
  .modal-head h2{font-family:var(--serif);font-size:1.2rem;font-weight:700;letter-spacing:.3px}
  .modal-head .icon-btn{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#f5f2ea}
  .modal-head .icon-btn:hover{background:rgba(229,168,75,.2);color:var(--gold);border-color:var(--gold)}
  .modal-body{padding:20px 22px;overflow-y:auto}
  .modal-body::-webkit-scrollbar{width:9px}
  .modal-body::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .modal-body::-webkit-scrollbar-thumb,body.prof-dark .modal-body::-webkit-scrollbar-thumb{background:#2a3d35}
  .modal-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:16px}

  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .field{display:flex;flex-direction:column;gap:5px}
  .field.span-2{grid-column:1/-1}
  .field label{font-size:.78rem;font-weight:700;color:var(--heading);letter-spacing:.3px}
  .field label small{color:var(--muted);font-weight:500}
  .field input,.field textarea,.field select{
    background:var(--field);border:1px solid var(--line);border-radius:10px;
    padding:9px 12px;font-size:.9rem;outline:0;transition:border .15s ease,box-shadow .15s ease;width:100%;
    color:var(--ink);
  }
  .field select option{background:var(--surface);color:var(--ink)}
  .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-soft)}
  .field textarea{resize:vertical;min-height:64px}
  .field-hint{
    margin-top:12px;font-size:.82rem;color:var(--teal);background:var(--teal-soft);
    border:1px solid var(--teal-border);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:7px;
  }
  #ProfessorsApp.prof-dark .field-hint,body.prof-dark .field-hint{color:var(--gold-deep);border-color:var(--gold-border);background:var(--gold-soft)}
  .field-hint svg{width:14px;height:14px;flex:0 0 auto}

  /* ---------- Toast ---------- */
  .toast{
    position:fixed;bottom:22px;right:22px;z-index:80;max-width:360px;
    background:var(--toast-bg);color:#f5f2ea;font-size:.88rem;font-weight:500;
    border-radius:13px;padding:13px 17px;border:1px solid rgba(255,255,255,.15);
    box-shadow:0 18px 44px -14px rgba(10,41,35,.7);
    opacity:0;transform:translateY(12px);pointer-events:none;
    transition:opacity .25s ease,transform .25s ease;
    display:flex;gap:9px;align-items:flex-start;
  }
  .toast svg{width:16px;height:16px;flex:0 0 auto;color:#f0d9a8;margin-top:2px}
  .toast .ico-info{display:none}
  .toast.info .ico-ok{display:none}
  .toast.info .ico-info{display:block}
  #ProfessorsApp.prof-dark .count-chip,#ProfessorsApp.prof-dark .chip,#ProfessorsApp.prof-dark .link-btn,#ProfessorsApp.prof-dark .contact-links a,
  body.prof-dark .count-chip,body.prof-dark .chip,body.prof-dark .link-btn,body.prof-dark .contact-links a{color:var(--teal)}
  #ProfessorsApp.prof-dark .stat-ico.teal,body.prof-dark .stat-ico.teal{color:var(--teal)}
  #ProfessorsApp.prof-dark .stat-ico.gold,body.prof-dark .stat-ico.gold{color:var(--gold-deep)}
  #ProfessorsApp.prof-dark .stat-ico.green,body.prof-dark .stat-ico.green{color:#a3e635}
  #ProfessorsApp.prof-dark .stat-ico.stone,body.prof-dark .stat-ico.stone{color:#d6d3d1}
  #ProfessorsApp.prof-dark a,body.prof-dark a{color:var(--teal)}
  .toast.show{opacity:1;transform:none}
  .toast{border-left:3px solid var(--gold)}
  .toast.info{border-left-color:var(--teal)}

  /* ---------- Reading status ---------- */
  .st-pill{display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:700;border-radius:999px;padding:2px 9px;letter-spacing:.3px;border:1px solid transparent;white-space:nowrap}
  .st-pill.st-read{background:#edf7e5;color:#365314;border-color:#cce3be}
  .st-pill.st-reading{background:var(--teal-soft);color:var(--teal);border-color:var(--teal-border)}
  .st-pill.st-wishlist{background:var(--gold-soft);color:var(--gold-deep);border-color:var(--gold-border)}
  #ProfessorsApp.prof-dark .st-pill.st-read,body.prof-dark .st-pill.st-read{background:rgba(132,204,22,.14);color:#a3e635;border-color:#3b531a}
  .paper-ico.ico-read{background:#edf7e5;color:#365314;border-color:#cce3be}
  .paper-ico.ico-reading{background:var(--teal-soft);color:var(--teal);border-color:var(--teal-border)}
  #ProfessorsApp.prof-dark .paper-ico.ico-read,body.prof-dark .paper-ico.ico-read{background:rgba(132,204,22,.14);color:#a3e635;border-color:#3b531a}
  #ProfessorsApp.prof-dark .paper-ico.ico-reading,body.prof-dark .paper-ico.ico-reading{color:var(--teal)}
  #ProfessorsApp.prof-dark .st-pill.st-reading,body.prof-dark .st-pill.st-reading{color:var(--teal)}
  #ProfessorsApp.prof-dark .st-pill.st-wishlist,body.prof-dark .st-pill.st-wishlist{color:var(--gold-deep)}

  /* ---------- Tag filter bar ---------- */
  .tag-bar{display:flex;align-items:center;gap:8px;margin:0 0 20px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
  .tag-bar::-webkit-scrollbar{height:6px}
  .tag-bar::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .tag-bar::-webkit-scrollbar-thumb,body.prof-dark .tag-bar::-webkit-scrollbar-thumb{background:#2a3d35}
  .tag-bar-label{flex:0 0 auto;font-size:.72rem;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);font-weight:700;display:inline-flex;align-items:center;gap:6px;padding-right:4px}
  .tag-bar-label svg{width:13px;height:13px;color:var(--gold-deep)}
  .tag-chip{flex:0 0 auto;background:var(--surface);border:1px solid var(--line);color:var(--muted);font-size:.78rem;font-weight:600;padding:4px 12px;border-radius:999px;transition:background .15s ease,border-color .15s ease,color .15s ease}
  .tag-chip:hover{border-color:var(--teal-border);color:var(--teal);background:var(--teal-soft)}
  .tag-chip.active{background:var(--gold-soft);border-color:var(--gold);color:var(--gold-deep)}
  #ProfessorsApp.prof-dark .tag-chip.active,body.prof-dark .tag-chip.active{color:var(--gold-deep)}
  .tag-chip .n{opacity:.55;font-weight:500;margin-left:4px;font-size:.72rem}

  /* ---------- Collapsible college groups ---------- */
  .college-group{cursor:pointer;user-select:none;border-radius:12px;padding:7px 10px;margin:22px -10px 8px;transition:background .15s ease}
  .college-group:first-child{margin-top:0}
  .college-group:hover{background:var(--surface-2)}
  .college-group .group-chev{display:grid;place-items:center;width:16px;height:16px;flex:0 0 auto;transition:transform .25s ease}
  .college-group .group-chev svg{width:15px;height:15px;color:var(--muted)}
  .college-group.collapsed .group-chev{transform:rotate(-90deg)}
  .college-group.collapsed h2{color:var(--muted)}

  /* ---------- Keyboard focus card ---------- */
  .prof-card.kb-active{outline:2px solid var(--teal);outline-offset:3px}

  /* ---------- Per-professor paper filter ---------- */
  .paper-filter{background:var(--field);border:1px solid var(--line);border-radius:8px;font-size:.78rem;padding:5px 10px;color:var(--ink);outline:0;width:150px;max-width:44vw;transition:border .15s ease,box-shadow .15s ease}
  .paper-filter:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-soft)}

  /* ---------- Count chip when filtering ---------- */
  .count-chip.filtered{background:var(--gold-soft);color:var(--gold-deep)}
  #ProfessorsApp.prof-dark .count-chip.filtered,body.prof-dark .count-chip.filtered{color:var(--gold-deep)}

  /* ---------- Shortcuts modal ---------- */
  .shortcut-grid{display:grid;grid-template-columns:auto 1fr;gap:10px 16px;align-items:center;font-size:.88rem;color:var(--ink)}
  .kbd{background:var(--field);border:1px solid var(--line);border-bottom-width:2px;border-radius:7px;padding:2px 9px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.76rem;color:var(--heading);white-space:nowrap;justify-self:start}

  /* ---------- Empty state float ---------- */
  @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .empty-ico{animation:floaty 5s ease-in-out infinite}

  /* ---------- Drag-to-reorder professors (QS mode) ---------- */
  #profList .grip{display:none;width:20px;height:38px;border:0;padding:0;background:transparent;border-radius:8px;color:var(--muted);cursor:grab;place-items:center;flex:0 0 auto;margin-left:-8px;transition:color .15s ease,background .15s ease}
  #profList .grip svg{width:13px;height:13px;pointer-events:none}
  #profList.grouped .grip{display:grid}
  #profList .grip:hover{color:var(--teal-mid);background:var(--teal-soft)}
  #profList .grip:active{cursor:grabbing}
  .prof-card.dragging{opacity:.45;border-style:dashed}
  .prof-card.drag-above{box-shadow:0 -4px 0 -1px var(--gold),var(--shadow-card)}
  .prof-card.drag-below{box-shadow:0 4px 0 -1px var(--gold),var(--shadow-card)}
  #ProfessorsApp.prof-dark .prof-card.drag-above,body.prof-dark .prof-card.drag-above{box-shadow:0 -4px 0 -1px var(--gold-deep),var(--shadow-card)}
  #ProfessorsApp.prof-dark .prof-card.drag-below,body.prof-dark .prof-card.drag-below{box-shadow:0 4px 0 -1px var(--gold-deep),var(--shadow-card)}

  /* ---------- College mini status bar ---------- */
  .group-bar{display:inline-flex;width:58px;height:6px;border-radius:999px;overflow:hidden;background:var(--line);flex:0 0 auto}
  .group-bar i{display:block;height:100%;min-width:3px}
  .group-bar .gb-read{background:#65a30d}
  .group-bar .gb-reading{background:var(--teal)}
  .group-bar .gb-wishlist{background:var(--gold)}
  #ProfessorsApp.prof-dark .group-bar,body.prof-dark .group-bar{background:var(--line)}

  /* ---------- Reading streak badge ---------- */
  .streak-badge{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(180deg,var(--gold-soft),#f7e3bd);border:1px solid var(--gold-border);color:var(--gold-deep);font-size:.72rem;font-weight:700;border-radius:999px;padding:2px 9px;letter-spacing:.3px}
  .streak-badge svg{width:11px;height:11px;fill:currentColor}
  #ProfessorsApp.prof-dark .streak-badge,body.prof-dark .streak-badge{color:var(--gold-deep);background:var(--gold-soft)}

  /* ---------- Paste-import modal ---------- */
  .paste-area{width:100%;min-height:150px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.78rem;line-height:1.5;background:var(--field);border:1px solid var(--line);border-radius:10px;padding:12px 14px;color:var(--ink);resize:vertical;outline:0;transition:border-color .15s ease,box-shadow .15s ease}
  .paste-area:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,118,110,.12)}

  /* ---------- Reading journal (dated notes timeline on a paper) ---------- */
  .journal-block{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin-bottom:10px;position:relative;overflow:hidden}
  .journal-block::before{content:'';position:absolute;top:0;bottom:0;left:0;width:3px;background:linear-gradient(180deg,var(--teal),var(--gold));opacity:.4}
  .journal-head{display:flex;align-items:center;gap:7px;margin-bottom:9px;color:var(--heading)}
  .journal-head svg{width:13px;height:13px;color:var(--teal);flex:0 0 auto}
  .journal-head .k{font-size:.68rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--heading)}
  .journal-head .cnt{background:var(--teal-soft);color:var(--teal-deep);border:1px solid var(--teal-border);border-radius:999px;font-size:.66rem;font-weight:700;padding:1px 7px}
  .journal-list{list-style:none;margin:0;padding:2px 0 2px 16px;border-left:2px solid var(--line);display:grid;gap:9px;max-height:230px;overflow-y:auto;scrollbar-width:thin}
  .journal-list::-webkit-scrollbar{width:6px}
  .journal-list::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .journal-list::-webkit-scrollbar-thumb{background:#33453d}
  .journal-item{position:relative;display:flex;gap:9px;align-items:flex-start;font-size:.85rem;line-height:1.5}
  .journal-item::before{content:'';position:absolute;left:-20.5px;top:7px;width:7px;height:7px;border-radius:50%;background:var(--teal);box-shadow:0 0 0 2.5px var(--surface)}
  .journal-date{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.68rem;font-weight:700;color:var(--gold-deep);background:var(--gold-soft);border:1px solid var(--gold-border);border-radius:7px;padding:2px 7px;margin-top:1px;white-space:nowrap}
  .journal-txt{color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
  .journal-del{flex:0 0 auto;opacity:0;width:24px;height:24px;margin-left:auto;transition:opacity .15s ease}
  .journal-item:hover .journal-del,.journal-item:focus-within .journal-del{opacity:1}
  #ProfessorsApp.prof-dark .journal-date,body.prof-dark .journal-date{color:var(--gold-deep);background:var(--gold-soft)}
  #ProfessorsApp.prof-dark .journal-item::before,body.prof-dark .journal-item::before{box-shadow:0 0 0 2.5px var(--surface)}

  /* ---------- Favorites ---------- */
  .prof-card.fav{box-shadow:inset 3px 0 0 0 var(--gold),var(--shadow-card)}
  .fav-chip{display:inline-flex;align-items:center;gap:3px;color:var(--gold-deep);background:var(--gold-soft);border:1px solid var(--gold-border);border-radius:999px;font-size:.62rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:1px 7px;margin-left:8px;vertical-align:2px}
  .fav-chip svg{width:9px;height:9px;fill:currentColor}
  #ProfessorsApp.prof-dark .fav-chip,body.prof-dark .fav-chip{color:var(--gold-deep);background:var(--gold-soft)}
  .icon-btn.fav-on{color:var(--gold-deep);border-color:var(--gold-border);background:var(--gold-soft)}
  .icon-btn.fav-on svg{fill:currentColor}
  #ProfessorsApp.prof-dark .icon-btn.fav-on,body.prof-dark .icon-btn.fav-on{color:var(--gold-deep);background:var(--gold-soft)}

  /* ---------- Heatmap year-jump menu ---------- */
  .heat-menu{position:absolute;top:calc(100% + 7px);right:0;z-index:40;background:var(--surface);border:1px solid var(--line);border-radius:11px;box-shadow:0 12px 30px rgba(31,41,32,.2);min-width:190px;padding:5px;display:none;animation:menuIn .14s ease}
  .heat-menu.open{display:block}
  @keyframes menuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .heat-menu button{display:flex;width:100%;justify-content:space-between;gap:12px;align-items:center;border:0;background:transparent;padding:7px 11px;border-radius:8px;font-family:var(--sans);font-size:.8rem;color:var(--ink);cursor:pointer;text-align:left}
  .heat-menu button:hover{background:var(--teal-soft);color:var(--teal)}
  .heat-menu button.on{color:var(--teal);font-weight:700}
  .heat-menu .hm-n{color:var(--muted);font-size:.7rem;font-variant-numeric:tabular-nums}
  #ProfessorsApp.prof-dark .heat-menu,body.prof-dark .heat-menu{box-shadow:0 12px 30px rgba(0,0,0,.5)}

  /* ---------- Resume pause button ---------- */
  .resume-pause{color:var(--muted)}
  .resume-pause:hover{color:var(--gold-deep);border-color:var(--gold-border);background:var(--gold-soft)}
  #ProfessorsApp.prof-dark .resume-pause:hover,body.prof-dark .resume-pause:hover{color:var(--gold-deep)}

  /* ---------- Reading heatmap (52-week calendar) ---------- */
  .heat-section{margin:0 0 22px}
  .heat-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px 18px 12px;box-shadow:var(--shadow-card);position:relative;overflow:hidden}
  .heat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--teal),var(--gold));opacity:.45}
  .heat-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px}
  .heat-head h2{font-family:var(--serif);font-size:1.02rem;color:var(--heading);display:inline-flex;align-items:center;gap:7px;font-weight:700}
  .heat-head h2 svg{width:15px;height:15px;color:var(--teal)}
  .heat-total{font-size:.78rem;color:var(--muted)}
  .heat-hint{margin-left:2px;font-size:.72rem;color:var(--muted);font-style:italic}
  .heat-scroll{overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
  .heat-scroll::-webkit-scrollbar{height:6px}
  .heat-scroll::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .heat-scroll::-webkit-scrollbar-thumb{background:#33453d}
  .heat-svg{display:block}
  .heat-svg rect.hl{stroke:transparent;stroke-width:1;transition:opacity .15s ease,stroke .15s ease}
  .heat-svg rect.hl[data-date]{cursor:pointer}
  .heat-svg rect.hl:hover{stroke:var(--teal);opacity:.82}
  .heat-svg text{font-family:var(--sans);font-size:9px;fill:var(--muted)}
  .hl-0{fill:var(--heat-0)}
  .hl-1{fill:var(--heat-1)}
  .hl-2{fill:var(--heat-2)}
  .hl-3{fill:var(--heat-3)}
  .hl-4{fill:var(--heat-4)}
  .heat-legend{display:flex;align-items:center;gap:5px;font-size:.72rem;color:var(--muted);margin-top:2px}
  .heat-legend .sw{width:10px;height:10px;border-radius:2.5px;display:inline-block}

  /* ---------- Yearly reading goal ---------- */
  .goal-row{display:flex;flex-direction:column;gap:4px;margin-top:3px}
  .goal-meta{display:flex;justify-content:space-between;align-items:baseline;font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
  .goal-meta b{font-size:.78rem;color:var(--heading);font-variant-numeric:tabular-nums;letter-spacing:0}
  .goal-track{height:6px;border-radius:999px;background:var(--line);overflow:hidden}
  .goal-fill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--teal),var(--gold));transition:width .4s ease}
  .goal-fill.done{background:linear-gradient(90deg,var(--gold),#d98324)}
  .goal-set-btn{font-size:.74rem;padding:1px 2px;align-self:flex-start}

  /* ---------- Heatmap year navigation ---------- */
  .heat-nav{display:inline-flex;align-items:center;gap:4px;margin-left:auto;position:relative}
  .heat-nav .hn-btn{width:26px;height:26px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--muted);display:grid;place-items:center;cursor:pointer;transition:all .15s ease;padding:0}
  .heat-nav .hn-btn svg{width:13px;height:13px}
  .heat-nav .hn-btn:hover:not(:disabled){color:var(--teal-mid);border-color:var(--teal-border);background:var(--teal-soft)}
  .heat-nav .hn-btn:disabled{opacity:.35;cursor:default}
  .heat-nav .hn-label{font-family:var(--sans);font-size:.76rem;font-weight:700;color:var(--heading);font-variant-numeric:tabular-nums;border:1px solid var(--line);background:var(--field);border-radius:8px;padding:4px 12px;min-width:88px;text-align:center;cursor:pointer;transition:all .15s ease}
  .heat-nav .hn-label:hover{border-color:var(--teal-border);background:var(--teal-soft)}

  /* ---------- Paper row status accent + detail-cell hover ---------- */
  .paper-row{transition:box-shadow .18s ease}
  .paper-row.pr-read:hover{box-shadow:inset 3px 0 0 0 #7ba13f}
  .paper-row.pr-reading:hover{box-shadow:inset 3px 0 0 0 var(--teal)}
  .paper-row.pr-wishlist:hover{box-shadow:inset 3px 0 0 0 var(--gold)}
  .detail-cell{transition:border-color .15s ease,background .15s ease}
  .detail-cell:hover{border-color:var(--teal-border);background:var(--teal-soft)}

  /* ---------- Page entrance ---------- */
  .page{animation:pageIn .5s ease both}
  @keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  /* ---------- Bulk add papers modal ---------- */
  .bulk-hint{font-size:.78rem;color:var(--muted);background:var(--surface-2);border:1px dashed var(--line);border-radius:10px;padding:8px 12px;line-height:1.65;margin-bottom:12px}
  .bulk-hint code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--field);border:1px solid var(--line);border-radius:5px;padding:0 5px;font-size:.72rem;color:var(--heading)}

  /* ---------- Compare professors ---------- */
  .cmp-pick{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .cmp-pick select{flex:1;min-width:180px;background:var(--field);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:.86rem;color:var(--ink);outline:0;transition:border .15s ease,box-shadow .15s ease}
  .cmp-pick select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,118,110,.14)}
  .cmp-swap{width:40px;height:40px;flex:0 0 auto}
  .cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .cmp-col{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:13px 14px;min-width:0;display:flex;flex-direction:column;gap:10px}
  .cmp-id{display:flex;align-items:center;gap:10px;min-width:0}
  .cmp-id .avatar{width:40px;height:40px;font-size:.92rem;flex:0 0 auto}
  .cmp-id-txt{min-width:0;display:flex;flex-direction:column}
  .cmp-name{font-weight:700;font-size:.9rem;color:var(--heading);line-height:1.3}
  .cmp-college{font-size:.73rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cmp-stats{display:flex;flex-direction:column}
  .cmp-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:.8rem;border-bottom:1px dashed var(--line);padding:4px 0}
  .cmp-row:last-child{border-bottom:0}
  .cmp-row .k{color:var(--muted)}
  .cmp-row .v{font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;text-align:right}
  .cmp-row .v.win{color:var(--teal)}
  #ProfessorsApp.prof-dark .cmp-row .v.win,body.prof-dark .cmp-row .v.win{color:var(--teal)}
  .cmp-papers{border-top:1px solid var(--line);padding-top:8px;max-height:250px;overflow-y:auto;scrollbar-width:thin}
  .cmp-papers::-webkit-scrollbar{width:8px}
  .cmp-papers::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .cmp-papers::-webkit-scrollbar-thumb,body.prof-dark .cmp-papers::-webkit-scrollbar-thumb{background:#2a3d35}
  .cmp-paper{padding:6px 1px;border-bottom:1px dashed var(--line)}
  .cmp-paper:last-child{border-bottom:0}
  .cmp-paper .t{font-weight:600;font-size:.8rem;color:var(--ink);display:block;line-height:1.35}
  .cmp-paper .m{color:var(--muted);font-size:.72rem;display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:1px}
  .cmp-empty{color:var(--muted);font-size:.84rem;font-style:italic;text-align:center;padding:16px 0}
  @media (max-width:640px){.cmp-grid{grid-template-columns:1fr}}

  /* ---------- Focus visibility (keyboard users) ---------- */
  :where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--teal);outline-offset:2px}

  /* ---------- Card micro-interactions ---------- */
  .prof-card:hover{transform:translateY(-1px)}
  .stat-num{font-variant-numeric:tabular-nums}
  @media (max-width:760px){
    .heat-hint{display:none}
  }

  /* ---------- Journal browser modal ---------- */
  .btn-cnt{min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:var(--teal-soft);border:1px solid var(--teal-border);color:var(--teal);font-size:.7rem;font-weight:800;line-height:17px;text-align:center;display:inline-block;font-variant-numeric:tabular-nums}
  #ProfessorsApp.prof-dark .btn-cnt,body.prof-dark .btn-cnt{background:var(--teal-soft);color:var(--teal);border-color:var(--teal-border)}
  .jrnl-list{max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);scrollbar-width:thin}
  .jrnl-list::-webkit-scrollbar{width:6px}
  .jrnl-list::-webkit-scrollbar-thumb{background:#d8d2c2;border-radius:8px}
  #ProfessorsApp.prof-dark .jrnl-list::-webkit-scrollbar-thumb,body.prof-dark .jrnl-list::-webkit-scrollbar-thumb{background:#2a3d35}
  .jrnl-row{display:flex;gap:10px;align-items:flex-start;padding:10px 13px;border-bottom:1px dashed var(--line);cursor:pointer;transition:background .15s ease;width:100%;text-align:left;background:none;border-left:none;border-right:none;border-top:none;font:inherit;color:inherit}
  .jrnl-row:last-child{border-bottom:none}
  .jrnl-row:hover,.jrnl-row:focus-visible{background:var(--teal-soft)}
  #ProfessorsApp.prof-dark .jrnl-row:hover,#ProfessorsApp.prof-dark .jrnl-row:focus-visible,
  body.prof-dark .jrnl-row:hover,body.prof-dark .jrnl-row:focus-visible{background:var(--teal-soft)}
  .jrnl-date{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.68rem;font-weight:700;color:var(--gold-deep);background:var(--gold-soft);border:1px solid var(--gold-border);border-radius:7px;padding:2px 7px;margin-top:1px;white-space:nowrap;font-variant-numeric:tabular-nums}
  #ProfessorsApp.prof-dark .jrnl-date,body.prof-dark .jrnl-date{color:var(--gold-deep);background:var(--gold-soft)}
  .jrnl-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}
  .jrnl-txt{font-size:.88rem;line-height:1.5;color:var(--ink);overflow-wrap:anywhere;white-space:pre-wrap}
  .jrnl-src{font-size:.73rem;color:var(--muted);display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-width:0}
  .jrnl-src .jp{font-weight:700;color:var(--teal);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  #ProfessorsApp.prof-dark .jrnl-src .jp,body.prof-dark .jrnl-src .jp{color:var(--teal)}
  .jrnl-src .jc{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
  .jrnl-empty{padding:30px 18px;text-align:center;color:var(--muted);font-size:.88rem;display:flex;flex-direction:column;align-items:center;gap:8px}
  .jrnl-empty svg{width:26px;height:26px;opacity:.45}
  .jrnl-count{font-size:.75rem;color:var(--muted);margin:0 2px 8px}
  .jrnl-count b{color:var(--teal);font-variant-numeric:tabular-nums}
  #ProfessorsApp.prof-dark .jrnl-count b,body.prof-dark .jrnl-count b{color:var(--teal)}

  /* ---------- Goal pace projection ---------- */
  .goal-pace{font-size:.72rem;font-style:italic;display:inline-flex;align-items:center;gap:4px;line-height:1.35}
  .goal-pace svg{width:11px;height:11px;flex:0 0 auto}
  .goal-pace.pace-on{color:var(--teal)}
  .goal-pace.pace-warn{color:var(--gold-deep)}
  #ProfessorsApp.prof-dark .goal-pace.pace-on,body.prof-dark .goal-pace.pace-on{color:var(--teal)}
  #ProfessorsApp.prof-dark .goal-pace.pace-warn,body.prof-dark .goal-pace.pace-warn{color:var(--gold-deep)}

  /* ---------- Paper-row flash (jump-to-paper highlight) ---------- */
  .paper-row.flash{animation:flashRing 1.1s ease-in-out 2;border-radius:10px}

  /* ---------- Responsive ---------- */
  @media (max-width:760px){
    #profList .grip{display:none!important}
    .header-inner{padding:14px 16px 12px}
    .content{padding:20px 14px 32px}
    .brand-row{align-items:stretch}
    .header-actions{width:100%}
    .header-actions .btn{flex:1}
    .form-grid{grid-template-columns:1fr}
    .prof-head{padding:14px;gap:11px}
    .prof-right .count-chip{display:none}
    .footer-inner{flex-direction:column;align-items:flex-start}
  }
  @media (prefers-reduced-motion:reduce){
    *,*::before,*::after{transition:none!important;animation:none!important}
  }

  /* ---------- Print ---------- */
  @media print{
    body{background:#fff!important}
    .site-header,.site-footer,.scroll-top,.toast,.icon-btn,.btn,.sort-wrap,.search-wrap,.tag-bar{display:none!important}
    .content{padding:0;max-width:none}
    .prof-card,.papers-block,.detail-cell,.note-block,.bio{box-shadow:none!important;border-color:#bbb!important;background:#fff!important}
    .acc{grid-template-rows:1fr!important}
    .college-group{margin-top:14px}
    .stat-card::before{display:none}
    .heat-card,.resume-card{box-shadow:none!important;border-color:#bbb!important;background:#fff!important}
    .resume-list{max-height:none;overflow:visible}
  }
/* ===== ProfessorTrack header redesign (reformed 2026-10-03: bare brand mark,
   flat Import/Export/Save/Theme actions, single command-bar row) ===== */
#ProfessorsApp .icb-btn { --icb-accent: var(--gold); --icb-tip-bg: var(--toast-bg, #081a16); --icb-tip-fg: #f5f2ea; }
/* bare brand mark — enlarged scholar cap with a subtle glow, brighter in dark mode */
#ProfessorsApp.prof-dark .logo { filter: drop-shadow(0 0 11px rgba(240, 217, 168, .48)); }
/* unified command bar — toggle · sort · search · add as concentric pills */
.pt-row2 {
  display: flex; align-items: center; gap: 10px;
  --icb-size: 36px;
}
.pt-row2 .icb-btn { border-radius: 999px; }
.pt-row2 .search-wrap {
  flex: 1 1 auto; min-width: 110px;
  height: 36px; padding: 0 13px; border-radius: 999px;
}
.pt-row2 .sort-wrap { height: 36px; }
.pt-row2 .sort-wrap select { height: 36px; padding: 0 10px; border-radius: 999px; }
@media (max-width: 640px) {
  .brand-row { flex-wrap: wrap; }
  .header-actions { margin-left: auto; }
  .pt-row2 { flex-wrap: wrap; }
  .pt-row2 .search-wrap { order: 10; flex-basis: 100%; }
}

/* ---------- Draggable modals (2026-10-03) ---------- */
.modal-head { cursor: grab; touch-action: none; }
.modal-card.dragging { transition: none; user-select: none; }
.modal-card.dragging .modal-head { cursor: grabbing; }

/* ---------- Professor modal media capture (photo / college logo) ---------- */
.media-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.media-capture{
  position:relative;display:grid;place-items:center;height:132px;
  border-radius:14px;border:1.5px dashed var(--line);background:var(--surface-2);
  cursor:pointer;overflow:hidden;outline:none;
  transition:border-color .15s ease,background .15s ease;
}
.media-capture:hover,.media-capture:focus-visible{border-color:var(--teal)}
.media-capture.drag-over{border-color:var(--teal);background:var(--teal-soft)}
.media-capture .media-preview{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.media-capture .media-preview-contain{object-fit:contain;padding:12px;background:var(--surface)}
.media-empty{display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--muted);pointer-events:none}
.media-empty svg{width:30px;height:30px;color:var(--teal-mid);margin-bottom:4px}
.media-empty strong{font-size:.9rem;color:var(--ink)}
.media-empty span{font-size:.72rem;text-transform:uppercase;letter-spacing:.6px}
.media-clear{
  position:absolute;top:7px;right:7px;width:24px;height:24px;border-radius:50%;
  border:0;background:rgba(0,0,0,.55);color:#fff;font-size:15px;line-height:1;
  cursor:pointer;display:grid;place-items:center;padding:0;
}
.media-clear:hover{background:rgba(0,0,0,.78)}

/* ---------- proff.html-style card head (big portrait + college logo far right) ---------- */
.prof-head .avatar-lg{
  width:64px;height:64px;font-size:1.25rem;
  box-shadow:inset 0 -8px 14px rgba(0,0,0,.12),0 0 0 2px var(--surface),0 0 0 3.5px var(--prof-c,var(--line));
}
.prof-head .avatar-lg.avatar-blank{
  background:var(--surface-2);border:1.5px dashed var(--line);
  box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--line);
}
.prof-head .avatar-lg img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.college-logo{
  width:76px;height:54px;object-fit:contain;flex:0 0 auto;padding:5px;
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  box-shadow:var(--shadow-card);
}
@media (max-width:760px){
  .college-logo{display:none}
  .media-grid{grid-template-columns:1fr}
}

/* Professor identity color — subtle by default, theme-aware emphasis on hover (spec §14) */
#ProfessorsApp .avatar { transition: transform .18s ease, filter .18s ease, box-shadow .18s ease; }
#ProfessorsApp .prof-card:hover .avatar {
  filter: brightness(0.88) saturate(1.25);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--prof-c, var(--teal)) 30%, transparent);
}
#ProfessorsApp.prof-dark .prof-card:hover .avatar {
  filter: brightness(1.18) saturate(1.15);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--prof-c, var(--teal)) 42%, transparent);
}


/* Professor identity-color picker (professor modal) */
#ProfessorsApp .prof-color-picker { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
#ProfessorsApp .prof-color-picker button {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid var(--line); cursor: pointer; padding: 0;
  transition: transform .15s ease, box-shadow .15s ease;
}
#ProfessorsApp .prof-color-picker button:hover { transform: scale(1.12); }
#ProfessorsApp .prof-color-picker button.active {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--teal) 30%, transparent);
}
#ProfessorsApp .prof-color-picker input[type="color"] {
  width: 26px; height: 26px; padding: 0; border: 2px dashed var(--line);
  border-radius: 50%; background: transparent; cursor: pointer;
}

`;
}

let stylesInjected = false;
export function InitProfessorsStyles() {
  if (stylesInjected) return;
  if (document.getElementById('ProfessorsStyles')) { stylesInjected = true; return; }
  var style = document.createElement('style');
  style.id = 'ProfessorsStyles';
  style.textContent = GetProfessorsStyles();
  document.head.appendChild(style);
  stylesInjected = true;
}
