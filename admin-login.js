/**
 * =====================================================
 *  THE DOG CIRCLE — Admin Login
 *  Fichier : admin-login.js
 * =====================================================
 */
(function () {

  function doLogin() {
    var email = (document.getElementById('adminEmail').value || '').trim();
    var pwd   = (document.getElementById('adminPwd').value   || '').trim();
    var err   = document.getElementById('loginErr');
    if (email === 'admin@thedogcircle.fr' && pwd === 'admin2026') {
      err.style.display = 'none';
      document.getElementById('pg-login').style.display = 'none';
      document.getElementById('pg-app').style.display   = 'flex';
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

  // Exposer globalement pour les onclick HTML (fallback fiable)
  window.adminLogin  = doLogin;
  window.adminLogout = doLogout;

  // DOMContentLoaded — garanti avant tout événement custom
  document.addEventListener('DOMContentLoaded', function () {
    var loginBtn  = document.getElementById('loginBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn)  loginBtn.addEventListener('click', doLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);

    document.addEventListener('keydown', function (e) {
      var pg = document.getElementById('pg-login');
      if (e.key === 'Enter' && pg && pg.style.display !== 'none') doLogin();
    });
  });

})();
