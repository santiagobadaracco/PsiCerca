(async () => {
  try {
    const user = await requireUser();

    if (!user) return;

    const welcome = document.getElementById('welcome');

    if (welcome) {
      welcome.textContent = 'Sesión iniciada como ' + user.email;
    }

    const sb = requireSupabase();

    // Buscar perfil existente
    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const meta = user.user_metadata || {};

    const currentProfile = profile || {
      id: user.id,
      display_name: meta.full_name || '',
      license: meta.license || '',
      jurisdiction: meta.jurisdiction || '',
      zone: '',
      modality: '',
      orientation: '',
      population: '',
      whatsapp: '',
      bio: '',
      is_public: false,
      photo_url: ''
    };

    // ==============================
    // CARGAR DATOS DEL FORMULARIO
    // ==============================

    const fields = [
      'display_name',
      'license',
      'jurisdiction',
      'zone',
      'modality',
      'orientation',
      'population',
      'whatsapp',
      'bio'
    ];

    fields.forEach(field => {
      const element = document.getElementById(field);

      if (element) {
        element.value = currentProfile[field] || '';
      }
    });

    const publicCheckbox = document.getElementById('is_public');

    if (publicCheckbox) {
      publicCheckbox.checked = !!currentProfile.is_public;
    }

    // ==============================
    // FOTO DE PERFIL
    // ==============================

    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');

    const initials = (currentProfile.display_name || 'PS')
      .split(' ')
      .map(x => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (photoPreview) {
      if (currentProfile.photo_url) {
        photoPreview.innerHTML =
          '<img src="' +
          currentProfile.photo_url +
          '" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;">';
      } else {
        photoPreview.textContent = initials;
      }
    }

    // Vista previa
    if (photoInput && photoPreview) {
      photoInput.addEventListener('change', () => {

        const file = photoInput.files[0];

        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          showMessage(
            'msg',
            'La foto no puede superar los 2 MB.',
            true
          );

          photoInput.value = '';
          return;
        }

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
          showMessage(
            'msg',
            'La foto debe ser JPG, PNG o WEBP.',
            true
          );

          photoInput.value = '';
          return;
        }

        const previewURL = URL.createObjectURL(file);

        photoPreview.innerHTML =
          '<img src="' +
          previewURL +
          '" alt="Vista previa" style="width:100%;height:100%;object-fit:cover;">';
      });
    }

    // ==============================
    // GUARDAR PERFIL
    // ==============================

    const form = document.getElementById('profileForm');

    if (!form) {
      throw new Error('No se encontró el formulario del perfil.');
    }

    form.addEventListener('submit', async event => {

      event.preventDefault();

      const button = form.querySelector('button[type="submit"]');

      if (button) {
        button.disabled = true;
        button.textContent = 'Guardando…';
      }

      try {

        let photoURL = currentProfile.photo_url || '';

        // ==============================
        // SUBIR FOTO
        // ==============================

        const file = photoInput && photoInput.files
          ? photoInput.files[0]
          : null;

        if (file) {

          const extension = file.name
            .split('.')
            .pop()
            .toLowerCase();

          const filePath = user.id + '/profile.' + extension;

          const uploadResult = await sb.storage
            .from('profile-photos')
            .upload(
              filePath,
              file,
              {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
              }
            );

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          const publicResult = sb.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

          photoURL = publicResult.data.publicUrl;
        }

        // ==============================
        // DATOS DEL PERFIL
        // ==============================

        const payload = {
          id: user.id,

          display_name: document
            .getElementById('display_name')
            .value
            .trim(),

          license: document
            .getElementById('license')
            .value
            .trim(),

          jurisdiction: document
            .getElementById('jurisdiction')
            .value,

          zone: document
            .getElementById('zone')
            .value
            .trim(),

          modality: document
            .getElementById('modality')
            .value,

          orientation: document
            .getElementById('orientation')
            .value
            .trim(),

          population: document
            .getElementById('population')
            .value
            .trim(),

          whatsapp: document
            .getElementById('whatsapp')
            .value
            .trim(),

          bio: document
            .getElementById('bio')
            .value
            .trim(),

          is_public: document
            .getElementById('is_public')
            .checked,

          photo_url: photoURL,

          updated_at: new Date().toISOString()
        };

        // ==============================
        // GUARDAR EN SUPABASE
        // ==============================

        const result = await sb
          .from('profiles')
          .upsert(payload, {
            onConflict: 'id'
          });

        if (result.error) {
          throw result.error;
        }

        currentProfile.photo_url = photoURL;
        currentProfile.is_public = payload.is_public;

        showMessage(
          'msg',
          'Perfil guardado correctamente.'
        );

      } catch (error) {

        console.error('Error guardando perfil:', error);

        showMessage(
          'msg',
          error.message || 'No se pudieron guardar los cambios.',
          true
        );

      } finally {

        if (button) {
          button.disabled = false;
          button.textContent = 'Guardar cambios';
        }

      }

    });

  } catch (error) {

    console.error('Error en dashboard:', error);

    showMessage(
      'msg',
      error.message || 'Ocurrió un error.',
      true
    );
  }

})();
