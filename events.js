/**
 * =====================================================
 *  THE DOG CIRCLE — Module Events
 *  Fichier : events.js
 * =====================================================
 */
(function () {

  var mesInscriptions = [];
  window._TDC_EVENTS  = {};
  var filtreVille     = 'Toutes';

  document.addEventListener('TDC:ready', function () { injectModal(); });
  document.addEventListener('TDC:tab',   function (e) { if (e.detail.tab === 'events') loadEvents(); });
  document.addEventListener('TDC:login', function () { loadEvents(); });

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
    document.getElementById('ev-det-act').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      handleAction(btn);
    });
  }

  function closeModal() {
    var m = document.getElementById('modal-ev-detail');
    if (m) m.style.display = 'none';
  }

  function handleAction(btn) {
    var action  = btn.dataset.action;
    var eventId = btn.dataset.id;
    if (action === 'inscrire') {
      var attente = btn.dataset.attente === '1';
      btn.disabled    = true;
      btn.textContent = '...';
      inscrire(eventId, attente)
        .then(function () { loadEvents(); closeModal(); })
        .catch(function (err) { btn.disabled = false; btn.textContent = attente ? 'Liste attente' : "S'inscrire"; alert('Erreur : ' + err.message); });
    } else if (action === 'desinscrire') {
      if (!confirm('Tu veux vraiment te désinscrire ?')) return;
      btn.disabled = true; btn.textContent = '...';
      desinscrire(eventId)
        .then(function () { loadEvents(); closeModal(); })
        .catch(function (err) { btn.disabled = false; alert('Erreur : ' + err.message); });
    } else if (action === 'annuler-payant') {
      if (confirm('Cet événement est payant et a lieu dans moins de 24h.\nContacte thedogcircleclub@gmail.com\n\nOuvrir ton client email ?'))
        window.location.href = 'mailto:thedogcircleclub@gmail.com?subject=' + encodeURIComponent('Annulation - ' + btn.dataset.titre);
    }
  }

  // ── Ouvrir le modal ──────────────────────────────────
  function openEventModal(id) {
    var ev = window._TDC_EVENTS[String(id)];
    if (!ev) return;
    var m = document.getElementById('modal-ev-detail');
    if (!m) { injectModal(); m = document.getElementById('modal-ev-detail'); }

    var photoEl = document.getElementById('ev-det-photo');
    if (ev.photo_url) {
      photoEl.innerHTML = '<img src="' + ev.photo_url + '" style="width:100%;height:220px;object-fit:cover;" alt="">';
    } else {
      photoEl.innerHTML = '🎉'; photoEl.style.fontSize = '64px';
    }

    document.getElementById('ev-det-type').textContent  = ev.type || 'Événement';
    document.getElementById('ev-det-titre').textContent = ev.titre;

    var ville     = ev.ville_custom || ev.ville || 'National';
    var heureStr  = ev.heure ? ev.heure + (ev.heure_fin ? ' → ' + ev.heure_fin : '') : '';
    var restantes = ev.places - (ev.inscrits || 0);

    document.getElementById('ev-det-meta').innerHTML =
      '📍 ' + ville + (ev.lieu ? ' · ' + ev.lieu : '')
      + '<br>📅 ' + (ev.date || '—') + (heureStr ? ' · ⏰ ' + heureStr : '')
      + '<br>💳 ' + (ev.prix || 'Gratuit')
      + '<br>👥 ' + (ev.inscrits || 0) + ' / ' + ev.places + ' inscrits'
      + (restantes > 0 ? ' · <span style="color:var(--green);">' + restantes + ' place' + (restantes > 1 ? 's' : '') + ' restante' + (restantes > 1 ? 's' : '') + '</span>' : ' · <span style="color:var(--red);">Complet</span>');

    document.getElementById('ev-det-desc').textContent = ev.description || '';

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

      window._TDC_EVENTS = {};
      evRes.data.forEach(function (ev) { window._TDC_EVENTS[String(ev.id)] = ev; });

      var villes = ['Toutes'];
      evRes.data.forEach(function(ev) {
        var v = ev.ville_custom || ev.ville || 'National';
        if (v && villes.indexOf(v) === -1) villes.push(v);
      });

      var evsFiltres = filtreVille === 'Toutes'
        ? evRes.data
        : evRes.data.filter(function(ev) { return (ev.ville_custom || ev.ville || 'National') === filtreVille; });

      c.innerHTML = evsFiltres.length === 0
        ? '<div class="loading">Aucun event dans cette ville 🐾</div>'
        : evsFiltres.map(function (ev) { return renderEvent(ev); }).join('');

      // Listeners sur les boutons des cards
      c.querySelectorAll('button[data-ev-id]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          var action  = btn.dataset.evAction;
          var eventId = btn.dataset.evId;
          if (action === 'inscrire') {
            var attente = btn.dataset.evAttente === '1';
            btn.disabled = true; btn.textContent = '...';
            inscrire(eventId, attente)
              .then(function () { loadEvents(); })
              .catch(function (err) { btn.disabled = false; btn.textContent = attente ? 'Liste attente' : "S'inscrire"; alert('Erreur : ' + err.message); });
          } else if (action === 'desinscrire') {
            if (!confirm('Tu veux vraiment te désinscrire ?')) return;
            btn.disabled = true; btn.textContent = '...';
            desinscrire(eventId)
              .then(function () { loadEvents(); })
              .catch(function (err) { btn.disabled = false; alert('Erreur : ' + err.message); });
          } else if (action === 'annuler-payant') {
            if (confirm('Cet événement est payant.\nContacte thedogcircleclub@gmail.com\n\nOuvrir ton client email ?'))
              window.location.href = 'mailto:thedogcircleclub@gmail.com?subject=' + encodeURIComponent('Annulation - ' + btn.dataset.evTitre);
          }
        });
      });

      // Listeners "Voir les détails"
      c.querySelectorAll('button[data-ev-open]').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); openEventModal(btn.dataset.evOpen); });
      });

      // Filtre villes
      var filtreDiv = document.createElement('div');
      filtreDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;';
      villes.forEach(function(v) {
        var btn = document.createElement('button');
        btn.textContent = v;
        btn.style.cssText = 'padding:7px 18px;border-radius:100px;font-size:12px;font-family:inherit;cursor:pointer;transition:all .2s;font-weight:500;'
          + (filtreVille === v ? 'background:var(--green);color:#fff;border:1.5px solid var(--green);' : 'background:transparent;color:var(--t2);border:1.5px solid var(--b);');
        btn.addEventListener('click', function () { filtreVille = v; loadEvents(); });
        filtreDiv.appendChild(btn);
      });
      c.insertBefore(filtreDiv, c.firstChild);

    }).catch(function (err) {
      c.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
    });
  }

  // ── Rendu d'une card event — nouveau design ──────────
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

    // Bouton principal
    var actionBtn = '';
    if (estInscrit) {
      actionBtn = '<span class="ev-tag tag-green" style="padding:6px 14px;font-size:12px;font-weight:500;">✓ Inscrit</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" style="font-size:12px;padding:6px 16px;" data-ev-id="' + ev.id + '" data-ev-action="annuler-payant" data-ev-titre="' + ev.titre.replace(/"/g, '&quot;') + '">Annuler</button>'
          : '<button class="btn btn-danger" style="font-size:12px;padding:6px 16px;" data-ev-id="' + ev.id + '" data-ev-action="desinscrire">Se désinscrire</button>');
    } else if (enAttente) {
      actionBtn = '<span class="ev-tag tag-yellow" style="padding:6px 14px;font-size:12px;">⏳ En attente</span>'
        + '<button class="btn btn-danger" style="font-size:12px;padding:6px 16px;" data-ev-id="' + ev.id + '" data-ev-action="desinscrire">Annuler</button>';
    } else if (complet) {
      actionBtn = '<button class="btn btn-o" style="font-size:12px;padding:6px 16px;" data-ev-id="' + ev.id + '" data-ev-action="inscrire" data-ev-attente="1">Liste d\'attente</button>';
    } else {
      actionBtn = '<button class="btn btn-p" style="font-size:13px;padding:8px 20px;" data-ev-id="' + ev.id + '" data-ev-action="inscrire" data-ev-attente="0">S\'inscrire</button>';
    }

    // Badge places
    var placesBadge = complet
      ? '<span style="font-size:11px;color:#dc2626;font-weight:500;">Complet</span>'
      : '<span style="font-size:11px;color:' + (restantes <= 3 ? '#dc2626' : 'var(--green)') + ';font-weight:500;">' + restantes + ' place' + (restantes > 1 ? 's' : '') + '</span>';

    // Photo ou fond coloré
    var mediaSide = ev.photo_url
      ? '<div style="width:140px;min-width:140px;flex-shrink:0;overflow:hidden;border-radius:12px;position:relative;">'
          + '<img src="' + ev.photo_url + '" style="width:140px;height:100%;min-height:130px;object-fit:cover;display:block;" loading="lazy" alt="">'
          + '<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);border-radius:8px;padding:5px 10px;text-align:center;">'
            + '<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:600;color:#fff;line-height:1;">' + (parts[0] || '--') + '</div>'
            + '<div style="font-size:10px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:.08em;font-weight:500;">' + monthLabel(parts[1]) + '</div>'
          + '</div>'
        + '</div>'
      : '<div style="width:140px;min-width:140px;flex-shrink:0;background:var(--greenp);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:16px;">'
          + '<div style="font-family:\'Playfair Display\',serif;font-size:36px;font-weight:600;color:var(--green);line-height:1;">' + (parts[0] || '--') + '</div>'
          + '<div style="font-size:12px;color:var(--green);text-transform:uppercase;letter-spacing:.08em;font-weight:500;">' + monthLabel(parts[1]) + '</div>'
        + '</div>';

    return '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;margin-bottom:14px;overflow:hidden;display:flex;min-height:130px;">'

      // Côté gauche — photo ou date
      + mediaSide

      // Côté droit — contenu
      + '<div style="flex:1;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;min-width:0;">'

        // Ligne 1 : titre + type
        + '<div>'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
            + (ev.type ? '<span style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);font-weight:500;">' + ev.type + '</span>' : '')
          + '</div>'
          + '<div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:600;color:var(--t);margin-bottom:6px;line-height:1.3;">' + ev.titre + '</div>'

          // Ligne infos
          + '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;">'
            + '<span style="font-size:12px;color:var(--t3);">📍 ' + ville + '</span>'
            + (ev.heure ? '<span style="font-size:12px;color:var(--t3);">⏰ ' + ev.heure + '</span>' : '')
            + '<span style="font-size:12px;font-weight:500;color:var(--gold);">💳 ' + (ev.prix || 'Gratuit') + '</span>'
            + placesBadge
          + '</div>'
        + '</div>'

        // Ligne 2 : actions + détails
        + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
          + '<div style="display:flex;align-items:center;gap:8px;">' + actionBtn + '</div>'
          + '<button data-ev-open="' + ev.id + '" style="background:none;border:none;font-size:12px;color:var(--green);cursor:pointer;font-weight:500;font-family:inherit;padding:0;white-space:nowrap;">Voir les détails →</button>'
        + '</div>'

      + '</div>'
    + '</div>';
  }

  function monthLabel(m) {
    var months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    var n = parseInt(m, 10);
    return (n >= 1 && n <= 12) ? months[n-1] : (m || '--');
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
    return db.from('inscriptions').select('id,statut')
      .eq('event_id', eventId)
      .eq('membre_email', window.TDC.userEmail)
      .single()
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
