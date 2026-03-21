/**
 * =====================================================
 *  THE DOG CIRCLE — Module Partenaires
 *  Fichier : partenaires.js
 *  Écoute  : TDC:login · TDC:tab(partners)
 * =====================================================
 */
(function () {

  // Couleurs de fond par type de service
  var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
  var icons    = { 'Toilettage':'✂️','Promenades canines':'🦮','Boutique':'🛍️','Vétérinaire':'🩺','Éducation canine':'🎓','Hôtel pet-friendly':'🏨','Restaurant':'🍽️','Autre':'🤝' };

  document.addEventListener('TDC:login', function () {
    loadPartners();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'partners') loadPartners();
  });

  function loadPartners() {
    var g = document.getElementById('partnersGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db
      .from('partenaires')
      .select('*')
      .eq('statut', 'Actif')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucun partenaire pour le moment 🐾</div>';
          return;
        }

        g.innerHTML = res.data.map(function (p, i) {
          var bg   = bgColors[i % bgColors.length];
          var icon = icons[p.type] || '🤝';
          return '<div class="partner-card">'
            + '<div class="partner-header">'
              + '<div class="partner-icon" style="background:' + bg + '">' + icon + '</div>'
              + '<div><div class="partner-name">' + p.nom + '</div>'
                + '<div class="partner-type">' + p.type + (p.ville && p.ville !== 'National' ? ' · ' + p.ville : '') + '</div></div>'
            + '</div>'
            + '<div class="partner-offer">' + (p.offre || '') + '</div>'
            + '<div class="partner-code">'
              + '<span class="code-text">' + p.code + '</span>'
              + '<span class="copy-btn" data-code="' + p.code + '">Copier</span>'
            + '</div></div>';
        }).join('');

        // Copier le code promo
        g.addEventListener('click', function (e) {
          var btn = e.target.closest('.copy-btn');
          if (!btn) return;
          navigator.clipboard.writeText(btn.dataset.code).then(function () {
            btn.textContent = 'Copié !';
            setTimeout(function () { btn.textContent = 'Copier'; }, 2000);
          });
        });

      }).catch(function (err) {
        g.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

})();
