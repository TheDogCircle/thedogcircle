/**
 * =====================================================
 *  THE DOG CIRCLE — Module Escapades
 *  Fichier : escapades.js
 *  Tables  : escapades · devis_escapades
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:login', function () { injectUI(); loadEscapades(); });
  document.addEventListener('TDC:tab',   function (e) { if (e.detail.tab === 'escapades') loadEscapades(); });

  function injectUI() {
    var sec = document.getElementById('tc-escapades');
    if (!sec || document.getElementById('esc-subtabs')) return;

    var subtabs = document.createElement('div');
    subtabs.id = 'esc-subtabs';
    subtabs.className = 'subtab-row';
    subtabs.innerHTML =
      '<button class="subtab active" id="escTabListe">✨ Nos escapades</button>'
      + '<button class="subtab" id="escTabDevis">📋 Demander un devis</button>';
    sec.appendChild(subtabs);

    var gridWrap = document.createElement('div');
    gridWrap.id = 'esc-grid-wrap';
    gridWrap.innerHTML = '<div id="esc-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px;"></div>';
    sec.appendChild(gridWrap);

    var panelDevis = document.createElement('div');
    panelDevis.id    = 'esc-devis-panel';
    panelDevis.style = 'display:none;margin-top:16px;';
    panelDevis.innerHTML = buildDevisForm();
    sec.appendChild(panelDevis);

    document.getElementById('escTabListe').addEventListener('click', function () { showTab('liste'); });
    document.getElementById('escTabDevis').addEventListener('click', function () { showTab('devis'); });

    var today = new Date().toISOString().split('T')[0];
    var dateInputs = panelDevis.querySelectorAll('input[type="date"]');
    dateInputs.forEach(function (i) { i.min = today; });

    document.addEventListener('click', function (e) {
      if (e.target.id === 'devis-submit') submitDevis();
      var btn = e.target.closest('[data-esc-devis]');
      if (btn) {
        document.getElementById('devis-escapade-titre').value = btn.dataset.escTitre || '';
        showTab('devis');
      }
    });
  }

  function showTab(tab) {
    var btnL = document.getElementById('escTabListe');
    var btnD = document.getElementById('escTabDevis');
    if (btnL) btnL.classList.toggle('active', tab === 'liste');
    if (btnD) btnD.classList.toggle('active', tab === 'devis');
    var gw = document.getElementById('esc-grid-wrap');
    var dp = document.getElementById('esc-devis-panel');
    if (gw) gw.style.display = tab === 'liste' ? 'block' : 'none';
    if (dp) dp.style.display = tab === 'devis' ? 'block' : 'none';
  }

  function loadEscapades() {
    var g = document.getElementById('esc-grid');
    if (!g) return;
    g.innerHTML = '<div class="loading" style="grid-column:1/-1;">Chargement...</div>';

    window.TDC.db.from('escapades').select('*').eq('statut', 'actif').order('created_at', { ascending: false })
      .then(function (res) {
        var data = (res.data && res.data.length > 0) ? res.data : defaultEscapades();

        g.innerHTML = data.map(function (e) {
          var badge = e.prix_type === 'devis'
            ? '<span style="background:var(--goldp);color:var(--gold);font-size:10px;padding:3px 10px;border-radius:100px;font-weight:500;">Sur devis</span>'
            : '<span style="background:rgba(255,255,255,0.9);color:var(--green);font-size:10px;padding:3px 10px;border-radius:100px;font-weight:500;">' + (e.prix||'Prix sur demande') + '</span>';

          var media = e.photo_url
            ? '<div style="height:200px;overflow:hidden;position:relative;">'
                + '<img src="' + e.photo_url + '" style="width:100%;height:200px;object-fit:cover;" alt="' + e.titre + '">'
                + '<div style="position:absolute;top:12px;left:12px;">' + badge + '</div>'
                + (e.duree ? '<div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.5);color:#fff;font-size:10px;padding:3px 10px;border-radius:100px;">' + e.duree + '</div>' : '')
              + '</div>'
            : '<div style="height:200px;background:' + typeColor(e.type) + ';display:flex;align-items:center;justify-content:center;font-size:64px;position:relative;">'
                + typeEmoji(e.type)
                + '<div style="position:absolute;top:12px;left:12px;">' + badge + '</div>'
                + (e.duree ? '<div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.4);color:#fff;font-size:10px;padding:3px 10px;border-radius:100px;">' + e.duree + '</div>' : '')
              + '</div>';

          return '<div style="background:var(--w);border:1px solid var(--b);border-radius:20px;overflow:hidden;">'
            + media
            + '<div style="padding:18px 20px;">'
              + '<div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">' + (e.type||'Escapade') + '</div>'
              + '<div style="font-family:\'Playfair Display\',serif;font-size:17px;margin-bottom:6px;">' + e.titre + '</div>'
              + '<div style="font-size:12px;color:var(--t3);margin-bottom:10px;">📍 ' + (e.lieu||'France') + (e.capacite ? ' · 👥 ' + e.capacite + ' membres max' : '') + '</div>'
              + '<div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:16px;">' + (e.description||'') + '</div>'
              + '<button class="btn btn-p" style="width:100%;justify-content:center;padding:10px;" data-esc-devis="' + e.id + '" data-esc-titre="' + e.titre.replace(/"/g,'&quot;') + '">✨ Demander un devis</button>'
            + '</div></div>';
        }).join('');

      }).catch(function (err) {
        g.innerHTML = '<div class="error">Erreur : ' + err.message + '</div>';
      });
  }

  function buildDevisForm() {
    var inp = 'width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;';
    return '<div style="background:var(--w);border:1px solid var(--b);border-radius:16px;padding:28px;max-width:560px;">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:20px;margin-bottom:6px;">✨ Demander un devis</div>'
      + '<div style="font-size:13px;color:var(--t3);margin-bottom:24px;">Notre équipe vous répond sous 24h 🐾</div>'

      + '<div style="margin-bottom:16px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Escapade souhaitée</label>'
        + '<input type="text" id="devis-escapade-titre" placeholder="Ex: Week-end en villa dog-friendly..." style="' + inp + '"></div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">'
        + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Nombre de chiens</label>'
          + '<select id="devis-nb-chiens" style="' + inp + '"><option value="1">1 chien</option><option value="2">2 chiens</option><option value="3">3 chiens</option><option value="4+">4 et plus</option></select></div>'
        + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Nombre de personnes</label>'
          + '<select id="devis-nb-personnes" style="' + inp + '"><option value="1">1 personne</option><option value="2">2 personnes</option><option value="3">3 personnes</option><option value="4-6">4 à 6</option><option value="7+">7 et plus</option></select></div>'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">'
        + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Dates souhaitées</label>'
          + '<input type="text" id="devis-dates" placeholder="Ex: Mi-juillet 2025" style="' + inp + '"></div>'
        + '<div><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Destination</label>'
          + '<input type="text" id="devis-lieu" placeholder="Ex: Côte d\'Azur" style="' + inp + '"></div>'
      + '</div>'

      + '<div style="margin-bottom:16px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Budget indicatif</label>'
        + '<select id="devis-budget" style="' + inp + '">'
          + '<option value="">Indiquer un budget...</option>'
          + '<option value="500-1000€">500 – 1 000 €</option>'
          + '<option value="1000-2000€">1 000 – 2 000 €</option>'
          + '<option value="2000-5000€">2 000 – 5 000 €</option>'
          + '<option value="5000+€">5 000 € et plus</option>'
          + '<option value="flexible">Budget flexible</option>'
        + '</select></div>'

      + '<div style="margin-bottom:24px;"><label style="display:block;font-size:11px;color:var(--t3);text-transform:uppercase;margin-bottom:6px;">Besoins spéciaux</label>'
        + '<textarea id="devis-besoins" placeholder="Race, allergies, accessibilité, occasion spéciale..." style="' + inp + 'resize:vertical;min-height:90px;"></textarea></div>'

      + '<div id="devis-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:14px;"></div>'
      + '<button id="devis-submit" class="btn btn-p" style="width:100%;padding:13px;font-size:15px;">✨ Envoyer ma demande de devis</button>'
      + '<div style="font-size:11px;color:var(--t3);text-align:center;margin-top:10px;">Notre concierge canin vous contacte sous 24h 🐾</div>'
      + '<div id="devis-ok" style="display:none;background:#d1fae5;color:#065f46;border-radius:12px;padding:16px;text-align:center;font-size:13px;margin-top:14px;">✓ Demande reçue ! Notre équipe vous contacte sous 24h 🐾</div>'
    + '</div>';
  }

  async function submitDevis() {
    var db    = window.TDC.db;
    var titre = document.getElementById('devis-escapade-titre').value.trim();
    var err   = document.getElementById('devis-err');
    var btn   = document.getElementById('devis-submit');
    err.style.display = 'none';
    if (!titre) { err.textContent = 'Indique l\'escapade souhaitée.'; err.style.display = 'block'; return; }
    btn.textContent = 'Envoi...'; btn.disabled = true;

    var res = await db.from('devis_escapades').insert([{
      membre_email:   window.TDC.userEmail,
      membre_prenom:  window.TDC.userPrenom,
      escapade_titre: titre,
      nb_chiens:      parseInt(document.getElementById('devis-nb-chiens').value) || 1,
      nb_personnes:   document.getElementById('devis-nb-personnes').value,
      dates:          document.getElementById('devis-dates').value,
      lieu:           document.getElementById('devis-lieu').value,
      budget:         document.getElementById('devis-budget').value,
      besoins:        document.getElementById('devis-besoins').value,
      statut:         'en_attente'
    }]);

    if (res.error) { err.textContent = 'Erreur : ' + res.error.message; err.style.display = 'block'; }
    else {
      document.getElementById('devis-ok').style.display = 'block';
      ['devis-escapade-titre','devis-dates','devis-lieu','devis-besoins'].forEach(function (id) { document.getElementById(id).value = ''; });
      document.getElementById('devis-budget').selectedIndex = 0;
    }
    btn.textContent = '✨ Envoyer ma demande de devis'; btn.disabled = false;
  }

  function defaultEscapades() {
    return [
      { id:'d1', titre:'Week-end en villa dog-friendly', type:'Week-end en villa dog-friendly', description:'Villas privées avec jardins sécurisés, chef à domicile, spa pour vous et votre compagnon.', lieu:'Luberon · Normandie · Côte Basque', prix:'À partir de 890€/pers.', prix_type:'fixe', duree:'2-3 nuits', capacite:8, photo_url:null },
      { id:'d2', titre:'Croisière canine en Méditerranée', type:'Croisière canine', description:'Voilier privatisé, calanques, criques secrètes et dîners au coucher de soleil avec votre chien.', lieu:'Marseille · Corse · Côte d\'Azur', prix:null, prix_type:'devis', duree:'3-7 nuits', capacite:6, photo_url:null },
      { id:'d3', titre:'Retraite Spa & Bien-être', type:'Spa & bien-être avec son chien', description:'Soins holistiques pour vous, bains et massages pour votre chien. Yoga en pleine nature.', lieu:'Alpes · Pyrénées · Dordogne', prix:'À partir de 1 200€/pers.', prix_type:'fixe', duree:'3-5 nuits', capacite:10, photo_url:null },
      { id:'d4', titre:'Chasse & Nature Premium', type:'Chasse & nature premium', description:'Domaines privés, guides experts. Pour les passionnés de nature avec leur compagnon de travail.', lieu:'Sologne · Ardennes · Gascogne', prix:null, prix_type:'devis', duree:'2-4 jours', capacite:6, photo_url:null },
      { id:'d5', titre:'City Break Luxury', type:'City break luxury', description:'Hôtels 5 étoiles dog-friendly, restaurants gastronomiques, concierge privé.', lieu:'Paris · Bordeaux · Lyon', prix:'À partir de 650€/pers.', prix_type:'fixe', duree:'2-3 nuits', capacite:12, photo_url:null },
    ];
  }

  function typeColor(type) {
    var c = { 'Week-end en villa dog-friendly':'#C8DEB8','Croisière canine':'#B8C9D4','Spa & bien-être avec son chien':'#D4B8B8','Chasse & nature premium':'#D4CEB8','City break luxury':'#D4C5A9' };
    return c[type] || '#EBF0E8';
  }

  function typeEmoji(type) {
    var e = { 'Week-end en villa dog-friendly':'🏡','Croisière canine':'⛵','Spa & bien-être avec son chien':'🛁','Chasse & nature premium':'🌲','City break luxury':'🏙️' };
    return e[type] || '✨';
  }

})();
