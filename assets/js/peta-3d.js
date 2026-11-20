/* =============================================================================
   PETA 3D WILAYAH KERJA — komponen tunggal yang dipakai ulang di:
     · Beranda, section #wilayah (interaktif)
     · wilayah-provinsi.html, hero (statis, langsung fokus ke provinsi)
   Render: SVG Indonesia (Natural Earth, domain publik) dengan efek 3D CSS. Bidang dimiringkan
   rotateX(--rx), 4 lapisan translateZ sebagai ketebalan, pin berdiri tegak (counter-rotate).

   KAMERA
   Satu transform pada .peta:  translate3d(--tx, --ty, 0) scale3d(--k) rotateX(--rx)
   --tx/--ty/--k didaftarkan lewat @property (lihat peta-3d.css) sehingga yang dianimasikan adalah
   variabelnya, bukan transform. Jadi tilt (--rx) yang di-scrub scroll tetap instan, dan hanya
   gerak kamera yang memakai transisi 750 ms.
   Posisi tujuan dihitung analitis dengan proyeksi perspektif (P, perspective-origin) sehingga
   titik provinsi jatuh tepat di tengah area bebas yang diberikan halaman (opsi `region`).
   Pin di-counter-scale 1/--k agar ukurannya tetap saat zoom.

   API
     var peta = Peta3D.mount(stageEl, {
       provinces, project,            // data + projectToMap(lat, lon) dari assets/data/provinsi.js
       interactive: true,             // false → pin tidak bisa diklik (hero profil, mobile)
       zoom: 2.2,                     // faktor zoom saat fokus (angka atau fungsi)
       res: 2.2,                      // opsional: faktor resolusi R (default = zoom saat mount, maks 3)
       region: function(){ return {x, y, w, h}; },  // area bebas (px, koordinat stage)
       mapLabel: '...',               // aria-label peta (role="img"); null → aria-hidden
       popIn: true,                   // pin muncul bergantian saat peta pertama kali terlihat
       detail: { sea, land, names },  // opsional: peta satu warna + nama laut/pulau + skala jarak
       maxZoom: 2.6,                  // opsional: batas zoom bebas (default = R); pan: true → drag saat diperbesar
       onZoom: function(level){},     // dipanggil tiap kamera berubah (level 1 = diam)
       onHover: function(slug|null){}, onSelect: function(slug){}
     });
     peta.focus(slug, {instant}) · peta.reset({instant}) · peta.hot(slug|null) · peta.sync() · peta.selected
     peta.zoomBy(f) · peta.zoomReset() · peta.canZoom(+1|-1) · peta.zoomLevel()
   ============================================================================= */
