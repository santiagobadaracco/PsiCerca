(async () => {
  try {
    const user = await requireUser();
    if (!user) return;

    document.getElementById('welcome').textContent =
      `Sesión iniciada como ${user.email}`;

    const sb = requireSupabase();

    let { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    // Si todavía no existe un perfil, lo creamos
    if (!profile) {
      const meta = user.user_metadata || {};

      const payload = {
        id: user.id,
        display_name: meta.full_name || '',
        license: meta.license || '',
        jurisdiction: meta.jurisdiction || ''
      };

      const res = await sb
        .from('profiles')
        .insert(payload)
        .select()
        .single();

      if (res.error) throw res.error;

      profile = res.data;
    }

    // Cargar datos del perfil en el formulario
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
        element.value = profile[field] ?? '';
      }
    });

    document.getElementById('is_public').checked =
      !!profile.is_public;

    // Guardar cambios
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
            display_name: document.getElementById('display_name').value.trim(),
            license: document.getElementById('license').value.trim(),
            jurisdiction: document.getElementById('jurisdiction').value,
            zone: document.getElementById('zone').value.trim(),
            modality: document.getElementById('modality').value,
            orientation: document.getElementById('orientation').value.trim(),
            population: document.getElementById('population').value.trim(),
            whatsapp: document.getElementById('whatsapp').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            is_public: document.getElementById('is_public').checked,
            updated_at: new Date().toISOString()
          };

          const { error } = await sb
            .from('profiles')
            .upsert(payload);

          if (error) throw error;

          showMessage(
            'msg',
            'Perfil guardado correctamente.'
          );

        } catch (error) {
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
    showMessage(
      'msg',
      error.message || 'Ocurrió un error.',
      true
    );
  }
})();
