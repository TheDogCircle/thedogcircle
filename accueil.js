/**
 * =====================================================
 *  THE DOG CIRCLE — Accueil membres
 *  Fichier : accueil.js
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', loadAccueil);
  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'accueil') loadAccueil();
  });

  async function loadAccueil() {
    var db      = window.TDC.db;
    var email   = window.TDC.userEmail;
    var membre  = window.TDC.userMembre || {};
    var c       = document.getElementById('tc-accueil');
    if (!c) return;

    c.innerHTML = '<div class="loading">Chargement...</div>';

    try {
      var results = await Promise.all([
        db.from('events').select('*').order('date_raw', { ascending: true }),
        db.from('inscriptions').select('event_id,statut').eq('membre_email', email),
        db.from('membres').select('prenom,chien,ville,race,photo_profil,photo_chien,date_naissance,date_naissance_chien,situation_amoureuse,created_at,formule,numero_membre').eq('statut', 'actif').order('created_at', { ascending: false }),
        db.from('partenaires').select('nom,type,offre,code,photo_url').eq('statut', 'Actif').limit(3),
        db.from('photos').select('photo_url,chien,membre_prenom').order('id', { ascending: false }).limit(6),
        db.from('chat_collectif').select('membre_prenom,message,created_at').order('created_at', { ascending: false }).limit(1),
        db.from('messages_prives').select('id').eq('destinataire_email', email).eq('lu', false)
      ]);

      var evRes       = results[0].data || [];
      var inscRes     = results[1].data || [];
      var membresRes  = results[2].data || [];
      var partsRes    = results[3].data || [];
      var photosRes   = results[4].data || [];
      var msgNonLus   = results[6].data || [];

      // Stats
      var now        = new Date().toISOString().split('T')[0];
      var evtsAvenir = evRes.filter(function (e) { return e.date_raw >= now; }).length;
      var nbMembres  = membresRes.length;
      var nbMessages = msgNonLus.length;

      // 3 prochains events
      var prochains = evRes.filter(function (e) { return e.date_raw >= now; }).slice(0, 3);

      // Nouveaux membres (3 derniers, pas soi-même)
      var nouveaux = membresRes.filter(function (m) { return m.prenom !== membre.prenom; }).slice(0, 3);

      // Anniversaires ce mois — chiens ET membres
      var moisCourant = new Date().getMonth() + 1;
      var anniversaires = [];
      membresRes.forEach(function (m) {
        // Anniversaire chien
        if (m.date_naissance_chien) {
          var moisChien = parseInt(m.date_naissance_chien.split('-')[1], 10);
          if (moisChien === moisCourant) {
            var age = new Date().getFullYear() - parseInt(m.date_naissance_chien.split('-')[0], 10);
            var jour = parseInt(m.date_naissance_chien.split('-')[2], 10);
            anniversaires.push({ nom: m.prenom + ' & ' + (m.chien || 'son chien'), texte: (m.chien || 'Son chien') + ' fête ses ' + age + ' ans le ' + jour, jour: jour, type: 'chien' });
          }
        }
        // Anniversaire membre
        if (m.date_naissance) {
          var moisMembre = parseInt(m.date_naissance.split('-')[1], 10);
          if (moisMembre === moisCourant) {
            var jourM = parseInt(m.date_naissance.split('-')[2], 10);
            anniversaires.push({ nom: m.prenom, texte: m.prenom + ' fête son anniversaire le ' + jourM, jour: jourM, type: 'membre' });
          }
        }
      });
      anniversaires.sort(function (a, b) { return a.jour - b.jour; });

      // Aujourd'hui pour calcul "dans X jours"
      var today = new Date();

      c.innerHTML =

        // ── HERO ──
        renderHero(membre) +

        // ── STATS ──
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'
          + renderStat(evtsAvenir, 'Events à venir')
          + renderStat(nbMembres, 'Membres actifs')
          + renderStat(nbMessages, 'Messages non lus')
        + '</div>'

        // ── GRILLE 1 : Events + Instadog ──
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + renderEventsCard(prochains, inscRes)
          + renderInstadogMini(photosRes)
        + '</div>'

        // ── GRILLE 2 : Nouveaux membres + Partenaires ──
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
          + renderNouveauxMembres(nouveaux)
          + renderPartenaires(partsRes)
        + '</div>'

        // ── ANNIVERSAIRES ──
        + (anniversaires.length > 0 ? renderAnniversaires(anniversaires, today) : '');

      // Listeners clics
      var evLink = c.querySelector('[data-go="events"]');
      if (evLink) evLink.addEventListener('click', function () { window.TDC_switchTab('events'); });
      var anLink = c.querySelector('[data-go="annuaire"]');
      if (anLink) anLink.addEventListener('click', function () { window.TDC_switchTab('annuaire'); });
      var ptLink = c.querySelector('[data-go="partners"]');
      if (ptLink) ptLink.addEventListener('click', function () { window.TDC_switchTab('partners'); });

    } catch (err) {
      c.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
    }
  }

  // ── Hero ─────────────────────────────────────────────
  function renderHero(m) {
    var prenom  = m.prenom || window.TDC.userPrenom || 'Membre';
    var chien   = m.chien  || '';
    var num     = m.numero_membre ? '#' + String(m.numero_membre).padStart(3,'0') : '';
    var formule = m.formule || '';
    var badge   = formule ? '<div style="background:var(--gold);color:#fff;font-size:10px;padding:5px 14px;border-radius:100px;white-space:nowrap;">' + formule + '</div>' : '';
    return '<div style="background:var(--green);border-radius:16px;padding:22px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
      + '<div>'
        + '<div style="font-family:\'Playfair Display\',serif;font-size:18px;color:var(--cream);margin-bottom:4px;">Bonjour ' + prenom + (chien ? ' & ' + chien : '') + ' 🐾</div>'
        + '<div style="font-size:12px;color:rgba(246,240,228,0.7);">Membre ' + num + (formule ? ' · ' + formule : '') + ' · The Dog Circle</div>'
      + '</div>'
      + badge
    + '</div>';
  }

  // ── Stat card ────────────────────────────────────────
  function renderStat(val, label) {
    return '<div style="background:var(--w);border-radius:12px;border:1px solid var(--b);padding:16px;text-align:center;">'
      + '<div style="font-size:24px;font-weight:500;color:var(--green);">' + (val || 0) + '</div>'
      + '<div style="font-size:11px;color:var(--t3);margin-top:3px;">' + label + '</div>'
    + '</div>';
  }

  // ── Events card ──────────────────────────────────────
  function renderEventsCard(events, inscriptions) {
    var items = events.map(function (ev) {
      var parts      = (ev.date || '--/--').split('/');
      var insc       = inscriptions.find(function (i) { return i.event_id === ev.id && i.statut === 'confirme'; });
      var ville      = ev.ville_custom || ev.ville || '';
      var badgeHtml  = insc
        ? '<span style="font-size:9px;background:var(--greenp);color:var(--green);padding:2px 7px;border-radius:100px;white-space:nowrap;">Inscrit</span>'
        : (ev.prix && ev.prix !== 'Gratuit'
          ? '<span style="font-size:9px;background:var(--goldp);color:var(--gold);padding:2px 7px;border-radius:100px;white-space:nowrap;">' + ev.prix + '</span>'
          : '<span style="font-size:9px;background:var(--greenp);color:var(--green);padding:2px 7px;border-radius:100px;white-space:nowrap;">Gratuit</span>');
      return '<div style="display:flex;gap:10px;padding:8px 14px;border-top:0.5px solid var(--b);align-items:center;">'
        + '<div style="background:var(--greenp);border-radius:8px;padding:6px 8px;text-align:center;min-width:36px;flex-shrink:0;">'
          + '<div style="font-size:14px;font-weight:500;color:var(--green);line-height:1;">' + (parts[0]||'--') + '</div>'
          + '<div style="font-size:9px;color:var(--greenm);text-transform:uppercase;">' + monthLabel(parts[1]) + '</div>'
        + '</div>'
        + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:12px;font-weight:500;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + ev.titre + '</div>'
          + '<div style="font-size:10px;color:var(--t3);">' + ville + (ev.heure ? ' · ' + ev.heure : '') + '</div>'
        + '</div>'
        + badgeHtml
      + '</div>';
    }).join('');

    return '<div style="background:var(--w);border-radius:14px;border:1px solid var(--b);overflow:hidden;">'
      + '<div style="padding:12px 14px 8px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--t);">Prochains events</div>'
        + '<div style="font-size:11px;color:var(--gold);cursor:pointer;" data-go="events">Voir tout →</div>'
      + '</div>'
      + (items || '<div style="padding:16px 14px;font-size:12px;color:var(--t3);">Aucun event à venir 🐾</div>')
    + '</div>';
  }

  // ── Instadog mini ────────────────────────────────────
  function renderInstadogMini(photos) {
    var cells = photos.map(function (p) {
      return p.photo_url
        ? '<div style="border-radius:8px;overflow:hidden;aspect-ratio:1;"><img src="' + p.photo_url + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="' + (p.chien||'') + '"></div>'
        : '<div style="border-radius:8px;background:var(--greenp);aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:20px;">🐾</div>';
    });
    while (cells.length < 6) cells.push('<div style="border-radius:8px;background:var(--cream);aspect-ratio:1;"></div>');

    return '<div style="background:var(--w);border-radius:14px;border:1px solid var(--b);overflow:hidden;">'
      + '<div style="padding:12px 14px 8px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--t);">Instadog</div>'
        + '<div style="font-size:11px;color:var(--gold);cursor:pointer;" onclick="window.TDC_switchTab(\'feed\')">Voir tout →</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 14px 14px;">' + cells.join('') + '</div>'
    + '</div>';
  }

  // ── Nouveaux membres ─────────────────────────────────
  function renderNouveauxMembres(membres) {
    var colors = ['#3B5E3F','#B8882A','#587A5C','#9C8472','#2A1C0C'];
    var items = membres.map(function (m, i) {
      var initiale = (m.prenom || '?')[0].toUpperCase();
      var couleur  = colors[i % colors.length];
      var avatar   = m.photo_profil
        ? '<img src="' + m.photo_profil + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="">'
        : '<div style="width:36px;height:36px;border-radius:50%;background:' + couleur + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:500;flex-shrink:0;">' + initiale + '</div>';
      // Badge "nouveau" si < 7 jours
      var isNew    = m.created_at && (Date.now() - new Date(m.created_at).getTime()) < 7 * 86400000;
      var badge    = '<span style="font-size:9px;background:var(--greenp);color:var(--green);padding:2px 7px;border-radius:100px;white-space:nowrap;">' + (isNew ? 'Nouveau' : 'Cette semaine') + '</span>';
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-top:0.5px solid var(--b);">'
        + avatar
        + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:12px;font-weight:500;color:var(--t);">' + m.prenom + (m.chien ? ' & ' + m.chien : '') + '</div>'
          + '<div style="font-size:10px;color:var(--t3);">' + (m.ville||'') + (m.race ? ' · ' + m.race : '') + '</div>'
        + '</div>'
        + badge
      + '</div>';
    }).join('');

    return '<div style="background:var(--w);border-radius:14px;border:1px solid var(--b);overflow:hidden;">'
      + '<div style="padding:12px 14px 8px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--t);">Nouveaux membres</div>'
        + '<div style="font-size:11px;color:var(--gold);cursor:pointer;" data-go="annuaire">Voir l\'annuaire →</div>'
      + '</div>'
      + (items || '<div style="padding:16px 14px;font-size:12px;color:var(--t3);">Aucun nouveau membre récent.</div>')
    + '</div>';
  }

  // ── Partenaires ──────────────────────────────────────
  function renderPartenaires(parts) {
    var items = parts.map(function (p) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-top:0.5px solid var(--b);">'
        + '<div style="width:32px;height:32px;border-radius:8px;background:var(--goldp);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤝</div>'
        + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:12px;font-weight:500;color:var(--t);">' + p.nom + '</div>'
          + '<div style="font-size:10px;color:var(--t3);">' + (p.offre||'') + '</div>'
        + '</div>'
        + (p.code ? '<span style="font-size:10px;font-family:monospace;background:var(--greenp);color:var(--green);padding:2px 7px;border-radius:5px;font-weight:600;white-space:nowrap;">' + p.code + '</span>' : '')
      + '</div>';
    }).join('');

    return '<div style="background:var(--w);border-radius:14px;border:1px solid var(--b);overflow:hidden;">'
      + '<div style="padding:12px 14px 8px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--t);">Partenaires du moment</div>'
        + '<div style="font-size:11px;color:var(--gold);cursor:pointer;" data-go="partners">Voir tout →</div>'
      + '</div>'
      + (items || '<div style="padding:16px 14px;font-size:12px;color:var(--t3);">Aucun partenaire actif.</div>')
    + '</div>';
  }

  // ── Anniversaires ────────────────────────────────────
  function renderAnniversaires(list, today) {
    var colors = ['#3B5E3F','#B8882A','#587A5C','#9C8472'];
    var items = list.slice(0, 4).map(function (a, i) {
      var dateAnniv = new Date(today.getFullYear(), today.getMonth(), a.jour);
      var diff      = Math.round((dateAnniv - today) / 86400000);
      var diffLabel = diff === 0 ? "Aujourd'hui 🎉" : diff === 1 ? 'Demain' : 'Dans ' + diff + ' jours';
      var isUrgent  = diff <= 3;
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-top:0.5px solid var(--b);">'
        + '<div style="width:32px;height:32px;border-radius:50%;background:' + colors[i % colors.length] + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:500;flex-shrink:0;">' + (a.nom[0]||'?').toUpperCase() + '</div>'
        + '<div style="flex:1;">'
          + '<div style="font-size:12px;font-weight:500;color:var(--t);">' + a.nom + '</div>'
          + '<div style="font-size:10px;color:var(--t3);">' + a.texte + (a.type === 'chien' ? ' 🐾' : '') + '</div>'
        + '</div>'
        + '<div style="font-size:10px;font-weight:500;color:' + (isUrgent ? 'var(--gold)' : 'var(--t3)') + ';white-space:nowrap;">' + diffLabel + '</div>'
      + '</div>';
    }).join('');

    return '<div style="background:var(--w);border-radius:14px;border:1px solid var(--b);overflow:hidden;margin-bottom:14px;">'
      + '<div style="padding:12px 14px 8px;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--t);">Anniversaires ce mois-ci 🎂</div>'
      + '</div>'
      + items
    + '</div>';
  }

  function monthLabel(m) {
    var months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    var n = parseInt(m, 10);
    return (n >= 1 && n <= 12) ? months[n-1] : (m || '--');
  }

})();
