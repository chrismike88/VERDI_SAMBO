/* VERDI SAMBO — rules engine (aturan bisnis R1–R13).
 * Fungsi murni: tidak menyentuh DOM maupun penyimpanan, sehingga mudah diuji.
 * Kode status lama dipertahankan agar ekspor kompatibel dengan aplikasi asli.
 */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util;

  var FINAL = {
    sesuai_ai: { label: 'Sesuai (AI)', code: 'SESUAI AI', tone: 'ok', icon: 'check' },
    sesuai: { label: 'Sesuai', code: 'SESUAI', tone: 'ok', icon: 'check2' },
    tidak_sesuai: { label: 'Tidak sesuai', code: 'TIDAK SESUAI', tone: 'bad', icon: 'x' },
    rumah_tutup: { label: 'Rumah tutup', code: 'RUMAH TUTUP', tone: 'closed', icon: 'home' },
    periksa: { label: 'Periksa manual', code: 'PERIKSA / KOREKSI MANUAL', tone: 'check', icon: 'search' },
    ulang: { label: 'Minta foto ulang', code: 'MINTA FOTO ULANG', tone: 'retake', icon: 'camera' },
    menunggu: { label: 'Menunggu AI', code: 'MENUNGGU AI', tone: 'wait', icon: 'clock' },
    memproses: { label: 'Memproses', code: 'MEMPROSES', tone: 'wait', icon: 'spin' }
  };

  var DEFAULT_SETTINGS = {
    minBrightness: 45,
    minSharpness: 600,
    maxColorfulness: 60,
    minConfidence: 0.75,
    minAgree: 2,
    caterTolerance: 0,
    caterMismatchReview: true,
    radiusPelangganKm: 0.5,
    radiusKantorKm: 25,
    dupDistance: 6,
    periodReview: true,
    autoAdvance: true,
    workers: Math.max(1, Math.min(6, ((navigator.hardwareConcurrency || 4) - 1))),
    theme: 'auto',
    density: 'normal',
    ocrEnabled: false,
    verifikator: 'Verifikator ULP Samboja',
    offices: [
      { id: 'ulp-samboja', nama: 'ULP Samboja', level: 'ULP', lat: -1.0447, lon: 117.1150 },
      { id: 'up3-balikpapan', nama: 'UP3 Balikpapan', level: 'UP3', lat: -1.2650, lon: 116.8310 }
    ]
  };

  function num(v) {
    if (v == null || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function nearestOffice(lat, lon, offices) {
    var best = null;
    (offices || []).forEach(function (o) {
      var d = U.haversine(lat, lon, o.lat, o.lon);
      if (d != null && (!best || d < best.d)) best = { o: o, d: d };
    });
    return best;
  }

  /* ctx: { settings, period:{month,year}, dupMap } */
  function evaluate(row, ctx) {
    var S = Object.assign({}, DEFAULT_SETTINGS, ctx.settings || {});
    var ai = row.ai, v = row.verif || {}, period = ctx.period || {};
    var r = {
      kwh: 'BELUM DIPROSES', idpel: 'BELUM DIVERIFIKASI', sticker: 'BELUM_DIPERIKSA', stickerPeriod: null,
      statusAI: 'BELUM_DIPROSES', konsistensi: '—', cv: '-', aiVerif: 'MENUNGGU AI', final: 'menunggu',
      stanAI: null, stanFinal: null, conf: null, cater: null, jarakKm: null, rujukan: null, lokasi: null,
      warnings: [], checks: [], instruksi: 'Menunggu eksekusi proses AI.', dupWith: null, meterMatch: null, periodOk: null
    };

    if (row.stage === 'running') { r.aiVerif = 'MEMPROSES'; r.final = 'memproses'; r.cv = 'Analyzing'; r.instruksi = 'AI sedang menganalisis foto.'; }
    if (!row.photo) { r.instruksi = 'Foto belum dipasangkan dengan baris ini.'; }

    var reviewReasons = [];

    if (ai && ai.done) {
      // R1 kelayakan
      var g1 = ai.gate1 || { ok: true, reasons: [] };
      r.kwh = g1.ok ? 'VALID' : 'TIDAK LAYAK';
      r.cv = g1.ok ? (ai.stan && ai.stan.text ? 'READABLE' : 'TIDAK TERBACA') : 'TIDAK TERBACA';
      r.checks.push({ key: 'kwh', ok: g1.ok, label: g1.ok ? 'Foto layak meter' : 'Foto tidak layak', detail: g1.ok ? 'Kecerahan, ketajaman, dan layar LCD lolos pemeriksaan.' : g1.reasons.join(' ') });

      // R2 IDPEL: nama file = Excel; overlay 12 digit dibandingkan bila ada
      var ov = ai.overlay || {};
      var ovId = String(ov.idpel || '').replace(/\D/g, '');
      var fileId = row.photo ? row.photo.idpel : null;
      var idOk = fileId === row.idpel;
      var idDetail = 'Excel ' + row.idpel + ' = nama file ' + (fileId || '—');
      if (ovId.length === 12 && ovId !== row.idpel) { idOk = false; idDetail += '; stempel foto ' + ovId; }
      r.idpel = idOk ? 'MATCH' : 'MISMATCH';
      r.checks.push({ key: 'idpel', ok: idOk, label: idOk ? 'IDPEL cocok' : 'IDPEL tidak cocok', detail: idDetail });
      if (!idOk) reviewReasons.push('IDPEL foto berbeda dengan data Excel.');

      // R3 nama overlay
      if (ov.nama) {
        var sim = U.similarity(ov.nama, row.nama);
        r.namaSim = sim;
        if (sim < 0.85) r.warnings.push({ code: 'NAMA_BEDA', level: 'warn', text: 'Nama di stempel foto (' + ov.nama + ') berbeda dengan Excel.' });
      }

      // R4 nomor meter: overlay 11 digit (atau OCR pelat) vs master
      var meterSeen = ai.nomorMeterOcr || (ovId.length === 11 ? ovId : null);
      if (meterSeen && row.nomorMeter) {
        r.meterMatch = meterSeen === String(row.nomorMeter).replace(/\D/g, '');
        r.checks.push({ key: 'meter', ok: r.meterMatch, label: r.meterMatch ? 'Nomor meter cocok' : 'Nomor meter berbeda', detail: 'Foto ' + meterSeen + ' · master ' + row.nomorMeter });
        if (!r.meterMatch) reviewReasons.push('Nomor meter di foto berbeda dengan master.');
      }

      // R5 STAN
      if (ai.stan && ai.stan.text) {
        r.stanAI = ai.stan.text;
        r.conf = ai.stan.conf;
        var agreeOk = ai.stan.agree >= S.minAgree;
        r.konsistensi = agreeOk ? 'CONSISTENT' : 'INCONSISTENT';
        r.statusAI = agreeOk && ai.stan.conf >= S.minConfidence && ai.stan.text.indexOf('?') < 0 ? 'AI_CONFIDENT' : 'AI_UNCERTAIN';
      } else if (g1.ok) {
        r.statusAI = 'AI_UNCERTAIN'; r.konsistensi = ai.stan ? 'INCONSISTENT' : 'NOT_RUN';
      } else {
        r.konsistensi = 'NOT_RUN';
      }

      // R7 stiker
      if (ai.sticker) {
        r.sticker = ai.sticker.found ? 'ADA' : 'TIDAK TERIDENTIFIKASI';
        var sm = v.stickerMonth || ai.stickerMonth || null;
        var stDetail = ai.sticker.found ? 'Stiker petugas terdeteksi' : 'Tidak ada stiker petugas pada foto';
        if (ai.sticker.found && sm) {
          stDetail += ', ' + sm.label;
          r.stickerPeriod = sm.month === period.month && sm.year === period.year ? 'BULAN SESUAI' : 'BEDA PERIODE';
          if (r.stickerPeriod === 'BEDA PERIODE') r.warnings.push({ code: 'BEDA_PERIODE', level: 'warn', text: 'Stiker ' + sm.label + ' berbeda dengan periode ' + U.BULAN[period.month - 1] + ' ' + period.year + '.' });
        }
        r.checks.push({ key: 'stiker', ok: ai.sticker.found ? (r.stickerPeriod === 'BEDA PERIODE' ? 'warn' : true) : false, label: ai.sticker.found ? 'Stiker ada' : 'Stiker tidak teridentifikasi', detail: stDetail });
      }

      // R9 lokasi
      var plat = num(ov.lat != null ? ov.lat : (ai.exif && ai.exif.lat)), plon = num(ov.lon != null ? ov.lon : (ai.exif && ai.exif.lon));
      if (plat != null && plon != null) {
        var radius, ref;
        if (row.latRef != null && row.lonRef != null) {
          ref = { nama: 'Koordinat pelanggan (master)', lat: row.latRef, lon: row.lonRef, source: 'pelanggan' };
          radius = S.radiusPelangganKm;
        } else {
          var no = nearestOffice(plat, plon, S.offices);
          if (no) { ref = { nama: no.o.nama, lat: no.o.lat, lon: no.o.lon, source: 'kantor' }; radius = S.radiusKantorKm; }
        }
        if (ref) {
          r.jarakKm = U.haversine(plat, plon, ref.lat, ref.lon);
          r.rujukan = ref; r.radiusKm = radius; r.fotoLat = plat; r.fotoLon = plon;
          r.lokasi = r.jarakKm > radius ? 'JAUH' : 'DEKAT';
          var far = r.lokasi === 'JAUH';
          r.checks.push({
            key: 'lokasi', ok: far ? 'warn' : true, label: far ? 'Lokasi jauh — cek stiker' : 'Lokasi sesuai',
            detail: U.fmtNum(r.jarakKm, 2) + ' km dari ' + ref.nama + ' (ambang ' + radius + ' km)'
          });
          if (far && r.sticker !== 'ADA') reviewReasons.push('Lokasi foto jauh dari rujukan dan stiker tidak teridentifikasi.');
          if (far) r.warnings.push({ code: 'CEK_STIKER', level: 'warn', text: 'CEK STIKER (> ' + radius + ' km)' });
        }
      } else {
        r.lokasi = 'TANPA_KOORDINAT';
      }

      // R11 tanggal foto vs periode
      var ts = ov.tanggal ? U.parseStampDate(ov.tanggal) : (ai.exif && ai.exif.date ? ai.exif.date : null);
      if (ts && period.month) {
        var d = new Date(ts);
        r.fotoTanggal = ts;
        r.periodOk = d.getMonth() + 1 === period.month && d.getFullYear() === period.year;
        r.checks.push({ key: 'periode', ok: r.periodOk ? true : 'warn', label: r.periodOk ? 'Tanggal foto dalam periode' : 'Foto di luar periode', detail: U.fmtDateTime(ts) + ' · periode ' + U.BULAN[period.month - 1] + ' ' + period.year });
        if (!r.periodOk) {
          r.warnings.push({ code: 'FOTO_DI_LUAR_PERIODE', level: 'warn', text: 'Foto diambil ' + U.fmtDateTime(ts) + ', di luar periode.' });
          if (S.periodReview) reviewReasons.push('Foto diambil di luar periode.');
        }
      }

      // R12 duplikat
      if (ctx.dupMap && ctx.dupMap[row.id]) r.dupWith = ctx.dupMap[row.id];

      // keputusan AI (G8)
      if (!g1.ok) {
        r.aiVerif = 'MINTA FOTO ULANG'; r.final = 'ulang';
        r.instruksi = 'Foto tidak layak: ' + g1.reasons.join(' ') + ' Minta petugas mengambil foto ulang.';
      } else if (r.dupWith) {
        r.aiVerif = 'MINTA FOTO ULANG'; r.final = 'ulang';
        r.instruksi = 'Foto sama dengan IDPEL ' + r.dupWith + '. Kemungkinan foto daur ulang — minta foto ulang.';
        r.checks.push({ key: 'dup', ok: false, label: 'Foto duplikat', detail: 'Sangat mirip dengan foto IDPEL ' + r.dupWith });
      } else {
        // R8 cater
        var stanNum = r.stanAI != null ? Number(r.stanAI) : null;
        if (row.stanCater != null && stanNum != null && !isNaN(stanNum) && r.statusAI === 'AI_CONFIDENT') {
          var diff = Math.abs(stanNum - row.stanCater);
          if (diff > S.caterTolerance && S.caterMismatchReview) reviewReasons.push('STAN AI (' + r.stanAI + ') berbeda ' + U.fmtNum(diff, 2) + ' dengan STAN cater (' + row.stanCater + ').');
        }
        if (r.statusAI === 'AI_CONFIDENT' && !reviewReasons.length) {
          r.aiVerif = 'SESUAI AI'; r.final = 'sesuai_ai';
          r.instruksi = 'AI berhasil membaca angka meter dengan hasil yang konsisten.';
        } else {
          r.aiVerif = 'PERIKSA / KOREKSI MANUAL'; r.final = 'periksa';
          r.instruksi = r.statusAI !== 'AI_CONFIDENT'
            ? 'Foto layak, tetapi AI tidak dapat memastikan angka meter. Silakan lakukan pemeriksaan manual.'
            : reviewReasons.join(' ');
          if (r.statusAI !== 'AI_CONFIDENT' && reviewReasons.length) r.instruksi += ' ' + reviewReasons.join(' ');
        }
      }
      r.reviewReasons = reviewReasons;
    }

    // R13 keputusan manual menimpa status AI
    if (v.keputusan) {
      r.final = { SESUAI: 'sesuai', TIDAK_SESUAI: 'tidak_sesuai', RUMAH_TUTUP: 'rumah_tutup' }[v.keputusan] || r.final;
    }
    r.stanFinal = v.stanManual != null && v.stanManual !== '' ? String(v.stanManual) : (r.stanAI && r.stanAI.indexOf('?') < 0 ? r.stanAI : null);

    // R8 perbandingan cater
    if (r.stanFinal != null && v.keputusan !== 'RUMAH_TUTUP') {
      if (row.stanCater == null) r.cater = 'TANPA_PEMBANDING';
      else r.cater = Math.abs(Number(r.stanFinal) - row.stanCater) <= S.caterTolerance ? 'SESUAI' : 'TIDAK_SESUAI';
    }
    return r;
  }

  /* R12: pasangkan foto yang sangat mirip (pHash) dalam satu batch */
  function computeDuplicates(rows, maxDist) {
    var map = {}, list = [];
    var withHash = rows.filter(function (r) { return r.ai && r.ai.phash; });
    for (var i = 0; i < withHash.length; i++) for (var j = i + 1; j < withHash.length; j++) {
      var d = VS.cv.hamming(withHash[i].ai.phash, withHash[j].ai.phash);
      if (d <= maxDist && (!withHash[i].ai.sig || !withHash[j].ai.sig || VS.cv.sigDiff(withHash[i].ai.sig, withHash[j].ai.sig) <= 12)) {
        var a = withHash[i], b = withHash[j];
        // baris dengan nomor urut lebih besar dianggap salinan
        var later = a.no > b.no ? a : b, first = later === a ? b : a;
        map[later.id] = first.idpel;
        list.push({ a: first, b: later, dist: d });
      }
    }
    return { map: map, list: list };
  }

  function stats(rows, evals) {
    var s = { total: rows.length, sesuai_ai: 0, sesuai: 0, tidak_sesuai: 0, rumah_tutup: 0, periksa: 0, ulang: 0, menunggu: 0, memproses: 0, aiSukses: 0, caterSesuai: 0, caterTidak: 0, caterTanpa: 0, processed: 0 };
    rows.forEach(function (r) {
      var e = evals[r.id]; if (!e) return;
      s[e.final]++;
      if (e.aiVerif === 'SESUAI AI') s.aiSukses++;
      if (r.ai && r.ai.done) s.processed++;
      if (e.cater === 'SESUAI') s.caterSesuai++;
      else if (e.cater === 'TIDAK_SESUAI') s.caterTidak++;
      else if (e.cater === 'TANPA_PEMBANDING') s.caterTanpa++;
    });
    s.valid = s.sesuai_ai + s.sesuai;
    s.tidakValid = s.tidak_sesuai;
    s.review = s.periksa + s.ulang;
    s.belum = s.menunggu + s.memproses;
    return s;
  }

  VS.rules = { evaluate: evaluate, computeDuplicates: computeDuplicates, stats: stats, FINAL: FINAL, DEFAULT_SETTINGS: DEFAULT_SETTINGS, num: num };
})();
