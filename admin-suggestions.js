/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Suggestions & Demandes
 *  Fichier : admin-suggestions.js
 *  Tables  : suggestions_events · demandes_garde
 *  Écoute  : TDCA:login · TDCA:section(suggestions)
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:ready', function () {
    // Ajouter l'entrée dans la sidebar
    var sbNav = document.querySelector('.sb-nav');
    if (!sbNav || document.querySelector('[data-sec="suggestions"]')) return;

    var secDiv = document.createElement('div');
    secDiv.innerHTML =
      '<div class="sb-sec">Membres</div>'
      + '<div class="sb-item" data-sec="suggestions"><span class="sb-icon">💡</span> Suggestions & Demandes <span class="sb-badge" id="nb-suggestions">0</span></div>';
    sbNav.appendChild(secDiv);

    // Ajouter la section dans le contenu
    var main = document.querySelector('.main-content');
    if (main) {
      var sec = document.createElement('div');
      sec.id = 'sec-suggestions';
      sec.className = 'sec';
      sec.innerHTML =
        '<div class="page-header"><div><div class="page-title">Suggestions & Demandes 💡</div><div class="page-sub">Idées d\'events et demandes de garde des membres</div></div></div>'

        + '<div style="font-size:14px;font-weight:500;color:var(--t);margin-bottom:12px;">💡 Suggestions d\'events</div>'
        + '<div class="card"><table class="tbl" id="tbl-suggestions"></table></div>'

        + '<div style="font-size:14px;font-weight:500;color:var(--t);margin:20px 0 12px;">🐾 Demandes de garde</div>'
        + '<div class="card"><table class="tbl" id="tbl-demandes"></table></div>';
      main.appendChild(sec);
    }
  });

  document.addEventListener('TDCA:login', function () {
    loadAll();
    setInterval(loadAll, 30000);
  });

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'suggestions') loadAll();
  });

  async function loadAll() {
    await Promise.all([loadSuggestions(), loadDemandes()]);
  }

  // ── Suggestions events ───────────────────────────────
  async function loadSuggestions() {
    var db  = window.TDCA.db;
    var res = await db.from('suggestions_events').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    var data    = res.data || [];
    var pending = data.filter(function (s) { return s.statut === 'en_attente'; });
    document.getElementById('nb-suggestions').textContent = pending.length;

    var tbl = document.getElementById('tbl-suggestions');
    if (!tbl) return;
    if (data.length === 0) {
      tbl.innerHTML = '<tr><td colspan="6"><div class="empty">Aucune suggestion pour le moment</div></td></tr>';
      return;
    }
    tbl.innerHTML =
      '<tr><th>Membre</th><th>Titre</th><th>Ville</th><th>Date souhaitée</th><th>Statut</th><th>Action</th></tr>'
      + data.map(function (s) {
          return '<tr>'
            + '<td><div class="tbl-name">' + (s.membre_prenom||'—') + '</div><div style="font-size:11px;color:var(--t3);">' + (s.membre_email||'') + '</div></td>'
            + '<td><strong>' + s.titre + '</strong>' + (s.description ? '<div style="font-size:11px;color:var(--t3);max-width:200px;">' + s.description.substring(0,80) + '</div>' : '') + '</td>'
            + '<td>' + (s.ville||'—') + '</td>'
            + '<td>' + (s.date_souhaitee||'—') + '</td>'
            + '<td>' + window.pillStatut(s.statut === 'en_attente' ? 'en_attente' : s.statut) + '</td>'
            + '<td><div class="actions">'
              + (s.statut === 'en_attente'
                ? '<button class="btn-xs btn-xs-g" onclick="window.TDCA.suggestions.acceptSug(\'' + s.id + '\')">✓ Créer l\'event</button>'
                  + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.suggestions.rejectSug(\'' + s.id + '\')">✗ Refuser</button>'
                : '')
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  // ── Demandes de garde ────────────────────────────────
  async function loadDemandes() {
    var db  = window.TDCA.db;
    var res = await db.from('demandes_garde').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }
    var data = res.data || [];

    var tbl = document.getElementById('tbl-demandes');
    if (!tbl) return;
    if (data.length === 0) {
      tbl.innerHTML = '<tr><td colspan="6"><div class="empty">Aucune demande de garde pour le moment</div></td></tr>';
      return;
    }
    tbl.innerHTML =
      '<tr><th>Membre</th><th>Chien</th><th>Dates</th><th>Ville</th><th>Message</th><th>Statut</th></tr>'
      + data.map(function (d) {
          return '<tr>'
            + '<td><div class="tbl-name">' + (d.membre_prenom||'—') + '</div><div style="font-size:11px;color:var(--t3);">' + (d.membre_email||'') + '</div></td>'
            + '<td>' + (d.chien||'—') + '</td>'
            + '<td>' + (d.dates||'—') + '</td>'
            + '<td>' + (d.ville||'—') + '</td>'
            + '<td style="font-size:11px;color:var(--t3);max-width:180px;">' + (d.message||'—').substring(0,80) + '</td>'
            + '<td>' + window.pillStatut(d.statut === 'en_attente' ? 'en_attente' : d.statut) + '</td>'
          + '</tr>';
        }).join('');
  }

  // ── Actions suggestions ──────────────────────────────
  async function acceptSuggestion(id) {
    var db  = window.TDCA.db;
    var res = await db.from('suggestions_events').update({ statut: 'accepte' }).eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Suggestion acceptée ! Crée l\'event dans la section Events 🎉');
    await loadSuggestions();
  }

  async function rejectSuggestion(id) {
    var db  = window.TDCA.db;
    var res = await db.from('suggestions_events').update({ statut: 'refuse' }).eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Suggestion refusée.');
    await loadSuggestions();
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.suggestions = {
    load:      loadAll,
    acceptSug: acceptSuggestion,
    rejectSug: rejectSuggestion
  };

})();
