/**
 * =====================================================
 *  THE DOG CIRCLE — Module Map
 *  Fichier : map.js
 *  Lib     : Leaflet (déjà chargé dans membres.html)
 *  Écoute  : TDC:tab(map)
 * =====================================================
 */
(function () {

  var mapInstance = null;

  // Points de démo — à remplacer par des données Supabase
  var spots = {
    events: [
      { lat:48.8566, lng:2.3522,  title:'Balade collective',    detail:'Paris · 15 mai',    color:'#3B5E3F' },
      { lat:45.7640, lng:4.8357,  title:'Pique-nique canin',    detail:'Lyon · 22 mai',     color:'#3B5E3F' },
      { lat:44.8378, lng:-0.5792, title:'Dog surf Lacanau',     detail:'Bordeaux · 5 juin', color:'#3B5E3F' },
    ],
    garde: [
      { lat:48.8680, lng:2.3412,  title:'Sophie R.',   detail:'Paris 11e · Weekends', color:'#B8882A' },
      { lat:45.7590, lng:4.8350,  title:'Marc D.',     detail:'Lyon 2e · Juillet',    color:'#B8882A' },
      { lat:48.8380, lng:2.2820,  title:'Pierre V.',   detail:'Paris 15e · Août',     color:'#B8882A' },
    ],
    partenaires: [
      { lat:48.8720, lng:2.3600,  title:'Woof & Clean',  detail:'Toiletteur · -25%',    color:'#587A5C' },
      { lat:48.8490, lng:2.3700,  title:'Veto Express',  detail:'Vétérinaire · -15%',   color:'#587A5C' },
      { lat:45.7580, lng:4.8400,  title:'BaladePaws',    detail:'Promeneur · -30%',     color:'#587A5C' },
    ]
  };

  document.addEventListener('TDC:tab', function (e) {
    if (e.detail.tab !== 'map') return;
    // Leaflet ne supporte pas d'être initialisé dans un container caché
    // On attend un tick pour que l'onglet soit visible
    setTimeout(initMap, 50);
  });

  function initMap() {
    var container = document.getElementById('map-container');
    if (!container) return;

    // Détruire l'instance précédente si on revient sur l'onglet
    if (mapInstance) {
      mapInstance.invalidateSize();
      return;
    }

    mapInstance = L.map('map-container', {
      center: [46.8, 2.3],
      zoom:   6,
      zoomControl: true
    });

    // Tuiles OpenStreetMap (gratuites, pas de clé API)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(mapInstance);

    // Ajouter les markers
    addMarkers(spots.events,      '🎉');
    addMarkers(spots.garde,       '🏠');
    addMarkers(spots.partenaires, '🤝');
  }

  function addMarkers(list, emoji) {
    list.forEach(function (spot) {
      var icon = L.divIcon({
        className: '',
        html: '<div style="'
          + 'background:' + spot.color + ';'
          + 'width:32px;height:32px;border-radius:50%;'
          + 'display:flex;align-items:center;justify-content:center;'
          + 'font-size:14px;border:2px solid #fff;'
          + 'box-shadow:0 2px 8px rgba(0,0,0,0.2);">'
          + emoji
          + '</div>',
        iconSize:   [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([spot.lat, spot.lng], { icon: icon })
        .addTo(mapInstance)
        .bindPopup(
          '<div style="font-family:DM Sans,sans-serif;min-width:140px;">'
          + '<div style="font-weight:500;font-size:14px;margin-bottom:3px;">' + spot.title + '</div>'
          + '<div style="font-size:12px;color:#6B5240;">' + spot.detail + '</div>'
          + '</div>'
        );
    });
  }

})();
