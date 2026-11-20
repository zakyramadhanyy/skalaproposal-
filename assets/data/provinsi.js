/* =============================================================================
   DATA PROVINSI — sumber tunggal untuk section peta (Beranda), /wilayah/, dan /wilayah/<slug>/.
   Strukturnya sama dengan interface `Province` di docs/plans/wilayah.md, jadi bisa dipindah ke CMS
   (WordPress/WPGraphQL) tanpa mengubah komponen.

   CARA MENGEDIT
   - Tambah/ubah provinsi: edit array PROVINSI di bawah. `slug` dipakai di URL, jangan diganti setelah tayang.
   - Posisi pin: isi `lat`/`lon` (derajat desimal). Konversi ke peta dilakukan projectToMap().
   - Teks yang belum ada: biarkan berawalan "[" (mis. "[Ringkasan program]"). Halaman menandainya
     sebagai placeholder dan tidak menganggapnya data.
   - Foto: isi `photo` dengan path gambar. Kosong → placeholder duotone.

   ASAL DATA
   - Nama, kategori, dan urutan: peta wilayah di skala.or.id (12 provinsi).
   - `summary` 6 provinsi pertama: teks sorotan dari peta skala.or.id (sumber: situs klien).
   - `summary` 6 provinsi Papua: dari berita/profil skala.or.id (2026-11-17). Stat & fokus: lihat FAKTA/FOKUS di bawah.
   - Kabupaten mitra, cerita, publikasi per provinsi: BELUM ADA → placeholder (hanya di halaman profil, tidak di beranda).
   - lat/lon: perkiraan titik pusat/ibu kota, PERLU DIKONFIRMASI klien. 6 nilai pertama dari brief,
     6 Papua/Maluku dibalik dari posisi pin di peta skala.or.id.
   ============================================================================= */
