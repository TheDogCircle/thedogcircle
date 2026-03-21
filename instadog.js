/**
 * =====================================================
 *  THE DOG CIRCLE — Module Instadog
 *  Fichier : instadog.js
 *  Tables  : photos · Storage bucket: photos
 *  Écoute  : TDC:login · TDC:tab(feed)
 * =====================================================
 */
(function () {

  var likes = {};

  document.addEventListener('TDC:login', function () {
    injectUploadUI();
    loadFeed();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'feed') loadFeed();
  });

  // ── Bouton + modal upload ────────────────────────────
  function injectUploadUI() {
    var sec = document.getElementById('tc-feed');
    if (!sec || document.getElementById('btn-publier')) return;

    // Bouton
    var btn = document.createElement('button');
    btn.id = 'btn-publier';
    btn.className = 'btn btn-p';
    btn.style = 'font-size:13px;margin-bottom:20px;';
    btn.textContent = '📸 Publier une photo';
    btn.addEventListener('click', function () {
      document.getElementById('modal-instadog').style.display = 'flex';
    });
    sec.insertBefore(btn, document.getElementById('feedGrid'));

    // Modal
    var modal = document.createElement('div');
    modal.id = 'modal-instadog';
    modal.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML =
      '<div style="background:var(--w);border-radius:20px;padding:28px;width:100%;max-width:440px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:20px;">📸 Publier une photo</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Photo de ton chien</label>'
          + '<input type="file" id="insta-file" accept="image/*" style="width:100%;font-size:13px;">'
        + '</div>'
        + '<div id="insta-preview" style="display:none;margin-bottom:14px;border-radius:12px;overflow:hidden;height:160px;">'
          + '<img id="insta-img" style="width:100%;height:160px;object-fit:cover;" src="" alt="">'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Prénom de ton chien</label>'
          + '<input type="text" id="insta-chien" placeholder="Ex: Noisette" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Légende</label>'
          + '<input type="text" id="insta-cap" placeholder="Ex: Balade matinale 🌿" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div id="insta-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
          + '<button id="insta-cancel" style="padding:9px 18px;border-radius:8px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:13px;cursor:pointer;">Annuler</button>'
          + '<button id="insta-submit" style="padding:9px 18px;border-radius:8px;background:var(--green);color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;">Publier 🐾</button>'
        + '</div>'
      + '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.getElementById('insta-cancel').addEventListener('click', closeModal);
    document.getElementById('insta-file').addEventListener('change', previewPhoto);
    document.getElementById('insta-submit').addEventListener('click', uploadPhoto);
  }

  function closeModal() {
    document.getElementById('modal-instadog').style.display = 'none';
    document.getElementById('insta-file').value  = '';
    document.getElementById('insta-chien').value = '';
    document.getElementById('insta-cap').value   = '';
    document.getElementById('insta-preview').style.display = 'none';
    document.getElementById('insta-err').style.display     = 'none';
  }

  function previewPhoto() {
    var file = document.getElementById('insta-file').files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('insta-img').src = e.target.result;
      document.getElementById('insta-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  // ── Upload ───────────────────────────────────────────
  async function uploadPhoto() {
    var db    = window.TDC.db;
    var file  = document.getElementById('insta-file').files[0];
    var chien = document.getElementById('insta-chien').value.trim();
    var cap   = document.getElementById('insta-cap').value.trim();
    var err   = document.getElementById('insta-err');
    var btn   = document.getElementById('insta-submit');

    err.style.display = 'none';
    if (!file)  { err.textContent = 'Choisis une photo.'; err.style.display = 'block'; return; }
    if (!chien) { err.textContent = 'Indique le prénom de ton chien.'; err.style.display = 'block'; return; }

    btn.textContent = 'Envoi en cours...';
    btn.disabled    = true;

    try {
      // 1. Upload Storage
      var ext      = file.name.split('.').pop().toLowerCase();
      var fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
      var up = await db.storage.from('photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (up.error) throw up.error;

      // 2. URL publique
      var publicUrl = db.storage.from('photos').getPublicUrl(fileName).data.publicUrl;

      // 3. Insert en base
      var ins = await db.from('photos').insert([{
        membre_email:  window.TDC.userEmail,
        membre_prenom: window.TDC.userPrenom,
        chien:         chien,
        caption:       cap,
        photo_url:     publicUrl,
        statut:        'en_attente'
      }]);
      if (ins.error) throw ins.error;

      closeModal();
      toast('Photo envoyée ! Elle sera publiée après validation 🐾');
      loadFeed();

    } catch (e) {
      err.textContent   = 'Erreur : ' + (e.message || 'réessaie');
      err.style.display = 'block';
    }

    btn.textContent = 'Publier 🐾';
    btn.disabled    = false;
  }

  // ── Feed ─────────────────────────────────────────────
  function loadFeed() {
    var g = document.getElementById('feedGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db
      .from('photos')
      .select('*')
      .eq('statut', 'valide')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucune photo pour le moment 🐾<br><small style="color:var(--t3);">Sois le premier à publier !</small></div>';
          return;
        }
        g.innerHTML = res.data.map(function (p) {
          var media = p.photo_url
            ? '<img src="' + p.photo_url + '" style="width:100%;height:160px;object-fit:cover;" alt="' + (p.chien || '') + '" loading="lazy">'
            : '<div class="feed-photo" style="background:' + (p.bg_color || '#C8DEB8') + '">' + (p.emoji || '🐾') + '</div>';
          return '<div class="feed-card">'
            + media
            + '<div class="feed-info">'
              + '<div class="feed-dog">' + (p.chien || 'Mon chien') + '</div>'
              + '<div class="feed-meta">' + (p.membre_prenom || '') + (p.ville ? ' · ' + p.ville : '') + '</div>'
              + '<div class="feed-cap">' + (p.caption || '') + '</div>'
              + '<span class="feed-like" data-id="' + p.id + '" data-lk="' + (p.likes || 0) + '">♡ ' + (p.likes || 0) + '</span>'
            + '</div></div>';
        }).join('');

        g.addEventListener('click', function (e) {
          var el = e.target.closest('.feed-like');
          if (!el) return;
          var id = el.dataset.id; var base = parseInt(el.dataset.lk);
          if (likes[id]) { el.textContent = '♡ ' + base; el.style.color = ''; delete likes[id]; }
          else           { el.textContent = '♥ ' + (base + 1); el.style.color = '#dc2626'; likes[id] = 1; }
        });
      });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style = 'position:fixed;bottom:24px;right:24px;background:var(--green);color:var(--cream);padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

})();
