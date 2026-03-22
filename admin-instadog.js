/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Instadog
 *  Fichier : admin-instadog.js
 *  Table   : photos (minuscules)
 *  Écoute  : TDCA:login · TDCA:section(instadog)
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:login', function () {
    loadPhotos();
  });

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'instadog') loadPhotos();
  });

  // ── Charger ────────────────────────────────────────
  async function loadPhotos() {
    var db   = window.TDCA.db;
    var grid = document.getElementById('photos-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--t3);">Chargement...</div>';

    var res = await db.from('photos').select('*').order('created_at', { ascending: false });
    if (res.error) {
      grid.innerHTML = '<div style="grid-column:1/-1;color:var(--red);padding:20px;">Erreur : ' + res.error.message + '</div>';
      return;
    }

    if (!res.data || res.data.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--t3);">Aucune photo pour le moment</div>';
      return;
    }

    grid.innerHTML = res.data.map(function (p) {
      var media = p.photo_url
        ? '<div class="photo-img" style="padding:0;overflow:hidden;"><img src="' + p.photo_url + '" style="width:100%;height:90px;object-fit:cover;" alt=""></div>'
        : '<div class="photo-img" style="background:' + (p.bg_color || '#C8DEB8') + ';">' + (p.emoji || '🐾') + '</div>';

      return '<div class="photo-card" id="photo-' + p.id + '">'
        + media
        + '<div class="photo-info">'
          + '<div class="photo-name">' + (p.chien || '—') + '</div>'
          + '<div class="photo-meta">' + (p.membre_prenom || '') + (p.ville ? ' · ' + p.ville : '') + '</div>'
          + '<div class="photo-meta">"' + (p.caption || '') + '"</div>'
          + '<div class="photo-actions" style="margin-top:6px;">'
            + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.instadog.remove(\'' + p.id + '\')">✗ Supprimer</button>'
          + '</div>'
        + '</div>'
      + '</div>';
    }).join('');
  }

  // ── Supprimer une photo ────────────────────────────
  async function removePhoto(id) {
    if (!confirm('Supprimer cette photo ?')) return;
    var db  = window.TDCA.db;
    var res = await db.from('photos').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Photo supprimée.');
    await loadPhotos();
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.instadog = {
    remove: removePhoto
  };

})();
