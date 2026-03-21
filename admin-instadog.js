/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Instadog
 *  Fichier : admin-instadog.js
 *  Écoute  : TDCA:section(instadog)
 * =====================================================
 */
(function () {

  // Données statiques pour l'instant — à connecter à une table Supabase "photos"
  var photos = [
    { emoji:'🐕',    bg:'#C8DEB8', dog:'Noisette', city:'Paris',      cap:'Balade matinale 🌿',   statut:'en_attente' },
    { emoji:'🐩',    bg:'#D4C5A9', dog:'Bella',    city:'Nantes',     cap:'Toilettage ✨',          statut:'en_attente' },
    { emoji:'🐕‍🦺', bg:'#B8C9D4', dog:'Thor',     city:'Lyon',       cap:'Agility 🎓',            statut:'valide'     },
    { emoji:'🦮',    bg:'#D4B8B8', dog:'Luna',     city:'Bordeaux',   cap:'Évasion mer 🌊',        statut:'valide'     },
    { emoji:'🐶',    bg:'#C5C8D4', dog:'Max',      city:'Strasbourg', cap:'Neige ❄️',              statut:'en_attente' },
    { emoji:'🐾',    bg:'#D4CEB8', dog:'Oscar',    city:'Rennes',     cap:'Garde membres 🙏',      statut:'valide'     },
    { emoji:'🐕',    bg:'#C8DEB8', dog:'Caramel',  city:'Paris',      cap:'Apéro canin 🍷',        statut:'en_attente' },
    { emoji:'🦮',    bg:'#EBF0E8', dog:'Zeus',     city:'Marseille',  cap:'Calanques 🏔️',         statut:'valide'     },
  ];

  document.addEventListener('TDCA:login', function () {
    buildPhotos();
  });

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'instadog') buildPhotos();
  });

  function buildPhotos() {
    var grid = document.getElementById('photos-grid');
    if (!grid) return;

    // Trier : en attente en premier
    var sorted = photos.slice().sort(function (a, b) {
      return a.statut === 'en_attente' ? -1 : 1;
    });

    grid.innerHTML = sorted.map(function (p, i) {
      var idx = photos.indexOf(p);
      return '<div class="photo-card" id="photo-' + idx + '">'
        + '<div class="photo-img" style="background:' + p.bg + ';">' + p.emoji + '</div>'
        + '<div class="photo-info">'
          + '<div class="photo-name">' + p.dog + '</div>'
          + '<div class="photo-meta">' + p.city + ' · "' + p.cap + '"</div>'
          + '<div style="margin-bottom:6px;">'
            + (p.statut === 'en_attente'
              ? '<span class="pill pill-amber">En attente</span>'
              : '<span class="pill pill-green">Validé</span>')
          + '</div>'
          + '<div class="photo-actions">'
            + (p.statut === 'en_attente'
              ? '<button class="btn-xs btn-xs-g" onclick="window.TDCA.instadog.validate(' + idx + ')">✓ Valider</button>'
              : '<span style="font-size:11px;color:var(--t3);">✓ Publié</span>')
            + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.instadog.remove(' + idx + ')">✗ Suppr.</button>'
          + '</div>'
        + '</div>'
      + '</div>';
    }).join('');
  }

  function validatePhoto(idx) {
    photos[idx].statut = 'valide';
    buildPhotos();
    window.TDCA.toast('Photo validée et publiée ✓');
  }

  function removePhoto(idx) {
    photos.splice(idx, 1);
    buildPhotos();
    window.TDCA.toast('Photo supprimée.');
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.instadog = {
    validate: validatePhoto,
    remove:   removePhoto
  };

})();
