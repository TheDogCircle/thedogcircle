/**
 * =====================================================
 *  THE DOG CIRCLE — Module Instadog
 *  Fichier : instadog.js
 *  Écoute  : TDC:login · TDC:tab(feed)
 * =====================================================
 */
(function () {

  var posts = [
    { bg:'#C8DEB8', e:'🐕',    dog:'Noisette', breed:'Cocker',  city:'Paris',    cap:'Balade matinale au bois de Vincennes', lk:61 },
    { bg:'#D4C5A9', e:'🐩',    dog:'Bella',    breed:'Bichon',  city:'Nantes',   cap:'Toilettage partenaire - code CIRCLE25', lk:44 },
    { bg:'#B8C9D4', e:'🐕‍🦺', dog:'Thor',     breed:'Husky',   city:'Lyon',     cap:'Premier cours éducation positive', lk:53 },
    { bg:'#D4B8B8', e:'🦮',    dog:'Luna',     breed:'Golden',  city:'Bordeaux', cap:'Évasion mer à Arcachon', lk:72 },
  ];

  var likes = {};
  var built = false;

  // Premier chargement au login (onglet actif par défaut)
  document.addEventListener('TDC:login', function () {
    buildFeed();
  });

  // Rechargement si on revient sur l'onglet
  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'feed' && !built) buildFeed();
  });

  function buildFeed() {
    var g = document.getElementById('feedGrid');
    if (!g) return;

    g.innerHTML = posts.map(function (p, i) {
      return '<div class="feed-card">'
        + '<div class="feed-photo" style="background:' + p.bg + '">' + p.e + '</div>'
        + '<div class="feed-info">'
          + '<div class="feed-dog">' + p.dog + '</div>'
          + '<div class="feed-meta">' + p.breed + ' · ' + p.city + '</div>'
          + '<div class="feed-cap">' + p.cap + '</div>'
          + '<span class="feed-like" data-i="' + i + '" data-lk="' + p.lk + '">♡ ' + p.lk + '</span>'
        + '</div></div>';
    }).join('');

    // Likes
    g.addEventListener('click', function (e) {
      var el = e.target.closest('.feed-like');
      if (!el) return;
      var i    = el.dataset.i;
      var base = parseInt(el.dataset.lk);
      if (likes[i]) {
        el.textContent  = '♡ ' + base;
        el.style.color  = '';
        delete likes[i];
      } else {
        el.textContent  = '♥ ' + (base + 1);
        el.style.color  = '#dc2626';
        likes[i] = 1;
      }
    });

    built = true;
  }

})();
