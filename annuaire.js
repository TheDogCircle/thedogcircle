/**
 * =====================================================
 *  THE DOG CIRCLE — Annuaire membres
 *  Fichier : annuaire.js
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'annuaire') loadAnnuaire();
  });

  async function loadAnnuaire() {
    var db = window.TDC.db;
    var c  = document.getElementById('annuaireGrid');
    if (!c) return;
    c.innerHTML = '<div class="loading">Chargement de l\'annuaire...</div>';

    var res = await db.from('membres')
      .select('prenom,nom,chien,race,ville,photo_profil,photo_chien,formule,numero_membre,situation_amoureuse,date_naissance_chien,created_at')
      .eq('statut', 'actif')
      .order('numero_membre', { ascending: true });

    if (res.error) { c.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }

    var membres = res.data || [];
    if (membres.length === 0) { c.innerHTML = '<div class="loading">Aucun membre pour le moment 🐾</div>'; return; }

    // Barre de recherche
    var searchBar = '<div style="margin-bottom:20px;">'
      + '<input type="text" id="annuaire-search" placeholder="Rechercher un membre ou un chien..." '
      + 'style="width:100%;padding:11px 16px;border:1.5px solid var(--b);border-radius:100px;font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
      + '</div>';

    c.innerHTML = searchBar + '<div id="annuaire-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;"></div>';

    renderCards(membres);

    // Recherche live
    document.getElementById('annuaire-search').addEventListener('input', function () {
      var q = this.value.toLowerCase().trim();
      var filtered = membres.filter(function (m) {
        return (m.prenom||'').toLowerCase().includes(q)
          || (m.chien||'').toLowerCase().includes(q)
          || (m.ville||'').toLowerCase().includes(q)
          || (m.race||'').toLowerCase().includes(q);
      });
      renderCards(filtered);
    });
  }

  function renderCards(membres) {
    var grid = document.getElementById('annuaire-cards');
    if (!grid) return;

    var colors = ['#3B5E3F','#B8882A','#587A5C','#9C8472','#2A1C0C','#6B5240'];

    grid.innerHTML = membres.map(function (m, i) {
      var initiale = (m.prenom || '?')[0].toUpperCase();
      var couleur  = colors[i % colors.length];
      var num      = m.numero_membre ? '#' + String(m.numero_membre).padStart(3,'0') : '';

      // Avatar (photo profil ou initiale)
      var avatar = m.photo_profil
        ? '<img src="' + m.photo_profil + '" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--w);" alt="">'
        : '<div style="width:72px;height:72px;border-radius:50%;background:' + couleur + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:500;border:3px solid var(--w);">' + initiale + '</div>';

      // Photo chien (miniature)
      var photoChien = m.photo_chien
        ? '<img src="' + m.photo_chien + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--w);position:absolute;bottom:0;right:0;" alt="">'
        : '<div style="width:36px;height:36px;border-radius:50%;background:var(--cream2);border:2px solid var(--w);position:absolute;bottom:0;right:0;display:flex;align-items:center;justify-content:center;font-size:14px;">🐾</div>';

      // Situation amoureuse
      var situationEmoji = {
        'Célibataire': '💛',
        'En couple':   '💚',
        'Marié(e)':    '💍',
        'Compliqué':   '🤍'
      };
      var siEmoji = m.situation_amoureuse && situationEmoji[m.situation_amoureuse]
        ? situationEmoji[m.situation_amoureuse]
        : null;

      // Âge du chien
      var ageChien = '';
      if (m.date_naissance_chien) {
        var age = new Date().getFullYear() - parseInt(m.date_naissance_chien.split('-')[0], 10);
        ageChien = age + ' an' + (age > 1 ? 's' : '');
      }

      // Badge formule
      var formuleStyle = (m.formule || '').includes('Fondateur')
        ? 'background:var(--goldp);color:var(--gold);'
        : 'background:var(--greenp);color:var(--green);';

      return '<div style="background:var(--w);border-radius:16px;border:1px solid var(--b);overflow:hidden;transition:box-shadow .2s;" onmouseover="this.style.boxShadow=\'0 4px 20px rgba(42,28,12,0.1)\'" onmouseout="this.style.boxShadow=\'none\'">'

        // Bandeau couleur + avatars
        + '<div style="background:' + couleur + ';height:56px;position:relative;"></div>'
        + '<div style="padding:0 16px 16px;margin-top:-36px;">'
          + '<div style="position:relative;display:inline-block;margin-bottom:10px;">'
            + avatar
            + photoChien
          + '</div>'

          // Nom + numéro
          + '<div style="font-size:14px;font-weight:500;color:var(--t);margin-bottom:2px;">'
            + m.prenom + (m.nom ? ' ' + m.nom[0] + '.' : '')
            + (num ? ' <span style="font-size:10px;color:var(--t3);font-weight:400;">' + num + '</span>' : '')
          + '</div>'

          // Ville
          + (m.ville ? '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">📍 ' + m.ville + '</div>' : '')

          // Chien + race + âge
          + (m.chien ? '<div style="font-size:12px;color:var(--t2);margin-bottom:8px;">🐾 ' + m.chien
              + (m.race ? ' <span style="color:var(--t3);">· ' + m.race + '</span>' : '')
              + (ageChien ? ' <span style="color:var(--t3);">· ' + ageChien + '</span>' : '')
            + '</div>' : '')

          // Tags : situation amoureuse + formule
          + '<div style="display:flex;flex-wrap:wrap;gap:5px;">'
            + (m.formule ? '<span style="font-size:9px;padding:2px 8px;border-radius:100px;' + formuleStyle + '">' + m.formule + '</span>' : '')
            + (siEmoji ? '<span style="font-size:9px;padding:2px 8px;border-radius:100px;background:var(--cream);color:var(--t2);">' + siEmoji + ' ' + m.situation_amoureuse + '</span>' : '')
          + '</div>'

        + '</div>'
      + '</div>';
    }).join('');

    if (membres.length === 0) {
      grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--t3);grid-column:1/-1;">Aucun membre trouvé 🐾</div>';
    }
  }

  window.TDC = window.TDC || {};
  window.TDC.annuaire = { load: loadAnnuaire };

})();
