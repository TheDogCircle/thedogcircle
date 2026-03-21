/**
 * =====================================================
 *  THE DOG CIRCLE — Module Escapades
 *  Fichier : escapades.js
 *  Tables  : escapades · devis_escapades
 *  Écoute  : TDC:login · TDC:tab(escapades)
 * =====================================================
 */
(function () {

  var escapadesData = [];

  document.addEventListener('TDC:login', function () {
    injectUI();
    loadEscapades();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'escapades') loadEscapades();
  });

  // ── Sous-onglets ──────────────────────────────────────
  function injectUI() {
    var sec = document.getElementById('tc-escapades');
    if (!sec || document.getElementById('esc-subtabs')) return;

    var subtabs = document.createElement('div');
    subtabs.id = 'esc-subtabs';
    subtabs.className = 'subtab-row';
    subtabs.innerHTML =
      '<button class="subtab active" id="escTabListe">✨ Nos escapades</button>'
      + '<button class="subtab" id="escTabDevis">📋 Demander un devis</button>';
    sec.insertBefore(subtabs, sec.querySelector('.esc-grid-wrap') || sec.firstChild);

    // Panel devis
    var panelDevis = document.createElement('div');
    panelDevis.id    = 'esc-devis-panel';
    panelDevis.style = 'display:none;';
    panelDevis.innerHTML = buildDevisForm(null);
    sec.appendChild(panelDevis);

    document.getElementById('escTabListe').addEventListener('click', function () { showEscTab('liste'); });
    document.getElementById('escTabDevis').addEventListener('click', function () { showEscTab('devis'); });
  }

  function showEscTab(tab) {
    document.getElementById('escTabListe').classList.toggle('active', tab === 'liste');
    document.getElementById('escTabDevis').classList.toggle('active', tab === 'devis');
    var grid = document.getElementById('esc-grid');
    if (grid) grid.closest('.esc-grid-wrap') ? grid.closest('.esc-grid-wrap').style.display = tab === 'liste' ? 'block' : 'none' : grid.style.display = tab === 'liste' ? 'grid' : 'none';
    document.getElementById('esc-devis-panel').style.display = tab === 'devis' ? 'block' : 'none';
  }

  // ── Charger les escapades ─────────────────────────────
  function loadEscapades() {
    var sec = document.getElementById('tc-escapades');
    if (!sec) return;

    // Créer la grille si elle n'existe pas
    if (!document.getElementById('esc-grid')) {
      var wrap = document.createElement('div');
      wrap.className = 'esc-grid-wrap';
      wrap.innerHTML = '<div id="esc-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"></div>';
      sec.appendChild(wrap);
    }

    var g = document.getElementById('esc-grid');
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db
      .from('escapades')
      .select('*')
      .eq('statut', 'actif')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { g.innerHTML = '<div class="error">Erreur : ' + res.error.message + '</div>'; return; }

        // Si aucune escapade en base, afficher les modèles
        var data = (res.data && res.data.length > 0) ? res.data : defaultEscapades();
        escapadesData = data;

        g.innerHTML = data.map(function (e) {
          var badge = e.prix_type === 'devis'
            ? '<span style="background:var(--goldp);color:var(--gold);font-size:10px;padding:3px 10px;border-radius:100px;">Sur devis</span>'
            : '<span style="background:var(--greenp);color:var(--green);font-size:10px;padding:3px 10px;border-radius:100px;">' + (e.prix||'Prix sur demande') + '</span>';

          return '<div style="background:var(--w);border:1px solid var(--b);border-radius:20px;overflow:hidden;">'
            + '<div style="height:180px;background:' + typeColor(e.type) + ';display:flex;align-items:center;justify-content:center;font-size:56px;position:relative;">'
              + typeEmoji(e.type)
              + '<div style="position:absolute;top:12px;left:12px;">' + badge + '</div>'
              + (e.duree ? '<div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.4);color:#fff;font-size:10px;padding:3px 10px;border-radius:100px;">' + e.duree + '</div>' : '')
            + '</div>'
            + '<div style="padding:18px 20px;">'
              + '<div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">' + (e.type||'Escapade') + '</div>'
              + '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:4px;">' + e.titre + '</div>'
              + '<div style="font-size:12px;color:var(--t3);margin-bottom:10px;">📍 ' + (e.lieu||'France') + (e.capacite ? ' · 👥 ' + e.capacite + ' membres max' : '') + '</div>'
              + '<div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:16px;">' + (e.description||'') + '</div>'
              + '<button class="btn btn-p" style="width:100%;justify-content:center;padding:10px;" data-esc-devis="' + e.id + '" data-esc-titre="' + e.titre + '">✨ Demander un devis</button>'
            + '</div></div>';
        }).join('');

        // Délégation clics boutons devis
        g.onclick = function (ev) {
          var btn = ev.target.closest('[data-esc-devis]');
          if (!btn) return;
          openDevisForEscapade(btn.dataset.escDevis, btn.dataset.escTitre);
        };

      }).catch(function (err) {
        g.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

  // ── Ouvrir devis pour une escapade précise ────────────
  function openDevisForEscapade(id, titre) {
    showEscTab('devis');
    document.getElementById('escTabDevis').click();
    var select = document.getElementById('devis-escapade');
    if (select) {
      // Pré-sélectionner l'escapade
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === String(id)) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    // Remplir le titre si champ libre
    var titreEl = document.getElementById('devis-escapade-titre');
    if (titreEl) titreEl.value = titre;
  }

  // ── Formulaire devis ──────────────────────────────────
  function buildDevisForm() {
    return '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:28px;max-width:560px;">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:20px;margin-bottom:6px;">✨ Demander un devis</div>'
      + '<div style="font-size:13px;color:var(--t3);margin-bottom:24px;">Notre équipe vous répond sous 24h</div>'

      + '<div style="margin-bottom:16px;">'
        + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Escapade souhaitée</label>'
        + '<input type="text" id="devis-escapade-titre" placeholder="Ex: Week-end en villa dog-friendly ou toute autre idée..." style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">'
        + '<div>'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Nombre de chiens</label>'
          + '<select id="devis-nb-chiens" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
            + '<option value="1">1 chien</option>'
            + '<option value="2">2 chiens</option>'
            + '<option value="3">3 chiens</option>'
            + '<option value="4+">4 chiens et plus</option>'
          + '</select>'
        + '</div>'
        + '<div>'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Nombre de personnes</label>'
          + '<select id="devis-nb-personnes" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
            + '<option value="1">1 personne</option>'
            + '<option value="2">2 personnes</option>'
            + '<option value="3">3 personnes</option>'
            + '<option value="4-6">4 à 6 personnes</option>'
            + '<option value="7+">7 personnes et plus</option>'
          + '</select>'
        + '</div>'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">'
        + '<div>'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Dates souhaitées</label>'
          + '<input type="text" id="devis-dates" placeholder="Ex: Mi-juillet, été 2025..." style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
        + '<div>'
          + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Destination / lieu</label>'
          + '<input type="text" id="devis-lieu" placeholder="Ex: Côte d\'Azur, Normandie..." style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
        + '</div>'
      + '</div>'

      + '<div style="margin-bottom:16px;">'
        + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Budget indicatif</label>'
        + '<select id="devis-budget" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
          + '<option value="">Indiquer un budget...</option>'
          + '<option value="500-1000€">500 – 1 000 €</option>'
          + '<option value="1000-2000€">1 000 – 2 000 €</option>'
          + '<option value="2000-5000€">2 000 – 5 000 €</option>'
          + '<option value="5000+">5 000 € et plus</option>'
          + '<option value="flexible">Budget flexible</option>'
        + '</select>'
      + '</div>'

      + '<div style="margin-bottom:24px;">'
        + '<label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Besoins spéciaux & infos complémentaires</label>'
        + '<textarea id="devis-besoins" placeholder="Race de votre chien, allergies, régime alimentaire, accessibilité PMR, préférences culinaires, occasion spéciale..." style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;resize:vertical;min-height:100px;"></textarea>'
      + '</div>'

      + '<div id="devis-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:14px;"></div>'
      + '<button id="devis-submit" class="btn btn-p" style="width:100%;padding:13px;font-size:15px;">✨ Envoyer ma demande de devis</button>'
      + '<div style="font-size:11px;color:var(--t3);text-align:center;margin-top:10px;">Notre concierge canin vous contacte sous 24h 🐾</div>'
      + '<div id="devis-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:12px;padding:16px;text-align:center;font-size:13px;margin-top:14px;">✓ Votre demande a bien été reçue ! Notre équipe vous contacte sous 24h 🐾</div>'
    + '</div>';
  }

  // ── Soumettre devis ───────────────────────────────────
  document.addEventListener('click', function (e) {
    if (e.target.id !== 'devis-submit') return;
    submitDevis();
  });

  async function submitDevis() {
    var db     = window.TDC.db;
    var titre  = document.getElementById('devis-escapade-titre') ? document.getElementById('devis-escapade-titre').value.trim() : '';
    var err    = document.getElementById('devis-err');
    var btn    = document.getElementById('devis-submit');
    err.style.display = 'none';

    if (!titre) { err.textContent = 'Indique l\'escapade souhaitée.'; err.style.display = 'block'; return; }

    btn.textContent = 'Envoi...'; btn.disabled = true;

    var res = await db.from('devis_escapades').insert([{
      membre_email:    window.TDC.userEmail,
      membre_prenom:   window.TDC.userPrenom,
      escapade_titre:  titre,
      nb_chiens:       parseInt(document.getElementById('devis-nb-chiens').value) || 1,
      nb_personnes:    document.getElementById('devis-nb-personnes').value,
      dates:           document.getElementById('devis-dates').value,
      lieu:            document.getElementById('devis-lieu').value,
      budget:          document.getElementById('devis-budget').value,
      besoins:         document.getElementById('devis-besoins').value,
      statut:          'en_attente'
    }]);

    if (res.error) {
      err.textContent = 'Erreur : ' + res.error.message;
      err.style.display = 'block';
    } else {
      document.getElementById('devis-ok').style.display = 'block';
      ['devis-escapade-titre','devis-dates','devis-lieu','devis-besoins'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      document.getElementById('devis-budget').selectedIndex = 0;
    }

    btn.textContent = '✨ Envoyer ma demande de devis';
    btn.disabled = false;
  }

  // ── Escapades par défaut (avant que l'admin en crée) ──
  function defaultEscapades() {
    return [
      { id:'d1', titre:'Week-end en villa dog-friendly', type:'Week-end en villa dog-friendly', description:'Villas privées avec jardins sécurisés, chef à domicile, spa pour vous et votre compagnon. Une bulle de douceur pour duo inséparable.', lieu:'Luberon · Normandie · Côte Basque', prix:'À partir de 890€/pers.', prix_type:'fixe', duree:'2-3 nuits', capacite:8, statut:'actif' },
      { id:'d2', titre:'Croisière canine en Méditerranée', type:'Croisière canine', description:'Embarquez avec votre chien à bord d\'un voilier privatisé. Calanques, criques secrètes et dîners au coucher de soleil.', lieu:'Marseille · Corse · Côte d\'Azur', prix:null, prix_type:'devis', duree:'3-7 nuits', capacite:6, statut:'actif' },
      { id:'d3', titre:'Retraite Spa & Bien-être', type:'Spa & bien-être avec son chien', description:'Soins holistiques pour vous, bains et massages pour votre chien. Yoga matinal en pleine nature, alimentation biodynamique.', lieu:'Alpes · Pyrénées · Dordogne', prix:'À partir de 1 200€/pers.', prix_type:'fixe', duree:'3-5 nuits', capacite:10, statut:'actif' },
      { id:'d4', titre:'Chasse & Nature Premium', type:'Chasse & nature premium', description:'Domaines privés, guides experts, gibier de qualité. Pour les passionnés de nature et de chasse avec leur compagnon de travail.', lieu:'Sologne · Ardennes · Gascogne', prix:null, prix_type:'devis', duree:'2-4 jours', capacite:6, statut:'actif' },
      { id:'d5', titre:'City Break Luxury', type:'City break luxury', description:'Hôtels 5 étoiles acceptant les chiens, restaurants gastronomiques pet-friendly, concierge privé pour vos escapades culturelles.', lieu:'Paris · Bordeaux · Lyon', prix:'À partir de 650€/pers.', prix_type:'fixe', duree:'2-3 nuits', capacite:12, statut:'actif' },
    ];
  }

  function typeColor(type) {
    var colors = {
      'Week-end en villa dog-friendly': '#C8DEB8',
      'Croisière canine':               '#B8C9D4',
      'Spa & bien-être avec son chien': '#D4B8B8',
      'Chasse & nature premium':        '#D4CEB8',
      'City break luxury':              '#D4C5A9'
    };
    return colors[type] || '#EBF0E8';
  }

  function typeEmoji(type) {
    var emojis = {
      'Week-end en villa dog-friendly': '🏡',
      'Croisière canine':               '⛵',
      'Spa & bien-être avec son chien': '🛁',
      'Chasse & nature premium':        '🌲',
      'City break luxury':              '🏙️'
    };
    return emojis[type] || '✨';
  }

})();
