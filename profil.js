/**
 * =====================================================
 *  THE DOG CIRCLE — Module Profil v2
 *  Fichier : profil.js
 *  Design  : Passeport canin premium
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

    var m           = membreData || window.TDC.userMembre || {};
    var prenom      = m.prenom      || window.TDC.userPrenom || 'Membre';
    var nom         = m.nom         || '';
    var chien       = m.chien       || '—';
    var race        = m.race        || '—';
    var ville       = m.ville       || '—';
    var formule     = m.formule     || '—';
    var numero      = m.numero_membre ? String(m.numero_membre).padStart(3,'0') : '—';
    var codeParrain = m.code_parrain || '—';
    var photoProfil     = m.photo_profil || null;
    var dateNaissanceMaitre = m.date_naissance || null;
    var ageMaitre = dateNaissanceMaitre ? calculerAge(dateNaissanceMaitre) : null;
    var photoChien  = m.photo_chien  || null;

    // Infos chien
    var dateNaissance = m.date_naissance_chien || null;
    var age = dateNaissance ? calculerAge(dateNaissance) : null;
    var couleurYeux   = m.couleur_yeux        || '—';
    var couleurRobe   = m.couleur_robe        || '—';
    var situation     = m.situation_amoureuse || '—';

    c.innerHTML =

      // ── CARTE MEMBRE ──────────────────────────────────
      '<div style="background:var(--green);border-radius:20px;padding:0;overflow:hidden;margin-bottom:20px;position:relative;">'

        // Fond décoratif
        + '<div style="position:absolute;top:-30px;right:-30px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>'
        + '<div style="position:absolute;bottom:-20px;left:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>'

        + '<div style="padding:24px 28px;position:relative;z-index:1;">'

          // Header carte
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">'
            + '<div>'
              + '<div style="font-size:9px;color:rgba(246,240,228,0.5);text-transform:uppercase;letter-spacing:.15em;margin-bottom:4px;">The Dog Circle</div>'
              + '<div style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;font-weight:500;">Carte Membre</div>'
            + '</div>'
            + '<div style="text-align:right;">'
              + '<div style="font-size:9px;color:rgba(246,240,228,0.5);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px;">N°</div>'
              + '<div style="font-family:\'Playfair Display\',serif;font-size:28px;color:var(--cream);font-weight:600;line-height:1;">#' + numero + '</div>'
            + '</div>'
          + '</div>'

          // Avatar + Nom
          + '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">'
            + '<div style="position:relative;flex-shrink:0;">'
              + '<div id="profil-avatar-wrap" style="width:64px;height:64px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;color:#fff;overflow:hidden;border:3px solid rgba(255,255,255,0.2);cursor:pointer;" onclick="document.getElementById(\'profil-photo-input\').click()">'
                + (photoProfil
                  ? '<img src="' + photoProfil + '" style="width:100%;height:100%;object-fit:cover;" alt="">'
                  : '<span style="color:#fff;">' + prenom[0].toUpperCase() + '</span>')
              + '</div>'
              + '<div style="position:absolute;bottom:0;right:0;width:20px;height:20px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;border:2px solid var(--green);" onclick="document.getElementById(\'profil-photo-input\').click()">✏️</div>'
              + '<input type="file" id="profil-photo-input" accept="image/*" style="display:none;" onchange="window._TDC_uploadProfilPhoto(this)">'
            + '</div>'
            + '<div>'
              + '<div style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--cream);font-weight:400;">' + prenom + (nom ? ' ' + nom.toUpperCase() : '') + '</div>'
              + '<div style="font-size:12px;color:rgba(246,240,228,0.6);margin-top:2px;">📍 ' + ville + (ageMaitre ? ' · ' + ageMaitre : '') + '</div>'
              + '<div style="display:inline-flex;align-items:center;gap:5px;background:var(--gold);color:#fff;font-size:10px;padding:3px 10px;border-radius:100px;margin-top:6px;font-weight:500;">⭐ Membre Fondateur</div>'
            + '</div>'
          + '</div>'

          // Code parrain
          + '<div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">'
            + '<div>'
              + '<div style="font-size:9px;color:rgba(246,240,228,0.5);text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px;">🎁 Ton code parrain</div>'
              + '<div style="font-family:monospace;font-size:18px;color:var(--cream);font-weight:600;letter-spacing:.1em;">' + codeParrain + '</div>'
            + '</div>'
            + (codeParrain !== '—'
              ? '<button onclick="navigator.clipboard.writeText(\'' + codeParrain + '\').then(function(){window._TDC_toast(\'Code copié ! 🐾\')})" style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500;">Copier</button>'
              : '')
          + '</div>'

        + '</div>'
      + '</div>'

      // ── PASSEPORT CANIN ───────────────────────────────
      + '<div style="background:var(--cream);border-radius:20px;padding:0;overflow:hidden;margin-bottom:20px;border:1px solid var(--b);">'

        // Header passeport
        + '<div style="background:var(--gold);padding:14px 24px;display:flex;justify-content:space-between;align-items:center;">'
          + '<div>'
            + '<div style="font-size:9px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.15em;margin-bottom:2px;">Passeport Canin</div>'
            + '<div style="font-family:\'Playfair Display\',serif;font-size:16px;color:#fff;font-weight:400;">The Dog Circle</div>'
          + '</div>'
          + '<div style="font-size:28px;">🐾</div>'
        + '</div>'

        + '<div style="padding:20px 24px;">'
          + '<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;">'

            // Photo chien
            + '<div style="flex-shrink:0;position:relative;">'
              + '<div style="width:80px;height:80px;border-radius:14px;background:var(--greenp);overflow:hidden;border:2px solid var(--b);cursor:pointer;" onclick="document.getElementById(\'chien-photo-input\').click()">'
                + (photoChien
                  ? '<img src="' + photoChien + '" style="width:100%;height:100%;object-fit:cover;" alt="">'
                  : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">🐕</div>')
              + '</div>'
              + '<div style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;border:2px solid var(--cream);" onclick="document.getElementById(\'chien-photo-input\').click()">✏️</div>'
              + '<input type="file" id="chien-photo-input" accept="image/*" style="display:none;" onchange="window._TDC_uploadChienPhoto(this)">'
            + '</div>'

            // Infos chien
            + '<div style="flex:1;">'
              + '<div style="font-family:\'Playfair Display\',serif;font-size:20px;color:var(--t);margin-bottom:4px;">' + chien + '</div>'
              + '<div style="font-size:13px;color:var(--t2);margin-bottom:2px;">🏷️ ' + race + '</div>'
              + (dateNaissance ? '<div style="font-size:12px;color:var(--t3);">📅 Né(e) le ' + formatDate(dateNaissance) + (age ? ' · ' + age : '') + '</div>' : '')
            + '</div>'
          + '</div>'

          // Grille infos
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
            + passeportField('👁️', 'Couleur des yeux', couleurYeux)
            + passeportField('🎨', 'Couleur de robe', couleurRobe)
            + passeportField('💛', 'Situation', situation)
            + passeportField('📍', 'Ville', ville)
          + '</div>'

          // Bouton modifier
          + '<button onclick="window._TDC_openEditModal()" style="width:100%;margin-top:16px;padding:11px;border-radius:100px;border:1.5px solid var(--green);background:transparent;color:var(--green);font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;">✏️ Modifier mes informations</button>'

        + '</div>'
      + '</div>'

      // Modal édition (injecté dans le DOM)
      + '';

    injectEditModal(m);
    window._TDC_toast = toast;
    window._TDC_openEditModal = openEditModal;
    window._TDC_uploadProfilPhoto = uploadProfilPhoto;
    window._TDC_uploadChienPhoto  = uploadChienPhoto;
  }

  function passeportField(icon, label, val) {
    return '<div style="background:var(--w);border-radius:12px;padding:12px 14px;border:1px solid var(--b);">'
      + '<div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">' + icon + ' ' + label + '</div>'
      + '<div style="font-size:14px;font-weight:500;color:var(--t);">' + val + '</div>'
    + '</div>';
  }

  function calculerAge(dateStr) {
    try {
      var parts = dateStr.split('/');
      var d = parts.length === 3 ? new Date(parts[2], parts[1]-1, parts[0]) : new Date(dateStr);
      var mois = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24 * 30.5));
      if (mois < 12) return mois + ' mois';
      var ans = Math.floor(mois / 12);
      return ans + ' an' + (ans > 1 ? 's' : '');
    } catch(e) { return null; }
  }

  function formatDate(dateStr) {
    try {
      var parts = dateStr.split('/');
      if (parts.length === 3) return dateStr;
      var d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR');
    } catch(e) { return dateStr; }
  }

  // ── Modal édition ────────────────────────────────────
  function injectEditModal(m) {
    var existing = document.getElementById('modal-edit-profil');
    if (existing) existing.remove();

    var inp = 'width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;';

    var situations = ['Célibataire 🐾','En couple 💑','Marié(e) 💍','Cherche l\'amour 💘','Ne cherche pas ❌'];
    var sitOptions = situations.map(function(s) {
      return '<option value="' + s + '"' + (m.situation_amoureuse === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

    var modal = document.createElement('div');
    modal.id    = 'modal-edit-profil';
    modal.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:2000;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
    modal.innerHTML =
      '<div style="background:var(--w);border-radius:20px;width:100%;max-width:480px;margin:40px auto;overflow:hidden;">'

        + '<div style="background:var(--green);padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">'
          + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;color:var(--cream);">✏️ Modifier mes infos</div>'
          + '<button onclick="document.getElementById(\'modal-edit-profil\').style.display=\'none\'" style="background:transparent;border:none;color:rgba(246,240,228,0.7);font-size:20px;cursor:pointer;">✕</button>'
        + '</div>'

        + '<div style="padding:24px;">'

          // Section maître
          + '<div style="font-size:11px;font-weight:500;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">👤 Informations maître</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Prénom</label><input type="text" id="edit-prenom" value="' + (m.prenom||'') + '" style="' + inp + '"></div>'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Nom</label><input type="text" id="edit-nom" value="' + (m.nom||'') + '" style="' + inp + '"></div>'
          + '</div>'
          + '<div style="margin-bottom:12px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ville</label><input type="text" id="edit-ville" value="' + (m.ville||'') + '" style="' + inp + '"></div>'
          + '<div style="margin-bottom:20px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ta date de naissance (JJ/MM/AAAA)</label><input type="text" id="edit-naissance-maitre" value="' + (m.date_naissance||'') + '" placeholder="Ex: 15/06/1990" style="' + inp + '"></div>'

          // Section chien
          + '<div style="font-size:11px;font-weight:500;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">🐾 Passeport canin</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Prénom du chien</label><input type="text" id="edit-chien" value="' + (m.chien||'') + '" style="' + inp + '"></div>'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Race</label><input type="text" id="edit-race" value="' + (m.race||'') + '" style="' + inp + '"></div>'
          + '</div>'
          + '<div style="margin-bottom:12px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Date de naissance (JJ/MM/AAAA)</label><input type="text" id="edit-naissance" value="' + (m.date_naissance_chien||'') + '" placeholder="Ex: 15/06/2021" style="' + inp + '"></div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Couleur des yeux</label><input type="text" id="edit-yeux" value="' + (m.couleur_yeux||'') + '" placeholder="Ex: Noisette" style="' + inp + '"></div>'
            + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Couleur de robe</label><input type="text" id="edit-robe" value="' + (m.couleur_robe||'') + '" placeholder="Ex: Roux doré" style="' + inp + '"></div>'
          + '</div>'
          + '<div style="margin-bottom:24px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Situation amoureuse 💛</label>'
            + '<select id="edit-situation" style="' + inp + '">'
              + '<option value="">— Choisir —</option>'
              + sitOptions
            + '</select>'
          + '</div>'

          + '<div id="edit-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
          + '<button id="edit-submit" onclick="window._TDC_saveProfile()" style="width:100%;padding:13px;border-radius:100px;background:var(--green);color:#fff;border:none;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;">Enregistrer les modifications ✓</button>'

        + '</div>'
      + '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });

    window._TDC_saveProfile = saveProfile;
  }

  function openEditModal() {
    var modal = document.getElementById('modal-edit-profil');
    if (modal) modal.style.display = 'flex';
  }

  // ── Sauvegarder profil ───────────────────────────────
  async function saveProfile() {
    var db  = window.TDC.db;
    var btn = document.getElementById('edit-submit');
    var err = document.getElementById('edit-err');
    err.style.display = 'none';
    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var payload = {
      prenom:                get('edit-prenom'),
      nom:                   get('edit-nom'),
      ville:                 get('edit-ville'),
      chien:                 get('edit-chien'),
      race:                  get('edit-race'),
      date_naissance:        get('edit-naissance-maitre') || null,
      date_naissance_chien:  get('edit-naissance') || null,
      couleur_yeux:          get('edit-yeux')      || null,
      couleur_robe:          get('edit-robe')      || null,
      situation_amoureuse:   get('edit-situation') || null
    };

    var res = await db.from('membres').update(payload).eq('email', window.TDC.userEmail);
    if (res.error) {
      err.textContent = 'Erreur : ' + res.error.message;
      err.style.display = 'block';
    } else {
      document.getElementById('modal-edit-profil').style.display = 'none';
      toast('Profil mis à jour ! 🐾');
      // Recharger
      window.TDC.userPrenom = payload.prenom || window.TDC.userPrenom;
      membreData = Object.assign(membreData || {}, payload);
      buildPasseport();
    }
    btn.textContent = 'Enregistrer les modifications ✓'; btn.disabled = false;
  }

  function get(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ── Upload photo profil ──────────────────────────────
  async function uploadProfilPhoto(input) {
    var file = input.files[0];
    if (!file) return;
    toast('Upload en cours...');
    try {
      var db  = window.TDC.db;
      var ext = file.name.split('.').pop().toLowerCase();
      var fileName = 'profils/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
      var up = await db.storage.from('Photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (up.error) throw up.error;
      var url = db.storage.from('Photos').getPublicUrl(fileName).data.publicUrl;
      var res = await db.from('membres').update({ photo_profil: url }).eq('email', window.TDC.userEmail);
      if (res.error) throw res.error;
      if (membreData) membreData.photo_profil = url;
      buildPasseport();
      toast('Photo de profil mise à jour ! 🐾');
    } catch(e) { toast('Erreur : ' + e.message); }
  }

  // ── Upload photo chien ───────────────────────────────
  async function uploadChienPhoto(input) {
    var file = input.files[0];
    if (!file) return;
    toast('Upload en cours...');
    try {
      var db  = window.TDC.db;
      var ext = file.name.split('.').pop().toLowerCase();
      var fileName = 'chiens/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
      var up = await db.storage.from('Photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (up.error) throw up.error;
      var url = db.storage.from('Photos').getPublicUrl(fileName).data.publicUrl;
      var res = await db.from('membres').update({ photo_chien: url }).eq('email', window.TDC.userEmail);
      if (res.error) throw res.error;
      if (membreData) membreData.photo_chien = url;
      buildPasseport();
      toast('Photo de ' + (membreData && membreData.chien ? membreData.chien : 'ton chien') + ' mise à jour ! 🐾');
    } catch(e) { toast('Erreur : ' + e.message); }
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
      + '<div class="params-section" style="margin-bottom:20px;">'
        + row('✉️ Email',               window.TDC.userEmail || '—')
        + row('🔔 Notifications events', 'Activées')
        + row('📧 Newsletter mensuelle', 'Activée')
      + '</div>'

      + '<div style="background:var(--w);border:1px solid var(--b);border-radius:14px;padding:20px;">'
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
        + '<button id="pwd-submit" class="btn btn-p" style="font-size:13px;width:100%;justify-content:center;padding:12px;" onclick="changePwd()">Mettre à jour</button>'
      + '</div>';

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

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style = 'position:fixed;bottom:24px;right:24px;background:var(--green);color:var(--cream);padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

})();
