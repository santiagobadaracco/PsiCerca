(async () => {
  try {
    const user = await requireUser();
    if (!user) return;

    document.getElementById('welcome').textContent =
      `Sesión iniciada como ${user.email}`;

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

    // Datos iniciales provenientes del registro
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
      is_public: false
    };

    // Cargar datos en el formulario
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
        element.value = currentProfile[field] ?? '';
      }
    });

    const publicCheckbox = document.getElementById('is_public');

    if (publicCheckbox) {
      publicCheckbox.checked = !!currentProfile.is_public;
    }

    // Guardar perfil
    document
      .getElementById('profileForm')
      .addEventListener('submit', async e => {

        e.preventDefault();

        const button = e.target.querySelector('button');

        button.disabled = true;
        button.textContent = 'Guardando…';

        try {

          const payload = {
            id: user.id,
            display_name:
              document.getElementById('display_name').value.trim(),

            license:
              document.getElementById('license').value.trim(),

            jurisdiction:
              document.getElementById('jurisdiction').value,

            zone:
              document.getElementById('zone').value.trim(),

            modality:
              document.getElementById('modality').value,

            orientation:
              document.getElementById('orientation').value.trim(),

            population:
              document.getElementById('population').value.trim(),

            whatsapp:
              document.getElementById('whatsapp').value.trim(),

            bio:
              document.getElementById('bio').value.trim(),

            is_public:
              document.getElementById('is_public').checked,

            updated_at:
              new Date().toISOString()
          };

          const { error } = await sb
            .from('profiles')
            .upsert(payload, {
              onConflict: 'id'
            });

          if (error) {
            throw error;
          }

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

          button.disabled = false;
          button.textContent = 'Guardar cambios';

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
