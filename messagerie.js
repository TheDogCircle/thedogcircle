/**
 * =====================================================
 *  THE DOG CIRCLE — Module Messagerie
 *  Fichier : messagerie.js
 *  Tables  : chat_collectif · messages_prives
 *  Realtime: Supabase
 * =====================================================
 */
(function () {

  var realtimeChat    = null;
  var realtimePrivate = null;
  var currentConv     = null; // email du destinataire actif
  var membres         = [];

  document.addEventListener('TDC:login',  function () { loadMembres(); });
  document.addEventListener('TDC:tab',    function (e) {
    if (e.detail.tab === 'messagerie') {
      showSubTab('collectif');
      loadChat();
      subscribeRealtime();
    } else {
      unsubscribeRealtime();
    }
  });

  // ── Charger la liste des membres ─────────────────────
  function loadMembres() {
    window.TDC.db.from('membres').select('prenom, email, photo_profil').order('prenom')
      .then(function(res) {
        membres = (res.data || []).filter(function(m) {
          return m.email !== window.TDC.userEmail;
        });
      });
  }

  // ── Sous-onglets ──────────────────────────────────────
  function showSubTab(tab) {
    var btnC = document.getElementById('msgTabCollectif');
    var btnP = document.getElementById('msgTabPrives');
    var secC = document.getElementById('msg-collectif');
    var secP = document.getElementById('msg-prives');
    if (!btnC) return;

    btnC.classList.toggle('active', tab === 'collectif');
    btnP.classList.toggle('active', tab === 'prives');
    secC.style.display = tab === 'collectif' ? 'flex' : 'none';
    secP.style.display = tab === 'prives'    ? 'flex' : 'none';

    if (tab === 'collectif') loadChat();
    if (tab === 'prives')    loadConversations();
  }

  // ── Inject UI ─────────────────────────────────────────
  document.addEventListener('TDC:login', function () {
    setTimeout(function() {
    var sec = document.getElementById('tc-messagerie');
    if (!sec) return;

    sec.innerHTML =
      // Sous-onglets
      '<div class="subtab-row" style="margin-bottom:0;">'
        + '<button class="subtab active" id="msgTabCollectif">🌍 Chat du cercle</button>'
        + '<button class="subtab" id="msgTabPrives">💌 Messages privés</button>'
      + '</div>'

      // Chat collectif
      + '<div id="msg-collectif" style="display:flex;flex-direction:column;height:520px;border:1px solid var(--b);border-radius:0 16px 16px 16px;overflow:hidden;background:var(--w);">'
        + '<div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;"></div>'
        + '<div style="padding:12px 16px;border-top:1px solid var(--b);display:flex;gap:8px;align-items:center;background:var(--w);">'
          + '<input type="text" id="chat-input" placeholder="Envoie un message à la meute 🐾" maxlength="500" style="flex:1;padding:10px 14px;border-radius:100px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
          + '<button id="chat-send" style="width:40px;height:40px;border-radius:50%;background:var(--green);border:none;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">→</button>'
        + '</div>'
      + '</div>'

      // Messages privés
      + '<div id="msg-prives" style="display:none;flex-direction:row;height:520px;border:1px solid var(--b);border-radius:0 16px 16px 16px;overflow:hidden;">'

        // Liste conversations
        + '<div id="conv-list" style="width:200px;flex-shrink:0;border-right:1px solid var(--b);background:var(--cream);overflow-y:auto;">'
          + '<div style="padding:12px 14px;font-size:11px;font-weight:500;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--b);">Membres</div>'
          + '<div id="conv-membres"></div>'
        + '</div>'

        // Zone conversation
        + '<div style="flex:1;display:flex;flex-direction:column;">'
          + '<div id="conv-header" style="padding:12px 16px;border-bottom:1px solid var(--b);font-size:14px;font-weight:500;color:var(--t);background:var(--w);display:flex;align-items:center;gap:10px;">'
            + '<span style="color:var(--t3);">Sélectionne un membre</span>'
          + '</div>'
          + '<div id="priv-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--w);"></div>'
          + '<div id="priv-input-zone" style="padding:12px 16px;border-top:1px solid var(--b);display:none;align-items:center;gap:8px;background:var(--w);">'
            + '<input type="text" id="priv-input" placeholder="Ton message..." maxlength="500" style="flex:1;padding:10px 14px;border-radius:100px;border:1.5px solid var(--b);font-family:inherit;font-size:14px;background:var(--cream);color:var(--t);outline:none;">'
            + '<button id="priv-send" style="width:40px;height:40px;border-radius:50%;background:var(--green);border:none;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">→</button>'
          + '</div>'
        + '</div>'

      + '</div>';

    // Bind sous-onglets
    document.getElementById('msgTabCollectif').addEventListener('click', function() { showSubTab('collectif'); });
    document.getElementById('msgTabPrives').addEventListener('click', function() { showSubTab('prives'); });

    // Bind envoi chat collectif
    document.getElementById('chat-send').addEventListener('click', sendChat);
    document.getElementById('chat-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendChat();
    });

    // Bind envoi message privé
    document.getElementById('priv-send').addEventListener('click', sendPrivate);
    document.getElementById('priv-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendPrivate();
    });
    }, 100);
  });

  // ── CHAT COLLECTIF ────────────────────────────────────
  function loadChat() {
    var box = document.getElementById('chat-messages');
    if (!box) return;
    box.innerHTML = '<div style="text-align:center;color:var(--t3);font-size:13px;padding:20px;">Chargement...</div>';

    window.TDC.db
      .from('chat_collectif')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(function(res) {
        box.innerHTML = '';
        if (!res.data || res.data.length === 0) {
          box.innerHTML = '<div style="text-align:center;color:var(--t3);font-size:13px;padding:20px;">Sois le premier à écrire 🐾</div>';
          return;
        }
        res.data.forEach(function(m) { appendChatMsg(m); });
        scrollBottom(box);
      });
  }

  function appendChatMsg(m) {
    var box = document.getElementById('chat-messages');
    if (!box) return;
    var isMe = m.membre_email === window.TDC.userEmail;
    var time = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    var div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;align-items:flex-end;' + (isMe ? 'flex-direction:row-reverse;' : '');

    var avatar = '';
    if (m.photo_profil) {
      avatar = '<img src="' + m.photo_profil + '" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="">';
    } else {
      avatar = '<div style="width:30px;height:30px;border-radius:50%;background:' + (isMe ? 'var(--green)' : 'var(--gold)') + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0;">' + (m.membre_prenom||'?')[0].toUpperCase() + '</div>';
    }

    div.innerHTML = avatar
      + '<div style="max-width:70%;">'
        + (!isMe ? '<div style="font-size:11px;color:var(--t3);margin-bottom:3px;">' + (m.membre_prenom||'Membre') + '</div>' : '')
        + '<div style="padding:9px 13px;border-radius:' + (isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';background:' + (isMe ? 'var(--green)' : 'var(--cream2)') + ';color:' + (isMe ? '#fff' : 'var(--t)') + ';font-size:14px;line-height:1.5;">' + escapeHtml(m.message) + '</div>'
        + '<div style="font-size:10px;color:var(--t3);margin-top:3px;text-align:' + (isMe ? 'right' : 'left') + ';">' + time + '</div>'
      + '</div>';

    box.appendChild(div);
  }

  async function sendChat() {
    var input = document.getElementById('chat-input');
    var msg   = input.value.trim();
    if (!msg) return;
    input.value = '';

    await window.TDC.db.from('chat_collectif').insert([{
      membre_email:  window.TDC.userEmail,
      membre_prenom: window.TDC.userPrenom,
      message:       msg
    }]);
  }

  // ── MESSAGES PRIVÉS ───────────────────────────────────
  function loadConversations() {
    var listEl = document.getElementById('conv-membres');
    if (!listEl) return;

    if (membres.length === 0) {
      listEl.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--t3);">Aucun membre</div>';
      return;
    }

    listEl.innerHTML = '';
    membres.forEach(function(m) {
      var div = document.createElement('div');
      div.style.cssText = 'padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--b);transition:background .15s;';
      div.addEventListener('mouseover', function() { div.style.background = 'var(--cream2)'; });
      div.addEventListener('mouseout',  function() { div.style.background = currentConv === m.email ? 'var(--greenp)' : ''; });

      var avatar = m.photo_profil
        ? '<img src="' + m.photo_profil + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" alt="">'
        : '<div style="width:28px;height:28px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;">' + (m.prenom||'?')[0].toUpperCase() + '</div>';

      div.innerHTML = avatar + '<span style="font-size:13px;color:var(--t);font-weight:' + (currentConv === m.email ? '500' : '400') + ';">' + m.prenom + '</span>';
      div.addEventListener('click', function() { openConversation(m); });
      listEl.appendChild(div);
    });
  }

  function openConversation(membre) {
    currentConv = membre.email;

    // Header
    var header = document.getElementById('conv-header');
    var avatar = membre.photo_profil
      ? '<img src="' + membre.photo_profil + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">'
      : '<div style="width:32px;height:32px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;">' + (membre.prenom||'?')[0].toUpperCase() + '</div>';
    header.innerHTML = avatar + '<span>' + membre.prenom + '</span>';

    // Afficher zone saisie
    document.getElementById('priv-input-zone').style.display = 'flex';

    // Charger messages
    loadPrivateMessages();

    // Re-render liste pour highlight
    loadConversations();

    // Subscribe realtime messages privés
    if (realtimePrivate) realtimePrivate.unsubscribe();
    realtimePrivate = window.TDC.db
      .channel('priv-' + window.TDC.userEmail)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_prives'
      }, function(payload) {
        var m = payload.new;
        if ((m.expediteur_email === currentConv && m.destinataire_email === window.TDC.userEmail)
          || (m.expediteur_email === window.TDC.userEmail && m.destinataire_email === currentConv)) {
          appendPrivMsg(m);
          scrollBottom(document.getElementById('priv-messages'));
        }
      })
      .subscribe();
  }

  function loadPrivateMessages() {
    var box = document.getElementById('priv-messages');
    if (!box || !currentConv) return;
    box.innerHTML = '<div style="text-align:center;color:var(--t3);font-size:13px;padding:20px;">Chargement...</div>';

    window.TDC.db
      .from('messages_prives')
      .select('*')
      .or('and(expediteur_email.eq.' + window.TDC.userEmail + ',destinataire_email.eq.' + currentConv + '),and(expediteur_email.eq.' + currentConv + ',destinataire_email.eq.' + window.TDC.userEmail + ')')
      .order('created_at', { ascending: true })
      .then(function(res) {
        box.innerHTML = '';
        if (!res.data || res.data.length === 0) {
          box.innerHTML = '<div style="text-align:center;color:var(--t3);font-size:13px;padding:20px;">Aucun message · Dis bonjour ! 🐾</div>';
          return;
        }
        res.data.forEach(function(m) { appendPrivMsg(m); });
        scrollBottom(box);
      });
  }

  function appendPrivMsg(m) {
    var box = document.getElementById('priv-messages');
    if (!box) return;
    var isMe = m.expediteur_email === window.TDC.userEmail;
    var time = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    var div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:' + (isMe ? 'flex-end' : 'flex-start') + ';';
    div.innerHTML =
      '<div style="max-width:75%;">'
        + '<div style="padding:9px 13px;border-radius:' + (isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';background:' + (isMe ? 'var(--green)' : 'var(--cream2)') + ';color:' + (isMe ? '#fff' : 'var(--t)') + ';font-size:14px;line-height:1.5;">' + escapeHtml(m.message) + '</div>'
        + '<div style="font-size:10px;color:var(--t3);margin-top:3px;text-align:' + (isMe ? 'right' : 'left') + ';">' + time + '</div>'
      + '</div>';
    box.appendChild(div);
  }

  async function sendPrivate() {
    if (!currentConv) return;
    var input = document.getElementById('priv-input');
    var msg   = input.value.trim();
    if (!msg) return;
    input.value = '';

    await window.TDC.db.from('messages_prives').insert([{
      expediteur_email:  window.TDC.userEmail,
      expediteur_prenom: window.TDC.userPrenom,
      destinataire_email: currentConv,
      message:           msg,
      lu:                false
    }]);
  }

  // ── Realtime chat collectif ───────────────────────────
  function subscribeRealtime() {
    if (realtimeChat) return;
    realtimeChat = window.TDC.db
      .channel('chat-collectif')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_collectif'
      }, function(payload) {
        var box = document.getElementById('chat-messages');
        if (!box) return;
        // Supprimer le message "sois le premier"
        var empty = box.querySelector('div[style*="Sois le premier"]');
        if (empty) empty.remove();
        appendChatMsg(payload.new);
        scrollBottom(box);
      })
      .subscribe();
  }

  function unsubscribeRealtime() {
    if (realtimeChat)    { realtimeChat.unsubscribe();    realtimeChat    = null; }
    if (realtimePrivate) { realtimePrivate.unsubscribe(); realtimePrivate = null; }
  }

  // ── Helpers ───────────────────────────────────────────
  function scrollBottom(el) {
    if (el) el.scrollTop = el.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
