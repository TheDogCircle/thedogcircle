/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Partenaires
 *  Fichier : admin-partenaires.js
 *  Table   : partenaires
 * =====================================================
 */
(function () {

  var partenaires = [];

  document.addEventListener('TDCA:ready', function () {
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-partenaire">'
      + '<div class="modal" style="max-width:540px;">'
        + '<div class="modal-title" id="pt-modal-title">Nouveau partenaire</div>'
        + '<input type="hidden" id="pt-edit-id">'

        + '<div class="frow">'
          + '<div class="fg"><label>Nom du partenaire</label><input type="text" id="pt-nom" placeholder="Woof & Clean"></div>'
          + '<div class="fg"><label>Type de service</label>'
            + '<select id="pt-type"><option>Toilettage</option><option>Promenades canines</option><option>Boutique</option><option>Vétérinaire</option><option>Éducation canine</option><option>Hôtel pet-friendly</option><option>Restaurant</option><option>Autre</option></select>'
          + '</div>'
        + '</div>'

        + '<div class="fg"><label>Offre exclusive membres</label><textarea id="pt-offre" placeholder="Ex: 25% de réduction sur toutes les prestations"></textarea></div>'

        + '<div class="fg"><label>Descriptif</label><textarea id="pt-desc" placeholder="Présentation du partenaire, ses spécialités..."></textarea></div>'

        + '<div class="frow">'
          + '<div class="fg"><label>Code promo</label><input type="text" id="pt-code" placeholder="CIRCLE25" style="text-transform:uppercase;"></div>'
          + '<div class="fg"><label>Ville</label><input type="text" id="pt-ville" placeholder="Paris ou National"></div>'
        + '</div>'

        + '<div class="frow">'
          + '<div class="fg"><label>Adresse</label><input type="text" id="pt-adresse" placeholder="12 rue du Faubourg, Paris 11e"></div>'
          + '<div class="fg"><label>Site web</label><input type="url" id="pt-site" placeholder="https://woof-clean.fr"></div>'
        + '</div>'

        + '<div class="fg"><label>Photo (optionnel)</label>'
          + '<input type="file" id="pt-photo" accept="image/*" style="font-size:13px;width:100%;">'
          + '<img id="pt-preview" style="display:none;width:100%;height:140px;object-fit:cover;border-radius:10px;margin-top:8px;" src="" alt="">'
          + '<div id="pt-photo-actuelle" style="font-size:11px;color:var(--t3);margin-top:4px;"></div>'
        + '</div>'

        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-partenaire\')">Annuler</button>'
          + '<button class="btn btn-p" id="pt-save-btn" onclick="window.TDCA.partenaires.save()">Enregistrer</button>'
        + '</div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-partenaire').addEventListener('click', function () {
      resetForm(); openModal('modal-partenaire');
    });

    // Preview photo
    document.getElementById('pt-photo').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = document.getElementById('pt-preview');
        img.src = e.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
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

  function renderPartenaires() {
    var tbl = document.getElementById('tbl-partenaires');
    if (!tbl) return;
    if (partenaires.length === 0) {
      tbl.innerHTML = '<tr><td colspan="8"><div class="empty">Aucun partenaire</div></td></tr>';
      return;
    }
    tbl.innerHTML =
      '<tr><th>Photo</th><th>Partenaire</th><th>Type</th><th>Code</th><th>Ville</th><th>Site</th><th>Statut</th><th>Actions</th></tr>'
      + partenaires.map(function (p) {
          var thumb = p.photo_url
            ? '<img src="' + p.photo_url + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px;" alt="">'
            : '<div style="width:44px;height:44px;background:var(--cream2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🤝</div>';
          var siteLink = p.site_web
            ? '<a href="' + p.site_web + '" target="_blank" style="color:var(--green);font-size:11px;">Voir →</a>'
            : '—';
          return '<tr>'
            + '<td>' + thumb + '</td>'
            + '<td><div class="tbl-name">' + p.nom + '</div>'
              + (p.adresse ? '<div style="font-size:11px;color:var(--t3);">' + p.adresse + '</div>' : '') + '</td>'
            + '<td><span class="pill pill-gray">' + p.type + '</span></td>'
            + '<td style="font-family:monospace;font-size:12px;">' + p.code + '</td>'
            + '<td>' + (p.ville||'—') + '</td>'
            + '<td>' + siteLink + '</td>'
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
    document.getElementById('pt-nom').value     = p.nom       || '';
    document.getElementById('pt-offre').value   = p.offre     || '';
    document.getElementById('pt-desc').value    = p.description|| '';
    document.getElementById('pt-code').value    = p.code      || '';
    document.getElementById('pt-ville').value   = p.ville     || '';
    document.getElementById('pt-adresse').value = p.adresse   || '';
    document.getElementById('pt-site').value    = p.site_web  || '';
    var photoInfo = document.getElementById('pt-photo-actuelle');
    if (p.photo_url) {
      photoInfo.innerHTML = 'Photo actuelle : <a href="' + p.photo_url + '" target="_blank" style="color:var(--green);">voir</a>';
      var img = document.getElementById('pt-preview');
      img.src = p.photo_url; img.style.display = 'block';
    } else {
      photoInfo.textContent = '';
      document.getElementById('pt-preview').style.display = 'none';
    }
    openModal('modal-partenaire');
  }

  // ── Sauvegarder ────────────────────────────────────
  async function savePartenaire() {
    var db     = window.TDCA.db;
    var nom    = document.getElementById('pt-nom').value.trim();
    var code   = document.getElementById('pt-code').value.trim().toUpperCase();
    var btn    = document.getElementById('pt-save-btn');
    if (!nom || !code) { window.TDCA.toast('Nom et code obligatoires.'); return; }

    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var payload = {
      nom:         nom,
      type:        document.getElementById('pt-type').value,
      offre:       document.getElementById('pt-offre').value,
      description: document.getElementById('pt-desc').value,
      code:        code,
      ville:       document.getElementById('pt-ville').value || 'National',
      adresse:     document.getElementById('pt-adresse').value,
      site_web:    document.getElementById('pt-site').value,
      statut:      'Actif'
    };

    // Upload photo si sélectionnée
    var file = document.getElementById('pt-photo').files[0];
    if (file) {
      try {
        payload.photo_url = await window.TDCUpload.upload(db, file, 'partenaires');
      } catch (e) {
        window.TDCA.toast('Erreur photo : ' + e.message);
        btn.textContent = 'Enregistrer'; btn.disabled = false;
        return;
      }
    }

    var editId = document.getElementById('pt-edit-id').value;
    var res    = editId
      ? await db.from('partenaires').update(payload).eq('id', editId)
      : await db.from('partenaires').insert([payload]);

    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); }
    else {
      closeModal('modal-partenaire');
      resetForm();
      window.TDCA.toast(editId ? 'Partenaire modifié ! 🤝' : 'Partenaire ajouté ! 🤝');
      await loadPartenaires();
    }
    btn.textContent = 'Enregistrer'; btn.disabled = false;
  }

  // ── Supprimer ──────────────────────────────────────
  async function deletePartenaire(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    var res = await window.TDCA.db.from('partenaires').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Partenaire supprimé.');
    await loadPartenaires();
  }

  function resetForm() {
    document.getElementById('pt-modal-title').textContent = 'Nouveau partenaire';
    document.getElementById('pt-edit-id').value = '';
    ['pt-nom','pt-offre','pt-desc','pt-code','pt-ville','pt-adresse','pt-site'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('pt-photo').value = '';
    document.getElementById('pt-preview').style.display = 'none';
    document.getElementById('pt-photo-actuelle').textContent = '';
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.partenaires = { load: loadPartenaires, save: savePartenaire, edit: editPartenaire, delete: deletePartenaire };

})();
