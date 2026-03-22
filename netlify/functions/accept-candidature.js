/**
 * =====================================================
 *  THE DOG CIRCLE — Netlify Function
 *  Fichier : netlify/functions/accept-candidature.js
 *  Sans dépendance npm — utilise fetch directement
 * =====================================================
 */

exports.handler = async function (event) {

  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { candidature, numero, codeParrain, tempPassword } = data;

    const SB_URL           = 'https://bmqyysilivmxndwhmovw.supabase.co';
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND_KEY       = process.env.RESEND_API_KEY;

    if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante');
    if (!RESEND_KEY)       throw new Error('RESEND_API_KEY manquante');

    // ── 1. Créer le compte Supabase Auth via REST Admin API ──
    const authRes = await fetch(SB_URL + '/auth/v1/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email:         candidature.email,
        password:      tempPassword,
        email_confirm: true,
        user_metadata: { prenom: candidature.prenom, chien: candidature.chien }
      })
    });

    const authData = await authRes.json();
    if (!authRes.ok) {
      console.error('Auth error:', JSON.stringify(authData));
      // Continuer si l'utilisateur existe déjà
      if (authData.code !== 'email_exists' && !String(authData.msg).includes('already')) {
        throw new Error('Auth: ' + (authData.msg || authData.message || JSON.stringify(authData)));
      }
    }

    // ── 2. Envoyer l'email via Resend ────────────────────
    const numeroStr = String(numero).padStart(3, '0');

    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        from:    'The Dog Circle <hello@thedogcircle.fr>',
        to:      [candidature.email],
        subject: '🐾 Bienvenue dans The Dog Circle, ' + candidature.prenom + ' !',
        html:    emailTemplate(candidature, tempPassword, numeroStr, codeParrain)
      })
    });

    if (!emailRes.ok) {
      const emailErr = await emailRes.json();
      console.error('Resend error:', JSON.stringify(emailErr));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, numeroStr })
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

function emailTemplate(c, tempPassword, numeroStr, codeParrain) {
  return '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F6F0E4;border-radius:16px;overflow:hidden;">'
    + '<div style="background:#3B5E3F;padding:32px;text-align:center;">'
      + '<div style="font-size:40px;margin-bottom:8px;">🐾</div>'
      + '<h1 style="color:#F6F0E4;font-size:28px;font-weight:400;margin:0;">The Dog Circle</h1>'
      + '<div style="color:#B8882A;font-size:12px;letter-spacing:0.15em;margin-top:6px;">CLUB PRIVÉ CANIN · MEMBRE #' + numeroStr + '</div>'
    + '</div>'
    + '<div style="padding:36px 40px;">'
      + '<h2 style="color:#2A1C0C;font-size:22px;font-weight:400;margin-bottom:16px;">Félicitations ' + c.prenom + ' ! 🎉</h2>'
      + '<p style="color:#6B5240;font-size:15px;line-height:1.7;margin-bottom:20px;">Ta candidature a été <strong style="color:#3B5E3F;">acceptée</strong>. Tu fais désormais partie du cercle. Bienvenue à toi et à <strong>' + (c.chien || 'ton chien') + '</strong> !</p>'
      + '<div style="background:#3B5E3F;border-radius:12px;padding:20px 24px;margin-bottom:20px;">'
        + '<div style="color:#B8882A;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Tes accès membres</div>'
        + '<div style="color:#F6F0E4;font-size:14px;margin-bottom:6px;">🔗 <strong>thedogcircle.fr/membres</strong></div>'
        + '<div style="color:#F6F0E4;font-size:14px;margin-bottom:6px;">📧 Login : <strong>' + c.email + '</strong></div>'
        + '<div style="color:#F6F0E4;font-size:14px;">🔑 Mot de passe : <strong>' + tempPassword + '</strong></div>'
      + '</div>'
      + '<div style="background:#F5E8C4;border-radius:12px;padding:16px 20px;margin-bottom:20px;">'
        + '<div style="color:#B8882A;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Ton passeport membre</div>'
        + '<div style="font-size:14px;color:#2A1C0C;margin-bottom:4px;">🏷️ Numéro de membre : <strong>#' + numeroStr + '</strong></div>'
        + '<div style="font-size:14px;color:#2A1C0C;">🎁 Ton code parrain : <strong>' + codeParrain + '</strong></div>'
        + '<div style="font-size:12px;color:#9C8472;margin-top:8px;">Partage ce code avec tes amis pour les inviter dans le cercle.</div>'
      + '</div>'
      + '<a href="https://thedogcircle.fr/membres" style="display:block;background:#B8882A;color:#F6F0E4;text-align:center;padding:14px;border-radius:100px;font-size:15px;text-decoration:none;font-weight:500;margin-bottom:20px;">Accéder à mon espace membre →</a>'
      + '<p style="color:#9C8472;font-size:12px;line-height:1.7;">💡 Tu pourras changer ton mot de passe depuis ton espace membre → Mon espace → Paramètres.<br>Formule choisie : <strong>' + (c.formule || '—') + '</strong></p>'
    + '</div>'
    + '<div style="background:#2A1C0C;padding:20px;text-align:center;">'
      + '<div style="color:rgba(246,240,228,0.4);font-size:11px;letter-spacing:0.1em;">thedogcircle.fr · Club Privé Canin · France</div>'
    + '</div>'
  + '</div>';
}
