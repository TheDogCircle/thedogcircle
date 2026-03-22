/**
 * =====================================================
 *  THE DOG CIRCLE — Module Profil
 *  Fichier : profil.js
 *  Tables  : membres · inscriptions
 * =====================================================
 */
(function () {

  var membreData = null;

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab !== 'profil') return;
    loadProfil();
  });

  document.addEventListener('TDC:ready', function () {
    bindSubtabs();
  });

  function bindSubtabs() {
    var btnP = document.getElementById('profTabPasseport');
    var btnA = document.getElementById('profTabAgenda');
    var btnS = document.getElementById('profTabParams');
    if (btnP) btnP.addEventListener('click', function () { showTab('passeport'); });
    if (btnA) btnA.addEventListener('click', function () { showTab('agenda'); });
    if (btnS) btnS.addEventListener('click', function () { showTab('params'); });
  }

  function showTab(tab) {
    ['profTabPasseport','profTabAgenda','profTabParams'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === 'profTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    });
    document.getElementById('profPasseport').style.display = tab === 'passeport' ? 'block' : 'none';
    document.getElementById('profAgenda').style.display    = tab === 'agenda'    ? 'block' : 'none';
    document.getElementById('profParams').style.display    = tab === 'params'    ? 'block' : 'none';

    if (tab === 'passeport') buildPasseport();
    if (tab === 'agenda')    loadAgenda();
    if (tab === 'params')    buildParams();
  }

  // ── Charger données membre ────────────────────────────
  function loadProfil() {
    window.TDC.db
      .from('membres')
      .select('*')
      .eq('email', window.TDC.userEmail)
      .single()
      .then(function (res) {
        if (res.data) {
          membreData = res.data;
          window.TDC.userMembre = res.data;
        }
        buildPasseport();
      })
      .catch(function () { buildPasseport(); });
  }

  // ── PASSEPORT ────────────────────────────────────────
  function buildPasseport() {
    var c = document.getElementById('profPasseport');
    if (!c) return;

    var m        = membreData || window.TDC.userMembre || {};
    var prenom   = m.prenom   || window.TDC.userPrenom || 'Membre';
    var chien    = m.chien    || '—';
    var race     = m.race     || '—';
    var ville    = m.ville    || '—';
    var formule  = m.formule  || '—';
    var numero   = m.numero_membre ? '#' + String(m.numero_membre).padStart(3,'0') : '—';
    var codeParrain = m.code_parrain || '—';

    c.innerHTML =
      // Header membre
      '<div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">'
        + '<div class="profil-avatar">' + prenom[0].toUpperCase() + '</div>'
        + '<div>'
          + '<div class="profil-name">' + prenom + '</div>'
          + '<span class="profil-badge">⭐ Membre Fondateur</span>'
          + (numero !== '—' ? '<div style="font-size:13px;color:var(--gold);font-weight:500;margin-top:6px;">🏷️ Membre ' + numero + '</div>' : '')
          + (ville !== '—' ? '<div style="font-size:12px;color:var(--t3);margin-top:3px;">📍 ' + ville + '</div>' : '')
        + '</div>'
      + '</div>'

      // Passeport canin
      + '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:14px;">🐾 Passeport canin</div>'
      + '<div class="passeport-grid">'
        + card('🐕', 'Prénom', chien)
        + card('🏷️', 'Race', race)
        + card('📍', 'Ville', ville)
        + card('💳', 'Formule', formule)
      + '</div>'

      // Code parrain — mis en valeur
      + '<div style="background:var(--goldp);border:1px solid var(--gold);border-radius:14px;padding:16px 20px;margin-top:16px;">'
        + '<div style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">🎁 Ton code parrain</div>'
        + '<div style="font-size:22px;font-weight:500;font-family:monospace;color:var(--t);letter-spacing:.1em;">' + codeParrain + '</div>'
        + '<div style="font-size:12px;color:var(--t3);margin-top:6px;">Partage ce code à tes amis pour les inviter dans The Dog Circle 🐾</div>'
        + (codeParrain !== '—'
          ? '<button onclick="navigator.clipboard.writeText(\'' + codeParrain + '\').then(function(){alert(\'Code copié ! 🐾\')})" class="btn btn-o" style="font-size:12px;padding:6px 14px;margin-top:10px;">Copier le code</button>'
          : '')
      + '</div>'

      + '<div style="margin-top:16px;">'
        + '<button class="btn btn-o" style="font-size:13px;" onclick="document.getElementById(\'profTabParams\').click()">⚙️ Modifier mes infos</button>'
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
                  + '<div class="ev-day">'   + (parts[0]||'--') + '</div>'
                  + '<div class="ev-month">' + (parts[1]||'')   + '</div>'
                + '</div>'
                + '<div class="ev-body">'
                  + '<div class="ev-title">'  + ev.titre + '</div>'
                  + '<div class="ev-detail">' + (ev.ville||'') + ' · ' + (ev.prix||'Gratuit') + '</div>'
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
    var m = membreData || {};

    c.innerHTML =
      '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:16px;">⚙️ Paramètres</div>'
      + '<div class="params-section">'
        + row('✉️ Email',               window.TDC.userEmail || '—')
        + row('🔔 Notifications events', 'Activées')
        + row('📧 Newsletter mensuelle', 'Activée')
      + '</div>'

      // Changer le mot de passe
      + '<div style="margin-top:20px;background:var(--w);border:1px solid var(--b);border-radius:14px;padding:20px;">'
        + '<div style="font-size:14px;font-weight:500;margin-bottom:14px;">🔑 Changer mon mot de passe</div>'
        + '<div style="margin-bottom:12px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Nouveau mot de passe</label>'
          + '<input type="password" id="new-pwd" placeholder="Minimum 8 caractères" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Confirmer le mot de passe</label>'
          + '<input type="password" id="confirm-pwd" placeholder="Retape ton mot de passe" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div id="pwd-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:10px;"></div>'
        + '<div id="pwd-ok"  style="display:none;color:#065f46;font-size:12px;margin-bottom:10px;">✓ Mot de passe mis à jour !</div>'
        + '<button id="pwd-submit" class="btn btn-p" style="font-size:13px;" onclick="changePwd()">Mettre à jour</button>'
      + '</div>';

    // Exposer globalement
    window.changePwd = async function () {
      var db   = window.TDC.db;
      var pwd  = document.getElementById('new-pwd').value;
      var conf = document.getElementById('confirm-pwd').value;
      var err  = document.getElementById('pwd-err');
      var ok   = document.getElementById('pwd-ok');
      var btn  = document.getElementById('pwd-submit');
      err.style.display = 'none'; ok.style.display = 'none';

      if (pwd.length < 8)   { err.textContent = 'Minimum 8 caractères.'; err.style.display = 'block'; return; }
      if (pwd !== conf)     { err.textContent = 'Les mots de passe ne correspondent pas.'; err.style.display = 'block'; return; }

      btn.textContent = 'Mise à jour...'; btn.disabled = true;
      var res = await db.auth.updateUser({ password: pwd });
      if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
      else {
        ok.style.display = 'block';
        document.getElementById('new-pwd').value     = '';
        document.getElementById('confirm-pwd').value = '';
      }
      btn.textContent = 'Mettre à jour'; btn.disabled = false;
    };
  }

  function row(label, val) {
    return '<div class="params-row">'
      + '<span class="params-label">' + label + '</span>'
      + '<span class="params-val">'   + val   + '</span>'
    + '</div>';
  }

})();
