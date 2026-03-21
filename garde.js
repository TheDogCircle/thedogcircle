/**
 * =====================================================
 *  THE DOG CIRCLE — Module Garde
 *  Fichier : garde.js
 *  Tables  : garde · demandes_garde
 *  Onglets : Gardiens dispos · Demandes en cours · Faire une demande · Proposer ma dispo
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

    // Sous-onglets
    var subtabs = document.createElement('div');
    subtabs.id = 'garde-subtabs';
    subtabs.className = 'subtab-row';
    subtabs.innerHTML =
      '<button class="subtab active"  id="gTabGardiens">🏠 Gardiens dispos</button>'
      + '<button class="subtab" id="gTabDemandes">📋 Demandes en cours</button>'
      + '<button class="subtab" id="gTabFaire">🐾 Faire une demande</button>'
      + '<button class="subtab" id="gTabProposer">➕ Proposer ma dispo</button>';
    sec.insertBefore(subtabs, document.getElementById('gardeGrid'));

    // ── Panneau demandes publiques ──────────────────────
    var panelDemandes = document.createElement('div');
    panelDemandes.id    = 'garde-demandes-list';
    panelDemandes.style = 'display:none;';
    panelDemandes.innerHTML = '<div id="demandes-grid" class="garde-grid"></div>';
    sec.appendChild(panelDemandes);

    // ── Panneau faire une demande ───────────────────────
    var panelFaire = document.createElement('div');
    panelFaire.id    = 'garde-faire';
    panelFaire.style = 'display:none;';
    panelFaire.innerHTML =
      '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:500px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:16px;">🐾 Faire une demande de garde</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Prénom de ton chien</label>'
          + '<input type="text" id="dem-chien" placeholder="Ex: Noisette" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Dates souhaitées</label>'
            + '<input type="text" id="dem-dates" placeholder="Ex: 15-20 juin" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ville</label>'
            + '<input type="text" id="dem-ville" placeholder="Ex: Paris" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '</div>'
        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Infos sur ton chien</label>'
          + '<textarea id="dem-msg" placeholder="Race, caractère, besoins particuliers..." style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;resize:vertical;min-height:80px;"></textarea>'
        + '</div>'
        + '<div id="dem-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<button id="dem-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma demande 🐾</button>'
        + '<div id="dem-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Demande publiée ! Les membres peuvent maintenant te contacter 🐾</div>'
      + '</div>';
    sec.appendChild(panelFaire);

    // ── Panneau proposer dispo ──────────────────────────
    var panelProposer = document.createElement('div');
    panelProposer.id    = 'garde-proposer';
    panelProposer.style = 'display:none;';
    panelProposer.innerHTML =
      '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:500px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:16px;">➕ Proposer ma disponibilité</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ton prénom</label>'
            + '<input type="text" id="pro-prenom" placeholder="Sophie" value="' + (window.TDC.userPrenom||'') + '" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ton chien</label>'
            + '<input type="text" id="pro-chien" placeholder="Noisette" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Race</label>'
            + '<input type="text" id="pro-race" placeholder="Cocker" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ville</label>'
            + '<input type="text" id="pro-ville" placeholder="Paris 11e" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Disponibilités</label>'
          + '<input type="text" id="pro-dispo" placeholder="Ex: Disponible weekends, juillet" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div style="margin-bottom:20px;">'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Préférences</label>'
          + '<input type="text" id="pro-tags" placeholder="Ex: Max 2 chiens, petits gabarits" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div id="pro-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<button id="pro-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Publier ma disponibilité 🐾</button>'
        + '<div id="pro-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Disponibilité publiée ! Tu apparais dans la liste 🐾</div>'
      + '</div>';
    sec.appendChild(panelProposer);

    // Bind sous-onglets
    document.getElementById('gTabGardiens').addEventListener('click', function () { showGardeTab('gardiens'); });
    document.getElementById('gTabDemandes').addEventListener('click', function () { showGardeTab('demandes'); loadDemandes(); });
    document.getElementById('gTabFaire').addEventListener('click',    function () { showGardeTab('faire'); });
    document.getElementById('gTabProposer').addEventListener('click', function () { showGardeTab('proposer'); });
    document.getElementById('dem-submit').addEventListener('click', saveDemande);
    document.getElementById('pro-submit').addEventListener('click', saveProposition);
  }

  function showGardeTab(tab) {
    document.getElementById('gTabGardiens').classList.toggle('active', tab === 'gardiens');
    document.getElementById('gTabDemandes').classList.toggle('active', tab === 'demandes');
    document.getElementById('gTabFaire').classList.toggle('active',    tab === 'faire');
    document.getElementById('gTabProposer').classList.toggle('active', tab === 'proposer');
    document.getElementById('gardeGrid').style.display            = tab === 'gardiens' ? 'grid'  : 'none';
    document.getElementById('garde-demandes-list').style.display  = tab === 'demandes' ? 'block' : 'none';
    document.getElementById('garde-faire').style.display          = tab === 'faire'    ? 'block' : 'none';
    document.getElementById('garde-proposer').style.display       = tab === 'proposer' ? 'block' : 'none';
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
          g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Aucune demande en cours 🐾<br><small style="color:var(--t3);">Sois le premier à en faire une !</small></div>';
          return;
        }
        var bgColors = ['#C8DEB8','#D4C5A9','#B8C9D4','#D4B8B8','#C5C8D4','#D4CEB8'];
        g.innerHTML = res.data.map(function (d, i) {
          var isOwn = d.membre_email === window.TDC.userEmail;
          return '<div class="garde-card">'
            + '<div class="garde-av" style="background:' + bgColors[i%6] + '">🐾</div>'
            + '<div class="garde-name">' + (d.membre_prenom||'Membre') + '</div>'
            + '<div class="garde-dog">' + (d.chien||'—') + '</div>'
            + (d.dates ? '<div class="garde-dispo" style="color:var(--gold);">📅 ' + d.dates + '</div>' : '')
            + (d.ville ? '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">📍 ' + d.ville + '</div>' : '')
            + (d.message ? '<div style="font-size:11px;color:var(--t2);line-height:1.5;margin-bottom:10px;">"' + d.message.substring(0,80) + (d.message.length>80?'...':'') + '"</div>' : '')
            + (isOwn
              ? '<span style="font-size:11px;color:var(--t3);">📌 Ta demande</span>'
              : '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;" onclick="window.location.href=\'mailto:thedogcircleclub@gmail.com?subject=Je suis dispo - Garde de ' + encodeURIComponent(d.chien||'votre chien') + '&body=Bonjour, je suis disponible pour garder ' + encodeURIComponent(d.chien||'votre chien') + ' du ' + encodeURIComponent(d.dates||'') + '. Mon email : ' + encodeURIComponent(window.TDC.userEmail) + '\'">Je suis dispo !</button>')
          + '</div>';
        }).join('');
      });
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
        showGardeTab('demandes');
        loadDemandes();
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
      setTimeout(function () {
        document.getElementById('pro-ok').style.display = 'none';
        showGardeTab('gardiens');
        loadGarde();
      }, 2000);
    }
    btn.textContent = 'Publier ma disponibilité 🐾'; btn.disabled = false;
  }

})();
