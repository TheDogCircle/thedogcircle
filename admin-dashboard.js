/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Dashboard
 *  Fichier : admin-dashboard.js
 *  Écoute  : TDCA:login · TDCA:section(dashboard)
 *  Expose  : window.TDCA.dashboard.refresh()
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:login', function () {
    loadDashboard();
    // Refresh toutes les 30 secondes
    setInterval(loadDashboard, 30000);
  });

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'dashboard') loadDashboard();
  });

  async function loadDashboard() {
    var db = window.TDCA.db;

    try {
      var results = await Promise.all([
        db.from('membres').select('id', { count: 'exact', head: true }),
        db.from('candidatures').select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),
        db.from('events').select('id', { count: 'exact', head: true }).gte('date_raw', new Date().toISOString().split('T')[0]),
        db.from('partenaires').select('id', { count: 'exact', head: true }).eq('statut', 'Actif'),
        db.from('candidatures').select('*').eq('statut', 'en_attente').order('created_at', { ascending: false }).limit(3),
        db.from('events').select('*').order('date_raw', { ascending: true }).limit(5)
      ]);

      // Stats
      document.getElementById('stat-membres').textContent     = results[0].count || 0;
      document.getElementById('stat-cands').textContent       = results[1].count || 0;
      document.getElementById('stat-events').textContent      = results[2].count || 0;
      document.getElementById('stat-partenaires').textContent = results[3].count || 0;
      document.getElementById('nb-cands').textContent         = results[1].count || 0;

      // Dernières candidatures
      var cands = results[4].data || [];
      document.getElementById('dash-cands').innerHTML =
        '<tr><th>Candidat</th><th>Chien</th><th>Formule</th><th>Action</th></tr>'
        + (cands.length === 0
          ? '<tr><td colspan="4" class="empty">Aucune candidature en attente 🎉</td></tr>'
          : cands.map(function (c) {
              return '<tr>'
                + '<td class="tbl-name">' + c.prenom + ' · ' + (c.ville || '') + '</td>'
                + '<td>' + (c.chien || '—') + (c.race ? ' · ' + c.race : '') + '</td>'
                + '<td>' + window.pillFormule(c.formule) + '</td>'
                + '<td><div class="actions">'
                  + '<button class="btn-xs btn-xs-g" onclick="window.TDCA.candidatures.accept(\'' + c.id + '\')">Accepter</button>'
                  + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.candidatures.reject(\'' + c.id + '\')">Refuser</button>'
                + '</div></td>'
              + '</tr>';
            }).join(''));

      // Prochains events
      var evts = results[5].data || [];
      document.getElementById('dash-events').innerHTML =
        '<tr><th>Event</th><th>Date</th><th>Inscrits</th><th>Statut</th></tr>'
        + (evts.length === 0
          ? '<tr><td colspan="4" class="empty">Aucun event planifié</td></tr>'
          : evts.map(function (e) {
              return '<tr>'
                + '<td class="tbl-name">' + e.titre + '</td>'
                + '<td>' + (e.date || '—') + '</td>'
                + '<td>' + (e.inscrits || 0) + ' / ' + e.places + '</td>'
                + '<td>' + window.pillStatut(e.statut) + '</td>'
              + '</tr>';
            }).join(''));

    } catch (err) {
      console.error('Dashboard error:', err);
    }
  }

  window.TDCA = window.TDCA || {};
  window.TDCA.dashboard = { refresh: loadDashboard };

})();
