;(async () => {
  try {
    const user = await requireUser();
    if (!user) return;

    const sb = requireSupabase();

    const form = document.getElementById('profileForm');
    const welcome = document.getElementById('welcome');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const msg = document.getElementById('msg');

    const fields = [
      'display_name',
      'license',
      'jurisdiction',
      'zone',
      'modality',
      'orientation',
      'whatsapp',
      'bio',
      'is_public'
    ];

    let currentProfile = null;
    let photoWasRemoved = false;

    welcome.textContent = user.email || 'Profesional';

    // Cargar perfil
    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    currentProfile = profile;

    if (profile) {
      fields.forEach(field => {
        const element = document.getElementById(field);
        if (!element) return;

        if (element.type === 'checkbox') {
          element.checked = Boolean(profile[field]);
        } else {
          element.value = profile[field] || '';
        }
      });

      // Recuperar población guardada
      const savedPopulation = profile.population || '';

      const selectedPopulation = savedPopulation
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      document.querySelectorAll('.population-option').forEach(option => {
        option.checked = selectedPopulation.includes(option.value);
      });

      if (profile.photo_url) {
        photoPreview.innerHTML = `
          <img
            src="${escapeHTML(profile.photo_url)}"
            alt="Foto de perfil"
            style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
          >
        `;

        showRemoveButton();
      }
    }

    // Actualizar el campo oculto de población
    function updatePopulationValue() {
      const selected = Array.from(
        document.querySelectorAll('.population-option:checked')
      ).map(option => option.value);

      const populationField = document.getElementById('population');

      if (populationField) {
        populationField.value = selected.join(', ');
      }
    }

    document.querySelectorAll('.population-option').forEach(option => {
      option.addEventListener('change', updatePopulationValue);
    });

    updatePopulationValue();

    // Vista previa de foto
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

      const reader = new FileReader();

      reader.onload = event => {
        photoPreview.innerHTML = `
          <img
            src="${event.target.result}"
            alt="Vista previa"
            style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
          >
        `;

        showRemoveButton();
        photoWasRemoved = false;
      };

      reader.readAsDataURL(file);
    });

    // Botón eliminar foto
    function showRemoveButton() {
      let removeButton = document.getElementById('removePhoto');

      if (removeButton) return;

      removeButton = document.createElement('button');
      removeButton.id = 'removePhoto';
      removeButton.type = 'button';
      removeButton.className = 'btn secondary';
      removeButton.style.marginTop = '8px';
      removeButton.textContent = 'Eliminar foto';

      photoInput.parentElement.appendChild(removeButton);

      removeButton.addEventListener('click', () => {
        photoInput.value = '';
        photoPreview.innerHTML = 'PS';
        photoWasRemoved = true;
        removeButton.remove();
      });
    }

    // Guardar perfil
    form.addEventListener('submit', async event => {
      event.preventDefault();

      try {
        showMessage('msg', 'Guardando...');

        updatePopulationValue();

        const populationField =
          document.getElementById('population');

        if (!populationField) {
          throw new Error(
            'No se encontró el campo de población.'
          );
        }

        const selectedPopulation = populationField.value;

        let photoUrl = currentProfile?.photo_url || null;

        // Eliminar foto si corresponde
        if (photoWasRemoved && photoUrl) {
          const extensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
          ];

          const paths = extensions.map(
            extension =>
              `${user.id}/profile.${extension}`
          );

          await sb.storage
            .from('profile-photos')
            .remove(paths);

          photoUrl = null;
        }

        // Subir nueva foto
        const file = photoInput.files[0];

        if (file) {
          const extension = file.name
            .split('.')
            .pop()
            .toLowerCase();

          const validExtensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
          ];

          if (!validExtensions.includes(extension)) {
            throw new Error(
              'Formato de imagen no válido. Usá JPG, PNG o WEBP.'
            );
          }

          const extensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
          ];

          const oldPaths = extensions
            .filter(ext => ext !== extension)
            .map(
              ext =>
                `${user.id}/profile.${ext}`
            );

          await sb.storage
            .from('profile-photos')
            .remove(oldPaths);

          const path =
            `${user.id}/profile.${extension}`;

          const { error: uploadError } =
            await sb.storage
              .from('profile-photos')
              .upload(
                path,
                file,
                {
                  upsert: true,
                  contentType: file.type
                }
              );

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicData } =
            sb.storage
              .from('profile-photos')
              .getPublicUrl(path);

          photoUrl =
            `${publicData.publicUrl}?v=${Date.now()}`;
        }

        const payload = {
          id: user.id,
          display_name:
            document
              .getElementById('display_name')
              ?.value.trim() || '',

          license:
            document
              .getElementById('license')
              ?.value.trim() || '',

          jurisdiction:
            document
              .getElementById('jurisdiction')
              ?.value || '',

          zone:
            document
              .getElementById('zone')
              ?.value.trim() || '',

          modality:
            document
              .getElementById('modality')
              ?.value || '',

          orientation:
            document
              .getElementById('orientation')
              ?.value.trim() || '',

          population:
            selectedPopulation,

          whatsapp:
            document
              .getElementById('whatsapp')
              ?.value.trim() || '',

          bio:
            document
              .getElementById('bio')
              ?.value.trim() || '',

          is_public:
            document
              .getElementById('is_public')
              ?.checked || false,

          photo_url:
            photoUrl
        };

        const {
          data: savedProfile,
          error: saveError
        } = await sb
          .from('profiles')
          .upsert(payload)
          .select()
          .single();

        if (saveError) {
          throw saveError;
        }

        currentProfile = savedProfile;
        photoWasRemoved = false;

        if (photoUrl) {
          photoPreview.innerHTML = `
            <img
              src="${escapeHTML(photoUrl)}"
              alt="Foto de perfil"
              style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
            >
          `;

          showRemoveButton();

        } else {
          photoPreview.innerHTML = 'PS';

          const removeButton =
            document.getElementById('removePhoto');

          if (removeButton) {
            removeButton.remove();
          }
        }

        showMessage(
          'msg',
          'Perfil guardado correctamente.'
        );

      } catch (error) {
        console.error(
          'Error al guardar perfil:',
          error
        );

        if (
          error.code === '23505' ||
          error.message?.includes(
            'unique_license_jurisdiction'
          )
        ) {
          showMessage(
            'msg',
            'Esta matrícula ya está registrada en PsiCerca para esa jurisdicción. Si considerás que se trata de un error, contactanos.',
            true
          );

          return;
        }

        showMessage(
          'msg',
          error.message ||
            'No se pudo guardar el perfil.',
          true
        );
      }
    });

  } catch (error) {
    console.error(
      'Error en dashboard:',
      error
    );
  }
})();