(function (root) {
  'use strict';

  var PATH = 'M67,109L72,115L74,115L77,119L76,126L74,128L72,127L70,122L66,120L63,114L59,109L62,109L65,107ZM103,177L101,177L96,174L91,165L93,160L97,159L98,160L102,170L105,174L105,176ZM472,322L470,326L471,327L464,328L456,326L456,325L456,324L460,324L460,318L467,313L474,316ZM447,312L449,313L453,317L445,322L442,326L441,327L440,326L441,323L439,321L434,318L429,317L426,312L427,311L436,313L441,310ZM248,175L251,179L252,186L255,192L265,194L262,196L260,201L261,204L247,199L245,195L246,192L243,188L243,186L238,183L233,184L229,183L230,180L234,178L234,175L236,173L239,172L241,176L242,175L241,172L245,171L248,173ZM611,236L611,241L609,239L608,240L606,248L606,249L608,249L610,250L611,251L611,252L608,254L606,254L603,259L601,259L599,259L598,256L602,250L604,237L606,233L608,232L608,233ZM599,251L598,253L594,252L593,253L592,253L592,252L593,248L594,247L593,242L593,240L600,237L602,244L599,248ZM296,62L293,62L292,61L295,59L292,58L290,55L290,54L295,50L295,52L298,55L298,58ZM294,203L293,206L291,208L289,208L288,206L287,205L286,206L281,207L282,206L280,201L283,194L286,193L291,194L294,197L296,199ZM869,153L879,155L885,160L890,163L888,164L885,165L880,164L878,163L876,157L874,158L870,156ZM870,173L886,175L890,176L899,177L900,178L895,179L886,180L879,177L871,175ZM772,140L776,140L782,143L783,146L781,147L775,147L769,141L768,141L768,143L771,146L774,147L774,148L771,149L769,146L766,147L765,145L762,145L760,144L761,142L762,141L764,142ZM722,96L719,97L717,91L719,87L722,85L725,85L727,87L726,93L724,95ZM716,175L714,176L711,175L703,176L700,174L700,173L701,170L705,168L710,170L716,173ZM671,191L670,191L667,183L669,181L670,182L670,185L672,190ZM671,177L677,178L669,180L658,181L657,179L660,178ZM648,176L650,176L652,175L653,176L653,177L656,178L656,179L649,181L646,180L641,181L637,182L635,179L637,175L642,174ZM783,309L778,309L778,306L779,302L780,302L781,297L787,292L788,290L790,290L791,292L790,293L791,297L789,301L784,306ZM687,302L687,303L682,305L680,308L671,306L666,308L667,305L670,302L675,302L683,300L686,302ZM640,312L641,313L644,312L650,312L652,313L652,316L637,318L635,317L637,315L636,314L637,313ZM776,167L773,167L771,166L769,160L774,158L777,159L777,160ZM46,29L54,28L61,29L67,29L69,29L76,36L78,41L83,46L83,51L85,53L92,56L95,60L103,64L115,72L132,93L135,95L139,98L138,94L138,92L140,91L143,92L148,97L150,102L152,104L158,105L163,109L166,113L168,119L171,122L173,123L183,125L185,129L184,131L174,135L182,134L191,129L194,129L198,133L201,139L193,144L192,147L195,149L193,151L193,152L195,155L199,158L209,162L213,161L216,178L217,180L223,184L223,187L219,191L219,194L220,194L226,190L235,190L239,192L248,205L249,208L245,212L244,216L244,218L246,221L244,228L245,236L245,245L243,260L242,263L239,262L234,257L228,261L219,256L218,259L220,264L218,264L206,253L202,247L182,234L174,227L165,216L154,206L149,199L144,194L139,187L138,185L139,180L131,167L127,157L118,146L114,139L106,135L103,132L95,108L91,100L80,93L74,91L72,90L70,79L65,77L56,64L53,61L45,59L41,53L27,41L24,37L19,28L20,25L20,22L21,21L23,21L30,22L39,28ZM602,322L596,324L588,324L578,328L577,326L573,326L571,328L569,328L565,328L555,326L550,326L546,325L541,327L539,323L541,318L543,318L551,314L556,314L559,315L565,316L574,321L585,318L592,322L595,321L597,318L604,315L605,313L602,313L604,311L606,312L607,316L603,319L604,321ZM544,338L548,341L549,344L553,343L555,345L560,350L561,352L560,353L558,355L553,357L546,355L542,350L535,346L530,346L523,344L521,341L523,339L526,338L535,337L539,338L542,336ZM506,315L508,316L511,314L514,315L516,317L517,316L521,315L522,316L523,321L525,323L524,324L518,324L517,324L519,326L516,326L510,327L509,323L505,326L498,328L495,328L491,330L484,331L481,332L475,330L475,323L476,320L483,316L487,318L492,318L497,324L500,324L503,322L505,322L506,321L503,319L501,318L497,316L496,313L496,312L499,311L504,311ZM647,118L643,122L637,130L632,131L623,133L612,133L609,129L607,129L582,130L575,129L565,130L556,128L551,130L547,134L544,144L545,151L548,158L554,162L557,169L565,169L568,168L570,163L577,157L580,159L585,159L592,156L604,156L603,153L610,152L615,153L616,156L615,161L612,161L610,159L608,158L605,159L596,168L591,172L583,175L578,180L573,178L572,179L572,181L575,183L577,185L581,187L587,198L592,201L592,204L594,207L592,209L591,216L598,222L600,226L604,225L605,229L604,232L601,231L601,233L596,233L588,236L587,237L587,241L586,242L584,242L577,240L575,236L578,226L571,222L562,214L563,212L566,206L566,198L564,196L562,195L557,196L549,202L549,204L552,210L553,218L551,226L552,237L549,248L552,258L550,257L542,257L537,260L534,258L530,254L530,252L533,243L533,240L535,235L535,225L532,218L532,214L530,213L522,214L519,211L518,206L519,201L518,197L524,192L526,185L529,180L530,178L529,169L533,159L537,154L540,158L537,141L540,139L539,134L542,130L544,128L545,125L548,121L549,119L550,119L552,122L554,122L556,121L562,113L566,111L569,113L573,113L577,117L583,117L595,118L603,122L608,120L626,122L634,118L637,114L639,114L641,110L645,109L649,104L653,105L654,108ZM276,267L279,269L283,271L293,273L297,272L301,276L302,282L304,283L317,285L321,284L328,285L336,285L341,286L344,283L347,277L350,275L352,276L357,281L360,281L364,280L369,283L374,283L376,285L386,286L388,292L391,294L391,299L396,301L406,303L418,301L425,304L426,309L425,317L427,321L429,323L429,325L425,324L422,322L415,321L401,315L389,317L377,316L364,315L345,312L333,306L317,302L305,302L302,302L299,304L294,304L286,302L280,299L275,297L257,295L256,293L258,289L246,285L232,284L232,282L234,280L234,282L236,283L238,281L240,276L241,277L243,276L245,269L249,265L265,268L269,267L269,264ZM324,97L322,99L323,101L324,102L325,105L343,121L355,117L363,118L370,118L373,116L376,115L378,109L384,107L394,106L395,107L395,109L406,112L409,113L414,109L425,108L427,109L430,105L431,100L433,99L434,98L433,94L433,92L441,86L441,85L439,84L440,78L443,76L444,76L447,75L450,67L450,56L452,51L456,48L459,49L464,47L468,48L470,47L482,48L492,51L490,53L495,59L496,62L493,63L491,61L489,63L481,63L483,64L487,67L488,68L487,71L487,72L493,75L493,77L492,78L495,78L493,80L497,81L499,86L502,91L502,93L497,97L503,104L515,112L519,116L521,117L522,119L520,121L512,122L505,121L499,116L501,119L500,121L496,124L491,135L490,146L492,151L492,156L485,159L480,165L478,165L476,165L474,162L475,168L470,171L470,173L465,177L468,177L468,180L468,183L465,185L470,186L471,188L470,193L465,193L465,195L467,194L466,201L464,202L462,202L462,203L464,206L462,207L460,210L458,216L431,228L430,226L429,218L428,211L426,213L424,212L423,211L424,208L421,211L418,209L416,211L410,213L409,212L408,207L403,208L396,202L395,207L390,210L387,211L380,210L371,215L370,214L370,204L368,201L366,202L361,202L352,204L349,203L351,201L347,203L344,201L338,203L337,202L334,182L331,179L333,172L332,166L327,161L320,158L318,158L316,157L317,155L319,153L314,150L313,148L315,140L316,139L310,132L309,120L310,116L314,113L311,113L312,108L317,103L319,99ZM707,122L710,122L712,117L716,115L716,112L717,110L721,107L727,106L727,116L719,121L718,124L725,128L727,132L731,135L722,131L712,130L711,130L710,133L710,138L712,145L718,155L721,158L718,158L717,156L713,154L710,148L706,145L706,133L703,129L703,127L704,122L702,120L700,115L700,113L703,109L705,101L710,94L713,93L710,101L713,104L713,111L710,115L705,118L705,120ZM750,200L754,202L763,203L767,206L769,211L771,212L773,215L772,221L755,213L751,210L744,210L745,212L744,213L733,210L733,208L731,208L726,212L723,212L721,212L718,208L715,206L710,213L711,210L710,208L717,200L733,199L735,200L736,202L737,202L744,198ZM688,205L692,206L696,211L696,213L696,216L690,219L685,220L682,219L674,215L671,212L671,207L672,205L675,206L682,204ZM647,329L648,331L651,330L652,331L651,334L648,334L650,341L648,344L637,354L632,355L625,358L620,358L620,355L622,353L619,351L619,350L622,343L629,337L630,339L635,339L637,336L637,334L640,333ZM855,260L855,264L854,265L855,270L854,273L853,274L849,273L843,268L843,267L846,267L847,263L844,260L847,260L850,256L850,255L851,254L852,255L853,258L854,258ZM851,276L850,279L846,284L844,286L841,284L841,283L842,276L843,276L842,275L842,270L843,270ZM935,314L930,317L916,317L920,307L926,299L930,297L935,296L940,296L944,300L945,302L941,310ZM987,195L987,274L984,282L987,286L987,332L966,313L966,312L969,307L965,311L953,313L951,311L950,308L949,310L944,314L943,314L942,312L947,300L940,293L942,292L946,292L949,292L946,292L942,290L937,286L942,285L933,274L930,265L932,263L928,262L929,261L931,260L926,260L925,255L909,246L909,244L907,245L905,244L895,241L881,235L870,233L865,234L855,228L854,226L854,223L858,223L855,222L851,224L848,222L845,223L842,220L839,220L833,215L833,213L833,208L836,204L833,205L832,211L831,212L829,212L830,214L827,218L827,222L823,225L818,226L816,225L813,218L815,215L813,209L804,202L798,201L796,198L802,196L812,199L819,192L822,191L831,193L833,195L834,191L837,190L837,188L835,188L837,186L838,184L833,186L823,186L817,188L808,186L804,187L798,182L796,173L791,172L782,169L778,170L776,170L777,167L780,164L781,161L781,158L793,154L800,149L805,147L815,148L828,155L839,155L842,157L841,161L845,168L842,176L843,188L849,199L850,194L851,193L853,193L854,202L857,201L858,207L861,210L866,211L871,210L879,203L882,197L887,194L890,188L899,186L904,184L906,182L905,178L920,171L922,171L926,174L938,177L941,180L962,189L969,189L971,191L979,191L981,193L982,195ZM943,317L936,317L936,315L938,313L941,312ZM157,96L158,98L157,102L154,103L152,103L150,99L150,97L155,95ZM172,119L171,119L169,117L168,113L168,110L170,111L172,113ZM173,109L173,111L169,109L164,108L163,106L173,108ZM185,124L184,125L173,121L172,121L174,117L174,116L178,119L184,121ZM187,121L186,122L182,118L178,117L178,115L184,117ZM190,128L187,128L188,125L189,125L190,127ZM193,125L191,123L192,121L194,124ZM206,115L207,115L208,115L206,119L204,118L204,117ZM217,114L219,117L217,122L216,122L214,119L215,118L214,117L210,118L210,116L213,115ZM222,143L223,143L226,146L224,146L220,144L217,145L215,144L217,139L219,140ZM215,147L218,149L216,152L214,152L213,153L211,149L211,148L213,148ZM200,147L197,148L194,147L196,144L199,145L200,146ZM326,164L321,167L320,166L321,160L324,160L326,162L327,163ZM413,290L409,290L405,292L398,292L390,290L390,289L393,285L416,285L418,287L414,289ZM860,163L858,163L856,161L857,160L858,159L860,161ZM697,150L694,151L694,145L697,146L697,146L697,148ZM703,146L706,149L704,152L705,154L708,154L710,157L707,158L705,156L701,157L701,153L698,150L698,147L701,148L702,146ZM817,264L815,266L817,260L818,258L821,252L822,253L821,257L818,261ZM814,263L813,265L811,265L811,261L810,258L812,258L813,259ZM718,217L717,219L715,217L712,219L711,218L713,216L718,214L719,214ZM687,54L685,55L685,53L687,50L685,48L686,43L688,45L690,49ZM663,67L662,68L660,66L659,61L661,62ZM773,315L771,316L776,311L780,311L774,314ZM751,308L750,310L749,310L746,307L746,305L751,305ZM709,311L715,312L715,312L713,314L709,313L708,311ZM762,175L764,178L763,180L764,181L760,183L758,183L752,182L749,179L755,177ZM171,255L169,255L165,252L167,251L171,253L171,254ZM129,207L130,210L128,208L128,205L125,203L125,198L126,198L130,203ZM125,197L123,199L121,199L120,193L125,196ZM117,189L112,187L111,185L111,182L114,183ZM88,151L87,152L85,151L87,144L85,140L87,140L90,145ZM46,90L43,89L36,85L32,83L30,80L32,78L34,78L45,86ZM587,255L585,255L582,251L583,247L584,247L586,249ZM611,164L612,169L614,166L616,166L618,168L618,170L615,171L613,170L612,173L610,174L609,172L611,171L610,167L604,173L603,170L603,167L605,165ZM583,148L584,149L583,150L578,151L580,148ZM555,273L554,276L553,270L553,262L555,266ZM446,287L442,287L443,285L446,284L449,285L449,286ZM465,221L461,225L460,224L460,220L459,218L461,210L464,208ZM606,370L603,370L604,367L608,366L615,361L616,365L611,368ZM634,316L631,320L629,320L628,318L626,318L628,315L630,316L633,313L634,314ZM626,314L623,315L622,318L620,318L618,321L617,320L615,321L612,320L617,315L615,315L619,315L623,313ZM613,316L613,317L607,317L607,316L611,314L614,314ZM210,122L209,123L207,120L210,121ZM242,79L241,78L241,75L244,77ZM310,174L307,175L307,173L310,173ZM266,203L265,203L263,202L264,201L267,202ZM389,262L389,263L387,263L387,262L389,261ZM232,280L230,280L229,279L232,277ZM64,96L59,93L63,93ZM22,17L21,17L19,15L22,15ZM619,176L617,175L617,172L618,171L620,174ZM612,226L610,229L608,229L607,227L606,225L607,224L611,224ZM532,324L530,324L530,321L532,318L534,320L532,323ZM451,325L450,326L448,324L450,323ZM494,51L499,51L499,54L495,55L493,52ZM494,70L494,71L492,69L491,67L494,67ZM560,290L557,290L557,288L560,289ZM492,316L490,316L490,313L494,312ZM468,213L467,216L466,214L467,212L468,211ZM830,229L831,230L825,228L825,226ZM774,156L772,158L763,159L765,157ZM768,151L765,150L768,148L769,149ZM745,143L741,141L740,139L745,142ZM698,156L695,156L696,153L697,153ZM728,215L728,216L726,215L725,214ZM724,215L721,216L722,214ZM797,292L796,293L792,290L795,290ZM727,291L726,292L724,290L726,289ZM700,301L699,301L699,298L701,299ZM616,357L614,358L614,357L616,354L617,355L615,356ZM583,363L579,363L583,360L586,360L585,362ZM606,320L606,321L604,321L605,320L607,318L610,319Z';
  var SVG = 'http://www.w3.org/2000/svg';
  var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');

  /* Path Indonesia didefinisikan sekali per dokumen, dipakai semua lapisan lewat <use>. */
  function ensureDefs() {
    if (document.getElementById('peta-idn')) return;
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<defs><path id="peta-idn" d="' + PATH + '"/></defs>';
    document.body.insertBefore(s, document.body.firstChild);
  }

  function layer(z, top, label) {
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 1000 381');
    s.setAttribute('class', 'peta__layer' + (top ? ' peta__layer--top' : ''));
    s.setAttribute('focusable', 'false');
    if (top && label) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); }
    else s.setAttribute('aria-hidden', 'true');
    if (!top) s.style.setProperty('--z', z + 'px');
    var u = document.createElementNS(SVG, 'use'); u.setAttribute('href', '#peta-idn'); s.appendChild(u);
    return s;
  }

  function px(v) { return parseFloat(v) || 0; }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Mode detail — bidang di bawah daratan: nama perairan + skala jarak. Peta satu warna:
     tanpa gradasi, relief, atau kontur (warna di peta-3d.css § Detail). Koordinat viewBox 1000×381. */
  function seaLayer(project, d) {
    var X = function (lon) { return project(0, lon).x * 10; }, Y = function (lat) { return project(lat, 0).y * 3.81; };
    var g = d.names || {}, h = '';
    (d.sea || []).forEach(function (l) {
      var x = X(l.lon), y = Y(l.lat);
      h += '<text class="peta__lbl peta__lbl--sea' + (l.big ? ' peta__lbl--big' : '') + '" x="' + x + '" y="' + y + '" text-anchor="middle"' + (l.rot ? ' transform="rotate(' + l.rot + ' ' + x + ' ' + y + ')"' : '') + '>' + esc(l.name) + '</text>';
    });
    /* skala jarak 500 km (1° bujur di khatulistiwa ≈ 111,32 km) */
    if (d.scale) {
    var x0 = X(127.2), y0 = Y(-10.6), w = X(100 + 500 / 111.32) - X(100);
    h += '<g class="peta__scale"><path d="M' + x0 + ',' + (y0 - 2.5) + 'V' + y0 + 'H' + (x0 + w) + 'V' + (y0 - 2.5) + 'M' + (x0 + w / 2) + ',' + y0 + 'V' + (y0 - 1.5) + '"/>'
      + '<text class="peta__deg" x="' + x0 + '" y="' + (y0 + 6.5) + '">0</text><text class="peta__deg" x="' + (x0 + w) + '" y="' + (y0 + 6.5) + '" text-anchor="middle">500 ' + esc(g.km || 'km') + '</text></g>';
    }
    if (!h) return null;
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 1000 381');
    s.setAttribute('class', 'peta__layer peta__sea');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.style.setProperty('--z', '-15px');
    s.innerHTML = h;
    return s;
  }
  function landLabels(top, project, d) {
    var h = '';
    (d.land || []).forEach(function (l) {
      var p = project(l.lat, l.lon), x = p.x * 10, y = p.y * 3.81;
      h += '<text class="peta__lbl peta__lbl--land" x="' + x + '" y="' + y + '" text-anchor="middle"' + (l.rot ? ' transform="rotate(' + l.rot + ' ' + x + ' ' + y + ')"' : '') + '>' + esc(l.name) + '</text>';
    });
    top.insertAdjacentHTML('beforeend', h);
  }

  function mount(stage, opt) {
    opt = opt || {};
    ensureDefs();
    var provs = opt.provinces || [], project = opt.project;
    var interactive = opt.interactive !== false;

    stage.classList.add('peta-stage');
    var map = document.createElement('div');
    map.className = 'peta';
    var shadow = document.createElement('div'); shadow.className = 'peta__shadow'; shadow.setAttribute('aria-hidden', 'true');
    map.appendChild(shadow);
    var det = opt.detail;
    if (det) { map.classList.add('peta--detail'); var sea = seaLayer(project, det); if (sea) map.appendChild(sea); }
    var top = layer(0, true, opt.mapLabel);
    if (det) {
      /* Detail: sisi tebal digambar DI DALAM lapisan atas sebagai salinan pulau yang digeser ke selatan (bidang miring
         membuatnya terbaca sebagai tebing). Satu raster saja: tumpukan lapisan translateZ beresolusi R× memakan
         ratusan MB memori GPU di layar retina dan membuat Chrome berkedip/crash. */
      var main = top.firstChild, sides = '';
      for (var dy = 6; dy > 0; dy -= .75) sides += '<use href="#peta-idn" class="peta__side" transform="translate(0 ' + dy + ')"/>';
      main.insertAdjacentHTML('beforebegin', sides);
    } else [-14, -10, -6, -3].forEach(function (z) { map.appendChild(layer(z, false)); });
    if (det) landLabels(top, project, det);
    map.appendChild(top);

    /* Pin: lapisan dekoratif bagi pembaca layar. Kontrol yang setara (daftar provinsi) disediakan halaman. */
    var pinsEl = document.createElement('div');
    pinsEl.className = 'peta__pins'; pinsEl.setAttribute('aria-hidden', 'true');
    var pins = {};
    provs.forEach(function (p, i) {
      var pos = project(p.lat, p.lon);
      var b = document.createElement(interactive ? 'button' : 'span');
      if (interactive) { b.type = 'button'; b.tabIndex = -1; }
      b.className = 'peta-pin';
      b.dataset.slug = p.slug; b.dataset.cat = p.category;
      b.style.left = pos.x + '%'; b.style.top = pos.y + '%'; b.style.setProperty('--i', i);
      b._pos = pos;
      b.innerHTML = '<span class="peta-pin__up"><span class="peta-pin__chip">' + p.name + '</span>'
        + '<span class="peta-pin__dot"></span><span class="peta-pin__stem"></span></span>';
      if (interactive) {
        b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { api.hot(p.slug); if (opt.onHover) opt.onHover(p.slug); } });
        b.addEventListener('pointerleave', function () { api.hot(null); if (opt.onHover) opt.onHover(null); });
        b.addEventListener('click', function () { if (opt.onSelect) opt.onSelect(p.slug, 'map'); });
        b.addEventListener('focus', function () { api.hot(p.slug); if (opt.onHover) opt.onHover(p.slug); });
        b.addEventListener('blur', function () { api.hot(null); if (opt.onHover) opt.onHover(null); });
      }
      pinsEl.appendChild(b); pins[p.slug] = b;
    });
    map.appendChild(pinsEl);
    if (!interactive) map.classList.add('peta--static');
    stage.appendChild(map);

    /* Resolusi: peta digambar R× lebih besar (R = faktor zoom) dan ditampilkan 1/R saat diam,
       sehingga saat zoom skalanya ≈ 1 dan tetap tajam. Lihat --R di peta-3d.css. */
    var zoomOf = function () { return typeof opt.zoom === 'function' ? opt.zoom() : (opt.zoom || 2.2); };
    var R = Math.max(1, Math.min(3, opt.res || zoomOf()));
    map.style.setProperty('--R', R);
    var REST = { tx: 0, ty: 0, k: 1 / R };
    var cam = REST;

    function setCam(c, instant) {
      cam = c;
      if (instant || (reduced && reduced.matches)) {
        map.classList.add('peta--instant');
        write();
        void map.offsetWidth;                 // terapkan tanpa transisi
        requestAnimationFrame(function () { map.classList.remove('peta--instant'); });
      } else write();
    }
    var free = false;   // true setelah zoom/geser manual: sync() tidak menarik kamera kembali ke provinsi
    var maxZoom = function () { return opt.maxZoom || R; };
    /* titik tengah stage relatif terhadap pusat peta (asal transform), px */
    function center() { return { x: stage.clientWidth / 2 - (map.offsetLeft + map.offsetWidth / 2), y: stage.clientHeight / 2 - (map.offsetTop + map.offsetHeight / 2) }; }
    function clampCam(c) {
      var mx = Math.max(0, (c.k * map.offsetWidth - stage.clientWidth) / 2 + stage.clientWidth * .2);
      var my = Math.max(0, (c.k * map.offsetHeight - stage.clientHeight) / 2 + stage.clientHeight * .2);
      return { tx: Math.max(-mx, Math.min(mx, c.tx)), ty: Math.max(-my, Math.min(my, c.ty)), k: c.k };
    }
    function write() {
      stage.classList.toggle('is-zoomed', cam.k > REST.k + 1e-4);
      if (opt.onZoom) opt.onZoom(cam.k / REST.k);
      map.style.setProperty('--tx', cam.tx.toFixed(2) + 'px');
      map.style.setProperty('--ty', cam.ty.toFixed(2) + 'px');
      map.style.setProperty('--k', cam.k.toFixed(4));
    }

    /* Hitung kamera agar kaki pin `slug` jatuh di titik tengah region (koordinat stage). */
    function solve(slug) {
      var pin = pins[slug]; if (!pin) return null;
      var cs = getComputedStyle(stage), ms = getComputedStyle(map);
      var P = px(cs.perspective) || 1700;
      var o = cs.perspectiveOrigin.split(' ').map(px);
      var rx = px(ms.getPropertyValue('--rx')) * Math.PI / 180;
      var W = map.offsetWidth, H = map.offsetHeight;
      var cx = map.offsetLeft + W / 2, cy = map.offsetTop + H / 2;
      var u = (pin._pos.x / 100 - 0.5) * W, v = (pin._pos.y / 100 - 0.5) * H;
      var r = opt.region ? opt.region() : { x: 0, y: 0, w: stage.clientWidth, h: stage.clientHeight };
      var k = zoomOf() / R;
      var Sx = r.x + r.w / 2, Sy = r.y + r.h / 2 + (opt.dotOffset || 28);   // titik pin ±28px (tiang 22 + ½ titik) di atas kaki
      var Z = k * v * Math.sin(rx), s = P / (P - Z);
      return {
        tx: o[0] + (Sx - o[0]) / s - cx - k * u,
        ty: o[1] + (Sy - o[1]) / s - cy - k * v * Math.cos(rx),
        k: k
      };
    }

    var api = {
      el: map, pins: pins, selected: null,
      focus: function (slug, o) {
        var c = solve(slug); if (!c) return;
        free = false;
        api.selected = slug;
        map.classList.add('has-sel');
        Object.keys(pins).forEach(function (s) { pins[s].classList.toggle('is-sel', s === slug); });
        setCam(c, o && o.instant);
      },
      reset: function (o) {
        api.selected = null;
        map.classList.remove('has-sel');
        Object.keys(pins).forEach(function (s) { pins[s].classList.remove('is-sel'); });
        setCam(REST, o && o.instant);
      },
      /* Pin sebagai kontrol (tombol HTML, bisa di-Tab) atau dekoratif (aria-hidden; halaman menyediakan daftar).
         label(p) → aria-label per pin; controls → id panel yang dibuka. */
      access: function (on, label, controls) {
        if (!interactive) return;
        if (on) pinsEl.removeAttribute('aria-hidden'); else pinsEl.setAttribute('aria-hidden', 'true');
        provs.forEach(function (p) {
          var b = pins[p.slug];
          b.tabIndex = on ? 0 : -1;
          if (on) { b.setAttribute('aria-label', label(p)); b.setAttribute('aria-expanded', String(api.selected === p.slug)); if (controls) b.setAttribute('aria-controls', controls); }
          else { b.removeAttribute('aria-label'); b.removeAttribute('aria-expanded'); b.removeAttribute('aria-controls'); }
        });
      },
      hot: function (slug) {
        Object.keys(pins).forEach(function (s) { pins[s].classList.toggle('is-hot', s === slug); });
      },
      /* Zoom bebas (tombol +/−) di sekitar titik tengah stage, dan geser (drag) saat diperbesar.
         Batas: skala diam (1/R) sampai --maxZoom × skala diam (default R, batas ketajaman raster). */
      zoomBy: function (f) {
        var kMin = REST.k, kMax = REST.k * maxZoom();
        var k2 = Math.max(kMin, Math.min(kMax, cam.k * f));
        if (Math.abs(k2 - cam.k) < 1e-4) return;
        free = true;
        if (k2 <= kMin + 1e-4) { setCam(REST); return; }
        var c = center(), r = k2 / cam.k;
        setCam(clampCam({ tx: c.x - r * (c.x - cam.tx), ty: c.y - r * (c.y - cam.ty), k: k2 }));
      },
      zoomReset: function () { free = true; setCam(REST); },
      zoomLevel: function () { return cam.k / REST.k; },
      canZoom: function (dir) { return dir > 0 ? cam.k < REST.k * maxZoom() - 1e-4 : cam.k > REST.k + 1e-4; },
      /* Hitung ulang posisi kamera (resize, perubahan tilt) tanpa animasi. */
      sync: function () { if (api.selected && !free) { var c = solve(api.selected); if (c) { cam = c; write(); } } }
    };

    setCam(REST, true);

    /* Geser peta dengan drag saat diperbesar (opsi pan). Klik pin setelah menggeser diabaikan. */
    if (opt.pan) {
      var drag = null, moved = false;
      stage.addEventListener('pointerdown', function (e) {
        if (cam.k <= REST.k + 1e-4 || e.button !== 0) return;
        drag = { x: e.clientX, y: e.clientY, tx: cam.tx, ty: cam.ty, id: e.pointerId }; moved = false;
      });
      stage.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        if (!moved) { moved = true; stage.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); map.classList.add('peta--instant'); }
        free = true; cam = clampCam({ tx: drag.tx + dx, ty: drag.ty + dy, k: cam.k }); write();
      });
      var end = function () { if (!drag) return; drag = null; stage.classList.remove('is-dragging'); map.classList.remove('peta--instant'); };
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      stage.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    }
    var rT;
    root.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (api.selected) api.focus(api.selected, { instant: true }); }, 120); });

    /* Pin muncul bergantian sekali saat peta terlihat */
    if (opt.popIn && 'IntersectionObserver' in root && !(reduced && reduced.matches)) {
      map.classList.add('pins-wait');
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        map.classList.add('pins-in'); requestAnimationFrame(function () { map.classList.remove('pins-wait'); });
        setTimeout(function () { map.classList.remove('pins-in'); }, 1800);
      }, { threshold: 0.35 });
      io.observe(map);
    }
    return api;
  }

  root.Peta3D = { mount: mount };
})(window);
