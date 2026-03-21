/**
 * =====================================================
 *  THE DOG CIRCLE — Module Garde
 *  Fichier : garde.js
 *  Table   : gardes
 *  Écoute  : TDC:login · TDC:tab(garde)
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', function () {
    loadGarde();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'garde') loadGarde();
  });

  function loadGarde() {
    var g = document.getElementById('gardeGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db
      .from('garde')
      .select('*')
      .eq('statut', 'actif')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) {
          g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>';
          return;
        }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucun gardien disponible pour le moment 🐾</div>';
          return;
        }

        var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
        var avatars  = ['🐕','🐩','🦮','🐕‍🦺','🐶','🐾'];

        g.innerHTML = res.data.map(function (gd, i) {
          var bg   = bgColors[i % bgColors.length];
          var av   = avatars[i % avatars.length];
          var tags = (gd.tags || '').split(',').map(function (t) {
            return '<span class="garde-tag">' + t.trim() + '</span>';
          }).join('');

          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bg + '">' + av + '</div>'
            + '<div class="garde-name">' + gd.prenom + '</div>'
            + '<div class="garde-dog">' + (gd.chien || '—') + (gd.race ? ' · ' + gd.race : '') + '</div>'
            + '<div class="garde-tags">' + tags + '</div>'
            + '<div class="garde-dispo">● ' + (gd.dispo || 'Disponible') + '</div>'
            + '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;"'
              + ' onclick="window.location.href=\'mailto:thedogcircleclub@gmail.com?subject=Garde - ' + encodeURIComponent(gd.prenom) + '\'">Contacter</button>'
          + '</div>';
        }).join('');

      }).catch(function (err) {
        g.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

})();
