/**
 * =====================================================
 *  THE DOG CIRCLE — Module Instadog
 *  Fichier : instadog.js
 *  Tables  : photos · Storage bucket: Photos
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

    var btn = document.createElement('button');
    btn.id = 'btn-publier';
    btn.className = 'btn btn-p';
    btn.style = 'font-size:13px;margin-bottom:20px;';
    btn.textContent = '📸 Publier une photo';
    btn.addEventListener('click', function () {
      document.getElementById('modal-instadog').style.display = 'flex';
    });
    sec.insertBefore(btn, document.getElementById('feedGrid'));

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
      var up = await db.storage.from('Photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (up.error) throw up.error;

      // 2. URL publique
      var publicUrl = db.storage.from('Photos').getPublicUrl(fileName).data.publicUrl;

      // 3. Insert en base — statut 'valide' directement, pas de modération
      var ins = await db.from('photos').insert([{
        membre_email:  window.TDC.userEmail,
        membre_prenom: window.TDC.userPrenom,
        chien:         chien,
        caption:       cap,
        photo_url:     publicUrl,
        statut:        'valide'
      }]);
      if (ins.error) throw ins.error;

      closeModal();
      toast('Photo publiée ! 🐾');
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
            ? '<div style="width:100%;aspect-ratio:4/5;overflow:hidden;"><img src="' + p.photo_url + '" style="width:100%;height:100%;object-fit:cover;" alt="' + (p.chien || '') + '" loading="lazy"></div>'
            : '<div class="feed-photo" style="aspect-ratio:4/5;background:' + (p.bg_color || '#C8DEB8') + '">' + (p.emoji || '🐾') + '</div>';
          var isLiked   = likes[p.id];
          var likeCount = (p.likes || 0) + (isLiked ? 1 : 0);
          return '<div class="feed-card">'
            + media
            + '<div class="feed-info">'
              + '<div class="feed-dog">' + (p.chien || 'Mon chien') + '</div>'
              + '<div class="feed-meta">' + (p.membre_prenom || '') + (p.ville ? ' · ' + p.ville : '') + '</div>'
              + '<div class="feed-cap">' + (p.caption || '') + '</div>'
              + '<div style="display:flex;align-items:center;gap:12px;margin-top:6px;">'
                + '<span class="feed-like" data-id="' + p.id + '" data-lk="' + (p.likes || 0) + '" style="cursor:pointer;font-size:16px;transition:transform .2s;display:flex;align-items:center;gap:4px;">'
                  + '<span style="font-size:18px;">' + (isLiked ? '🦴' : '🩶') + '</span>'
                  + '<span style="font-size:12px;color:var(--t3);">' + likeCount + '</span>'
                + '</span>'
                + '<span class="feed-comment-btn" data-id="' + p.id + '" data-chien="' + (p.chien||'') + '" style="cursor:pointer;font-size:13px;color:var(--t3);display:flex;align-items:center;gap:4px;">'
                  + '💬 <span id="cmt-count-' + p.id + '" style="font-size:12px;">0</span>'
                + '</span>'
              + '</div>'
              + '<div id="cmt-section-' + p.id + '" style="display:none;margin-top:10px;"></div>'
            + '</div></div>';
        }).join('');

        // Charger les compteurs de commentaires
        res.data.forEach(function(p) { loadCommentCount(p.id); });

        g.addEventListener('click', function (e) {
          // Like avec os
          var likeEl = e.target.closest('.feed-like');
          if (likeEl) {
            var id   = likeEl.dataset.id;
            var base = parseInt(likeEl.dataset.lk);
            var boneEl = likeEl.querySelector('span:first-child');
            var countEl = likeEl.querySelector('span:last-child');
            if (likes[id]) {
              boneEl.textContent  = '🩶';
              countEl.textContent = base;
              delete likes[id];
            } else {
              boneEl.textContent  = '🦴';
              countEl.textContent = base + 1;
              likes[id] = 1;
              likeEl.style.transform = 'scale(1.3)';
              setTimeout(function() { likeEl.style.transform = 'scale(1)'; }, 200);
            }
            return;
          }

          // Commentaires
          var cmtBtn = e.target.closest('.feed-comment-btn');
          if (cmtBtn) {
            var id    = cmtBtn.dataset.id;
            var chien = cmtBtn.dataset.chien;
            var sec   = document.getElementById('cmt-section-' + id);
            if (sec.style.display === 'none') {
              sec.style.display = 'block';
              loadComments(id, chien);
            } else {
              sec.style.display = 'none';
            }
          }
        });
      });
  }

  // ── Commentaires ─────────────────────────────────────
  function loadCommentCount(photoId) {
    window.TDC.db.from('commentaires').select('id', { count: 'exact', head: true }).eq('photo_id', photoId)
      .then(function(res) {
        var el = document.getElementById('cmt-count-' + photoId);
        if (el) el.textContent = res.count || 0;
      });
  }

  function loadComments(photoId, chien) {
    var sec = document.getElementById('cmt-section-' + photoId);
    if (!sec) return;
    sec.innerHTML = '<div style="font-size:12px;color:var(--t3);">Chargement...</div>';

    window.TDC.db.from('commentaires').select('*').eq('photo_id', photoId).order('created_at', { ascending: true })
      .then(function(res) {
        var comments = res.data || [];
        var inp = 'flex:1;padding:8px 10px;border-radius:20px;border:1.5px solid var(--b);font-family:inherit;font-size:12px;background:var(--cream);color:var(--t);outline:none;';

        sec.innerHTML =
          '<div style="margin-bottom:8px;">'
            + (comments.length === 0
              ? '<div style="font-size:12px;color:var(--t3);margin-bottom:8px;">Sois le premier à commenter 🐾</div>'
              : comments.map(function(c) {
                  return '<div style="margin-bottom:6px;">'
                    + '<span style="font-size:12px;font-weight:500;color:var(--t);">' + (c.membre_prenom||'Membre') + '</span> '
                    + '<span style="font-size:12px;color:var(--t2);">' + c.contenu + '</span>'
                  + '</div>';
                }).join(''))
          + '</div>'
          + '<div style="display:flex;gap:6px;align-items:center;">'
            + '<input type="text" id="cmt-input-' + photoId + '" placeholder="Commenter..." style="' + inp + '" maxlength="200">'
            + '<button onclick="window._TDC_sendComment(\'' + photoId + '\')" style="padding:8px 12px;border-radius:20px;background:var(--green);color:#fff;border:none;font-family:inherit;font-size:12px;cursor:pointer;">→</button>'
          + '</div>';

        document.getElementById('cmt-count-' + photoId).textContent = comments.length;
      });
  }

  window._TDC_sendComment = async function(photoId) {
    var input = document.getElementById('cmt-input-' + photoId);
    if (!input) return;
    var contenu = input.value.trim();
    if (!contenu) return;

    var res = await window.TDC.db.from('commentaires').insert([{
      photo_id:      photoId,
      membre_email:  window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom,
      contenu:       contenu
    }]);

    if (res.error) { alert('Erreur : ' + res.error.message); return; }
    input.value = '';
    // Reload la section commentaires
    var photo = document.querySelector('.feed-comment-btn[data-id="' + photoId + '"]');
    var chien = photo ? photo.dataset.chien : '';
    loadComments(photoId, chien);
  };

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style = 'position:fixed;bottom:24px;right:24px;background:var(--green);color:var(--cream);padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

})();
