/**
 * =====================================================
 *  THE DOG CIRCLE — Helper Upload Supabase Storage
 *  Fichier : upload-helper.js
 *  Usage   : window.TDCUpload.upload(file, folder)
 *            → retourne l'URL publique ou throw
 * =====================================================
 */
(function () {

  async function upload(db, file, folder) {
    var ext      = file.name.split('.').pop().toLowerCase();
    var fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    var up       = await db.storage.from('Photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (up.error) throw up.error;
    return db.storage.from('Photos').getPublicUrl(fileName).data.publicUrl;
  }

  // Prévisualisation d'image
  function previewInput(inputId, previewId) {
    var input   = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  window.TDCUpload = { upload: upload, previewInput: previewInput };

})();
