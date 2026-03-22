/**
 * =====================================================
 *  THE DOG CIRCLE — Module Dog Sitting
 *  Fichier : garde.js
 *  Tables  : garde · demandes_garde
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', function () {
    injectUI();
    loadSitters();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'garde') loadSitters();
  });

  function injectUI() {
    var sec = document.getElementById('tc-garde');
    if (!sec || document.getElementById('garde-subtabs')) return;

    // Sous-onglets
    var subtabs = document.createElement('div');
    subtabs.id = 'garde-subtabs';
    subtabs.className = 'subtab-row';
    subtabs.innerHTML =
      '<button class="subtab active" id="gTabSitters">🐾 Dog sitters dispos</button>'
      + '<button class="subtab" id="gTabDemandes">📋 Demandes en cours</button>'
      + '<button class="subtab" id="gTabFaire">➕ Demander un dog sitter</button>'
      + '<button class="subtab" id="gTabProposer">🐕 Devenir dog sitter</button>';
    sec.insertBefore(subtabs, document.getElementById('gardeGrid'));

    // Panneau demandes publiques
    var panelDemandes = document.createElement('div');
    panelDemandes.id    = 'garde-demandes-list';
    panelDemandes.style = 'display:none;';
    panelDemandes.innerHTML = '<div id="demandes-grid" class="garde-grid"></div>';
    sec.appendChild(panelDemandes);

    // Panneau faire une demande
    var panelFaire = document.createElement('div');
    panelFaire.id    = 'garde-faire';
    panelFaire.style = 'display:none;';
    panelFaire.innerHTML =
      '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:520px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:20px;margin-bottom:6px;">➕ Demander un dog sitter</div>'
        + '<div style="font-size:13px;color:var(--t3);margin-bottom:20px;">Les membres disponibles pourront te contacter directement</div>'

        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Prénom de ton chien</label>'
          + '<input type="text" id="dem-chien" placeholder="Ex: Noisette" style="' + inputStyle() + '">'
        + '</div>'

        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Date de début</label>'
            + '<input type="date" id="dem-date-debut" style="' + inputStyle() + '">'
          + '</div>'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Date de fin</label>'
            + '<input type="date" id="dem-date-fin" style="' + inputStyle() + '">'
          + '</div>'
        + '</div>'

        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Ville</label>'
          + '<input type="text" id="dem-ville" placeholder="Ex: Paris 11e" style="' + inputStyle() + '">'
        + '</div>'

        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Infos sur ton chien</label>'
          + '<textarea id="dem-msg" placeholder="Race, caractère, besoins particuliers, allergies..." style="' + inputStyle() + 'resize:vertical;min-height:80px;"></textarea>'
        + '</div>'

        + '<div id="dem-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<button id="dem-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma demande 🐾</button>'
        + '<div id="dem-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Demande publiée ! Les dog sitters disponibles vont te contacter 🐾</div>'
      + '</div>';
    sec.appendChild(panelFaire);

    // Panneau proposer dispo
    var panelProposer = document.createElement('div');
    panelProposer.id    = 'garde-proposer';
    panelProposer.style = 'display:none;';
    panelProposer.innerHTML =
      '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:520px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:20px;margin-bottom:6px;">🐕 Devenir dog sitter</div>'
        + '<div style="font-size:13px;color:var(--t3);margin-bottom:20px;">Propose tes disponibilités aux membres du cercle</div>'

        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Ton prénom</label>'
            + '<input type="text" id="pro-prenom" value="' + (window.TDC.userPrenom||'') + '" style="' + inputStyle() + '">'
          + '</div>'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Ton chien</label>'
            + '<input type="text" id="pro-chien" placeholder="Noisette" style="' + inputStyle() + '">'
          + '</div>'
        + '</div>'

        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Race</label>'
            + '<input type="text" id="pro-race" placeholder="Cocker Spaniel" style="' + inputStyle() + '">'
          + '</div>'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Ville</label>'
            + '<input type="text" id="pro-ville" placeholder="Paris 11e" style="' + inputStyle() + '">'
          + '</div>'
        + '</div>'

        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Disponible à partir du</label>'
            + '<input type="date" id="pro-date-debut" style="' + inputStyle() + '">'
          + '</div>'
          + '<div>'
            + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Jusqu\'au</label>'
            + '<input type="date" id="pro-date-fin" style="' + inputStyle() + '">'
          + '</div>'
        + '</div>'

        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Mes préférences</label>'
          + '<input type="text" id="pro-tags" placeholder="Ex: Max 2 chiens, petits gabarits, jardins" style="' + inputStyle() + '">'
        + '</div>'

        + '<div id="pro-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<button id="pro-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma disponibilité 🐕</button>'
        + '<div id="pro-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Tu apparais dans la liste des dog sitters ! 🐾</div>'
      + '</div>';
    sec.appendChild(panelProposer);

    // Modal édition demande
    var modalEdit = document.createElement('div');
    modalEdit.id    = 'modal-edit-demande';
    modalEdit.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;padding:16px;';
    modalEdit.innerHTML =
      '<div style="background:var(--w);border-radius:20px;padding:28px;width:100%;max-width:460px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:20px;">✏️ Modifier ma demande</div>'
        + '<input type="hidden" id="edit-dem-id">'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Prénom de ton chien</label>'
          + '<input type="text" id="edit-dem-chien" style="' + inputStyle() + '">'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Date de début</label>'
            + '<input type="date" id="edit-dem-debut" style="' + inputStyle() + '"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Date de fin</label>'
            + '<input type="date" id="edit-dem-fin" style="' + inputStyle() + '"></div>'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Ville</label>'
          + '<input type="text" id="edit-dem-ville" style="' + inputStyle() + '">'
        + '</div>'
        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Infos</label>'
          + '<textarea id="edit-dem-msg" style="' + inputStyle() + 'resize:vertical;min-height:70px;"></textarea>'
        + '</div>'
        + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
          + '<button onclick="document.getElementById(\'modal-edit-demande\').style.display=\'none\'" style="padding:9px 18px;border-radius:8px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:13px;cursor:pointer;">Annuler</button>'
          + '<button id="edit-dem-submit" style="padding:9px 18px;border-radius:8px;background:var(--green);color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;">Enregistrer</button>'
        + '</div>'
      + '</div>';
    document.body.appendChild(modalEdit);

    // Bind
    document.getElementById('gTabSitters').addEventListener('click',  function () { showTab('sitters'); });
    document.getElementById('gTabDemandes').addEventListener('click', function () { showTab('demandes'); loadDemandes(); });
    document.getElementById('gTabFaire').addEventListener('click',    function () { showTab('faire'); });
    document.getElementById('gTabProposer').addEventListener('click', function () { showTab('proposer'); });
    document.getElementById('dem-submit').addEventListener('click',   saveDemande);
    document.getElementById('pro-submit').addEventListener('click',   saveProposition);
    document.getElementById('edit-dem-submit').addEventListener('click', updateDemande);
    modalEdit.addEventListener('click', function (e) { if (e.target === modalEdit) modalEdit.style.display = 'none'; });

    // Init dates min = aujourd'hui
    var today = new Date().toISOString().split('T')[0];
    ['dem-date-debut','dem-date-fin','pro-date-debut','pro-date-fin'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.min = today;
    });
  }

  function inputStyle() {
    return 'width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;';
  }

  function showTab(tab) {
    document.getElementById('gTabSitters').classList.toggle('active',  tab === 'sitters');
    document.getElementById('gTabDemandes').classList.toggle('active', tab === 'demandes');
    document.getElementById('gTabFaire').classList.toggle('active',    tab === 'faire');
    document.getElementById('gTabProposer').classList.toggle('active', tab === 'proposer');
    document.getElementById('gardeGrid').style.display           = tab === 'sitters'  ? 'grid'  : 'none';
    document.getElementById('garde-demandes-list').style.display = tab === 'demandes' ? 'block' : 'none';
    document.getElementById('garde-faire').style.display         = tab === 'faire'    ? 'block' : 'none';
    document.getElementById('garde-proposer').style.display      = tab === 'proposer' ? 'block' : 'none';
  }

  // ── Dog sitters dispos ───────────────────────────────
  function loadSitters() {
    var g = document.getElementById('gardeGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db.from('garde').select('*').eq('statut', 'actif').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucun dog sitter disponible 🐾<br><small style="color:var(--t3);">Sois le premier à proposer tes services !</small></div>';
          return;
        }
        var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
        var avatars  = ['🐕','🐩','🦮','🐕‍🦺','🐶','🐾'];

        g.innerHTML = res.data.map(function (s, i) {
          var tags = (s.tags||'').split(',').filter(Boolean).map(function (t) {
            return '<span class="garde-tag">' + t.trim() + '</span>';
          }).join('');

          // Afficher les dates proprement
          var dispo = '';
          if (s.dispo && s.dispo.includes('|')) {
            var parts = s.dispo.split('|');
            dispo = '📅 Du ' + formatDate(parts[0]) + ' au ' + formatDate(parts[1]);
          } else {
            dispo = s.dispo || 'Disponible';
          }

          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bgColors[i%6] + '">' + avatars[i%6] + '</div>'
            + '<div class="garde-name">' + s.prenom + '</div>'
            + '<div class="garde-dog">' + (s.chien||'—') + (s.race ? ' · ' + s.race : '') + '</div>'
            + (s.ville ? '<div style="font-size:11px;color:var(--t3);margin-bottom:4px;">📍 ' + s.ville + '</div>' : '')
            + '<div class="garde-tags">' + tags + '</div>'
            + '<div class="garde-dispo">● ' + dispo + '</div>'
            + '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;" onclick="window.location.href=\'mailto:' + (s.email||'thedogcircleclub@gmail.com') + '?subject=Dog sitting - ' + encodeURIComponent(s.prenom) + '\'">Contacter</button>'
          + '</div>';
        }).join('');
      });
  }

  // ── Demandes publiques ───────────────────────────────
  function loadDemandes() {
    var g = document.getElementById('demandes-grid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db.from('demandes_garde').select('*').eq('statut', 'en_attente').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucune demande en cours 🐾<br><small>Sois le premier à en publier une !</small></div>';
          return;
        }

        window._gardeDemandesData = res.data;
        var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];

        g.innerHTML = res.data.map(function (d, i) {
          var isOwn = d.membre_email === window.TDC.userEmail;
          var dates = '';
          if (d.dates && d.dates.includes('|')) {
            var p = d.dates.split('|');
            dates = '📅 Du ' + formatDate(p[0]) + ' au ' + formatDate(p[1]);
          } else if (d.dates) {
            dates = '📅 ' + d.dates;
          }

          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bgColors[i%6] + '">🐾</div>'
            + '<div class="garde-name">' + (d.membre_prenom||'Membre') + '</div>'
            + '<div class="garde-dog">' + (d.chien||'—') + '</div>'
            + (dates ? '<div class="garde-dispo" style="color:var(--gold);font-size:11px;margin-bottom:4px;">' + dates + '</div>' : '')
            + (d.ville ? '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">📍 ' + d.ville + '</div>' : '')
            + (d.message ? '<div style="font-size:11px;color:var(--t2);line-height:1.5;margin-bottom:10px;">"' + d.message.substring(0,80) + (d.message.length>80?'…':'') + '"</div>' : '')
            + (isOwn
              ? '<div style="display:flex;gap:6px;">'
                  + '<button class="btn btn-o"      style="flex:1;padding:6px;font-size:11px;" data-garde-edit="'   + d.id + '">✏️ Modifier</button>'
                  + '<button class="btn btn-danger" style="flex:1;padding:6px;font-size:11px;" data-garde-delete="' + d.id + '">🗑️ Retirer</button>'
                + '</div>'
              : '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;" onclick="window.location.href=\'mailto:' + (d.membre_email||'thedogcircleclub@gmail.com') + '?subject=Je suis disponible - Dog sitting de ' + encodeURIComponent(d.chien||'votre chien') + '&body=Bonjour ' + encodeURIComponent(d.membre_prenom||'') + ', je suis disponible pour garder ' + encodeURIComponent(d.chien||'votre chien') + '. Mon email : ' + encodeURIComponent(window.TDC.userEmail) + '\'">Je suis disponible !</button>')
          + '</div>';
        }).join('');

        g.onclick = function (e) {
          var btnEdit   = e.target.closest('[data-garde-edit]');
          var btnDelete = e.target.closest('[data-garde-delete]');
          if (btnEdit) {
            var d = (window._gardeDemandesData||[]).find(function (x) { return String(x.id) === btnEdit.dataset.gardeEdit; });
            if (d) editDemande(d);
          }
          if (btnDelete) deleteDemande(btnDelete.dataset.gardeDelete);
        };
      });
  }

  // ── Éditer demande ───────────────────────────────────
  function editDemande(d) {
    document.getElementById('edit-dem-id').value    = d.id;
    document.getElementById('edit-dem-chien').value = d.chien || '';
    document.getElementById('edit-dem-ville').value = d.ville || '';
    document.getElementById('edit-dem-msg').value   = d.message || '';

    // Parser les dates stockées en format "debut|fin"
    if (d.dates && d.dates.includes('|')) {
      var p = d.dates.split('|');
      document.getElementById('edit-dem-debut').value = p[0] || '';
      document.getElementById('edit-dem-fin').value   = p[1] || '';
    } else {
      document.getElementById('edit-dem-debut').value = '';
      document.getElementById('edit-dem-fin').value   = '';
    }
    document.getElementById('modal-edit-demande').style.display = 'flex';
  }

  async function updateDemande() {
    var db  = window.TDC.db;
    var id  = document.getElementById('edit-dem-id').value;
    var btn = document.getElementById('edit-dem-submit');
    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var debut = document.getElementById('edit-dem-debut').value;
    var fin   = document.getElementById('edit-dem-fin').value;
    var dates = debut && fin ? debut + '|' + fin : (debut || fin || '');

    var res = await db.from('demandes_garde').update({
      chien:   document.getElementById('edit-dem-chien').value,
      dates:   dates,
      ville:   document.getElementById('edit-dem-ville').value,
      message: document.getElementById('edit-dem-msg').value
    }).eq('id', id).eq('membre_email', window.TDC.userEmail);

    if (res.error) { alert('Erreur : ' + res.error.message); }
    else { document.getElementById('modal-edit-demande').style.display = 'none'; loadDemandes(); }

    btn.textContent = 'Enregistrer'; btn.disabled = false;
  }

  // ── Supprimer demande ────────────────────────────────
  async function deleteDemande(id) {
    if (!confirm('Retirer ta demande ?')) return;
    var res = await window.TDC.db.from('demandes_garde').delete().eq('id', id).eq('membre_email', window.TDC.userEmail);
    if (res.error) { alert('Erreur : ' + res.error.message); return; }
    loadDemandes();
  }

  // ── Publier demande ──────────────────────────────────
  async function saveDemande() {
    var db    = window.TDC.db;
    var chien = document.getElementById('dem-chien').value.trim();
    var debut = document.getElementById('dem-date-debut').value;
    var fin   = document.getElementById('dem-date-fin').value;
    var err   = document.getElementById('dem-err');
    var btn   = document.getElementById('dem-submit');

    err.style.display = 'none';
    if (!chien) { err.textContent = 'Le prénom de ton chien est obligatoire.'; err.style.display = 'block'; return; }
    if (!debut) { err.textContent = 'La date de début est obligatoire.'; err.style.display = 'block'; return; }
    if (!fin)   { err.textContent = 'La date de fin est obligatoire.'; err.style.display = 'block'; return; }
    if (fin < debut) { err.textContent = 'La date de fin doit être après la date de début.'; err.style.display = 'block'; return; }

    btn.textContent = 'Publication...'; btn.disabled = true;

    var res = await db.from('demandes_garde').insert([{
      membre_email:  window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom,
      chien:         chien,
      dates:         debut + '|' + fin,
      ville:         document.getElementById('dem-ville').value,
      message:       document.getElementById('dem-msg').value,
      statut:        'en_attente'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('dem-ok').style.display = 'block';
      ['dem-chien','dem-date-debut','dem-date-fin','dem-ville','dem-msg'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      setTimeout(function () {
        document.getElementById('dem-ok').style.display = 'none';
        showTab('demandes'); loadDemandes();
      }, 2000);
    }
    btn.textContent = 'Publier ma demande 🐾'; btn.disabled = false;
  }

  // ── Devenir dog sitter ───────────────────────────────
  async function saveProposition() {
    var db     = window.TDC.db;
    var prenom = document.getElementById('pro-prenom').value.trim();
    var debut  = document.getElementById('pro-date-debut').value;
    var fin    = document.getElementById('pro-date-fin').value;
    var err    = document.getElementById('pro-err');
    var btn    = document.getElementById('pro-submit');

    err.style.display = 'none';
    if (!prenom) { err.textContent = 'Ton prénom est obligatoire.'; err.style.display = 'block'; return; }
    if (!debut)  { err.textContent = 'La date de début est obligatoire.'; err.style.display = 'block'; return; }

    btn.textContent = 'Publication...'; btn.disabled = true;

    var dispo = debut && fin ? debut + '|' + fin : (debut || 'Disponible');

    var res = await db.from('garde').insert([{
      prenom: prenom,
      chien:  document.getElementById('pro-chien').value,
      race:   document.getElementById('pro-race').value,
      ville:  document.getElementById('pro-ville').value,
      dispo:  dispo,
      tags:   document.getElementById('pro-tags').value,
      email:  window.TDC.userEmail,
      statut: 'actif'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('pro-ok').style.display = 'block';
      ['pro-chien','pro-race','pro-ville','pro-date-debut','pro-date-fin','pro-tags'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      setTimeout(function () {
        document.getElementById('pro-ok').style.display = 'none';
        showTab('sitters'); loadSitters();
      }, 2000);
    }
    btn.textContent = 'Publier ma disponibilité 🐕'; btn.disabled = false;
  }

  // ── Formater une date YYYY-MM-DD → DD/MM/YYYY ───────
  function formatDate(str) {
    if (!str) return '';
    var p = str.split('-');
    if (p.length !== 3) return str;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

})();
