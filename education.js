/**
 * =====================================================
 *  THE DOG CIRCLE — Module Education
 *  Fichier : education.js
 *  Table   : ressources_education
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', function () { loadEducation(); });
  document.addEventListener('TDC:tab',   function (e) { if (e.detail.tab === 'education') loadEducation(); });

  var categories = ['Tout', 'Éducation', 'Santé', 'Nutrition', 'Comportement', 'Balade', 'Bien-être'];
  var currentCat = 'Tout';
  var allData    = [];

  function loadEducation() {
    var g = document.getElementById('educationGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading">Chargement...</div>';

    window.TDC.db
      .from('ressources_education')
      .select('*')
      .eq('statut', 'actif')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }

        allData = res.data || [];

        if (allData.length === 0) {
          g.innerHTML = '<div class="loading">Aucune ressource pour le moment 🐾<br><small style="color:var(--t3);">Du contenu arrive bientôt !</small></div>';
          return;
        }

        renderEducation();
      });
  }

  function renderEducation() {
    var g = document.getElementById('educationGrid');
    if (!g) return;

    var filtered = currentCat === 'Tout'
      ? allData
      : allData.filter(function (r) { return r.categorie === currentCat; });

    // Filtres catégories
    var filtersHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">'
      + categories.map(function (cat) {
          return '<button onclick="window._TDC_edCat(\'' + cat + '\')" style="padding:6px 14px;border-radius:100px;font-size:12px;font-family:inherit;cursor:pointer;transition:all .2s;'
            + (currentCat === cat
              ? 'background:var(--green);color:#fff;border:1.5px solid var(--green);'
              : 'background:transparent;color:var(--t2);border:1.5px solid var(--b);')
            + '">' + cat + '</button>';
        }).join('')
      + '</div>';

    var typeColors = { 'Article':'#EBF0E8', 'Vidéo':'#F5E8C4', 'Conseil':'#EBF0E8', 'Atelier':'#F0E8EB' };
    var typeEmojis = { 'Article':'📝', 'Vidéo':'🎥', 'Conseil':'💡', 'Atelier':'🎓' };

    var cardsHtml = filtered.length === 0
      ? '<div class="loading">Aucune ressource dans cette catégorie.</div>'
      : '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
          + filtered.map(function (r) {
              var bg    = typeColors[r.type] || '#EBF0E8';
              var emoji = typeEmojis[r.type] || '📚';

              var media = r.photo_url
                ? '<div style="height:140px;overflow:hidden;border-radius:14px 14px 0 0;"><img src="' + r.photo_url + '" style="width:100%;height:140px;object-fit:cover;" alt="" loading="lazy"></div>'
                : '<div style="height:140px;background:' + bg + ';border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:center;font-size:48px;">' + emoji + '</div>';

              return '<div style="background:var(--w);border:1px solid var(--b);border-radius:14px;overflow:hidden;cursor:pointer;" onclick="window._TDC_openEdu(\'' + r.id + '\')">'
                + media
                + '<div style="padding:14px 16px;">'
                  + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">'
                    + '<span style="font-size:10px;background:' + bg + ';color:var(--t2);padding:2px 8px;border-radius:100px;">' + (r.type||'Conseil') + '</span>'
                    + (r.categorie ? '<span style="font-size:10px;color:var(--t3);">' + r.categorie + '</span>' : '')
                  + '</div>'
                  + '<div style="font-size:14px;font-weight:500;color:var(--t);margin-bottom:4px;line-height:1.4;">' + r.titre + '</div>'
                  + '<div style="font-size:12px;color:var(--t3);line-height:1.5;">' + (r.description||'').substring(0,80) + (r.description && r.description.length > 80 ? '…' : '') + '</div>'
                  + (r.auteur ? '<div style="font-size:11px;color:var(--t3);margin-top:8px;">✍️ ' + r.auteur + '</div>' : '')
                + '</div>'
              + '</div>';
            }).join('')
        + '</div>';

    g.innerHTML = filtersHtml + cardsHtml;

    // Modal détail
    window._TDC_edCat = function(cat) { currentCat = cat; renderEducation(); };
    window._TDC_openEdu = function(id) {
      var r = allData.find(function(x) { return x.id === id; });
      if (!r) return;

      var existing = document.getElementById('modal-edu');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id    = 'modal-edu';
      modal.style = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9000;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
      modal.innerHTML =
        '<div style="background:var(--w);border-radius:20px;width:100%;max-width:560px;margin:40px auto;overflow:hidden;">'
          + (r.photo_url
            ? '<img src="' + r.photo_url + '" style="width:100%;height:200px;object-fit:cover;" alt="">'
            : '<div style="height:120px;background:' + (typeColors[r.type]||'#EBF0E8') + ';display:flex;align-items:center;justify-content:center;font-size:48px;">' + (typeEmojis[r.type]||'📚') + '</div>')
          + '<div style="padding:28px;">'
            + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
              + '<span style="font-size:11px;background:var(--greenp);color:var(--green);padding:3px 10px;border-radius:100px;">' + (r.type||'Conseil') + '</span>'
              + (r.categorie ? '<span style="font-size:11px;background:var(--goldp);color:var(--gold);padding:3px 10px;border-radius:100px;">' + r.categorie + '</span>' : '')
            + '</div>'
            + '<div style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--t);margin-bottom:8px;">' + r.titre + '</div>'
            + (r.auteur ? '<div style="font-size:12px;color:var(--t3);margin-bottom:16px;">✍️ ' + r.auteur + '</div>' : '')
            + '<div style="font-size:14px;color:var(--t2);line-height:1.8;white-space:pre-wrap;">' + (r.contenu || r.description || '') + '</div>'
            + '<button onclick="document.getElementById(\'modal-edu\').remove()" style="width:100%;margin-top:24px;padding:12px;border-radius:100px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:14px;cursor:pointer;color:var(--t2);">Fermer</button>'
          + '</div>'
        + '</div>';

      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    };
  }

})();
