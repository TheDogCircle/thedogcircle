/**
 * =====================================================
 *  THE DOG CIRCLE — Module Events
 *  Fichier : events.js
 * =====================================================
 */
(function () {

  var mesInscriptions = [];
  window._TDC_EVENTS  = {};
  var filtreVille = 'Toutes';

  document.addEventListener('TDC:ready', function () {
    injectModal();

    document.addEventListener('click', function (e) {

      // Ouvrir le modal détail — seulement sur "Voir les détails"
      var card = e.target.closest('.ev-card-wrap');
      if (card && !e.target.closest('[data-action]') && !e.target.closest('.ev-actions') && !e.target.closest('[data-open-ev]')) {
        // Ne rien faire si clic sur la card — laisser les boutons gérer
        return;
      }

      // Bouton "Voir les détails"
      var btnDetail = e.target.closest('[data-open-ev]');
      if (btnDetail) {
        openEventModal(btnDetail.dataset.openEv);
        return;
      }

      // Actions inscription
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;

      if (action === 'inscrire') {
        var id      = btn.dataset.id;
        var attente = btn.dataset.attente === '1';
        btn.disabled    = true;
        btn.textContent = '...';
        inscrire(id, attente)
          .then(function () { loadEvents(); closeModal(); })
          .catch(function (err) {
            btn.disabled    = false;
            btn.textContent = attente ? 'Liste attente' : "S'inscrire";
            alert('Erreur : ' + err.message);
          });

      } else if (action === 'desinscrire') {
        if (!confirm('Tu veux vraiment te désinscrire ?')) return;
        btn.disabled = true;
        desinscrire(btn.dataset.id)
          .then(function () { loadEvents(); closeModal(); })
          .catch(function (err) {
            btn.disabled = false;
            alert('Erreur : ' + err.message);
          });

      } else if (action === 'annuler-payant') {
        var titre = btn.dataset.titre;
        if (confirm('Cet événement est payant et a lieu dans moins de 24h.\nPour annuler, contacte thedogcircleclub@gmail.com\n\nVeux-tu ouvrir ton client email ?')) {
          window.location.href = 'mailto:thedogcircleclub@gmail.com'
            + '?subject=' + encodeURIComponent('Annulation - ' + titre);
        }
      }
    });
  });

  document.addEventListener('TDC:tab',   function (e) { if (e.detail.tab === 'events') loadEvents(); });
  document.addEventListener('TDC:login',  function () { loadEvents(); });

  // ── Injecter le modal ────────────────────────────────
  function injectModal() {
    if (document.getElementById('modal-ev-detail')) return;
    var m = document.createElement('div');
    m.id    = 'modal-ev-detail';
    m.style = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9000;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
    m.innerHTML =
      '<div style="background:var(--w);border-radius:20px;width:100%;max-width:520px;overflow:hidden;margin:40px auto;">'
        + '<div id="ev-det-photo" style="height:220px;background:var(--greenp);display:flex;align-items:center;justify-content:center;font-size:64px;overflow:hidden;"></div>'
        + '<div style="padding:26px;">'
          + '<div id="ev-det-type"  style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;"></div>'
          + '<div id="ev-det-titre" style="font-family:\'Playfair Display\',serif;font-size:24px;margin-bottom:16px;color:var(--t);"></div>'
          + '<div id="ev-det-meta"  style="font-size:13px;color:var(--t2);line-height:2.2;margin-bottom:16px;border-left:3px solid var(--green);padding-left:14px;"></div>'
          + '<div id="ev-det-desc"  style="font-size:14px;color:var(--t2);line-height:1.8;margin-bottom:24px;"></div>'
          + '<div id="ev-det-act"   style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;"></div>'
          + '<button id="ev-det-close" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--b);background:transparent;font-family:inherit;font-size:14px;cursor:pointer;color:var(--t2);">Fermer</button>'
        + '</div>'
      + '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    document.getElementById('ev-det-close').addEventListener('click', closeModal);
  }

  function closeModal() {
    var m = document.getElementById('modal-ev-detail');
    if (m) m.style.display = 'none';
  }

  // ── Ouvrir le modal ──────────────────────────────────
  function openEventModal(id) {
    var ev = window._TDC_EVENTS[String(id)];
    if (!ev) return;

    var m = document.getElementById('modal-ev-detail');
    if (!m) { injectModal(); m = document.getElementById('modal-ev-detail'); }

    // Photo
    var photoEl = document.getElementById('ev-det-photo');
    if (ev.photo_url) {
      photoEl.innerHTML = '<img src="' + ev.photo_url + '" style="width:100%;height:220px;object-fit:cover;" alt="">';
    } else {
      photoEl.innerHTML  = '🎉';
      photoEl.style.fontSize = '64px';
    }

    document.getElementById('ev-det-type').textContent  = ev.type || 'Événement';
    document.getElementById('ev-det-titre').textContent = ev.titre;

    var ville    = ev.ville_custom || ev.ville || 'National';
    var heureStr = ev.heure ? ev.heure + (ev.heure_fin ? ' → ' + ev.heure_fin : '') : '';
    var restantes = ev.places - (ev.inscrits || 0);

    document.getElementById('ev-det-meta').innerHTML =
      '📍 ' + ville + (ev.lieu ? ' · ' + ev.lieu : '')
      + '<br>📅 ' + (ev.date || '—') + (heureStr ? ' · ⏰ ' + heureStr : '')
      + '<br>💳 ' + (ev.prix || 'Gratuit')
      + '<br>👥 ' + (ev.inscrits || 0) + ' / ' + ev.places + ' inscrits'
      + (restantes > 0
        ? ' · <span style="color:var(--green);">' + restantes + ' place' + (restantes > 1 ? 's' : '') + ' restante' + (restantes > 1 ? 's' : '') + '</span>'
        : ' · <span style="color:var(--red);">Complet</span>');

    document.getElementById('ev-det-desc').textContent = ev.description || '';

    // Bouton action
    var complet    = restantes <= 0;
    var insc       = mesInscriptions.find(function (i) { return i.event_id === ev.id; });
    var estInscrit = insc && insc.statut === 'confirme';
    var enAttente  = insc && insc.statut === 'liste_attente';
    var payant     = ev.prix && ev.prix !== 'Gratuit' && ev.prix !== 'Gratuit membres';
    var heuresRest = (new Date(ev.date_raw || '') - Date.now()) / 3600000;
    var moins24h   = heuresRest < 24 && heuresRest > 0;

    var actEl = document.getElementById('ev-det-act');
    if (estInscrit) {
      actEl.innerHTML = '<span class="ev-tag tag-green" style="padding:8px 16px;font-size:13px;">✓ Tu es inscrit(e)</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" data-action="annuler-payant" data-titre="' + ev.titre + '">Annuler</button>'
          : '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Se désinscrire</button>');
    } else if (enAttente) {
      actEl.innerHTML = '<span class="ev-tag tag-yellow" style="padding:8px 16px;">⏳ Liste d\'attente</span>'
        + '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>';
    } else if (complet) {
      actEl.innerHTML = '<button class="btn btn-o" style="flex:1;justify-content:center;padding:12px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="1">Rejoindre la liste d\'attente</button>';
    } else {
      actEl.innerHTML = '<button class="btn btn-p" style="flex:1;justify-content:center;padding:12px;font-size:15px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="0">S\'inscrire à cet event ✓</button>';
    }

    m.style.display = 'flex';
    window.scrollTo(0, 0);
  }

  // ── Charger les events ───────────────────────────────
  function loadEvents() {
    var db        = window.TDC.db;
    var userEmail = window.TDC.userEmail;
    var c         = document.getElementById('evList');
    if (!c) return;

    c.innerHTML = '<div class="loading">Chargement...</div>';

    Promise.all([
      db.from('events').select('*').order('date_raw', { ascending: true }),
      db.from('inscriptions').select('event_id,statut').eq('membre_email', userEmail)
    ]).then(function (results) {
      var evRes   = results[0];
      var inscRes = results[1];
      mesInscriptions = inscRes.data || [];

      if (evRes.error) { c.innerHTML = '<div class="error">Erreur : ' + evRes.error.message + '</div>'; return; }
      if (!evRes.data || evRes.data.length === 0) { c.innerHTML = '<div class="loading">Aucun event pour le moment 🐾</div>'; return; }

      // Stocker pour le modal
      window._TDC_EVENTS = {};
      evRes.data.forEach(function (ev) { window._TDC_EVENTS[String(ev.id)] = ev; });

      // Extraire les villes uniques
      var villes = ['Toutes'];
      evRes.data.forEach(function(ev) {
        var v = ev.ville_custom || ev.ville || 'National';
        if (v && villes.indexOf(v) === -1) villes.push(v);
      });

      // Filtrer les events
      var evsFiltres = filtreVille === 'Toutes'
        ? evRes.data
        : evRes.data.filter(function(ev) {
            var v = ev.ville_custom || ev.ville || 'National';
            return v === filtreVille;
          });

      // Vider le conteneur
      c.innerHTML = evsFiltres.length === 0
        ? '<div class="loading">Aucun event dans cette ville pour le moment 🐾</div>'
        : evsFiltres.map(function (ev) { return renderEvent(ev); }).join('');

      // Injecter le filtre AVANT les events directement dans le DOM
      var filtreDiv = document.createElement('div');
      filtreDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;';
      villes.forEach(function(v) {
        var btn = document.createElement('button');
        btn.textContent = v;
        btn.style.cssText = 'padding:6px 14px;border-radius:100px;font-size:12px;font-family:inherit;cursor:pointer;transition:all .2s;'
          + (filtreVille === v
            ? 'background:var(--green);color:#fff;border:1.5px solid var(--green);'
            : 'background:transparent;color:var(--t2);border:1.5px solid var(--b);');
        btn.addEventListener('click', function() {
          filtreVille = v;
          loadEvents();
        });
        filtreDiv.appendChild(btn);
      });
      c.insertBefore(filtreDiv, c.firstChild);

    }).catch(function (err) {
      c.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
    });
  }

  // ── Rendu d'une card event ───────────────────────────
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

    var spotsTag = complet
      ? '<span class="ev-tag tag-red">Complet</span>'
      : '<span class="ev-tag ' + (restantes <= 3 ? 'tag-red' : 'tag-green') + '">'
          + restantes + ' place' + (restantes > 1 ? 's' : '') + ' restante' + (restantes > 1 ? 's' : '') + '</span>';

    var actions = '';
    if (estInscrit) {
      actions = '<span class="ev-tag tag-green" style="padding:5px 12px;">✓ Inscrit</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" data-action="annuler-payant" data-titre="' + ev.titre + '">Annuler</button>'
          : '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Se désinscrire</button>');
    } else if (enAttente) {
      actions = '<span class="ev-tag tag-yellow" style="padding:5px 12px;">⏳ Attente</span>'
        + '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>';
    } else if (complet) {
      actions = '<button class="btn btn-o" style="font-size:12px;padding:6px 14px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="1">Liste attente</button>';
    } else {
      actions = '<button class="btn btn-p" style="font-size:12px;padding:6px 14px;" data-action="inscrire" data-id="' + ev.id + '" data-attente="0">S\'inscrire</button>';
    }

    // Photo si disponible
    var photoHtml = ev.photo_url
      ? '<div style="height:130px;overflow:hidden;margin:-20px -20px 16px -20px;border-radius:16px 16px 0 0;">'
          + '<img src="' + ev.photo_url + '" style="width:100%;height:130px;object-fit:cover;" loading="lazy" alt="">'
        + '</div>'
      : '';

    return '<div class="ev-card ev-card-wrap" data-evid="' + ev.id + '" style="display:block;padding:20px;position:relative;">'
      + photoHtml
      + '<div style="display:flex;gap:16px;align-items:flex-start;">'
        + '<div class="ev-date" style="flex-shrink:0;"><div class="ev-day">' + (parts[0] || '--') + '</div><div class="ev-month">' + (parts[1] || '--') + '</div></div>'
        + '<div class="ev-body">'
          + '<div class="ev-title">' + ev.titre + '</div>'
          + '<div class="ev-detail">' + (ev.ville_custom || ev.ville || 'National') + ' · ' + (ev.prix || 'Gratuit') + '</div>'
          + '<div class="ev-tags"><span class="ev-tag tag-gold">' + (ev.prix || 'Gratuit') + '</span>' + spotsTag + '</div>'
          + '<div class="ev-actions">' + actions + '</div>'
        + '</div>'
      + '</div>'
      + '<div style="text-align:right;margin-top:10px;">'
        + '<span data-open-ev="' + ev.id + '" style="font-size:12px;color:var(--green);cursor:pointer;font-weight:500;">Voir les détails →</span>'
      + '</div>'
    + '</div>';
  }

  // ── Inscrire ─────────────────────────────────────────
  function inscrire(eventId, listeAttente) {
    var db = window.TDC.db;
    return db.from('inscriptions').insert([{
      event_id:      eventId,
      membre_email:  window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom,
      statut:        listeAttente ? 'liste_attente' : 'confirme'
    }]).then(function (res) {
      if (res.error) throw res.error;
      if (!listeAttente) {
        return db.from('events').select('inscrits').eq('id', eventId).single()
          .then(function (evRes) {
            if (evRes.data) return db.from('events').update({ inscrits: (evRes.data.inscrits || 0) + 1 }).eq('id', eventId);
          });
      }
    });
  }

  // ── Désinscrire ──────────────────────────────────────
  function desinscrire(eventId) {
    var db = window.TDC.db;
    return db.from('inscriptions').select('id,statut').eq('event_id', eventId).eq('membre_email', window.TDC.userEmail).single()
      .then(function (res) {
        if (res.error) throw res.error;
        var inscId = res.data.id;
        var statut = res.data.statut;
        return db.from('inscriptions').delete().eq('id', inscId)
          .then(function (delRes) {
            if (delRes.error) throw delRes.error;
            if (statut === 'confirme') {
              return db.from('events').select('inscrits').eq('id', eventId).single()
                .then(function (evRes) {
                  if (evRes.data && evRes.data.inscrits > 0)
                    return db.from('events').update({ inscrits: evRes.data.inscrits - 1 }).eq('id', eventId);
                });
            }
          });
      });
  }

  window.TDC = window.TDC || {};
  window.TDC.events = { load: loadEvents };

})();
