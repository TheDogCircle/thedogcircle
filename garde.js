/**
 * =====================================================
 *  THE DOG CIRCLE — Module Garde
 *  Fichier : garde.js
 *  Écoute  : TDC:login · TDC:tab(garde)
 * =====================================================
 */
(function () {

  var gardes = [
    { bg:'#C8DEB8', av:'🐕',    name:'Sophie R.',  dog:'Noisette · Cocker', tags:['Paris 11e','Max 2 chiens'],   dispo:'Disponible weekends'   },
    { bg:'#D4C5A9', av:'🐩',    name:'Marc D.',    dog:'Bella · Bichon',    tags:['Lyon 2e','Petits gabarits'],  dispo:'Disponible juillet'    },
    { bg:'#B8C9D4', av:'🦮',    name:'Julie M.',   dog:'Luna · Golden',     tags:['Bordeaux','Grands gabarits'], dispo:'Disponible maintenant' },
    { bg:'#D4B8B8', av:'🐕‍🦺', name:'Pierre V.',  dog:'Thor · Husky',      tags:['Paris 15e','Jardins'],        dispo:'Disponible août'       },
  ];

  var built = false;

  document.addEventListener('TDC:login', function () {
    buildGarde();
  });

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab === 'garde' && !built) buildGarde();
  });

  function buildGarde() {
    var g = document.getElementById('gardeGrid');
    if (!g) return;

    g.innerHTML = gardes.map(function (gd) {
      return '<div class="garde-card">'
        + '<div class="garde-av" style="background:' + gd.bg + '">' + gd.av + '</div>'
        + '<div class="garde-name">' + gd.name + '</div>'
        + '<div class="garde-dog">' + gd.dog + '</div>'
        + '<div class="garde-tags">' + gd.tags.map(function (t) {
            return '<span class="garde-tag">' + t + '</span>';
          }).join('') + '</div>'
        + '<div class="garde-dispo">● ' + gd.dispo + '</div>'
        + '<button class="btn btn-p" style="padding:6px 14px;font-size:12px;width:100%;justify-content:center;"'
          + ' onclick="window.location.href=\'mailto:thedogcircleclub@gmail.com?subject=Garde - ' + encodeURIComponent(gd.name) + '\'">Contacter</button>'
      + '</div>';
    }).join('');

    built = true;
  }

})();
