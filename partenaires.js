/**
 * =====================================================
 *  THE DOG CIRCLE — Module Partenaires
 *  Fichier : partenaires.js
 *  Écoute  : TDC:login · TDC:tab(partners)
 * =====================================================
 */
(function () {

  var partners = [
    { bg:'#C8DEB8', icon:'✂️', name:'Woof & Clean',  type:'Toiletteur Paris',    offer:'-25% sur tous les soins',              code:'CIRCLE25'  },
    { bg:'#D4C5A9', icon:'🦮', name:'BaladePaws',    type:'Promeneur Paris',     offer:'-30% sur les promenades',              code:'CIRCLE30'  },
    { bg:'#B8C9D4', icon:'🛍️', name:'PawStore',     type:'Boutique premium',    offer:'-20% sur nutrition et accessoires',    code:'CIRCLE20'  },
    { bg:'#D4B8B8', icon:'🩺', name:'Veto Express',  type:'Vétérinaire',         offer:'Consultation offerte + -15% soins',    code:'CIRCLEVET' },
  ];

  var built = false;

  document.addEventListener('TDC:login', function () {
    buildPartners();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'partners' && !built) buildPartners();
  });

  function buildPartners() {
    var g = document.getElementById('partnersGrid');
    if (!g) return;

    g.innerHTML = partners.map(function (p) {
      return '<div class="partner-card">'
        + '<div class="partner-header">'
          + '<div class="partner-icon" style="background:' + p.bg + '">' + p.icon + '</div>'
          + '<div><div class="partner-name">' + p.name + '</div>'
            + '<div class="partner-type">' + p.type + '</div></div>'
        + '</div>'
        + '<div class="partner-offer">' + p.offer + '</div>'
        + '<div class="partner-code">'
          + '<span class="code-text">' + p.code + '</span>'
          + '<span class="copy-btn" data-code="' + p.code + '">Copier</span>'
        + '</div></div>';
    }).join('');

    g.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy-btn');
      if (!btn) return;
      navigator.clipboard.writeText(btn.dataset.code).then(function () {
        btn.textContent = 'Copié !';
        setTimeout(function () { btn.textContent = 'Copier'; }, 2000);
      });
    });

    built = true;
  }

})();
