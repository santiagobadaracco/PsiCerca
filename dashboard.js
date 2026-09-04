;(async () => {
try {
const user = await requireUser();

```
if (!user) return;

const welcome = document.getElementById('welcome');

if (welcome) {
  welcome.textContent = 'Sesión iniciada como ' + user.email;
}

const sb = requireSupabase();

// ==============================
// BUSCAR PERFIL
// ==============================

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
// CARGAR DATOS
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

const publicCheckbox =
  document.getElementById('is_public');

if (publicCheckbox) {
  publicCheckbox.checked =
    !!currentProfile.is_public;
}

// ==============================
// FOTO
// ==============================

const photoInput =
  document.getElementById('photo');

const photoPreview =
  document.getElementById('photoPreview');

let photoWasRemoved = false;

function getInitials() {
  const nombre =
    currentProfile.display_name || 'PS';

  return nombre
    .split(' ')
    .filter(Boolean)
    .map(nombre => nombre.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function mostrarFoto(url) {
  if (!photoPreview) return;

  photoPreview.innerHTML = '';

  const imagen =
    document.createElement('img');

  imagen.src = url;
  imagen.alt = 'Foto de perfil';

  imagen.style.width = '100%';
  imagen.style.height = '100%';
  imagen.style.objectFit = 'cover';
  imagen.style.borderRadius = '50%';
  imagen.style.display = 'block';

  photoPreview.appendChild(imagen);
}

function mostrarIniciales() {
  if (!photoPreview) return;

  photoPreview.innerHTML = '';
  photoPreview.textContent = getInitials();
}

if (currentProfile.photo_url) {
  mostrarFoto(currentProfile.photo_url);
} else {
  mostrarIniciales();
}

// ==============================
// BOTÓN QUITAR FOTO
// ==============================

let removeButton =
  document.getElementById('removePhoto');

if (!removeButton && photoInput) {
  removeButton =
    document.createElement('button');

  removeButton.type = 'button';
  removeButton.id = 'removePhoto';
  removeButton.className =
    'btn secondary';

  removeButton.textContent =
    'Quitar foto';

  removeButton.style.marginTop =
    '10px';

  photoInput.parentElement.appendChild(
    removeButton
  );
}

if (removeButton) {
  removeButton.addEventListener(
    'click',
    () => {
      photoWasRemoved = true;

      if (photoInput) {
        photoInput.value = '';
      }

      mostrarIniciales();

      showMessage(
        'msg',
        'La foto se quitará al guardar los cambios.'
      );
    }
  );
}

// ==============================
// SELECCIONAR NUEVA FOTO
// ==============================

if (photoInput) {
  photoInput.addEventListener(
    'change',
    function () {
      const archivo = this.files[0];

      if (!archivo) return;

      photoWasRemoved = false;

      if (archivo.size > 2 * 1024 * 1024) {
        showMessage(
          'msg',
          'La foto no puede superar los 2 MB.',
          true
        );

        this.value = '';
        return;
      }

      const formatosPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (
        !formatosPermitidos.includes(
          archivo.type
        )
      ) {
        showMessage(
          'msg',
          'La foto debe ser JPG, PNG o WEBP.',
          true
        );

        this.value = '';
        return;
      }

      const lector = new FileReader();

      lector.onload = function (evento) {
        mostrarFoto(
          evento.target.result
        );
      };

      lector.readAsDataURL(archivo);
    }
  );
}

// ==============================
// FORMULARIO
// ==============================

const form =
  document.getElementById('profileForm');

if (!form) {
  throw new Error(
    'No se encontró el formulario del perfil.'
  );
}

// ==============================
// GUARDAR PERFIL
// ==============================

form.addEventListener(
  'submit',
  async function (event) {
    event.preventDefault();

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    if (button) {
      button.disabled = true;
      button.textContent = 'Guardando…';
    }

    try {
      let photoURL =
        currentProfile.photo_url || '';

      const archivo =
        photoInput &&
        photoInput.files &&
        photoInput.files[0];

      // ==============================
      // QUITAR FOTO
      // ==============================

      if (
        photoWasRemoved &&
        currentProfile.photo_url
      ) {
        const oldURL =
          currentProfile.photo_url;

        const marker =
          '/profile-photos/';

        const position =
          oldURL.indexOf(marker);

        if (position !== -1) {
          let oldPath =
            oldURL.substring(
              position + marker.length
            );

          oldPath =
            oldPath.split('?')[0];

          const deleteResult =
            await sb.storage
              .from('profile-photos')
              .remove([oldPath]);

          if (deleteResult.error) {
            throw deleteResult.error;
          }
        }

        photoURL = '';
      }

      // ==============================
      // SUBIR NUEVA FOTO
      // ==============================

      if (archivo) {
        const extension =
          archivo.name
            .split('.')
            .pop()
            .toLowerCase();

        const ruta =
          user.id +
          '/profile.' +
          extension;

        const extensiones = [
          'jpg',
          'jpeg',
          'png',
          'webp'
        ];

        const archivosAnteriores =
          extensiones.map(
            extensionAnterior =>
              user.id +
              '/profile.' +
              extensionAnterior
          );

        const deleteOld =
          await sb.storage
            .from('profile-photos')
            .remove(
              archivosAnteriores
            );

        if (deleteOld.error) {
          console.warn(
            'No se pudieron eliminar algunas fotos anteriores:',
            deleteOld.error
          );
        }

        const subida =
          await sb.storage
            .from('profile-photos')
            .upload(
              ruta,
              archivo,
              {
                cacheControl: '3600',
                upsert: true,
                contentType:
                  archivo.type
              }
            );

        if (subida.error) {
          throw subida.error;
        }

        const publicURL =
          sb.storage
            .from('profile-photos')
            .getPublicUrl(ruta);

        photoURL =
          publicURL.data.publicUrl +
          '?v=' +
          Date.now();
      }

      // ==============================
      // DATOS DEL PERFIL
      // ==============================

      const payload = {
        id: user.id,

        display_name:
          document
            .getElementById('display_name')
            .value
            .trim(),

        license:
          document
            .getElementById('license')
            .value
            .trim(),

        jurisdiction:
          document
            .getElementById('jurisdiction')
            .value,

        zone:
          document
            .getElementById('zone')
            .value
            .trim(),

        modality:
          document
            .getElementById('modality')
            .value,

        orientation:
          document
            .getElementById('orientation')
            .value
            .trim(),

        population:
          document
            .getElementById('population')
            .value
            .trim(),

        whatsapp:
          document
            .getElementById('whatsapp')
            .value
            .trim(),

        bio:
          document
            .getElementById('bio')
            .value
            .trim(),

        is_public:
          document
            .getElementById('is_public')
            .checked,

        photo_url:
          photoURL,

        updated_at:
          new Date().toISOString()
      };

      // ==============================
      // GUARDAR EN SUPABASE
      // ==============================

      const resultado =
        await sb
          .from('profiles')
          .upsert(
            payload,
            {
              onConflict: 'id'
            }
          );

      if (resultado.error) {
        throw resultado.error;
      }

      // ==============================
      // ACTUALIZAR ESTADO LOCAL
      // ==============================

      currentProfile.photo_url =
        photoURL;

      currentProfile.display_name =
        payload.display_name;

      currentProfile.is_public =
        payload.is_public;

      photoWasRemoved = false;

      if (photoURL) {
        mostrarFoto(photoURL);
      } else {
        mostrarIniciales();
      }

      showMessage(
        'msg',
        'Perfil guardado correctamente.'
      );

    } catch (error) {
      console.error(
        'Error guardando perfil:',
        error
      );

      showMessage(
        'msg',
        error.message ||
        'No se pudieron guardar los cambios.',
        true
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          'Guardar cambios';
      }
    }
  }
);
```

} catch (error) {
console.error(
'Error en dashboard:',
error
);

```
showMessage(
  'msg',
  error.message ||
  'Ocurrió un error.',
  true
);
```

}
})();

