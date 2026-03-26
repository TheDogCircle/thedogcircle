/**
 * =====================================================
 *  THE DOG CIRCLE — Module Login
 *  Fichier : login.js
 *  Auth    : Supabase Auth (email + password)
 * =====================================================
 */
(function () {

  document.addEventListener('TDCA:ready', function () { /* admin only */ });

  document.addEventListener('TDC:ready', function () {
    bindLogin();
    bindAvatar();
    checkSession();
  });

  // ── Vérifier session existante ───────────────────────
  async function checkSession() {
    var db  = window.TDC.db;
    var res = await db.auth.getSession();
    if (res.data && res.data.session) {
      var user = res.data.session.user;
      await loginSuccess(user);
    }
  }

  // ── Connexion ────────────────────────────────────────
  function bindLogin() {
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    ['loginPwd','loginEmail'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doLogin();
      });
    });
    document.getElementById('logoutBtn').addEventListener('click', doLogout);

    // Lien mot de passe oublié
    var hint = document.querySelector('.login-hint');
    if (hint) {
      hint.insertAdjacentHTML('afterend',
        '<p class="login-hint" style="margin-top:8px;">'
          + '<a id="forgotPwd" style="color:var(--t3);cursor:pointer;">Mot de passe oublié ?</a>'
        + '</p>'
      );
      document.getElementById('forgotPwd').addEventListener('click', forgotPassword);
    }
  }

  async function doLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var pwd   = document.getElementById('loginPwd').value.trim();
    var err   = document.getElementById('loginErr');
    var btn   = document.getElementById('loginBtn');

    if (!email || !pwd) {
      err.textContent  = 'Email et mot de passe obligatoires.';
      err.style.display = 'block';
      return;
    }

    btn.textContent = 'Connexion...';
    btn.disabled    = true;
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

    // Charger les infos du membre depuis la table membres
    var memRes = await db.from('membres').select('*').eq('email', user.email).single();
    var membre = memRes.data;

    window.TDC.userEmail  = user.email;
    window.TDC.userPrenom = (membre && membre.prenom) || user.email.split('@')[0];
    window.TDC.userMembre = membre || {};

    document.getElementById('loginErr').style.display = 'none';
    document.getElementById('pg-login').style.display = 'none';
    document.getElementById('pg-app').style.display   = 'block';

    // Mettre à jour l'avatar et le bandeau
    var initiale    = window.TDC.userPrenom[0].toUpperCase();
    var photoProfil = membre && membre.photo_profil ? membre.photo_profil : null;
    updateAvatar(photoProfil, initiale);
    var welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) welcomeMsg.textContent = 'Bienvenue ' + window.TDC.userPrenom + ' 🐾';

    window.scrollTo(0, 0);
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
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event('TDC:logout'));
  }

  // ── Mot de passe oublié ──────────────────────────────
  async function forgotPassword() {
    var email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      alert('Saisis ton email dans le champ ci-dessus puis clique "Mot de passe oublié".');
      return;
    }
    var db  = window.TDC.db;
    var res = await db.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://thedogcircle.fr/membres.html'
    });
    if (res.error) { alert('Erreur : ' + res.error.message); return; }
    alert('📧 Un email de réinitialisation a été envoyé à ' + email + ' !');
  }

  // ── Mettre à jour l'avatar ──────────────────────────
  function updateAvatar(photoUrl, initiale) {
    var btn = document.getElementById('avatarBtn');
    if (!btn) return;
    // Supprimer l'ancienne image si présente
    var oldImg = btn.querySelector('img.avatar-photo');
    if (oldImg) oldImg.remove();
    // Mettre à jour l'initiale ou photo
    var textNode = btn.childNodes[0];
    if (photoUrl) {
      var img = document.createElement('img');
      img.src = photoUrl;
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

  // Exposer pour profil.js
  window.TDC_updateAvatar = updateAvatar;

  // ── Avatar dropdown ──────────────────────────────────
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
