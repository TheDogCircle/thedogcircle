/**
 * =====================================================
 *  THE DOG CIRCLE — Module Instadog
 *  Fichier : instadog.js
 *  Table   : photos (statut = valide)
 *  Écoute  : TDC:login · TDC:tab(feed)
 * =====================================================
 */
(function () {

  var likes = {};

  document.addEventListener('TDC:login', function () {
    loadFeed();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'feed') loadFeed();
  });

  function loadFeed() {
    var g = document.getElementById('feedGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db
      .from('Photos')
      .select('*')
      .eq('statut', 'valide')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) {
          g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>';
          return;
        }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucune photo publiée pour le moment 🐾</div>';
          return;
        }

        g.innerHTML = res.data.map(function (p, i) {
          var bg    = p.bg_color || '#C8DEB8';
          var emoji = p.emoji    || '🐾';
          return '<div class="feed-card">'
            + '<div class="feed-photo" style="background:' + bg + '">' + emoji + '</div>'
            + '<div class="feed-info">'
              + '<div class="feed-dog">' + (p.chien || 'Mon chien') + '</div>'
              + '<div class="feed-meta">' + (p.membre_prenom || '') + (p.ville ? ' · ' + p.ville : '') + '</div>'
              + '<div class="feed-cap">' + (p.caption || '') + '</div>'
              + '<span class="feed-like" data-id="' + p.id + '" data-lk="' + (p.likes || 0) + '">♡ ' + (p.likes || 0) + '</span>'
            + '</div></div>';
        }).join('');

        // Likes (local uniquement — pas d'auth pour l'instant)
        g.addEventListener('click', function (e) {
          var el = e.target.closest('.feed-like');
          if (!el) return;
          var id   = el.dataset.id;
          var base = parseInt(el.dataset.lk);
          if (likes[id]) {
            el.textContent = '♡ ' + base;
            el.style.color = '';
            delete likes[id];
          } else {
            el.textContent = '♥ ' + (base + 1);
            el.style.color = '#dc2626';
            likes[id] = 1;
          }
        });

      }).catch(function (err) {
        g.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

})();
