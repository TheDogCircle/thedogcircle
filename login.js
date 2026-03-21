/**
 * =====================================================
 *  THE DOG CIRCLE — Module Login
 *  Fichier : login.js
 *  Écoute  : TDC:ready
 *  Émet    : TDC:login · TDC:logout
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:ready', function () {
    bindLogin();
    bindAvatar();
  });

  // ── Connexion ──────────────────────────────────────
  function bindLogin() {
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    document.getElementById('loginPwd').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('loginEmail').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('logoutBtn').addEventListener('click', doLogout);
  }

  function doLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var pwd   = document.getElementById('loginPwd').value.trim();
    var err   = document.getElementById('loginErr');

    // TODO : remplacer par une vraie auth Supabase Auth quand elle sera configurée
    if (email === 'membre@thedogcircle.fr' && pwd === 'thedogcircle') {
      window.TDC.userEmail  = email;
      window.TDC.userPrenom = 'Membre';

      err.style.display = 'none';
      document.getElementById('pg-login').style.display = 'none';
      document.getElementById('pg-app').style.display   = 'block';

      // Mise à jour du bandeau de bienvenue et de l'avatar
      document.getElementById('welcomeMsg').textContent =
        'Bienvenue ' + window.TDC.userPrenom + ' 🐾';
      document.getElementById('avatarBtn').textContent = window.TDC.userPrenom[0].toUpperCase();

      window.scrollTo(0, 0);

      // Notifie tous les modules
      document.dispatchEvent(new CustomEvent('TDC:login', {
        detail: { email: window.TDC.userEmail, prenom: window.TDC.userPrenom }
      }));

    } else {
      err.style.display = 'block';
    }
  }

  function doLogout() {
    window.TDC.userEmail  = '';
    window.TDC.userPrenom = '';

    document.getElementById('pg-app').style.display   = 'none';
    document.getElementById('pg-login').style.display = 'flex';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPwd').value   = '';

    window.scrollTo(0, 0);
    document.dispatchEvent(new Event('TDC:logout'));
  }

  // ── Avatar dropdown ────────────────────────────────
  function bindAvatar() {
    document.getElementById('avatarBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = document.getElementById('profileDd');
      dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function () {
      var dd = document.getElementById('profileDd');
      if (dd) dd.style.display = 'none';
    });
  }

})();
