/**
 * =====================================================
 *  THE DOG CIRCLE — Module Events
 *  Fichier : events.js
 *  Tables  : events · inscriptions · suggestions_events
 * =====================================================
 */
(function () {

  var mesInscriptions = [];

  document.addEventListener('TDC:ready', function () {
    // Délégation clics boutons inscription
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;

      if (action === 'inscrire') {
        var id = btn.dataset.id; var attente = btn.dataset.attente === '1';
        btn.disabled = true; btn.textContent = '...';
        inscrire(id, attente)
          .then(function () { loadEvents(); })
          .catch(function (err) { btn.disabled = false; btn.textContent = attente ? 'Liste attente' : "S'inscrire"; alert('Erreur : ' + err.message); });

      } else if (action === 'desinscrire') {
        if (!confirm('Tu veux vraiment te désinscrire ?')) return;
        btn.disabled = true;
        desinscrire(btn.dataset.id)
          .then(function () { loadEvents(); })
          .catch(function (err) { btn.disabled = false; alert('Erreur : ' + err.message); });

      } else if (action === 'annuler-payant') {
        var titre = btn.dataset.titre;
        if (confirm('Cet événement est payant et a lieu dans moins de 24h.\nPour annuler, contacte thedogcircleclub@gmail.com\n\nVeux-tu ouvrir ton client email ?')) {
          window.location.href = 'mailto:thedogcircleclub@gmail.com?subject=' + encodeURIComponent('Annulation - ' + titre);
        }
      }
    });

    // Sous-onglets
    var btnAll = document.getElementById('evTabAll');
    var btnSug = document.getElementById('evTabSuggest');
    if (btnAll) btnAll.addEventListener('click', function () { showEvTab('all'); });
    if (btnSug) btnSug.addEventListener('click', function () { showEvTab('suggest'); });
  });

  document.addEventListener('TDC:login', function () {
    injectModal();
    injectSuggestionTab();
    loadEvents();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'events') loadEvents();
  });

  // ── Modal détail event ───────────────────────────────
  function injectModal() {
    if (document.getElementById('modal-event-detail')) return;
    var modal = document.createElement('div');
    modal.id    = 'modal-event-detail';
    modal.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:1000;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
    modal.innerHTML =
      '<div style="background:var(--w);border-radius:20px;width:100%;max-width:520px;overflow:hidden;margin:auto;">'
        + '<div id="ev-detail-photo" style="height:220px;background:var(--greenp);display:flex;align-items:center;justify-content:center;font-size:64px;position:relative;overflow:hidden;"></div>'
        + '<div style="padding:24px;">'
          + '<div id="ev-detail-type" style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;"></div>'
          + '<div id="ev-detail-titre" style="font-family:\'Playfair Display\',serif;font-size:22px;margin-bottom:12px;"></div>'
          + '<div id="ev-detail-meta" style="font-size:13px;color:var(--t2);line-height:2;margin-bottom:16px;"></div>'
          + '<div id="ev-detail-desc" style="font-size:14px;color:var(--t2);line-height:1.7;margin-bottom:20px;"></div>'
          + '<div id="ev-detail-actions" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"></div>'
        + '</div>'
        + '<div style="padding:0 24px 24px;">'
          + '<button onclick="document.getElementById(\'modal-event-detail\').style.display=\'none\'" style="width:100%;padding:11px;border-radius:10px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:14px;cursor:pointer;color:var(--t2);">Fermer</button>'
        + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
  }

  function openEventDetail(ev) {
    var modal = document.getElementById('modal-event-detail');
    if (!modal) return;

    // Photo ou fond
    var photoEl = document.getElementById('ev-detail-photo');
    if (ev.photo_url) {
      photoEl.innerHTML = '<img src="' + ev.photo_url + '" style="width:100%;height:220px;object-fit:cover;" alt="' + ev.titre + '">';
    } else {
      photoEl.innerHTML = '🎉';
      photoEl.style.background = 'var(--greenp)';
    }

    document.getElementById('ev-detail-type').textContent   = ev.type || 'Event';
    document.getElementById('ev-detail-titre').textContent  = ev.titre;

    var ville = ev.ville_custom || ev.ville || 'National';
    var heures = '';
    if (ev.heure) {
      heures = ev.heure;
      if (ev.heure_fin) heures += ' → ' + ev.heure_fin;
    }

    document.getElementById('ev-detail-meta').innerHTML =
      '📍 ' + ville + '<br>'
      + '📅 ' + (ev.date || '—') + (heures ? ' · ⏰ ' + heures : '') + '<br>'
      + '💳 ' + (ev.prix || 'Gratuit') + '<br>'
      + '👥 ' + (ev.inscrits || 0) + ' / ' + ev.places + ' inscrits';

    document.getElementById('ev-detail-desc').textContent = ev.description || '';

    // Actions
    var restantes  = ev.places - (ev.inscrits || 0);
    var complet    = restantes <= 0;
    var insc       = mesInscriptions.find(function (i) { return i.event_id === ev.id; });
    var estInscrit = insc && insc.statut === 'confirme';
    var enAttente  = insc && insc.statut === 'liste_attente';
    var payant     = ev.prix && ev.prix !== 'Gratuit' && ev.prix !== 'Gratuit membres';
    var heuresRest = (new Date(ev.date_raw || '') - Date.now()) / 3600000;
    var moins24h   = heuresRest < 24 && heuresRest > 0;

    var actionsEl = document.getElementById('ev-detail-actions');
    if (estInscrit) {
      actionsEl.innerHTML = '<span class="ev-tag tag-green" style="padding:7px 14px;">✓ Inscrit</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" data-action="annuler-payant" data-titre="' + ev.titre + '">Annuler</button>'
          : '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Se désinscrire</button>');
    } else if (enAttente) {
      actionsEl.innerHTML = '<span class="ev-tag tag-yellow" style="padding:7px 14px;">⏳ Liste attente</span>'
        + '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>';
    } else if (complet) {
      actionsEl.innerHTML = '<button class="btn btn-o" data-action="inscrire" data-id="' + ev.id + '" data-attente="1">Liste attente</button>'
        + '<span style="font-size:12px;color:var(--red);">Complet · ' + (-restantes < 0 ? 0 : restantes) + ' sur liste</span>';
    } else {
      actionsEl.innerHTML = '<button class="btn btn-p" style="flex:1;justify-content:center;" data-action="inscrire" data-id="' + ev.id + '" data-attente="0">S\'inscrire — ' + restantes + ' place' + (restantes>1?'s':'') + ' restante' + (restantes>1?'s':'') + '</button>';
    }

    modal.style.display = 'flex';
  }

  // ── Suggestion tab ───────────────────────────────────
  function injectSuggestionTab() {
    var row = document.querySelector('#tc-events .subtab-row');
    if (!row || document.getElementById('evTabSuggest')) return;
    var btn = document.createElement('button');
    btn.id = 'evTabSuggest'; btn.className = 'subtab';
    btn.textContent = '💡 Proposer un event';
    row.appendChild(btn);

    var panel = document.createElement('div');
    panel.id    = 'evSuggest';
    panel.style = 'display:none;';
    panel.innerHTML =
      '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:24px;max-width:500px;">'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:16px;">💡 Proposer un event</div>'
        + '<div style="margin-bottom:14px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Titre</label>'
          + '<input type="text" id="sug-titre" placeholder="Ex: Balade au Mont Saint-Michel" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Ville</label>'
            + '<input type="text" id="sug-ville" placeholder="Ex: Paris" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
          + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Date souhaitée</label>'
            + '<input type="date" id="sug-date" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;"></div>'
        + '</div>'
        + '<div style="margin-bottom:20px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:5px;">Description</label>'
          + '<textarea id="sug-desc" placeholder="Décris ton idée d\'event..." style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;resize:vertical;min-height:80px;"></textarea></div>'
        + '<div id="sug-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;"></div>'
        + '<button id="sug-submit" class="btn btn-p" style="width:100%;padding:12px;font-size:14px;">Envoyer ma suggestion 💡</button>'
        + '<div id="sug-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:10px;padding:12px;text-align:center;font-size:13px;margin-top:12px;">✓ Suggestion envoyée ! L\'équipe va l\'étudier 🐾</div>'
      + '</div>';
    document.getElementById('tc-events').appendChild(panel);
    document.getElementById('sug-submit').addEventListener('click', saveSuggestion);
  }

  function showEvTab(tab) {
    var btnAll = document.getElementById('evTabAll');
    var btnSug = document.getElementById('evTabSuggest');
    var listAll = document.getElementById('evList');
    var listSug = document.getElementById('evSuggest');
    if (btnAll) btnAll.classList.toggle('active', tab === 'all');
    if (btnSug) btnSug.classList.toggle('active', tab === 'suggest');
    if (listAll) listAll.style.display = tab === 'all'     ? 'block' : 'none';
    if (listSug) listSug.style.display = tab === 'suggest' ? 'block' : 'none';
  }

  // ── Charger les events ───────────────────────────────
  function loadEvents() {
    var db = window.TDC.db; var userEmail = window.TDC.userEmail;
    var c  = document.getElementById('evList');
    if (!c) return;
    c.innerHTML = '<div class="loading">Chargement...</div>';

    Promise.all([
      db.from('events').select('*').order('date_raw', { ascending: true }),
      db.from('inscriptions').select('event_id,statut').eq('membre_email', userEmail)
    ]).then(function (results) {
      var evRes = results[0]; var inscRes = results[1];
      mesInscriptions = inscRes.data || [];
      if (evRes.error) { c.innerHTML = '<div class="error">Erreur : ' + evRes.error.message + '</div>'; return; }
      if (!evRes.data || evRes.data.length === 0) { c.innerHTML = '<div class="loading">Aucun event pour le moment 🐾</div>'; return; }

      // Stocker pour la modal
      window._eventsData = evRes.data;

      c.innerHTML = evRes.data.map(function (ev) { return renderEvent(ev); }).join('');

      // Clic sur la card → ouvrir le détail
      c.onclick = function (e) {
        var btn = e.target.closest('[data-action]');
        if (btn) return; // laisser la délégation globale gérer
        var card = e.target.closest('.ev-card[data-evid]');
        if (!card) return;
        var ev = (window._eventsData||[]).find(function (x) { return String(x.id) === card.dataset.evid; });
        if (ev) openEventDetail(ev);
      };

    }).catch(function (err) { c.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>'; });
  }

  function renderEvent(ev) {
    var restantes  = ev.places - (ev.inscrits || 0);
    var complet    = restantes <= 0;
    var insc       = mesInscriptions.find(function (i) { return i.event_id === ev.id; });
    var estInscrit = insc && insc.statut === 'confirme';
    var enAttente  = insc && insc.statut === 'liste_attente';
    var parts      = (ev.date || '--/--').split('/');
    var payant     = ev.prix && ev.prix !== 'Gratuit' && ev.prix !== 'Gratuit membres';
    var heuresRest = (new Date(ev.date_raw || '') - Date.now()) / 3600000;
    var moins24h   = heuresRest < 24 && heuresRest > 0;
    var ville      = ev.ville_custom || ev.ville || 'National';

    var spotsTag = complet
      ? '<span class="ev-tag tag-red">Complet</span>'
      : '<span class="ev-tag ' + (restantes <= 3 ? 'tag-red' : 'tag-green') + '">' + restantes + ' place' + (restantes>1?'s':'') + ' restante' + (restantes>1?'s':'') + '</span>';

    var actions = '';
    if (estInscrit) {
      actions = '<span class="ev-tag tag-green" style="padding:5px 12px;">✓ Inscrit</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" data-action="annuler-payant" data-titre="' + ev.titre + '">Annuler</button>'
          : '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Se désinscrire</button>');
    } else if (enAttente) {
      actions = '<span class="ev-tag tag-yellow" style="padding:5px 12px;">⏳ Liste attente</span><button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>';
    } else if (complet) {
      actions = '<button class="btn btn-o" style="font-size:12px;padding:6px 14px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="1">Liste attente</button>';
    } else {
      actions = '<button class="btn btn-p" style="font-size:12px;padding:6px 14px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="0">S\'inscrire</button>';
    }

    // Photo en haut de la card si disponible
    var photoHtml = ev.photo_url
      ? '<div style="height:120px;overflow:hidden;border-radius:10px 10px 0 0;margin:-20px -20px 14px -20px;">'
          + '<img src="' + ev.photo_url + '" style="width:100%;height:120px;object-fit:cover;" alt="' + ev.titre + '">'
        + '</div>'
      : '';

    // Heure
    var heureStr = '';
    if (ev.heure) {
      heureStr = ' · ⏰ ' + ev.heure + (ev.heure_fin ? ' → ' + ev.heure_fin : '');
    }

    return '<div class="ev-card" data-evid="' + ev.id + '" style="cursor:pointer;flex-direction:column;padding:20px;">'
      + photoHtml
      + '<div style="display:flex;gap:18px;align-items:flex-start;">'
        + '<div class="ev-date" style="flex-shrink:0;"><div class="ev-day">' + (parts[0]||'--') + '</div><div class="ev-month">' + (parts[1]||'--') + '</div></div>'
        + '<div class="ev-body">'
          + '<div class="ev-title">' + ev.titre + '</div>'
          + '<div class="ev-detail">' + ville + ' · ' + (ev.prix||'Gratuit') + heureStr + '</div>'
          + '<div class="ev-tags"><span class="ev-tag tag-gold">' + (ev.prix||'Gratuit') + '</span>' + spotsTag + '</div>'
          + '<div class="ev-actions">' + actions + '</div>'
        + '</div>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--t3);margin-top:8px;text-align:right;">Cliquer pour plus de détails →</div>'
    + '</div>';
  }

  // ── Suggestion ───────────────────────────────────────
  async function saveSuggestion() {
    var db    = window.TDC.db;
    var titre = document.getElementById('sug-titre').value.trim();
    var err   = document.getElementById('sug-err');
    var btn   = document.getElementById('sug-submit');
    err.style.display = 'none';
    if (!titre) { err.textContent = 'Le titre est obligatoire.'; err.style.display = 'block'; return; }
    btn.textContent = 'Envoi...'; btn.disabled = true;

    var res = await db.from('suggestions_events').insert([{
      membre_email:   window.TDC.userEmail,
      membre_prenom:  window.TDC.userPrenom,
      titre:          titre,
      description:    document.getElementById('sug-desc').value,
      ville:          document.getElementById('sug-ville').value,
      date_souhaitee: document.getElementById('sug-date').value,
      statut:         'en_attente'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('sug-ok').style.display = 'block';
      ['sug-titre','sug-ville','sug-desc'].forEach(function (id) { document.getElementById(id).value = ''; });
      document.getElementById('sug-date').value = '';
      setTimeout(function () { document.getElementById('sug-ok').style.display = 'none'; }, 4000);
    }
    btn.textContent = 'Envoyer ma suggestion 💡'; btn.disabled = false;
  }

  // ── Inscrire / désinscrire ───────────────────────────
  function inscrire(eventId, listeAttente) {
    var db = window.TDC.db;
    return db.from('inscriptions').insert([{
      event_id: eventId, membre_email: window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom, statut: listeAttente ? 'liste_attente' : 'confirme'
    }]).then(function (res) {
      if (res.error) throw res.error;
      if (!listeAttente) return db.from('events').select('inscrits').eq('id', eventId).single()
        .then(function (evRes) {
          if (evRes.data) return db.from('events').update({ inscrits: (evRes.data.inscrits||0)+1 }).eq('id', eventId);
        });
    });
  }

  function desinscrire(eventId) {
    var db = window.TDC.db;
    return db.from('inscriptions').select('id,statut').eq('event_id', eventId).eq('membre_email', window.TDC.userEmail).single()
      .then(function (res) {
        if (res.error) throw res.error;
        var inscId = res.data.id; var statut = res.data.statut;
        return db.from('inscriptions').delete().eq('id', inscId).then(function (delRes) {
          if (delRes.error) throw delRes.error;
          if (statut === 'confirme') return db.from('events').select('inscrits').eq('id', eventId).single()
            .then(function (evRes) {
              if (evRes.data && evRes.data.inscrits > 0)
                return db.from('events').update({ inscrits: evRes.data.inscrits-1 }).eq('id', eventId);
            });
        });
      });
  }

  window.TDC = window.TDC || {};
  window.TDC.events = { load: loadEvents };

})();
