/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Login
 *  Fichier : admin-login.js
 *  Écoute  : TDCA:ready
 *  Émet    : TDCA:login · TDCA:logout
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:ready', function () {
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    document.getElementById('logoutBtn').addEventListener('click', doLogout);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && document.getElementById('pg-login').style.display !== 'none') doLogin();
    });
  });

  function doLogin() {
    var email = document.getElementById('adminEmail').value.trim();
    var pwd   = document.getElementById('adminPwd').value.trim();
    var err   = document.getElementById('loginErr');

    if (email === 'admin@thedogcircle.fr' && pwd === 'admin2026') {
      err.style.display = 'none';
      document.getElementById('pg-login').style.display = 'none';
      document.getElementById('pg-app').style.display   = 'grid';
      window.scrollTo(0, 0);
      document.dispatchEvent(new Event('TDCA:login'));
    } else {
      err.style.display = 'block';
    }
  }

  function doLogout() {
    document.getElementById('pg-app').style.display   = 'none';
    document.getElementById('pg-login').style.display = 'flex';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPwd').value   = '';
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event('TDCA:logout'));
  }

})();
