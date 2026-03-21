/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Map / Villes
 *  Fichier : admin-map.js
 *  Écoute  : TDCA:login · TDCA:section(map)
 * =====================================================
 */
(function () {

  var villes = [
    { nom:'Paris',     emoji:'🗼', membres:34, events:2 },
    { nom:'Lyon',      emoji:'🦁', membres:18, events:2 },
    { nom:'Bordeaux',  emoji:'🍷', membres:12, events:1 },
    { nom:'Nantes',    emoji:'🐘', membres:9,  events:1 },
    { nom:'Marseille', emoji:'⛵', membres:7,  events:1 },
    { nom:'Lille',     emoji:'🍺', membres:5,  events:1 },
  ];

  document.addEventListener('TDCA:ready', function () {
    document.getElementById('modals-container').insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="modal-ville">'
      + '<div class="modal">'
        + '<div class="modal-title">Ajouter une ville</div>'
        + '<div class="fg"><label>Nom de la ville</label><input type="text" id="vl-nom" placeholder="Ex: Toulouse"></div>'
        + '<div class="fg"><label>Emoji représentatif</label><input type="text" id="vl-emoji" placeholder="Ex: 🌸"></div>'
        + '<div class="modal-footer">'
          + '<button class="btn btn-o" onclick="closeModal(\'modal-ville\')">Annuler</button>'
          + '<button class="btn btn-p" onclick="window.TDCA.map.saveVille()">Ajouter</button>'
        + '</div>'
      + '</div></div>'
    );

    document.getElementById('btn-add-ville').addEventListener('click', function () {
      openModal('modal-ville');
    });
  });

  document.addEventListener('TDCA:login', function () {
    buildVilles();
  });

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'map') {
      buildVilles();
      // Futur : charger une carte Leaflet admin ici
    }
  });

  function buildVilles() {
    var tbl = document.getElementById('tbl-villes');
    if (!tbl) return;

    tbl.innerHTML =
      '<tr><th>Ville</th><th>Membres</th><th>Events locaux</th><th>Statut</th><th>Action</th></tr>'
      + villes.map(function (v) {
          var statut = v.membres >= 10 ? 'Actif' : 'Peu actif';
          return '<tr>'
            + '<td class="tbl-name">' + v.emoji + ' ' + v.nom + '</td>'
            + '<td>' + v.membres + '</td>'
            + '<td>' + v.events + '</td>'
            + '<td>' + window.pillStatut(statut) + '</td>'
            + '<td><button class="btn-xs btn-xs-r" onclick="window.TDCA.map.deleteVille(\'' + v.nom + '\')">Suppr.</button></td>'
          + '</tr>';
        }).join('');
  }

  function saveVille() {
    var nom   = document.getElementById('vl-nom').value.trim();
    var emoji = document.getElementById('vl-emoji').value.trim() || '📍';
    if (!nom) { window.TDCA.toast('Nom obligatoire.'); return; }
    villes.push({ nom: nom, emoji: emoji, membres: 0, events: 0 });
    closeModal('modal-ville');
    document.getElementById('vl-nom').value   = '';
    document.getElementById('vl-emoji').value = '';
    buildVilles();
    window.TDCA.toast('Ville ajoutée ! 📍');
  }

  function deleteVille(nom) {
    if (!confirm('Supprimer la ville ' + nom + ' ?')) return;
    villes = villes.filter(function (v) { return v.nom !== nom; });
    buildVilles();
    window.TDCA.toast('Ville supprimée.');
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.map = {
    saveVille:   saveVille,
    deleteVille: deleteVille
  };

})();