(function (root) {
  'use strict';

  /**
   * @typedef {'utama'|'tambahan'} ProvinceCategory
   * @typedef {{label:string, value:string}} Stat
   * @typedef {{title:string, description:string}} FocusArea
   * @typedef {{title:string, date:string, url:string}} Story
   * @typedef {{title:string, type:string, cover?:string, url:string}} Publication
   * @typedef {{
   *   slug:string, name:string, category:ProvinceCategory, lat:number, lon:number,
   *   summary:string, photo?:string, stats:Stat[], focusAreas:FocusArea[],
   *   partnerRegencies:string[], stories:Story[], publications:Publication[]
   * }} Province
   */

  /* FAKTA PER PROVINSI (diperiksa 2026-11-17) — menggantikan statistik & fokus dummy.
     · Kantor SKALA dan fokus program: halaman "Sekilas: Program SKALA di …" di skala.or.id/profil-provinsi/
       (Aceh Jan 2023, NTB Mei 2023, NTT Mei 2023, Maluku Sep 2023, Kaltara Okt 2023, Gorontalo Okt 2023;
       Tanah Papua: kantor di Provinsi Papua beroperasi sejak 2022 dan melayani keenam provinsi Papua).
     · Ibu kota dan tahun pembentukan provinsi: undang-undang pembentukan (Aceh UU 24/1956, Maluku 1945, NTB & NTT UU 64/1958,
       Gorontalo UU 38/2000, Kaltara UU 20/2012, Papua 1969, Papua Barat UU 45/1999, Papua Selatan/Tengah/Pegunungan 2022,
       Papua Barat Daya UU 29/2022).
     · Jumlah kab/kota mitra dan program aktif TIDAK dipublikasikan SKALA, sehingga tidak ditampilkan. */
  var FAKTA = {
    'aceh':                { ibu: 'Banda Aceh',    bentuk: '1956', kantor: 'Jan 2023' },
    'kalimantan-utara':    { ibu: 'Tanjung Selor', bentuk: '2012', kantor: 'Okt 2023' },
    'gorontalo':           { ibu: 'Gorontalo',     bentuk: '2000', kantor: 'Okt 2023' },
    'nusa-tenggara-barat': { ibu: 'Mataram',       bentuk: '1958', kantor: 'Mei 2023' },
    'nusa-tenggara-timur': { ibu: 'Kupang',        bentuk: '1958', kantor: 'Mei 2023' },
    'maluku':              { ibu: 'Ambon',         bentuk: '1945', kantor: 'Sep 2023' },
    'papua-barat-daya':    { ibu: 'Sorong',        bentuk: '2022', kantor: '2022', papua: true },
    'papua-barat':         { ibu: 'Manokwari',     bentuk: '1999', kantor: '2022', papua: true },
    'papua-tengah':        { ibu: 'Nabire',        bentuk: '2022', kantor: '2022', papua: true },
    'papua-pegunungan':    { ibu: 'Wamena',        bentuk: '2022', kantor: '2022', papua: true },
    'papua':               { ibu: 'Jayapura',      bentuk: '1969', kantor: '2022', papua: true },
    'papua-selatan':       { ibu: 'Merauke',       bentuk: '2022', kantor: '2022', papua: true }
  };
  /* Empat bidang yang tercantum di profil setiap provinsi (skala.or.id/profil-provinsi/) */
  var FOKUS = [
    { title: 'Partisipasi kelompok rentan', description: 'Memperkuat partisipasi kelompok rentan dalam perencanaan pembangunan.' },
    { title: 'Data dan analisis', description: 'Penyediaan dan pemanfaatan data serta analisis yang andal untuk kebijakan.' },
    { title: 'Kapasitas fiskal daerah', description: 'Meningkatkan kapasitas fiskal pemerintah daerah.' },
    { title: 'Kualitas belanja publik', description: 'Memperkuat kualitas belanja publik untuk layanan dasar.' }
  ];
  function stats(slug) {
    var f = FAKTA[slug];
    return [
      { label: 'Ibu kota', value: f.ibu },
      { label: 'Provinsi dibentuk', value: f.bentuk },
      { label: f.papua ? 'Kantor Tanah Papua' : 'Kantor SKALA', value: f.kantor }
    ];
  }
  function focusAreas() { return FOKUS.map(function (f) { return { title: f.title, description: f.description }; }); }
  function stories() {
    return [
      { title: '[Judul cerita lapangan]', date: '[Tanggal]', url: '#' },
      { title: '[Judul cerita lapangan]', date: '[Tanggal]', url: '#' }
    ];
  }
  function publications() {
    return [
      { title: '[Judul publikasi]', type: '[Jenis]', url: '#' },
      { title: '[Judul publikasi]', type: '[Jenis]', url: '#' },
      { title: '[Judul publikasi]', type: '[Jenis]', url: '#' }
    ];
  }
  function p(slug, name, category, lat, lon, summary) {
    var o = {
      slug: slug, name: name, category: category, lat: lat, lon: lon, summary: summary,
      photo: '', stats: stats(slug), focusAreas: focusAreas(),
      partnerRegencies: ['[Kabupaten/kota mitra]', '[Kabupaten/kota mitra]', '[Kabupaten/kota mitra]'],
      stories: stories(), publications: publications()
    };
    return o;
  }

  /** @type {Province[]} */
  var PROVINSI = [
    p('aceh', 'Aceh', 'utama', 4.9, 95.9, 'Data capaian layanan dasar (SPM) tersedia dan dapat diakses publik melalui dasbor aplikasi PINTU.'),
    p('kalimantan-utara', 'Kalimantan Utara', 'tambahan', 3.0, 116.6, 'Alokasi SPM naik dari Rp142,5 miliar (2024) menjadi Rp293,4 miliar (2025).'),
    p('gorontalo', 'Gorontalo', 'utama', 0.65, 122.5, 'Korbinwas provinsi di Boalemo memperkuat sinergi provinsi–kabupaten untuk infrastruktur dan pendidikan.'),
    p('nusa-tenggara-barat', 'Nusa Tenggara Barat', 'tambahan', -8.65, 116.4, 'Peningkatan anggaran SPM memperkuat layanan infrastruktur, perumahan, dan ketertiban.'),
    p('nusa-tenggara-timur', 'Nusa Tenggara Timur', 'utama', -8.7, 121.6, 'Korbinwas berbasis klaster mempercepat implementasi SPM.'),
    p('maluku', 'Maluku', 'utama', -3.23, 130.15, 'Keterisian pelaporan e-SPM meningkat hingga 98 persen.'),
    p('papua-barat-daya', 'Papua Barat Daya', 'utama', -0.89, 131.29, 'Portal Cenderawasih diluncurkan untuk memperkuat perencanaan pembangunan dan layanan dasar.'),
    p('papua-barat', 'Papua Barat', 'utama', -0.85, 134.03, 'Portal data SAIK+ dan SIDASSKEN menjadi rujukan data pembangunan bersama pemerintah provinsi.'),
    p('papua-tengah', 'Papua Tengah', 'utama', -3.7, 136.21, 'Bagian dari program SKALA di Tanah Papua untuk memperkuat partisipasi kelompok rentan dalam perencanaan.'),
    p('papua-pegunungan', 'Papua Pegunungan', 'utama', -4.29, 139.0, 'Bagian dari program SKALA di Tanah Papua, enam provinsi yang dibentuk bertahap pada 1969–2022.'),
    p('papua', 'Papua', 'utama', -2.6, 139.8, 'Kantor SKALA di Provinsi Papua beroperasi sejak 2022; portal SIOPAPUA menjadi rujukan data pembangunan.'),
    p('papua-selatan', 'Papua Selatan', 'utama', -7.3, 139.6, 'Penguatan data dan perlindungan sosial bagi Orang Asli Papua.')
  ];

  /* Foto per provinsi — HANYA yang konteksnya akurat (lokasi di provinsi itu / kegiatan di provinsi itu).
     Semua 12 provinsi kini punya foto. Jangan ganti dengan foto yang tidak sesuai lokasinya.
     Sumber, lisensi, dan atribusi: kredit-foto.html + docs/content/kredit-foto.md */
  var FOTO = {
    'nusa-tenggara-timur': { photo: 'assets/img/prov-ntt-960.webp', pos: '50% 55%', alt: 'Teluk biru dan perbukitan savana di Gili Laba, Flores, Nusa Tenggara Timur' },
    'nusa-tenggara-barat': { photo: 'assets/img/kegiatan-ntb-1000.webp', pos: '50% 55%', alt: 'Peluncuran Dashboard Eksekutif Provinsi Nusa Tenggara Barat di sebuah aula, dengan penampilan tari dan pejabat daerah' },
    'maluku': { photo: 'assets/img/sampul-maluku-800.webp', pos: '50% 70%', alt: 'Foto udara perahu di perairan kepulauan Maluku, dari sampul buklet SPM Maluku' },
    'papua-barat-daya': { photo: 'assets/img/kegiatan-papua-barat-daya-1000.webp', pos: '50% 40%', alt: 'Pejabat daerah dan mitra berfoto bersama pada peluncuran Portal Cenderawasih di Papua Barat Daya' },
    'papua-selatan': { photo: 'assets/img/kegiatan-papua-selatan-1000.webp', pos: '50% 45%', alt: 'Pejabat daerah dan mitra pada peluncuran dan pelatihan portal data daerah di Papua Selatan' },
    'aceh': { photo: 'assets/img/prov-aceh-960.webp', pos: '50% 40%', alt: 'Pandangan udara Kota Singkil di Kabupaten Aceh Singkil, Aceh: jalan utama, masjid, dan permukiman' },
    'kalimantan-utara': { photo: 'assets/img/prov-kaltara-960.webp', pos: '50% 55%', alt: 'Rumah adat Baloy Mayo suku Tidung di Kalimantan Utara dengan bendera merah putih' },
    'gorontalo': { photo: 'assets/img/prov-gorontalo-960.webp', pos: '50% 75%', alt: 'Perahu nelayan berwarna jingga dan biru di tepi Danau Limboto, Gorontalo' },
    'papua-barat': { photo: 'assets/img/prov-papua-barat-960.webp', pos: '50% 72%', alt: 'Pantai Syornabo di Pulau Mansinam, Manokwari, Papua Barat' },
    'papua-tengah': { photo: 'assets/img/prov-papua-tengah-960.webp', pos: '50% 88%', alt: 'Puncak berbatu dan bersalju Cartenz di Pegunungan Tengah Papua' },
    'papua': { photo: 'assets/img/prov-papua-960.webp', pos: '50% 60%', alt: 'Jembatan Youtefa berwarna merah di Jayapura, Papua' },
    'papua-pegunungan': { photo: 'assets/img/prov-papua-pegunungan-960.webp', pos: '50% 55%', alt: 'Tampungan air pembangkit listrik mikrohidro dan Sungai Uwe dengan latar pegunungan di sekitar Wamena' }
  };
  PROVINSI.forEach(function (pr) { var f = FOTO[pr.slug]; if (f) { pr.photo = f.photo; pr.photoPos = f.pos; pr.photoAlt = f.alt; } });

  /* Proyeksi peta: path Natural Earth digambar ekuirektangular pada viewBox 1000×381,
     batas lon 94.3–141.6 dan lat 6.6 s.d. −11.4 (rasio 47.3 : 18 = 1000 : 381).
     Hasil dalam persen terhadap lebar/tinggi peta. Kalibrasi: lihat docs/plans/wilayah.md §1. */
  var BOUNDS = { lonMin: 94.3, lonMax: 141.6, latMax: 6.6, latMin: -11.4 };
  function projectToMap(lat, lon) {
    return {
      x: (lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin) * 100,
      y: (BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin) * 100
    };
  }

  /* String antarmuka (CLAUDE.md §4: tidak ada teks hard-coded). Prototipe merender `id`;
     `en` diisi saat port ke Next.js (next-intl). */
  var STR = {
    id: {
      cat: { utama: 'Lokasi intervensi utama', tambahan: 'Lokasi intervensi tambahan' },
      eyebrow: 'Wilayah kerja',
      title: 'Wilayah Kerja SKALA',
      sub: 'Pilih provinsi untuk melihat fokus program di wilayah tersebut.',
      explore: 'Jelajahi wilayah kerja',
      count: '12 Provinsi',
      showAll: 'Lihat semua',
      focusLabel: 'Fokus program',
      profile: 'Lihat profil provinsi',
      profileShort: 'Lihat profil',
      prev: 'Provinsi sebelumnya',
      next: 'Provinsi berikutnya',
      close: 'Tutup detail provinsi',
      photo: 'Foto',
      mapLabel: 'Peta Indonesia tiga dimensi dengan 12 provinsi wilayah kerja SKALA.',
      listLabel: 'Daftar provinsi wilayah kerja',
      selected: function (n) { return n + ' dipilih. Detail provinsi ditampilkan.'; },
      reset: 'Peta kembali menampilkan semua provinsi.',
      back: 'Kembali ke peta',
      crumb: 'Wilayah Kerja',
      home: 'Beranda',
      listH1: '12 provinsi wilayah kerja SKALA',
      listIntro: '[Paragraf pengantar halaman wilayah kerja]',
      search: 'Cari provinsi',
      searchPh: 'Ketik nama provinsi',
      all: 'Semua',
      empty: 'Tidak ada provinsi yang cocok dengan pencarian Anda.',
      results: function (n) { return n + ' provinsi ditampilkan'; },
      viewProgram: 'Lihat program',
      relatedPubs: 'Publikasi terkait',
      allPubs: 'Semua publikasi',
      about: 'Tentang wilayah ini',
      tabs: { ringkasan: 'Ringkasan', fokus: 'Fokus program', cerita: 'Cerita lapangan' },
      partners: 'Kabupaten/kota mitra',
      overview: '[Paragraf ringkasan konteks provinsi, tantangan layanan dasar, dan peran SKALA]',
      allProv: 'Lihat semua provinsi',
      notFound: 'Provinsi tidak ditemukan.',
      placeholder: 'Konten menunggu data klien',
      zoomIn: 'Perbesar peta', zoomOut: 'Perkecil peta', zoomFit: 'Tampilkan seluruh peta',
      /* Nama geografi pada peta beranda (opsi `detail` Peta3D) */
      geo: {
        sea: { hindia: 'Samudra Hindia', pasifik: 'Samudra Pasifik', cina: 'Laut Cina Selatan', jawa: 'Laut Jawa', makassar: 'Selat Makassar',
               sulawesi: 'Laut Sulawesi', flores: 'Laut Flores', banda: 'Laut Banda', arafura: 'Laut Arafura' },
        land: { sumatra: 'Sumatra', kalimantan: 'Kalimantan', jawa: 'Jawa', sulawesi: 'Sulawesi', papua: 'Papua' },
        n: 'LU', s: 'LS', e: 'BT', eq: 'Khatulistiwa', km: 'km'
      }
    },
    en: {
      cat: { utama: 'Main intervention site', tambahan: 'Additional intervention site' },
      eyebrow: 'Where we work', title: 'Where SKALA works',
      sub: 'Select a province to see the programme focus in that area.',
      explore: 'Explore where we work', count: '12 Provinces', showAll: 'Show all',
      focusLabel: 'Programme focus', profile: 'View province profile', profileShort: 'View profile',
      prev: 'Previous province', next: 'Next province', close: 'Close province details', photo: 'Photo',
      mapLabel: 'Three-dimensional map of Indonesia showing SKALA’s 12 provinces.',
      listLabel: 'List of provinces', back: 'Back to map', crumb: 'Where We Work', home: 'Home',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomFit: 'Show the whole map',
      geo: {
        sea: { hindia: 'Indian Ocean', pasifik: 'Pacific Ocean', cina: 'South China Sea', jawa: 'Java Sea', makassar: 'Makassar Strait',
               sulawesi: 'Celebes Sea', flores: 'Flores Sea', banda: 'Banda Sea', arafura: 'Arafura Sea' },
        land: { sumatra: 'Sumatra', kalimantan: 'Borneo', jawa: 'Java', sulawesi: 'Sulawesi', papua: 'Papua' },
        n: 'N', s: 'S', e: 'E', eq: 'Equator', km: 'km'
      }
      /* sisanya diisi saat port Next.js */
    }
  };

  /* Posisi label geografi (perkiraan titik tengah perairan/pulau; rot = derajat searah jarum jam di layar).
     Nama diambil dari STR.<lang>.geo. */
  var GEO = {
    sea: [
      { k: 'hindia', lat: -9.4, lon: 101.6, rot: 22, big: true },
      { k: 'pasifik', lat: 3.6, lon: 135.2, rot: 0, big: true },
      { k: 'cina', lat: 5.7, lon: 110.6, rot: 0 },
      { k: 'jawa', lat: -5.1, lon: 111.0, rot: 0 },
      { k: 'makassar', lat: -1.6, lon: 118.15, rot: -78 },
      { k: 'sulawesi', lat: 3.1, lon: 122.4, rot: 0 },
      { k: 'flores', lat: -6.9, lon: 118.9, rot: 0 },
      { k: 'banda', lat: -5.7, lon: 127.8, rot: 0 },
      { k: 'arafura', lat: -9.7, lon: 135.4, rot: -8 }
    ],
    land: [
      { k: 'sumatra', lat: -0.2, lon: 101.4, rot: 46 },
      { k: 'kalimantan', lat: 0.4, lon: 113.6, rot: 0 },
      { k: 'jawa', lat: -7.25, lon: 110.1, rot: 7 },
      { k: 'sulawesi', lat: -2.6, lon: 120.35, rot: -72 },
      { k: 'papua', lat: -5.7, lon: 140.0, rot: 0 }
    ]
  };

  root.SKALA_WILAYAH = {
    geo: GEO,
    provinces: PROVINSI,
    projectToMap: projectToMap,
    str: STR.id,
    strings: STR,
    bySlug: function (slug) { for (var i = 0; i < PROVINSI.length; i++) if (PROVINSI[i].slug === slug) return PROVINSI[i]; return null; },
    isPlaceholder: function (s) { return typeof s === 'string' && s.charAt(0) === '['; },
    profileUrl: function (slug) { return 'https://skalavibes.vercel.app/wilayah-provinsi.html?p=' + encodeURIComponent(slug); },
    listUrl: 'https://skalavibes.vercel.app/wilayah.html',
    mapUrl: 'index.html#wilayah'
  };
})(window);
