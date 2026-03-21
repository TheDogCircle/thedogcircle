/**
 * =====================================================
 *  THE DOG CIRCLE — Module Profil
 *  Fichier : profil.js
 *  Tables  : membres · inscriptions · events
 *  Écoute  : TDC:tab(profil)
 * =====================================================
 */
(function () {

  var membreData = null;

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab !== 'profil') return;
    loadProfil();
  });

  document.addEventListener('TDCA:ready', function () {
    bindSubtabs();
  });

  document.addEventListener('TDC:ready', function () {
    bindSubtabs();
  });

  function bindSubtabs() {
    var btnP = document.getElementById('profTabPasseport');
    var btnA = document.getElementById('profTabAgenda');
    var btnS = document.getElementById('profTabParams');
    if (btnP) btnP.addEventListener('click', function () { showProfTab('passeport'); });
    if (btnA) btnA.addEventListener('click', function () { showProfTab('agenda'); });
    if (btnS) btnS.addEventListener('click', function () { showProfTab('params'); });
  }

  function showProfTab(tab) {
    document.getElementById('profTabPasseport').classList.toggle('active', tab === 'passeport');
    document.getElementById('profTabAgenda').classList.toggle('active', tab === 'agenda');
    document.getElementById('profTabParams').classList.toggle('active', tab === 'params');
    document.getElementById('profPasseport').style.display = tab === 'passeport' ? 'block' : 'none';
    document.getElementById('profAgenda').style.display    = tab === 'agenda'    ? 'block' : 'none';
    document.getElementById('profParams').style.display    = tab === 'params'    ? 'block' : 'none';

    if (tab === 'passeport') buildPasseport();
    if (tab === 'agenda')    loadAgenda();
    if (tab === 'params')    buildParams();
  }

  // ── Charger les données du membre ───────────────────
  function loadProfil() {
    window.TDC.db
      .from('membres')
      .select('*')
      .eq('email', window.TDC.userEmail)
      .single()
      .then(function (res) {
        if (res.data) membreData = res.data;
        buildPasseport();
      })
      .catch(function () {
        buildPasseport(); // affiche quand même avec les infos de session
      });
  }

  // ── PASSEPORT ────────────────────────────────────────
  function buildPasseport() {
    var c = document.getElementById('profPasseport');
    if (!c) return;

    var prenom  = (membreData && membreData.prenom)  || window.TDC.userPrenom || 'Membre';
    var chien   = (membreData && membreData.chien)   || '—';
    var race    = (membreData && membreData.race)    || '—';
    var ville   = (membreData && membreData.ville)   || '—';
    var formule = (membreData && membreData.formule) || '—';

    c.innerHTML =
      '<div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">'
        + '<div class="profil-avatar">' + prenom[0].toUpperCase() + '</div>'
        + '<div>'
          + '<div class="profil-name">' + prenom + '</div>'
          + '<span class="profil-badge">⭐ Membre Fondateur</span>'
          + '<div style="font-size:12px;color:var(--t3);margin-top:6px;">' + (ville !== '—' ? '📍 ' + ville : '') + '</div>'
        + '</div>'
      + '</div>'

      + '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:14px;">🐾 Passeport canin</div>'
      + '<div class="passeport-grid">'
        + card('🐕', 'Prénom', chien)
        + card('🏷️', 'Race', race)
        + card('📍', 'Ville', ville)
        + card('💳', 'Formule', formule)
      + '</div>'
      + '<div style="margin-top:16px;">'
        + '<button class="btn btn-o" style="font-size:13px;" onclick="alert(\'Modification du passeport à venir 🐾\')">✏️ Modifier</button>'
      + '</div>';
  }

  function card(icon, label, val) {
    return '<div class="passeport-card">'
      + '<div class="passeport-icon">' + icon + '</div>'
      + '<div class="passeport-label">' + label + '</div>'
      + '<div class="passeport-val">' + val + '</div>'
    + '</div>';
  }

  // ── MON AGENDA ───────────────────────────────────────
  function loadAgenda() {
    var c = document.getElementById('profAgenda');
    if (!c) return;
    c.innerHTML = '<div class="loading">Chargement...</div>';

    window.TDC.db
      .from('inscriptions')
      .select('*,events(*)')
      .eq('membre_email', window.TDC.userEmail)
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (!res.data || res.data.length === 0) {
          c.innerHTML = '<div class="loading">Aucune inscription pour le moment 🐾<br>'
            + '<small style="color:var(--t3);">Inscris-toi à un event dans l\'onglet 🎉 Events</small></div>';
          return;
        }
        c.innerHTML =
          '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:16px;">📅 Mon agenda</div>'
          + res.data.map(function (i) {
              var ev = i.events;
              if (!ev) return '';
              var parts = (ev.date || '--/--').split('/');
              var badge = i.statut === 'confirme'
                ? '<span class="ev-tag tag-green">✓ Confirmé</span>'
                : '<span class="ev-tag tag-yellow">⏳ Liste attente</span>';
              return '<div class="ev-card">'
                + '<div class="ev-date">'
                  + '<div class="ev-day">'   + (parts[0] || '--') + '</div>'
                  + '<div class="ev-month">' + (parts[1] || '')   + '</div>'
                + '</div>'
                + '<div class="ev-body">'
                  + '<div class="ev-title">'  + ev.titre + '</div>'
                  + '<div class="ev-detail">' + (ev.ville || '') + ' · ' + (ev.prix || 'Gratuit') + '</div>'
                  + '<div class="ev-tags">'   + badge + '</div>'
                  + '<div class="ev-actions">'
                    + '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>'
                  + '</div>'
                + '</div></div>';
            }).filter(Boolean).join('');
      }).catch(function (err) {
        c.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

  // ── PARAMÈTRES ────────────────────────────────────────
  function buildParams() {
    var c = document.getElementById('profParams');
    if (!c) return;
    c.innerHTML =
      '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:16px;">⚙️ Paramètres</div>'
      + '<div class="params-section">'
        + row('✉️ Email',               window.TDC.userEmail || '—')
        + row('🔔 Notifications events', 'Activées')
        + row('📧 Newsletter mensuelle', 'Activée')
        + row('🔒 Mot de passe',         '••••••••')
      + '</div>'
      + '<div style="margin-top:16px;">'
        + '<button class="btn btn-o" style="font-size:13px;" onclick="alert(\'Modification des paramètres à venir 🐾\')">✏️ Modifier</button>'
      + '</div>';
  }

  function row(label, val) {
    return '<div class="params-row">'
      + '<span class="params-label">' + label + '</span>'
      + '<span class="params-val">'   + val   + '</span>'
    + '</div>';
  }

})();
