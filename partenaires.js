/**
 * =====================================================
 *  THE DOG CIRCLE — Module Partenaires
 *  Fichier : partenaires.js
 *  Table   : partenaires
 * =====================================================
 */
(function () {

  var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
  var filtreVilleP = 'Toutes';
  var icons    = { 'Toilettage':'✂️','Promenades canines':'🦮','Boutique':'🛍️','Vétérinaire':'🩺','Éducation canine':'🎓','Hôtel pet-friendly':'🏨','Restaurant':'🍽️','Autre':'🤝' };

  document.addEventListener('TDC:login', function () { loadPartners(); });
  document.addEventListener('TDC:tab',   function (e) { if (e.detail.tab === 'partners') loadPartners(); });

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

        // Extraire villes uniques
        var villes = ['Toutes'];
        res.data.forEach(function(p) {
          var v = p.ville || 'National';
          if (v && villes.indexOf(v) === -1) villes.push(v);
        });

        // HTML filtre villes
        var filtreDiv = document.createElement('div');
        filtreDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;grid-column:1/-1;';
        villes.forEach(function(v) {
          var btn = document.createElement('button');
          btn.textContent = v;
          btn.dataset.ville = v;
          btn.style.cssText = 'padding:6px 14px;border-radius:100px;font-size:12px;font-family:inherit;cursor:pointer;transition:all .2s;border:1.5px solid var(--b);background:transparent;color:var(--t2);';
          if (filtreVilleP === v) {
            btn.style.background = 'var(--green)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--green)';
          }
          btn.addEventListener('click', function() {
            filtreVilleP = v;
            loadPartners();
          });
          filtreDiv.appendChild(btn);
        });
        var filtreHtml = filtreDiv.outerHTML;

        // Filtrer
        var pFiltres = filtreVilleP === 'Toutes'
          ? res.data
          : res.data.filter(function(p) {
              var v = p.ville || 'National';
              return v === filtreVilleP;
            });

        window._TDC_ptFiltre = function(ville) {
          filtreVilleP = ville;
          loadPartners();
        };

        if (pFiltres.length === 0) {
          g.innerHTML = filtreHtml + '<div class="loading" style="grid-column:1/-1;">Aucun partenaire dans cette ville 🐾</div>';
          return;
        }

        g.innerHTML = filtreHtml + pFiltres.map(function (p, i) {
          var bg   = bgColors[i % bgColors.length];
          var icon = icons[p.type] || '🤝';

          // Photo ou fond couleur
          var media = p.photo_url
            ? '<div style="height:140px;overflow:hidden;"><img src="' + p.photo_url + '" style="width:100%;height:140px;object-fit:cover;" alt="' + p.nom + '"></div>'
            : '<div style="height:140px;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:44px;">' + icon + '</div>';

          return '<div class="partner-card" style="overflow:hidden;">'
            + media
            + '<div style="padding:16px 18px;">'
              + '<div class="partner-header" style="margin-bottom:8px;">'
                + '<div>'
                  + '<div class="partner-name">' + p.nom + '</div>'
                  + '<div class="partner-type">' + p.type + (p.ville && p.ville !== 'National' ? ' · ' + p.ville : '') + '</div>'
                + '</div>'
              + '</div>'

              + (p.description ? '<div style="font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:10px;">' + p.description + '</div>' : '')

              + (p.adresse ? '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">📍 ' + p.adresse + '</div>' : '')

              + '<div class="partner-offer">' + (p.offre || '') + '</div>'

              + '<div class="partner-code">'
                + '<span class="code-text">' + p.code + '</span>'
                + '<span class="copy-btn" data-code="' + p.code + '">Copier</span>'
              + '</div>'

              + (p.site_web
                ? '<a href="' + p.site_web + '" target="_blank" style="display:block;text-align:center;margin-top:10px;font-size:12px;color:var(--green);text-decoration:none;font-weight:500;">Visiter le site →</a>'
                : '')
            + '</div></div>';
        }).join('');

        // Copier code
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
