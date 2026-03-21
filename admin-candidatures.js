/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Candidatures
 *  Fichier : admin-candidatures.js
 *  Écoute  : TDCA:login · TDCA:section(candidatures)
 *  Expose  : window.TDCA.candidatures.accept/reject
 * =====================================================
 */
(function () {

  var candidatures = [];

  document.addEventListener('TDCA:login', loadCandidatures);

  document.addEventListener('TDCA:section', function (e) {
    if (e.detail.sec === 'candidatures') loadCandidatures();
  });

  // ── Charger ────────────────────────────────────────
  async function loadCandidatures() {
    var db = window.TDCA.db;
    var res = await db.from('candidatures').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error(res.error); return; }

    candidatures = res.data || [];
    var pending = candidatures.filter(function (c) { return c.statut === 'en_attente'; });

    document.getElementById('nb-cands').textContent  = pending.length;
    document.getElementById('sub-cands').textContent = pending.length + ' en attente';

    renderCandidatures(pending);
    // Rafraîchit aussi le dashboard si visible
    if (window.TDCA.dashboard) window.TDCA.dashboard.refresh();
  }

  // ── Rendu ──────────────────────────────────────────
  function renderCandidatures(pending) {
    var tbl = document.getElementById('tbl-cands');
    if (!tbl) return;

    if (pending.length === 0) {
      tbl.innerHTML = '<tr><td colspan="6"><div class="empty">Aucune candidature en attente 🎉</div></td></tr>';
      return;
    }

    tbl.innerHTML =
      '<tr><th>Candidat</th><th>Chien</th><th>Formule</th><th>Message</th><th>Statut</th><th>Action</th></tr>'
      + pending.map(function (c) {
          return '<tr>'
            + '<td><div class="tbl-name">' + c.prenom + '</div>'
              + '<div style="font-size:11px;color:var(--t3);">' + (c.ville || '') + ' · ' + c.email + '</div></td>'
            + '<td>' + (c.chien || '—') + (c.race ? ' · ' + c.race : '') + '</td>'
            + '<td>' + window.pillFormule(c.formule) + '</td>'
            + '<td style="max-width:180px;font-size:11px;color:var(--t3);">"' + (c.message || '').substring(0, 60) + '…"</td>'
            + '<td><span class="pill pill-amber">En attente</span></td>'
            + '<td><div class="actions">'
              + '<button class="btn-xs" onclick="window.TDCA.candidatures.show(\'' + c.id + '\')">Voir</button>'
              + '<button class="btn-xs btn-xs-g" onclick="window.TDCA.candidatures.accept(\'' + c.id + '\')">✓ Accepter</button>'
              + '<button class="btn-xs btn-xs-r" onclick="window.TDCA.candidatures.reject(\'' + c.id + '\')">✗ Refuser</button>'
            + '</div></td>'
          + '</tr>';
        }).join('');
  }

  // ── Voir détail ────────────────────────────────────
  function showCand(id) {
    var c = candidatures.find(function (x) { return x.id === id; });
    if (!c) return;
    alert('📋 Candidature de ' + c.prenom
      + '\n\n📧 ' + c.email
      + '\n📍 ' + (c.ville || '—')
      + '\n🐾 ' + (c.chien || '—') + (c.race ? ' (' + c.race + ')' : '')
      + '\n💳 ' + (c.formule || '—')
      + '\n\n💬 "' + (c.message || '') + '"');
  }

  // ── Accepter ────────────────────────────────────────
  async function acceptCandidature(id) {
    var db = window.TDCA.db;
    var c  = candidatures.find(function (x) { return x.id === id; });
    if (!c) return;

    // 1. Mise à jour statut candidature
    var r1 = await db.from('candidatures').update({ statut: 'accepte' }).eq('id', id);
    if (r1.error) { alert('Erreur : ' + r1.error.message); return; }

    // 2. Créer le membre
    var r2 = await db.from('membres').insert([{
      prenom:  c.prenom,
      email:   c.email,
      ville:   c.ville,
      chien:   c.chien,
      race:    c.race,
      formule: c.formule,
      statut:  'actif'
    }]);
    if (r2.error) { alert('Erreur création membre : ' + r2.error.message); return; }

    // 3. Email de bienvenue via Resend
    try {
      var emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + window.TDCA.resendKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'The Dog Circle <hello@thedogcircle.fr>',
          to: [c.email],
          subject: '🐾 Bienvenue dans The Dog Circle, ' + c.prenom + ' !',
          html: emailBienvenue(c)
        })
      });
      if (emailRes.ok) {
        window.TDCA.toast('✅ ' + c.prenom + ' accepté(e) — email de bienvenue envoyé !');
      } else {
        window.TDCA.toast('✅ ' + c.prenom + ' accepté(e) (email non envoyé)');
      }
    } catch (err) {
      window.TDCA.toast('✅ ' + c.prenom + ' accepté(e) (email non envoyé)');
    }

    await loadCandidatures();
    if (window.TDCA.membres) window.TDCA.membres.load();
  }

  // ── Refuser ─────────────────────────────────────────
  async function rejectCandidature(id) {
    var db = window.TDCA.db;
    var r  = await db.from('candidatures').update({ statut: 'refuse' }).eq('id', id);
    if (r.error) { alert('Erreur : ' + r.error.message); return; }
    window.TDCA.toast('Candidature refusée.');
    await loadCandidatures();
  }

  // ── Template email ───────────────────────────────────
  function emailBienvenue(c) {
    return '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F6F0E4;border-radius:16px;overflow:hidden;">'
      + '<div style="background:#3B5E3F;padding:32px;text-align:center;">'
        + '<div style="font-size:40px;margin-bottom:8px;">🐾</div>'
        + '<h1 style="color:#F6F0E4;font-size:28px;font-weight:400;margin:0;">The Dog Circle</h1>'
        + '<div style="color:#B8882A;font-size:12px;letter-spacing:0.15em;margin-top:6px;">CLUB PRIVÉ CANIN</div>'
      + '</div>'
      + '<div style="padding:36px 40px;">'
        + '<h2 style="color:#2A1C0C;font-size:22px;font-weight:400;margin-bottom:16px;">Félicitations ' + c.prenom + ' ! 🎉</h2>'
        + '<p style="color:#6B5240;font-size:15px;line-height:1.7;margin-bottom:20px;">Ta candidature a été <strong style="color:#3B5E3F;">acceptée</strong>. Tu fais désormais partie du cercle. Bienvenue à toi et à <strong>' + c.chien + '</strong> !</p>'
        + '<div style="background:#3B5E3F;border-radius:12px;padding:20px 24px;margin-bottom:24px;">'
          + '<div style="color:#B8882A;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Tes accès membres</div>'
          + '<div style="color:#F6F0E4;font-size:14px;margin-bottom:6px;">🔗 <strong>thedogcircle.fr/membres.html</strong></div>'
          + '<div style="color:#F6F0E4;font-size:14px;margin-bottom:6px;">📧 Login : <strong>' + c.email + '</strong></div>'
          + '<div style="color:#F6F0E4;font-size:14px;">🔑 Mot de passe : <strong>thedogcircle</strong></div>'
        + '</div>'
        + '<a href="https://thedogcircle.fr/membres.html" style="display:block;background:#B8882A;color:#F6F0E4;text-align:center;padding:14px;border-radius:100px;font-size:15px;text-decoration:none;font-weight:500;margin-bottom:24px;">Accéder à mon espace membre →</a>'
        + '<p style="color:#9C8472;font-size:13px;line-height:1.7;">Formule choisie : <strong>' + c.formule + '</strong></p>'
      + '</div>'
      + '<div style="background:#2A1C0C;padding:20px;text-align:center;">'
        + '<div style="color:rgba(246,240,228,0.4);font-size:11px;letter-spacing:0.1em;">thedogcircle.fr · Club Privé Canin · France</div>'
      + '</div>'
    + '</div>';
  }

  // ── API publique ────────────────────────────────────
  window.TDCA = window.TDCA || {};
  window.TDCA.candidatures = {
    load:   loadCandidatures,
    accept: acceptCandidature,
    reject: rejectCandidature,
    show:   showCand
  };

})();
