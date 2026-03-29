/**
 * =====================================================
 *  THE DOG CIRCLE — Module Login
 *  Fichier : login.js
 * =====================================================
 */
(function () {

  document.addEventListener('TDC:ready', function () {
    bindLogin();
    bindAvatar();
    checkSession();
  });

  async function checkSession() {
    var db  = window.TDC.db;
    var res = await db.auth.getSession();
    if (res.data && res.data.session) {
      await loginSuccess(res.data.session.user);
    }
  }

  function bindLogin() {
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    ['loginPwd', 'loginEmail'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doLogin();
      });
    });

    var lb = document.getElementById('logoutBtn');
    if (lb) lb.addEventListener('click', doLogout);

    var lb2 = document.getElementById('logoutBtnParams');
    if (lb2) lb2.addEventListener('click', doLogout);

    var forgot = document.getElementById('forgotPwd');
    if (forgot) forgot.addEventListener('click', function (e) {
      e.preventDefault();
      forgotPassword();
    });
  }

  async function doLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var pwd   = document.getElementById('loginPwd').value.trim();
    var err   = document.getElementById('loginErr');
    var btn   = document.getElementById('loginBtn');

    if (!email || !pwd) {
      err.textContent   = 'Email et mot de passe obligatoires.';
      err.style.display = 'block';
      return;
    }

    btn.textContent   = 'Connexion...';
    btn.disabled      = true;
    err.style.display = 'none';

    var db  = window.TDC.db;
    var res = await db.auth.signInWithPassword({ email: email, password: pwd });

    if (res.error) {
      err.textContent   = 'Email ou mot de passe incorrect.';
      err.style.display = 'block';
      btn.textContent   = 'Accéder au club 🐾';
      btn.disabled      = false;
      return;
    }

    await loginSuccess(res.data.user);
    btn.textContent = 'Accéder au club 🐾';
    btn.disabled    = false;
  }

  async function loginSuccess(user) {
    var db = window.TDC.db;

    var memRes = await db.from('membres').select('*').eq('email', user.email).single();
    var membre = memRes.data;

    window.TDC.userEmail  = user.email;
    window.TDC.userPrenom = (membre && membre.prenom) || user.email.split('@')[0];
    window.TDC.userMembre = membre || {};

    document.getElementById('loginErr').style.display = 'none';
    document.getElementById('pg-login').style.display = 'none';
    document.getElementById('pg-app').style.display   = 'block';

    var initiale    = window.TDC.userPrenom[0].toUpperCase();
    var photoProfil = membre && membre.photo_profil ? membre.photo_profil : null;
    updateAvatar(photoProfil, initiale);

    window.scrollTo(0, 0);

    // ✅ Atterrir sur l'accueil à la connexion
    if (window.TDC_switchTab) window.TDC_switchTab('accueil');

    document.dispatchEvent(new CustomEvent('TDC:login', {
      detail: { email: window.TDC.userEmail, prenom: window.TDC.userPrenom }
    }));
  }

  async function doLogout() {
    var db = window.TDC.db;
    await db.auth.signOut();
    window.TDC.userEmail  = '';
    window.TDC.userPrenom = '';
    window.TDC.userMembre = {};
    document.getElementById('pg-app').style.display   = 'none';
    document.getElementById('pg-login').style.display = 'flex';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPwd').value   = '';
    var dd = document.getElementById('profileDd');
    if (dd) dd.style.display = 'none';
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event('TDC:logout'));
  }

  async function forgotPassword() {
    var email = document.getElementById('loginEmail').value.trim();
    if (!email) { alert('Saisis ton email dans le champ ci-dessus puis clique "Mot de passe oublié".'); return; }
    var db  = window.TDC.db;
    var res = await db.auth.resetPasswordForEmail(email, { redirectTo: 'https://thedogcircle.fr/membres.html' });
    if (res.error) { alert('Erreur : ' + res.error.message); return; }
    alert('📧 Un email de réinitialisation a été envoyé à ' + email + ' !');
  }

  function updateAvatar(photoUrl, initiale) {
    var btn = document.getElementById('avatarBtn');
    if (!btn) return;
    var oldImg = btn.querySelector('img.avatar-photo');
    if (oldImg) oldImg.remove();
    var textNode = btn.childNodes[0];
    if (photoUrl) {
      var img = document.createElement('img');
      img.src       = photoUrl;
      img.className = 'avatar-photo';
      img.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:50%;';
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      if (textNode && textNode.nodeType === 3) textNode.textContent = '';
      btn.insertBefore(img, btn.firstChild);
    } else {
      if (textNode && textNode.nodeType === 3) textNode.textContent = initiale;
    }
  }

  window.TDC_updateAvatar = updateAvatar;

  function bindAvatar() {
    var avatarBtn = document.getElementById('avatarBtn');
    var dd        = document.getElementById('profileDd');
    if (!avatarBtn || !dd) return;

    avatarBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    });
    dd.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { dd.style.display = 'none'; });
  }

})();
