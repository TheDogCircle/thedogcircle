/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Escapades
 *  Fichier : admin-escapades.js
 *  Tables  : escapades · devis_escapades
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:ready', function () {
    var suggestionsItem = document.querySelector('.sb-item[data-sec="suggestions"]');
    var partenairesItem = document.querySelector('.sb-item[data-sec="partenaires"]');
    var ref = suggestionsItem || partenairesItem;
    var item = document.createElement('div');
    item.className = 'sb-item';
    item.setAttribute('data-sec', 'escapades');
    item.innerHTML = '<span class="sb-icon">✨</span> Escapades luxury';
    if (ref && ref.nextSibling) { ref.parentNode.insertBefore(item, ref.nextSibling); }
    else { document.querySelector('.sb-nav').appendChild(item); }

    var main = document.querySelector('.main-content');
    if (!main) return;
    var sec = document.createElement('div');
    sec.id = 'sec-escapades';
    sec.className = 'sec';
    sec.innerHTML =
      '<div class="page-header">'
        + '<div><div class="page-title">Escapades luxury ✨</div><div class="page-sub">Gérer les offres et demandes de devis</div></div>'
        + '<button class="btn btn-p" id="btn-add-escapade">+ Nouvelle escapade</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:20px;">'
        + '<button id="escAdminTabOffres" style="padding:7px 16px;border-radius:100px;font-size:13px;border:1.5px solid var(--b);cursor:pointer;background:var(--green);color:#fff;font-family:inherit;">✨ Nos offres</button>'
        + '<button id="escAdminTabDevis"  style="padding:7px 16px;border-radius:100px;font-size:13px;border:1.5px solid var(--b);cursor:pointer;background:var(--w);color:var(--t2);font-family:inherit;">📋 Demandes de devis <span id="nb-devis" style="background:var(--red);color:#fff;font-size:9px;padding:1px 6px;border-radius:10px;margin-left:4px;">0</span></button>'
      + '</div>'
      + '<div id="esc-offres-panel"><div class="card"><table class="tbl" id="tbl-escapades"></table></div></div>'
      + '<div id="esc-devis-panel"  style="display:none;"><div class="card"><table class="tbl" id="tbl-devis"></table></div></div>'

      // Modal escapade
      + '<div class="modal-overlay" id="modal-escapade"><div class="modal" style="max-width:540px;">'
        + '<div class="modal-title" id="esc-modal-title">Nouvelle escapade</div>'
        + '<input type="hidden" id="esc-edit-id">'
        + '<div class="fg"><label>Titre</label><input type="text" id="esc-titre" placeholder="Week-end en villa Luberon"></div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Type</label><select id="esc-type"><option>Week-end en villa dog-friendly</option><option>Croisière canine</option><option>Spa & bien-être avec son chien</option><option>Chasse & nature premium</option><option>City break luxury</option><option>Autre</option></select></div>'
          + '<div class="fg"><label>Lieu</label><input type="text" id="esc-lieu" placeholder="Luberon, Côte d\'Azur..."></div>'
        + '</div>'
        + '<div class="fg"><label>Description</label><textarea id="esc-desc" placeholder="Décris l\'escapade..."></textarea></div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Prix affiché</label><input type="text" id="esc-prix" placeholder="À partir de 890€/pers."></div>'
          + '<div class="fg"><label>Type de prix</label><select id="esc-prix-type"><option value="devis">Sur devis</option><option value="fixe">Prix fixe</option></select></div>'
        + '</div>'
        + '<div class="frow">'
          + '<div class="fg"><label>Durée</label><input type="text" id="esc-duree" placeholder="2-3 nuits"></div>'
          + '<div class="fg"><label>Capacité max</label><input type="number" id="esc-capacite" placeholder="8"></div>'
        + '</div>'
        + '<div class="fg"><label>Photo de l\'escapade (optionnel)</label>'
          + '<input type="file" id="esc-photo" accept="image/*" style="font-size:13px;width:100%;">'
          + '<img id="esc-preview" style="display:none;width:100%;height:140px;object-fit:cover;border-radius:10px;margin-top:8px;" src="" alt="">'
          + '<div id="esc-photo-actuelle" style="font-size:11px;color:var(--t3);margin-top:4px;"></div>'
        + '</div>'
        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-escapade\')">Annuler</button>'
          + '<button class="btn btn-p" id="esc-save-btn" onclick="window.TDCA.escapades.save()">Enregistrer</button>'
        + '</div>'
      + '</div></div>'

      // Modal devis détail
      + '<div class="modal-overlay" id="modal-devis-detail"><div class="modal">'
        + '<div class="modal-title">Détail de la demande</div>'
        + '<div id="devis-detail-body"></div>'
        + '<div class="modal-footer"><button class="btn btn-o" onclick="closeModal(\'modal-devis-detail\')">Fermer</button></div>'
      + '</div></div>';

    main.appendChild(sec);

    document.getElementById('escAdminTabOffres').addEventListener('click', function () { showTab('offres'); });
    document.getElementById('escAdminTabDevis').addEventListener('click',  function () { showTab('devis'); });
    document.getElementById('btn-add-escapade').addEventListener('click',  function () { resetForm(); openModal('modal-escapade'); });

    document.getElementById('esc-photo').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = document.getElementById('esc-preview');
        img.src = e.target.result; img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  });

  document.addEventListener('TDCA:login', function () { loadEscapades(); loadDevis(); setInterval(loadDevis, 30000); });
  document.addEventListener('TDCA:section', function (e) { if (e.detail.sec === 'escapades') { loadEscapades(); loadDevis(); } });

  function showTab(tab) {
    var btnO = document.getElementById('escAdminTabOffres');
    var btnD = document.getElementById('escAdminTabDevis');
    if (btnO) { btnO.style.background = tab==='offres' ? 'var(--green)' : 'var(--w)'; btnO.style.color = tab==='offres' ? '#fff' : 'var(--t2)'; }
    if (btnD) { btnD.style.background = tab==='devis'  ? 'var(--green)' : 'var(--w)'; btnD.style.color = tab==='devis'  ? '#fff' : 'var(--t2)'; }
    document.getElementById('esc-offres-panel').style.display = tab==='offres' ? 'block' : 'none';
    document.getElementById('esc-devis-panel').style.display  = tab==='devis'  ? 'block' : 'none';
  }

  async function loadEscapades() {
    var db  = window.TDCA.db;
    var tbl = document.getElementById('tbl-escapades');
    if (!tbl) return;
    var res = await db.from('escapades').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    var data = res.data || [];
    if (data.length === 0) { tbl.innerHTML = '<tr><td colspan="8"><div class="empty">Aucune escapade créée ✨</div></td></tr>'; return; }
    tbl.innerHTML =
      '<tr><th>Photo</th><th>Titre</th><th>Type</th><th>Lieu</th><th>Prix</th><th>Durée</th><th>Statut</th><th>Actions</th></tr>'
      + data.map(function (e) {
          var thumb = e.photo_url
            ? '<img src="' + e.photo_url + '" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">'
            : '<div style="width:48px;height:48px;background:var(--goldp);border-radius:8px;display:flex;align-items:center;justify-content:center;">✨</div>';
          return '<tr>'
            + '<td>' + thumb + '</td>'
            + '<td class="tbl-name">' + e.titre + '</td>'
            + '<td><span class="pill pill-gray">' + (e.type||'—') + '</span></td>'
            + '<td>' + (e.lieu||'—') + '</td>'
            + '<td>' + (e.prix_type==='devis' ? '<span class="pill pill-amber">Sur devis</span>' : (e.prix||'—')) + '</td>'
            + '<td>' + (e.duree||'—') + '</td>'
            + '<td>' + window.pillStatut(e.statut==='actif' ? 'Actif' : 'En pause') + '</td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.escapades.edit(\'' + e.id + '\')">✏️</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.escapades.delete(\'' + e.id + '\')">Suppr.</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  async function loadDevis() {
    var db  = window.TDCA.db;
    var tbl = document.getElementById('tbl-devis');
    if (!tbl) return;
    var res = await db.from('devis_escapades').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    var data    = res.data || [];
    var pending = data.filter(function (d) { return d.statut === 'en_attente'; });
    var nb = document.getElementById('nb-devis');
    if (nb) nb.textContent = pending.length;
    window._devisData = data;
    if (data.length === 0) { tbl.innerHTML = '<tr><td colspan="7"><div class="empty">Aucune demande de devis</div></td></tr>'; return; }
    tbl.innerHTML =
      '<tr><th>Membre</th><th>Escapade</th><th>Dates</th><th>Budget</th><th>Personnes</th><th>Statut</th><th>Action</th></tr>'
      + data.map(function (d) {
          return '<tr>'
            + '<td><div class="tbl-name">' + (d.membre_prenom||'—') + '</div><div style="font-size:11px;color:var(--t3);">' + (d.membre_email||'') + '</div></td>'
            + '<td>' + (d.escapade_titre||'—') + '</td>'
            + '<td>' + (d.dates||'—') + '</td>'
            + '<td>' + (d.budget||'—') + '</td>'
            + '<td>' + (d.nb_personnes||'—') + '</td>'
            + '<td>' + window.pillStatut(d.statut==='en_attente' ? 'en_attente' : d.statut) + '</td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.escapades.showDevis(\'' + d.id + '\')">Voir</button>'
              + (d.statut==='en_attente' ? '<button class="btn-xs btn-xs-g" onclick="window.TDCA.escapades.traitDevis(\'' + d.id + '\')">Traité</button>' : '')
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  function showDevisDetail(id) {
    var d = (window._devisData||[]).find(function (x) { return String(x.id) === String(id); });
    if (!d) return;
    document.getElementById('devis-detail-body').innerHTML =
      '<div style="font-size:13px;line-height:2;">'
        + '<div><strong>Membre :</strong> ' + (d.membre_prenom||'—') + ' · ' + (d.membre_email||'') + '</div>'
        + '<div><strong>Escapade :</strong> ' + (d.escapade_titre||'—') + '</div>'
        + '<div><strong>Dates :</strong> ' + (d.dates||'—') + '</div>'
        + '<div><strong>Lieu :</strong> ' + (d.lieu||'—') + '</div>'
        + '<div><strong>Chiens :</strong> ' + (d.nb_chiens||'—') + '</div>'
        + '<div><strong>Personnes :</strong> ' + (d.nb_personnes||'—') + '</div>'
        + '<div><strong>Budget :</strong> ' + (d.budget||'—') + '</div>'
        + '<div><strong>Besoins :</strong> ' + (d.besoins||'—') + '</div>'
        + '<div style="margin-top:14px;">'
          + '<a href="mailto:' + (d.membre_email||'') + '?subject=Votre demande de devis - ' + encodeURIComponent(d.escapade_titre||'') + '" class="btn btn-p" style="font-size:13px;">📧 Répondre par email</a>'
        + '</div>'
      + '</div>';
    openModal('modal-devis-detail');
  }

  async function traiterDevis(id) {
    var res = await window.TDCA.db.from('devis_escapades').update({ statut: 'traite' }).eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Devis marqué comme traité ✓');
    await loadDevis();
  }

  async function saveEscapade() {
    var db    = window.TDCA.db;
    var titre = document.getElementById('esc-titre').value.trim();
    var btn   = document.getElementById('esc-save-btn');
    if (!titre) { window.TDCA.toast('Le titre est obligatoire.'); return; }
    btn.textContent = 'Enregistrement...'; btn.disabled = true;

    var editId  = document.getElementById('esc-edit-id').value;
    var payload = {
      titre:       titre,
      type:        document.getElementById('esc-type').value,
      lieu:        document.getElementById('esc-lieu').value,
      description: document.getElementById('esc-desc').value,
      prix:        document.getElementById('esc-prix').value,
      prix_type:   document.getElementById('esc-prix-type').value,
      duree:       document.getElementById('esc-duree').value,
      capacite:    parseInt(document.getElementById('esc-capacite').value) || null,
      statut:      'actif'
    };

    var file = document.getElementById('esc-photo').files[0];
    if (file) {
      try { payload.photo_url = await window.TDCUpload.upload(db, file, 'escapades'); }
      catch (e) { window.TDCA.toast('Erreur photo : ' + e.message); btn.textContent = 'Enregistrer'; btn.disabled = false; return; }
    }

    var res = editId
      ? await db.from('escapades').update(payload).eq('id', editId)
      : await db.from('escapades').insert([payload]);

    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); }
    else { closeModal('modal-escapade'); resetForm(); window.TDCA.toast(editId ? 'Escapade modifiée ✨' : 'Escapade créée ✨'); await loadEscapades(); }
    btn.textContent = 'Enregistrer'; btn.disabled = false;
  }

  async function editEscapade(id) {
    var db  = window.TDCA.db;
    var res = await db.from('escapades').select('*').eq('id', id).single();
    if (res.error || !res.data) return;
    var e = res.data;
    document.getElementById('esc-modal-title').textContent = 'Modifier l\'escapade';
    document.getElementById('esc-edit-id').value  = e.id;
    document.getElementById('esc-titre').value    = e.titre || '';
    document.getElementById('esc-lieu').value     = e.lieu  || '';
    document.getElementById('esc-desc').value     = e.description || '';
    document.getElementById('esc-prix').value     = e.prix  || '';
    document.getElementById('esc-duree').value    = e.duree || '';
    document.getElementById('esc-capacite').value = e.capacite || '';
    if (e.photo_url) {
      document.getElementById('esc-photo-actuelle').innerHTML = 'Photo actuelle : <a href="' + e.photo_url + '" target="_blank" style="color:var(--green);">voir</a>';
      var img = document.getElementById('esc-preview'); img.src = e.photo_url; img.style.display = 'block';
    }
    openModal('modal-escapade');
  }

  async function deleteEscapade(id) {
    if (!confirm('Supprimer cette escapade ?')) return;
    var res = await window.TDCA.db.from('escapades').delete().eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Escapade supprimée.');
    await loadEscapades();
  }

  function resetForm() {
    document.getElementById('esc-modal-title').textContent = 'Nouvelle escapade';
    document.getElementById('esc-edit-id').value = '';
    ['esc-titre','esc-lieu','esc-desc','esc-prix','esc-duree','esc-capacite'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('esc-photo').value = '';
    document.getElementById('esc-preview').style.display = 'none';
    document.getElementById('esc-photo-actuelle').textContent = '';
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.escapades = { load: loadEscapades, save: saveEscapade, edit: editEscapade, delete: deleteEscapade, showDevis: showDevisDetail, traitDevis: traiterDevis };

})();
