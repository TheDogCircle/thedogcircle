/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Instadog
 *  Fichier : admin-instadog.js
 *  Table   : photos
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

    // En attente en premier
    var sorted = res.data.slice().sort(function (a, b) {
      return a.statut === 'en_attente' ? -1 : 1;
    });

    grid.innerHTML = sorted.map(function (p) {
      var bg    = p.bg_color || '#C8DEB8';
      var emoji = p.emoji    || '🐾';
      var badge = p.statut === 'en_attente'
        ? '<span class="pill pill-amber">En attente</span>'
        : '<span class="pill pill-green">Validé</span>';
      return '<div class="photo-card" id="photo-' + p.id + '">'
        + '<div class="photo-img" style="background:' + bg + ';">' + emoji + '</div>'
        + '<div class="photo-info">'
          + '<div class="photo-name">' + (p.chien || '—') + '</div>'
          + '<div class="photo-meta">' + (p.membre_prenom || '') + (p.ville ? ' · ' + p.ville : '') + '</div>'
          + '<div class="photo-meta">"' + (p.caption || '') + '"</div>'
          + '<div style="margin:4px 0;">' + badge + '</div>'
          + '<div class="photo-actions">'
            + (p.statut === 'en_attente'
              ? '<button class="btn-xs btn-xs-g" onclick="window.TDCA.instadog.validate(\'' + p.id + '\')">✓ Valider</button>'
              : '<span style="font-size:11px;color:var(--t3);">✓ Publié</span>')
            + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.instadog.remove(\'' + p.id + '\')">✗ Suppr.</button>'
          + '</div>'
        + '</div>'
      + '</div>';
    }).join('');
  }

  // ── Valider une photo ──────────────────────────────
  async function validatePhoto(id) {
    var db  = window.TDCA.db;
    var res = await db.from('photos').update({ statut: 'valide' }).eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Photo validée et publiée ✓');
    await loadPhotos();
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
    validate: validatePhoto,
    remove:   removePhoto
  };

})();
