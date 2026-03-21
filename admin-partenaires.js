/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Partenaires
 *  Fichier : admin-partenaires.js
 *  Écoute  : TDCA:login · TDCA:section(partenaires)
 *  Expose  : window.TDCA.partenaires.load()
 * =====================================================
 */
(function () {

  var partenaires = [];

  document.addEventListener('TDCA:ready', function () {
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-partenaire">'
      + '<div class="modal">'
        + '<div class="modal-title" id="pt-modal-title">Nouveau partenaire</div>'
        + '<input type="hidden" id="pt-edit-id">'
        + '<div class="fg"><label>Nom du partenaire</label><input type="text" id="pt-nom" placeholder="Ex: Woof & Clean"></div>'
        + '<div class="fg"><label>Type de service</label>'
          + '<select id="pt-type">'
            + '<option>Toilettage</option><option>Promenades canines</option><option>Boutique</option>'
            + '<option>Vétérinaire</option><option>Éducation canine</option><option>Hôtel pet-friendly</option>'
            + '<option>Restaurant</option><option>Autre</option>'
          + '</select>'
        + '</div>'
        + '<div class="fg"><label>Offre exclusive membres</label>'
          + '<textarea id="pt-offre" placeholder="Ex: 25% de réduction sur toutes les prestations"></textarea>'
        + '</div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Code promo</label><input type="text" id="pt-code" placeholder="CIRCLE25" style="text-transform:uppercase;"></div>'
          + '<div class="fg"><label>Ville</label><input type="text" id="pt-ville" placeholder="Paris ou National"></div>'
        + '</div>'
        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-partenaire\')">Annuler</button>'
          + '<button class="btn btn-p" onclick="window.TDCA.partenaires.save()">Enregistrer</button>'
        + '</div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-partenaire').addEventListener('click', function () {
      resetForm();
      openModal('modal-partenaire');
    });
  });

  document.addEventListener('TDCA:login', loadPartenaires);

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'partenaires') loadPartenaires();
  });

  // ── Charger ────────────────────────────────────────
  async function loadPartenaires() {
    var db  = window.TDCA.db;
    var res = await db.from('partenaires').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    partenaires = res.data || [];
    document.getElementById('stat-partenaires').textContent =
      partenaires.filter(function (p) { return p.statut === 'Actif'; }).length;
    renderPartenaires();
  }

  // ── Rendu ──────────────────────────────────────────
  function renderPartenaires() {
    var tbl = document.getElementById('tbl-partenaires');
    if (!tbl) return;

    if (partenaires.length === 0) {
      tbl.innerHTML = '<tr><td colspan="7"><div class="empty">Aucun partenaire pour le moment</div></td></tr>';
      return;
    }

    tbl.innerHTML =
      '<tr><th>Partenaire</th><th>Type</th><th>Offre</th><th>Code</th><th>Ville</th><th>Statut</th><th>Actions</th></tr>'
      + partenaires.map(function (p) {
          return '<tr>'
            + '<td class="tbl-name">' + p.nom + '</td>'
            + '<td><span class="pill pill-gray">' + p.type + '</span></td>'
            + '<td style="font-size:11px;color:var(--t3);max-width:160px;">' + (p.offre || '—') + '</td>'
            + '<td style="font-family:monospace;font-size:12px;">' + p.code + '</td>'
            + '<td>' + (p.ville || '—') + '</td>'
            + '<td>' + window.pillStatut(p.statut) + '</td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.partenaires.edit(\'' + p.id + '\')">✏️</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.partenaires.delete(\'' + p.id + '\')">Suppr.</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  // ── Éditer ─────────────────────────────────────────
  function editPartenaire(id) {
    var p = partenaires.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    document.getElementById('pt-modal-title').textContent = 'Modifier le partenaire';
    document.getElementById('pt-edit-id').value = p.id;
    document.getElementById('pt-nom').value     = p.nom;
    document.getElementById('pt-offre').value   = p.offre || '';
    document.getElementById('pt-code').value    = p.code;
    document.getElementById('pt-ville').value   = p.ville || '';
    openModal('modal-partenaire');
  }

  // ── Sauvegarder ────────────────────────────────────
  async function savePartenaire() {
    var db   = window.TDCA.db;
    var nom  = document.getElementById('pt-nom').value.trim();
    var code = document.getElementById('pt-code').value.trim().toUpperCase();
    if (!nom || !code) { window.TDCA.toast('Nom et code obligatoires.'); return; }

    var editId  = document.getElementById('pt-edit-id').value;
    var payload = {
      nom:    nom,
      type:   document.getElementById('pt-type').value,
      offre:  document.getElementById('pt-offre').value,
      code:   code,
      ville:  document.getElementById('pt-ville').value || 'National',
      statut: 'Actif'
    };

    var res;
    if (editId) {
      res = await db.from('partenaires').update(payload).eq('id', editId);
    } else {
      res = await db.from('partenaires').insert([payload]);
    }

    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }

    closeModal('modal-partenaire');
    resetForm();
    window.TDCA.toast(editId ? 'Partenaire modifié ! 🤝' : 'Partenaire ajouté ! 🤝');
    await loadPartenaires();
  }

  // ── Supprimer ──────────────────────────────────────
  async function deletePartenaire(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    var db  = window.TDCA.db;
    var res = await db.from('partenaires').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Partenaire supprimé.');
    await loadPartenaires();
  }

  function resetForm() {
    document.getElementById('pt-modal-title').textContent = 'Nouveau partenaire';
    document.getElementById('pt-edit-id').value = '';
    ['pt-nom','pt-offre','pt-code','pt-ville'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
  }

  // ── API publique ────────────────────────────────────
  window.TDCA = window.TDCA || {};
  window.TDCA.partenaires = {
    load:   loadPartenaires,
    save:   savePartenaire,
    edit:   editPartenaire,
    delete: deletePartenaire
  };

})();
