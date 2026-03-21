/**
 * =====================================================
 *  THE DOG CIRCLE — Module Events
 *  Fichier : events.js
 *  Écoute  : TDC:ready · TDC:tab(events)
 *  Expose  : window.TDC.events.load()
 * =====================================================
 */
(function () {

  var mesInscriptions = [];

  document.addEventListener('TDC:ready', function () {
    // Délégation clics boutons (inscrire / désinscrire)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var action = btn.dataset.action;

      if (action === 'inscrire') {
        var id      = btn.dataset.id;
        var attente = btn.dataset.attente === '1';
        btn.disabled    = true;
        btn.textContent = '...';
        inscrire(id, attente)
          .then(function () { loadEvents(); })
          .catch(function (err) {
            btn.disabled    = false;
            btn.textContent = attente ? 'Liste attente' : "S'inscrire";
            alert('Erreur : ' + err.message);
          });

      } else if (action === 'desinscrire') {
        if (!confirm('Tu veux vraiment te désinscrire ?')) return;
        btn.disabled = true;
        desinscrire(btn.dataset.id)
          .then(function () { loadEvents(); })
          .catch(function (err) {
            btn.disabled = false;
            alert('Erreur : ' + err.message);
          });

      } else if (action === 'annuler-payant') {
        var titre = btn.dataset.titre;
        var msg   = 'Cet événement est payant et a lieu dans moins de 24h.\n'
                  + 'Pour annuler, contacte thedogcircleclub@gmail.com\n'
                  + 'Objet : Annulation - ' + titre;
        if (confirm(msg + '\n\nVeux-tu ouvrir ton client email ?')) {
          window.location.href = 'mailto:thedogcircleclub@gmail.com'
            + '?subject=' + encodeURIComponent('Annulation - ' + titre)
            + '&body='    + encodeURIComponent(
                'Bonjour,\nJe souhaite annuler mon inscription à : ' + titre
                + '\nMon email : ' + window.TDC.userEmail
              );
        }
      }
    });
  });

  // Charger à l'ouverture de l'onglet
  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'events') loadEvents();
  });

  // Charger aussi au login (premier chargement automatique)
  document.addEventListener('TDC:login', function () {
    loadEvents();
  });

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

      if (evRes.error) {
        c.innerHTML = '<div class="error">Erreur : ' + evRes.error.message + '</div>';
        return;
      }
      if (!evRes.data || evRes.data.length === 0) {
        c.innerHTML = '<div class="loading">Aucun event pour le moment 🐾</div>';
        return;
      }
      c.innerHTML = evRes.data.map(function (ev) { return renderEvent(ev); }).join('');

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
          + restantes + ' place' + (restantes > 1 ? 's' : '')
          + ' restante' + (restantes > 1 ? 's' : '') + '</span>';

    var actions = '';
    if (estInscrit) {
      actions = '<span class="ev-tag tag-green" style="padding:5px 12px;">✓ Inscrit</span>'
        + ((payant && moins24h)
          ? '<button class="btn btn-danger" data-action="annuler-payant" data-titre="' + ev.titre + '">Annuler</button>'
          : '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Se désinscrire</button>');
    } else if (enAttente) {
      actions = '<span class="ev-tag tag-yellow" style="padding:5px 12px;">⏳ Liste attente</span>'
        + '<button class="btn btn-danger" data-action="desinscrire" data-id="' + ev.id + '">Annuler</button>';
    } else if (complet) {
      actions = '<button class="btn btn-o" style="font-size:12px;padding:6px 14px;"'
        + ' data-action="inscrire" data-id="' + ev.id + '" data-attente="1">Liste attente</button>';
    } else {
      actions = '<button class="btn btn-p" style="font-size:12px;padding:6px 14px;"'
        + ' data-action="inscrire" data-id="' + ev.id + '" data-attente="0">S\'inscrire</button>';
    }

    return '<div class="ev-card" data-evid="' + ev.id + '">'
      + '<div class="ev-date"><div class="ev-day">' + (parts[0] || '--') + '</div>'
        + '<div class="ev-month">' + (parts[1] || '--') + '</div></div>'
      + '<div class="ev-body">'
        + '<div class="ev-title">' + ev.titre + '</div>'
        + '<div class="ev-detail">' + (ev.ville || 'National') + ' · ' + (ev.prix || 'Gratuit') + '</div>'
        + '<div class="ev-tags"><span class="ev-tag tag-gold">' + (ev.prix || 'Gratuit') + '</span>' + spotsTag + '</div>'
        + '<div class="ev-actions">' + actions + '</div>'
      + '</div></div>';
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
            if (evRes.data) {
              return db.from('events')
                .update({ inscrits: (evRes.data.inscrits || 0) + 1 })
                .eq('id', eventId);
            }
          });
      }
    });
  }

  // ── Désinscrire ──────────────────────────────────────
  function desinscrire(eventId) {
    var db = window.TDC.db;
    return db.from('inscriptions')
      .select('id,statut')
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
                  if (evRes.data && evRes.data.inscrits > 0) {
                    return db.from('events')
                      .update({ inscrits: evRes.data.inscrits - 1 })
                      .eq('id', eventId);
                  }
                });
            }
          });
      });
  }

  // ── API publique ─────────────────────────────────────
  window.TDC = window.TDC || {};
  window.TDC.events = { load: loadEvents };

})();
