/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Events
 *  Fichier : admin-events.js
 *  Écoute  : TDCA:login · TDCA:section(events)
 *  Expose  : window.TDCA.events.load()
 * =====================================================
 */
(function () {

  var events = [];

  document.addEventListener('TDCA:ready', function () {
    // Injecter la modal
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-event">'
      + '<div class="modal">'
        + '<div class="modal-title" id="ev-modal-title">Nouvel event</div>'
        + '<input type="hidden" id="ev-edit-id">'
        + '<div class="fg"><label>Titre</label><input type="text" id="ev-title" placeholder="Ex: Balade Forêt de Fontainebleau"></div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Date</label><input type="date" id="ev-date"></div>'
          + '<div class="fg"><label>Heure</label><input type="time" id="ev-time" value="10:00"></div>'
        + '</div>'
        + '<div class="fg"><label>Lieu / Détails</label><input type="text" id="ev-lieu" placeholder="Ex: RDV parking principal"></div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Prix membres</label><input type="text" id="ev-prix" placeholder="Gratuit ou 39€"></div>'
          + '<div class="fg"><label>Nombre de places</label><input type="number" id="ev-places" placeholder="12"></div>'
        + '</div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Type</label>'
            + '<select id="ev-type"><option>Balade</option><option>Évasion</option><option>Apéro canin</option><option>Atelier éducation</option><option>Shooting photo</option><option>Dîner dog-friendly</option><option>Autre</option></select>'
          + '</div>'
          + '<div class="fg"><label>Ville</label>'
            + '<select id="ev-ville"><option>Paris</option><option>Lyon</option><option>Bordeaux</option><option>Nantes</option><option>Marseille</option><option>Lille</option><option>National</option></select>'
          + '</div>'
        + '</div>'
        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-event\')">Annuler</button>'
          + '<button class="btn btn-p" onclick="window.TDCA.events.save()">Enregistrer</button>'
        + '</div>'
      + '</div></div>'

      // Modal inscrits
      + '<div class="modal-overlay" id="modal-inscrits">'
      + '<div class="modal">'
        + '<div class="modal-title" id="inscrits-title">Inscrits</div>'
        + '<div id="inscrits-body"></div>'
        + '<div class="modal-footer"><button class="btn btn-o" onclick="closeModal(\'modal-inscrits\')">Fermer</button></div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-event').addEventListener('click', function () {
      resetForm();
      openModal('modal-event');
    });
  });

  document.addEventListener('TDCA:login', loadEvents);

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'events') loadEvents();
  });

  // ── Charger ────────────────────────────────────────
  async function loadEvents() {
    var db  = window.TDCA.db;
    var res = await db.from('events').select('*').order('date_raw', { ascending: true });
    if (res.error) { console.error(res.error); return; }
    events = res.data || [];
    document.getElementById('stat-events').textContent = events.filter(function (e) {
      return e.date_raw >= new Date().toISOString().split('T')[0];
    }).length;
    renderEvents();
    if (window.TDCA.dashboard) window.TDCA.dashboard.refresh();
  }

  // ── Rendu ──────────────────────────────────────────
  function renderEvents() {
    var tbl = document.getElementById('tbl-events');
    if (!tbl) return;

    if (events.length === 0) {
      tbl.innerHTML = '<tr><td colspan="8"><div class="empty">Aucun event pour le moment</div></td></tr>';
      return;
    }

    tbl.innerHTML =
      '<tr><th>Event</th><th>Date</th><th>Ville</th><th>Prix</th><th>Inscrits</th><th>Places restantes</th><th>Statut</th><th>Actions</th></tr>'
      + events.map(function (e) {
          var restantes    = e.places - (e.inscrits || 0);
          var complet      = restantes <= 0;
          var spotsStyle   = complet
            ? 'color:#dc2626;font-weight:600;'
            : restantes <= 3
              ? 'color:#d97706;font-weight:600;'
              : 'color:#059669;';
          return '<tr>'
            + '<td class="tbl-name">' + e.titre + '</td>'
            + '<td>' + (e.date || '—') + '</td>'
            + '<td><span class="pill pill-gray">' + (e.ville || '—') + '</span></td>'
            + '<td>' + (e.prix || 'Gratuit') + '</td>'
            + '<td><strong>' + (e.inscrits || 0) + '</strong> / ' + e.places + '</td>'
            + '<td style="' + spotsStyle + '">' + (complet ? 'COMPLET' : restantes + ' restante' + (restantes > 1 ? 's' : '')) + '</td>'
            + '<td>' + window.pillStatut(e.statut) + '</td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs btn-xs-e" onclick="window.TDCA.events.inscrits(\'' + e.id + '\',\'' + e.titre.replace(/'/g, '') + '\')">Inscrits</button>'
              + '<button class="btn-xs" onclick="window.TDCA.events.edit(\'' + e.id + '\')">✏️</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.events.delete(\'' + e.id + '\')">Suppr.</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  // ── Voir inscrits ───────────────────────────────────
  async function voirInscrits(eventId, eventTitre) {
    var db  = window.TDCA.db;
    var res = await db.from('inscriptions').select('*').eq('event_id', eventId).order('created_at', { ascending: true });
    if (res.error) { alert('Erreur : ' + res.error.message); return; }

    var data      = res.data || [];
    var confirmes = data.filter(function (i) { return i.statut === 'confirme'; });
    var attente   = data.filter(function (i) { return i.statut === 'liste_attente'; });

    document.getElementById('inscrits-title').textContent = 'Inscrits — ' + eventTitre;
    document.getElementById('inscrits-body').innerHTML =
      '<div style="margin-bottom:16px;">'
        + '<div style="font-size:12px;font-weight:500;color:var(--green);margin-bottom:8px;">✅ Confirmés (' + confirmes.length + ')</div>'
        + (confirmes.length === 0
          ? '<div style="color:var(--t3);font-size:12px;">Aucun inscrit confirmé</div>'
          : confirmes.map(function (i, n) {
              return '<div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--b);">'
                + '<strong>' + (n + 1) + '.</strong> ' + i.membre_prenom + ' — ' + i.membre_email
              + '</div>';
            }).join(''))
      + '</div>'
      + (attente.length > 0
        ? '<div>'
            + '<div style="font-size:12px;font-weight:500;color:var(--gold);margin-bottom:8px;">⏳ Liste d\'attente (' + attente.length + ')</div>'
            + attente.map(function (i, n) {
                return '<div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--b);">'
                  + '<strong>' + (n + 1) + '.</strong> ' + i.membre_prenom + ' — ' + i.membre_email
                + '</div>';
              }).join('')
          + '</div>'
        : '');

    openModal('modal-inscrits');
  }

  // ── Éditer ─────────────────────────────────────────
  function editEvent(id) {
    var e = events.find(function (x) { return x.id === id; });
    if (!e) return;
    document.getElementById('ev-modal-title').textContent = 'Modifier l\'event';
    document.getElementById('ev-edit-id').value  = e.id;
    document.getElementById('ev-title').value    = e.titre;
    document.getElementById('ev-date').value     = e.date_raw || '';
    document.getElementById('ev-prix').value     = e.prix || '';
    document.getElementById('ev-places').value   = e.places || '';
    document.getElementById('ev-ville').value    = e.ville || 'Paris';
    openModal('modal-event');
  }

  // ── Sauvegarder ────────────────────────────────────
  async function saveEvent() {
    var db    = window.TDCA.db;
    var titre = document.getElementById('ev-title').value.trim();
    var date  = document.getElementById('ev-date').value;
    if (!titre || !date) { window.TDCA.toast('Titre et date obligatoires.'); return; }

    var d       = new Date(date);
    var dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    var editId  = document.getElementById('ev-edit-id').value;

    var payload = {
      titre:    titre,
      date:     dateStr,
      date_raw: date,
      prix:     document.getElementById('ev-prix').value  || 'Gratuit',
      places:   parseInt(document.getElementById('ev-places').value) || 10,
      ville:    document.getElementById('ev-ville').value,
      statut:   'Ouvert'
    };

    var res;
    if (editId) {
      res = await db.from('events').update(payload).eq('id', editId);
    } else {
      payload.inscrits = 0;
      res = await db.from('events').insert([payload]);
    }

    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }

    closeModal('modal-event');
    resetForm();
    window.TDCA.toast(editId ? 'Event modifié ! 🎉' : 'Event créé ! 🎉');
    await loadEvents();
  }

  // ── Supprimer ──────────────────────────────────────
  async function deleteEvent(id) {
    if (!confirm('Supprimer cet event ?')) return;
    var db  = window.TDCA.db;
    var res = await db.from('events').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Event supprimé.');
    await loadEvents();
  }

  function resetForm() {
    document.getElementById('ev-modal-title').textContent = 'Nouvel event';
    document.getElementById('ev-edit-id').value  = '';
    ['ev-title','ev-date','ev-lieu','ev-prix','ev-places'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
  }

  // ── API publique ────────────────────────────────────
  window.TDCA = window.TDCA || {};
  window.TDCA.events = {
    load:     loadEvents,
    save:     saveEvent,
    edit:     editEvent,
    delete:   deleteEvent,
    inscrits: voirInscrits
  };

})();
