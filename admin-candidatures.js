/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Candidatures
 *  Fichier : admin-candidatures.js
 *  Auth    : via Netlify Function accept-candidature
 *  Numéro  : auto-incrémenté (#001, #002...)
 *  Parrain : code unique TDC-XXXX
 * =====================================================
 */
(function () {

  var candidatures = [];

  document.addEventListener('TDCA:login', loadCandidatures);
  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'candidatures') loadCandidatures();
  });

  // ── Charger ──────────────────────────────────────────
  async function loadCandidatures() {
    var db  = window.TDCA.db;
    var res = await db.from('candidatures').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }

    candidatures = res.data || [];
    var pending  = candidatures.filter(function (c) { return c.statut === 'en_attente'; });

    document.getElementById('nb-cands').textContent   = pending.length;
    document.getElementById('sub-cands').textContent  = pending.length + ' en attente';
    document.getElementById('stat-cands').textContent = pending.length;

    renderCandidatures(pending);
    if (window.TDCA.dashboard) window.TDCA.dashboard.refresh();
  }

  function renderCandidatures(pending) {
    var tbl = document.getElementById('tbl-cands');
    if (!tbl) return;

    if (pending.length === 0) {
      tbl.innerHTML = '<tr><td colspan="7"><div class="empty">Aucune candidature en attente 🎉</div></td></tr>';
      return;
    }

    tbl.innerHTML =
      '<tr><th>Candidat</th><th>Chien</th><th>Formule</th><th>Parrain(s)</th><th>Message</th><th>Statut</th><th>Actions</th></tr>'
      + pending.map(function (c) {
          var parrains = [c.parrain1, c.parrain2].filter(Boolean).join(', ') || '<span style="color:var(--red);font-size:11px;">Aucun</span>';
          return '<tr>'
            + '<td><div class="tbl-name">' + c.prenom + '</div>'
              + '<div style="font-size:11px;color:var(--t3);">' + (c.ville||'') + ' · ' + c.email + '</div></td>'
            + '<td>' + (c.chien||'—') + (c.race ? ' · ' + c.race : '') + '</td>'
            + '<td>' + window.pillFormule(c.formule) + '</td>'
            + '<td style="font-size:11px;">' + parrains + '</td>'
            + '<td style="max-width:160px;font-size:11px;color:var(--t3);">"' + (c.message||'').substring(0,60) + '…"</td>'
            + '<td><span class="pill pill-amber">En attente</span></td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.candidatures.show(\'' + c.id + '\')">Voir</button>'
              + '<button class="btn-xs btn-xs-g" onclick="window.TDCA.candidatures.accept(\'' + c.id + '\')">✓ Accepter</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.candidatures.reject(\'' + c.id + '\')">✗ Refuser</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  // ── Voir détail ──────────────────────────────────────
  function showCand(id) {
    var c = candidatures.find(function (x) { return x.id === id; });
    if (!c) return;
    alert('📋 Candidature de ' + c.prenom
      + '\n\n📧 ' + c.email
      + '\n📍 ' + (c.ville||'—')
      + '\n🐾 ' + (c.chien||'—') + (c.race ? ' (' + c.race + ')' : '')
      + '\n💳 ' + (c.formule||'—')
      + '\n🤝 Parrain 1 : ' + (c.parrain1||'—')
      + '\n🤝 Parrain 2 : ' + (c.parrain2||'—')
      + '\n\n💬 "' + (c.message||'') + '"');
  }

  // ── Accepter ─────────────────────────────────────────
  async function acceptCandidature(id) {
    var db = window.TDCA.db;
    var c  = candidatures.find(function (x) { return x.id === id; });
    if (!c) return;

    if (!confirm('Accepter ' + c.prenom + ' ?\n\nUn compte sera créé et un email de bienvenue envoyé automatiquement.')) return;

    window.TDCA.toast('Création du compte en cours...');

    try {
      // 1. Numéro de membre auto-incrémenté
      var countRes = await db.from('membres').select('id', { count: 'exact', head: true });
      var numero   = (countRes.count || 0) + 1;

      // 2. Générer mot de passe temporaire et code parrain
      var tempPassword = 'TDC-' + Math.random().toString(36).slice(2,8).toUpperCase() + '!';
      // Code parrain basé sur le prénom du chien
      var nomChien     = (c.chien || 'CERCLE').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      var codeParrain  = 'TDC_' + nomChien;

      // 3. Appeler la Netlify Function (crée Auth + envoie email)
      var fnRes = await fetch('/.netlify/functions/accept-candidature', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidature:  c,
          numero:       numero,
          codeParrain:  codeParrain,
          tempPassword: tempPassword
        })
      });

      var fnData = await fnRes.json();
      if (!fnRes.ok) throw new Error(fnData.error || 'Erreur fonction');

      // 4. Créer le membre dans la table
      var memRes = await db.from('membres').insert([{
        prenom:        c.prenom,
        email:         c.email,
        ville:         c.ville,
        chien:         c.chien,
        race:          c.race,
        formule:       c.formule,
        statut:        'actif',
        numero_membre: numero,
        code_parrain:  codeParrain,
        parrain1:      c.parrain1 || null,
        parrain2:      c.parrain2 || null
      }]);
      if (memRes.error) throw new Error('Membre: ' + memRes.error.message);

      // 5. Marquer candidature comme acceptée
      await db.from('candidatures').update({ statut: 'accepte' }).eq('id', id);

      var numeroStr = String(numero).padStart(3, '0');
      window.TDCA.toast('✅ ' + c.prenom + ' accepté(e) — membre #' + numeroStr + ' ! Email envoyé 📧');

      await loadCandidatures();
      if (window.TDCA.membres) window.TDCA.membres.load();

    } catch (err) {
      window.TDCA.toast('❌ Erreur : ' + err.message);
      console.error(err);
    }
  }

  // ── Refuser ──────────────────────────────────────────
  async function rejectCandidature(id) {
    if (!confirm('Refuser cette candidature ?')) return;
    var db  = window.TDCA.db;
    var res = await db.from('candidatures').update({ statut: 'refuse' }).eq('id', id);
    if (res.error) { window.TDCA.toast('Erreur : ' + res.error.message); return; }
    window.TDCA.toast('Candidature refusée.');
    await loadCandidatures();
  }

  // ── API publique ──────────────────────────────────────
  window.TDCA = window.TDCA || {};
  window.TDCA.candidatures = {
    load:   loadCandidatures,
    accept: acceptCandidature,
    reject: rejectCandidature,
    show:   showCand
  };

})();
