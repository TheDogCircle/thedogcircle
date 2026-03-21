/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Membres
 *  Fichier : admin-membres.js
 *  Écoute  : TDCA:login · TDCA:section(membres)
 *  Expose  : window.TDCA.membres.load()
 * =====================================================
 */
(function () {

  var membres = [];

  // Injecter la modal membres
  document.addEventListener('TDCA:ready', function () {
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-membre">'
      + '<div class="modal">'
        + '<div class="modal-title">Ajouter un membre</div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Prénom maître</label><input type="text" id="mb-prenom" placeholder="Sophie"></div>'
          + '<div class="fg"><label>Prénom chien</label><input type="text" id="mb-chien" placeholder="Noisette"></div>'
        + '</div>'
        + '<div class="fg"><label>Email</label><input type="email" id="mb-email" placeholder="sophie@email.com"></div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Race</label><input type="text" id="mb-race" placeholder="Cocker Spaniel"></div>'
          + '<div class="fg"><label>Ville</label>'
            + '<select id="mb-ville"><option>Paris</option><option>Lyon</option><option>Bordeaux</option><option>Nantes</option><option>Marseille</option><option>Lille</option><option>Autre</option></select>'
          + '</div>'
        + '</div>'
        + '<div class="fg"><label>Formule</label>'
          + '<select id="mb-formule">'
            + '<option>Fondateur — 79€ la 1ère année</option>'
            + '<option selected>Annuel — 149€/an</option>'
            + '<option>Mensuel — 14,90€/mois</option>'
          + '</select>'
        + '</div>'
        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-membre\')">Annuler</button>'
          + '<button class="btn btn-p" onclick="window.TDCA.membres.save()">Ajouter le membre</button>'
        + '</div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-membre').addEventListener('click', function () {
      openModal('modal-membre');
    });
  });

  document.addEventListener('TDCA:login', loadMembres);

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'membres') loadMembres();
  });

  // ── Charger ────────────────────────────────────────
  async function loadMembres() {
    var db  = window.TDCA.db;
    var res = await db.from('membres').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }

    membres = res.data || [];
    document.getElementById('sub-membres').textContent = membres.length + ' membres actifs';
    document.getElementById('stat-membres').textContent = membres.length;
    renderMembres();
  }

  // ── Rendu ──────────────────────────────────────────
  function renderMembres() {
    var tbl = document.getElementById('tbl-membres');
    if (!tbl) return;

    if (membres.length === 0) {
      tbl.innerHTML = '<tr><td colspan="6"><div class="empty">Aucun membre pour le moment</div></td></tr>';
      return;
    }

    tbl.innerHTML =
      '<tr><th>Membre</th><th>Chien</th><th>Formule</th><th>Ville</th><th>Statut</th><th>Action</th></tr>'
      + membres.map(function (m) {
          return '<tr>'
            + '<td><div class="tbl-name">' + m.prenom + '</div>'
              + '<div style="font-size:11px;color:var(--t3);">' + (m.email || '') + '</div></td>'
            + '<td>' + (m.chien || '—') + (m.race ? ' · ' + m.race : '') + '</td>'
            + '<td>' + window.pillFormule(m.formule) + '</td>'
            + '<td>' + (m.ville || '—') + '</td>'
            + '<td>' + window.pillStatut(m.statut === 'actif' ? 'Actif' : m.statut) + '</td>'
            + '<td><button class="btn-xs btn-xs-r" onclick="window.TDCA.membres.delete(\'' + m.id + '\')">Suppr.</button></td>'
          + '</tr>';
        }).join('');
  }

  // ── Sauvegarder ────────────────────────────────────
  async function saveMembre() {
    var db     = window.TDCA.db;
    var prenom = document.getElementById('mb-prenom').value.trim();
    var email  = document.getElementById('mb-email').value.trim();
    if (!prenom || !email) { window.TDCA.toast('Prénom et email obligatoires.'); return; }

    var res = await db.from('membres').insert([{
      prenom:  prenom,
      email:   email,
      ville:   document.getElementById('mb-ville').value,
      chien:   document.getElementById('mb-chien').value || '—',
      race:    document.getElementById('mb-race').value  || '—',
      formule: document.getElementById('mb-formule').value.split('—')[0].trim(),
      statut:  'actif'
    }]);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }

    closeModal('modal-membre');
    ['mb-prenom','mb-chien','mb-email','mb-race'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    window.TDCA.toast('Membre ajouté ! 🐾');
    await loadMembres();
  }

  // ── Supprimer ──────────────────────────────────────
  async function deleteMembre(id) {
    if (!confirm('Supprimer ce membre ?')) return;
    var db  = window.TDCA.db;
    var res = await db.from('membres').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Membre supprimé.');
    await loadMembres();
  }

  // ── API publique ────────────────────────────────────
  window.TDCA = window.TDCA || {};
  window.TDCA.membres = { load: loadMembres, save: saveMembre, delete: deleteMembre };

})();
