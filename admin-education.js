/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Education
 *  Fichier : admin-education.js
 *  Table   : ressources_education
 * =====================================================
 */
(function () {

  var ressources = [];

  document.addEventListener('TDCA:ready', function () {

    // Injecter item dans sidebar
    var mapItem = document.querySelector('.sb-item[data-sec="map"]');
    if (mapItem && mapItem.nextSibling) {
      var item = document.createElement('div');
      item.className = 'sb-item';
      item.setAttribute('data-sec', 'education');
      item.innerHTML = '<span class="sb-icon">📚</span> Éducation';
      mapItem.parentNode.insertBefore(item, mapItem.nextSibling);
    }

    // Injecter section
    var main = document.querySelector('.main-content');
    if (main) {
      var sec = document.createElement('div');
      sec.id = 'sec-education';
      sec.className = 'sec';
      sec.innerHTML =
        '<div class="page-header">'
          + '<div><div class="page-title">Conseils & Éducation 📚</div><div class="page-sub">Ressources pour les membres</div></div>'
          + '<button class="btn btn-p" id="btn-add-edu">+ Nouvelle ressource</button>'
        + '</div>'
        + '<div class="card"><table class="tbl" id="tbl-education"></table></div>';
      main.appendChild(sec);
    }

    // Injecter modal
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-education">'
      + '<div class="modal" style="max-width:560px;">'
        + '<div class="modal-title" id="edu-modal-title">Nouvelle ressource</div>'
        + '<input type="hidden" id="edu-edit-id">'

        + '<div class="fg"><label>Titre</label><input type="text" id="edu-titre" placeholder="Ex: Comment éduquer son chien au rappel"></div>'

        + '<div class="frow">'
          + '<div class="fg"><label>Type</label>'
            + '<select id="edu-type"><option>Conseil</option><option>Article</option><option>Vidéo</option><option>Atelier</option></select>'
          + '</div>'
          + '<div class="fg"><label>Catégorie</label>'
            + '<select id="edu-categorie"><option>Éducation</option><option>Santé</option><option>Nutrition</option><option>Comportement</option><option>Balade</option><option>Bien-être</option></select>'
          + '</div>'
        + '</div>'

        + '<div class="fg"><label>Description courte</label><textarea id="edu-desc" placeholder="Résumé en 2-3 lignes..."></textarea></div>'

        + '<div class="fg"><label>Contenu complet</label><textarea id="edu-contenu" placeholder="Le contenu détaillé de la ressource..." style="min-height:140px;"></textarea></div>'

        + '<div class="fg"><label>Auteur</label><input type="text" id="edu-auteur" placeholder="Ex: Dr. Martin, Éducateur canin"></div>'

        + '<div class="fg"><label>Photo (optionnel)</label>'
          + '<input type="file" id="edu-photo" accept="image/*" style="font-size:13px;width:100%;">'
          + '<img id="edu-preview" style="display:none;width:100%;height:120px;object-fit:cover;border-radius:10px;margin-top:8px;" src="" alt="">'
        + '</div>'

        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-education\')">Annuler</button>'
          + '<button class="btn btn-p" id="edu-save-btn" onclick="window.TDCA.education.save()">Enregistrer</button>'
        + '</div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-edu').addEventListener('click', function () {
      resetForm(); openModal('modal-education');
    });

    document.getElementById('edu-photo').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = document.getElementById('edu-preview');
        img.src = e.target.result; img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  });

  document.addEventListener('TDCA:login', loadEdu);
  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'education') loadEdu();
  });

  async function loadEdu() {
    var db  = window.TDCA.db;
    var res = await db.from('ressources_education').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    ressources = res.data || [];
    renderEdu();
  }

  function renderEdu() {
    var tbl = document.getElementById('tbl-education');
    if (!tbl) return;
    if (ressources.length === 0) {
      tbl.innerHTML = '<tr><td colspan="6"><div class="empty">Aucune ressource pour le moment</div></td></tr>';
      return;
    }
    tbl.innerHTML =
      '<tr><th>Titre</th><th>Type</th><th>Catégorie</th><th>Auteur</th><th>Statut</th><th>Actions</th></tr>'
      + ressources.map(function (r) {
          return '<tr>'
            + '<td><div class="tbl-name">' + r.titre + '</div>'
              + (r.description ? '<div style="font-size:11px;color:var(--t3);">' + r.description.substring(0,60) + '…</div>' : '') + '</td>'
            + '<td><span class="pill pill-gray">' + (r.type||'—') + '</span></td>'
            + '<td>' + (r.categorie||'—') + '</td>'
            + '<td>' + (r.auteur||'—') + '</td>'
            + '<td>' + window.pillStatut(r.statut === 'actif' ? 'Actif' : r.statut) + '</td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.education.edit(\'' + r.id + '\')">✏️</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.education.delete(\'' + r.id + '\')">Suppr.</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  function editEdu(id) {
    var r = ressources.find(function(x) { return String(x.id) === String(id); });
    if (!r) return;
    document.getElementById('edu-modal-title').textContent = 'Modifier la ressource';
    document.getElementById('edu-edit-id').value   = r.id;
    document.getElementById('edu-titre').value     = r.titre    || '';
    document.getElementById('edu-desc').value      = r.description || '';
    document.getElementById('edu-contenu').value   = r.contenu  || '';
    document.getElementById('edu-auteur').value    = r.auteur   || '';
    document.getElementById('edu-type').value      = r.type     || 'Conseil';
    document.getElementById('edu-categorie').value = r.categorie|| 'Éducation';
    if (r.photo_url) {
      var img = document.getElementById('edu-preview');
      img.src = r.photo_url; img.style.display = 'block';
    }
    openModal('modal-education');
  }

  async function saveEdu() {
    var db    = window.TDCA.db;
    var titre = document.getElementById('edu-titre').value.trim();
    var btn   = document.getElementById('edu-save-btn');
    if (!titre) { window.TDCA.toast('Le titre est obligatoire.'); return; }
    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var payload = {
      titre:       titre,
      type:        document.getElementById('edu-type').value,
      categorie:   document.getElementById('edu-categorie').value,
      description: document.getElementById('edu-desc').value,
      contenu:     document.getElementById('edu-contenu').value,
      auteur:      document.getElementById('edu-auteur').value,
      statut:      'actif'
    };

    var file = document.getElementById('edu-photo').files[0];
    if (file) {
      try { payload.photo_url = await window.TDCUpload.upload(db, file, 'education'); }
      catch(e) { window.TDCA.toast('Erreur photo : ' + e.message); btn.textContent = 'Enregistrer'; btn.disabled = false; return; }
    }

    var editId = document.getElementById('edu-edit-id').value;
    var res = editId
      ? await db.from('ressources_education').update(payload).eq('id', editId)
      : await db.from('ressources_education').insert([payload]);

    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); }
    else {
      closeModal('modal-education');
      resetForm();
      window.TDCA.toast(editId ? 'Ressource modifiée ! 📚' : 'Ressource ajoutée ! 📚');
      await loadEdu();
    }
    btn.textContent = 'Enregistrer'; btn.disabled = false;
  }

  async function deleteEdu(id) {
    if (!confirm('Supprimer cette ressource ?')) return;
    var res = await window.TDCA.db.from('ressources_education').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Ressource supprimée.');
    await loadEdu();
  }

  function resetForm() {
    document.getElementById('edu-modal-title').textContent = 'Nouvelle ressource';
    document.getElementById('edu-edit-id').value = '';
    ['edu-titre','edu-desc','edu-contenu','edu-auteur'].forEach(function(id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('edu-photo').value = '';
    document.getElementById('edu-preview').style.display = 'none';
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.education = { load: loadEdu, save: saveEdu, edit: editEdu, delete: deleteEdu };

})();
