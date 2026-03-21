/**
 * =====================================================
 *  THE DOG CIRCLE — Module Garde
 *  Fichier : garde.js
 *  Tables  : garde · demandes_garde
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', function () {
    injectGardeUI();
    loadGarde();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'garde') loadGarde();
  });

  function injectGardeUI() {
    var sec = document.getElementById('tc-garde');
    if (!sec || document.getElementById('garde-subtabs')) return;

    var subtabs = document.createElement('div');
    subtabs.id = 'garde-subtabs';
    subtabs.className = 'subtab-row';
    subtabs.innerHTML =
      '<button class="subtab active" id="gTabGardiens">🏠 Gardiens dispos</button>'
      + '<button class="subtab" id="gTabDemandes">📋 Demandes en cours</button>'
      + '<button class="subtab" id="gTabFaire">🐾 Faire une demande</button>'
      + '<button class="subtab" id="gTabProposer">➕ Proposer ma dispo</button>';
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
    panelFaire.innerHTML = buildDemandeForm();
    sec.appendChild(panelFaire);

    // Panneau proposer dispo
    var panelProposer = document.createElement('div');
    panelProposer.id    = 'garde-proposer';
    panelProposer.style = 'display:none;';
    panelProposer.innerHTML = buildProposerForm();
    sec.appendChild(panelProposer);

    // Modal édition demande
    var modalEdit = document.createElement('div');
    modalEdit.id    = 'modal-edit-demande';
    modalEdit.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;padding:16px;';
    modalEdit.innerHTML =
      '<div style="background:var(--w);border-radius:20px;padding:28px;width:100%;max-width:440px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:20px;">✏️ Modifier ma demande</div>'
        + '<input type="hidden" id="edit-dem-id">'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Prénom de ton chien</label>'
          + '<input type="text" id="edit-dem-chien" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Dates</label>'
            + '<input type="text" id="edit-dem-dates" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ville</label>'
            + '<input type="text" id="edit-dem-ville" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '</div>'
        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Infos sur ton chien</label>'
          + '<textarea id="edit-dem-msg" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;resize:vertical;min-height:80px;"></textarea>'
        + '</div>'
        + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
          + '<button onclick="document.getElementById(\'modal-edit-demande\').style.display=\'none\'" style="padding:9px 18px;border-radius:8px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:13px;cursor:pointer;">Annuler</button>'
          + '<button id="edit-dem-submit" style="padding:9px 18px;border-radius:8px;background:var(--green);color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;">Enregistrer</button>'
        + '</div>'
      + '</div>';
    document.body.appendChild(modalEdit);

    // Bind
    document.getElementById('gTabGardiens').addEventListener('click', function () { showGardeTab('gardiens'); });
    document.getElementById('gTabDemandes').addEventListener('click', function () { showGardeTab('demandes'); loadDemandes(); });
    document.getElementById('gTabFaire').addEventListener('click',    function () { showGardeTab('faire'); });
    document.getElementById('gTabProposer').addEventListener('click', function () { showGardeTab('proposer'); });
    document.getElementById('dem-submit').addEventListener('click', saveDemande);
    document.getElementById('pro-submit').addEventListener('click', saveProposition);
    document.getElementById('edit-dem-submit').addEventListener('click', updateDemande);
    modalEdit.addEventListener('click', function (e) { if (e.target === modalEdit) modalEdit.style.display = 'none'; });
  }

  function showGardeTab(tab) {
    ['gTabGardiens','gTabDemandes','gTabFaire','gTabProposer'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === 'gTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    });
    document.getElementById('gardeGrid').style.display           = tab === 'gardiens' ? 'grid'  : 'none';
    document.getElementById('garde-demandes-list').style.display = tab === 'demandes' ? 'block' : 'none';
    document.getElementById('garde-faire').style.display         = tab === 'faire'    ? 'block' : 'none';
    document.getElementById('garde-proposer').style.display      = tab === 'proposer' ? 'block' : 'none';
  }

  // ── Gardiens dispos ──────────────────────────────────
  function loadGarde() {
    var g = document.getElementById('gardeGrid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';
    window.TDC.db.from('garde').select('*').eq('statut', 'actif').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }
        if (!res.data || res.data.length === 0) {
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucun gardien disponible 🐾<br><small style="color:var(--t3);">Propose ta dispo !</small></div>';
          return;
        }
        var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
        var avatars  = ['🐕','🐩','🦮','🐕‍🦺','🐶','🐾'];
        g.innerHTML = res.data.map(function (gd, i) {
          var tags = (gd.tags||'').split(',').map(function (t) { return '<span class="garde-tag">' + t.trim() + '</span>'; }).join('');
          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bgColors[i%6] + '">' + avatars[i%6] + '</div>'
            + '<div class="garde-name">' + gd.prenom + '</div>'
            + '<div class="garde-dog">' + (gd.chien||'—') + (gd.race ? ' · ' + gd.race : '') + '</div>'
            + '<div class="garde-tags">' + tags + '</div>'
            + '<div class="garde-dispo">● ' + (gd.dispo||'Disponible') + '</div>'
            + '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;" onclick="window.location.href=\'mailto:' + (gd.email||'thedogcircleclub@gmail.com') + '?subject=Garde - ' + encodeURIComponent(gd.prenom) + '\'">Contacter</button>'
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
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucune demande en cours 🐾<br><small>Sois le premier à en faire une !</small></div>';
          return;
        }
        // Stocker les données pour edit
        window._gardeDemandesData = res.data;

        // Délégation clics
        var grid = document.getElementById('demandes-grid');
        grid.onclick = function (e) {
          var btnEdit   = e.target.closest('[data-garde-edit]');
          var btnDelete = e.target.closest('[data-garde-delete]');
          if (btnEdit) {
            var d = window._gardeDemandesData.find(function (x) { return String(x.id) === btnEdit.dataset.gardeEdit; });
            if (d) editDemande(d);
          }
          if (btnDelete) deleteDemande(btnDelete.dataset.gardeDelete);
        };
          var isOwn = d.membre_email === window.TDC.userEmail;
          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bgColors[i%6] + '">🐾</div>'
            + '<div class="garde-name">' + (d.membre_prenom||'Membre') + '</div>'
            + '<div class="garde-dog">' + (d.chien||'—') + '</div>'
            + (d.dates   ? '<div class="garde-dispo" style="color:var(--gold);">📅 ' + d.dates + '</div>' : '')
            + (d.ville   ? '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">📍 ' + d.ville + '</div>' : '')
            + (d.message ? '<div style="font-size:11px;color:var(--t2);line-height:1.5;margin-bottom:10px;">"' + d.message.substring(0,80) + (d.message.length>80?'...':'') + '"</div>' : '')
            + (isOwn
              ? '<div style="display:flex;gap:6px;">'
                  + '<button class="btn btn-o"     style="flex:1;padding:6px;font-size:11px;" data-garde-edit="' + d.id + '">✏️ Modifier</button>'
                  + '<button class="btn btn-danger" style="flex:1;padding:6px;font-size:11px;" data-garde-delete="' + d.id + '">🗑️ Supprimer</button>'
                + '</div>'
              : '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;" onclick="window.location.href=\'mailto:' + (d.membre_email||'thedogcircleclub@gmail.com') + '?subject=Je suis dispo - Garde de ' + encodeURIComponent(d.chien||'votre chien') + '&body=Bonjour ' + encodeURIComponent(d.membre_prenom||'') + ', je suis disponible pour garder ' + encodeURIComponent(d.chien||'votre chien') + ' du ' + encodeURIComponent(d.dates||'') + '. Mon email : ' + encodeURIComponent(window.TDC.userEmail) + '\'">Je suis dispo !</button>')
          + '</div>';
        }).join('');
      });
  }

  // ── Éditer une demande ───────────────────────────────
  function editDemande(d) {
    document.getElementById('edit-dem-id').value    = d.id;
    document.getElementById('edit-dem-chien').value = d.chien  || '';
    document.getElementById('edit-dem-dates').value = d.dates  || '';
    document.getElementById('edit-dem-ville').value = d.ville  || '';
    document.getElementById('edit-dem-msg').value   = d.message|| '';
    document.getElementById('modal-edit-demande').style.display = 'flex';
  }

  async function updateDemande() {
    var db  = window.TDC.db;
    var id  = document.getElementById('edit-dem-id').value;
    var btn = document.getElementById('edit-dem-submit');
    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var res = await db.from('demandes_garde').update({
      chien:   document.getElementById('edit-dem-chien').value,
      dates:   document.getElementById('edit-dem-dates').value,
      ville:   document.getElementById('edit-dem-ville').value,
      message: document.getElementById('edit-dem-msg').value
    }).eq('id', id).eq('membre_email', window.TDC.userEmail);

    if (res.error) { alert('Erreur : ' + res.error.message); }
    else {
      document.getElementById('modal-edit-demande').style.display = 'none';
      loadDemandes();
    }
    btn.textContent = 'Enregistrer'; btn.disabled = false;
  }

  // ── Supprimer une demande ────────────────────────────
  async function deleteDemande(id) {
    if (!confirm('Supprimer ta demande ?')) return;
    var res = await window.TDC.db.from('demandes_garde').delete().eq('id', id).eq('membre_email', window.TDC.userEmail);
    if (res.error) { alert('Erreur : ' + res.error.message); return; }
    loadDemandes();
  }

  // ── Sauvegarder demande ──────────────────────────────
  async function saveDemande() {
    var db    = window.TDC.db;
    var chien = document.getElementById('dem-chien').value.trim();
    var err   = document.getElementById('dem-err');
    var btn   = document.getElementById('dem-submit');
    err.style.display = 'none';
    if (!chien) { err.textContent = 'Le prénom de ton chien est obligatoire.'; err.style.display = 'block'; return; }
    btn.textContent = 'Publication...'; btn.disabled = true;

    var res = await db.from('demandes_garde').insert([{
      membre_email:  window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom,
      chien:         chien,
      dates:         document.getElementById('dem-dates').value,
      ville:         document.getElementById('dem-ville').value,
      message:       document.getElementById('dem-msg').value,
      statut:        'en_attente'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('dem-ok').style.display = 'block';
      ['dem-chien','dem-dates','dem-ville','dem-msg'].forEach(function (id) { document.getElementById(id).value = ''; });
      setTimeout(function () {
        document.getElementById('dem-ok').style.display = 'none';
        showGardeTab('demandes'); loadDemandes();
      }, 2000);
    }
    btn.textContent = 'Publier ma demande 🐾'; btn.disabled = false;
  }

  // ── Sauvegarder proposition ──────────────────────────
  async function saveProposition() {
    var db     = window.TDC.db;
    var prenom = document.getElementById('pro-prenom').value.trim();
    var err    = document.getElementById('pro-err');
    var btn    = document.getElementById('pro-submit');
    err.style.display = 'none';
    if (!prenom) { err.textContent = 'Ton prénom est obligatoire.'; err.style.display = 'block'; return; }
    btn.textContent = 'Publication...'; btn.disabled = true;

    var res = await db.from('garde').insert([{
      prenom: prenom,
      chien:  document.getElementById('pro-chien').value,
      race:   document.getElementById('pro-race').value,
      ville:  document.getElementById('pro-ville').value,
      dispo:  document.getElementById('pro-dispo').value,
      tags:   document.getElementById('pro-tags').value,
      email:  window.TDC.userEmail,
      statut: 'actif'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('pro-ok').style.display = 'block';
      ['pro-chien','pro-race','pro-ville','pro-dispo','pro-tags'].forEach(function (id) { document.getElementById(id).value = ''; });
      setTimeout(function () { document.getElementById('pro-ok').style.display = 'none'; showGardeTab('gardiens'); loadGarde(); }, 2000);
    }
    btn.textContent = 'Publier ma disponibilité 🐾'; btn.disabled = false;
  }

  // ── Formulaires HTML ─────────────────────────────────
  function buildDemandeForm() {
    return '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:500px;">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:16px;">🐾 Faire une demande de garde</div>'
      + field('dem-chien','Prénom de ton chien','Ex: Noisette','text')
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
        + '<div>' + fieldRaw('dem-dates','Dates souhaitées','Ex: 15-20 juin','text') + '</div>'
        + '<div>' + fieldRaw('dem-ville','Ville','Ex: Paris','text') + '</div>'
      + '</div>'
      + '<div style="margin-bottom:20px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Infos sur ton chien</label>'
        + '<textarea id="dem-msg" placeholder="Race, caractère, besoins particuliers..." style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;resize:vertical;min-height:80px;"></textarea></div>'
      + '<div id="dem-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
      + '<button id="dem-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma demande 🐾</button>'
      + '<div id="dem-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Demande publiée ! Les membres peuvent te contacter 🐾</div>'
    + '</div>';
  }

  function buildProposerForm() {
    return '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:500px;">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:16px;">➕ Proposer ma disponibilité</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
        + '<div>' + fieldRaw('pro-prenom','Ton prénom','Sophie','text') + '</div>'
        + '<div>' + fieldRaw('pro-chien','Ton chien','Noisette','text') + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
        + '<div>' + fieldRaw('pro-race','Race','Cocker','text') + '</div>'
        + '<div>' + fieldRaw('pro-ville','Ville','Paris 11e','text') + '</div>'
      + '</div>'
      + field('pro-dispo','Disponibilités','Ex: Disponible weekends, juillet','text')
      + field('pro-tags','Préférences','Ex: Max 2 chiens, petits gabarits','text')
      + '<div id="pro-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
      + '<button id="pro-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma disponibilité 🐾</button>'
      + '<div id="pro-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Tu apparais dans la liste ! 🐾</div>'
    + '</div>';
  }

  function field(id, label, placeholder, type) {
    return '<div style="margin-bottom:14px;">' + fieldRaw(id, label, placeholder, type) + '</div>';
  }

  function fieldRaw(id, label, placeholder, type) {
    return '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">' + label + '</label>'
      + '<input type="' + type + '" id="' + id + '" placeholder="' + placeholder + '" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">';
  }

  // ── API publique ─────────────────────────────────────
  window.TDC = window.TDC || {};
  window.TDC.garde = { editDemande: editDemande, deleteDemande: deleteDemande };

})();
