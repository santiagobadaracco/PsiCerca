function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function loadProfiles() {
  const box = document.getElementById('results');
  const count = document.getElementById('resultCount');

  box.innerHTML = '<div class="empty">Buscando profesionales...</div>';

  const sb = requireSupabase();

  const { data: profiles, error: profilesError } = await sb
    .from('profiles')
    .select(`
      id,
      display_name,
      license,
      jurisdiction,
      modality,
      orientation,
      population,
      bio,
      photo_url
    `)
    .eq('is_public', true)
    .order('display_name', { ascending: true });

  if (profilesError) {
    console.error(profilesError);
    box.innerHTML = `
      <div class="empty">
        No se pudieron cargar los profesionales.
      </div>
    `;
    count.textContent = '';
    return;
  }

  if (!profiles || !profiles.length) {
    box.innerHTML = `
      <div class="empty">
        No hay profesionales publicados todavía.
      </div>
    `;
    count.textContent = '';
    return;
  }

  const profileIds = profiles.map(profile => profile.id);

  const { data: locations, error: locationsError } = await sb
    .from('professional_locations')
    .select(`
      profile_id,
      province,
      party,
      locality,
      neighborhood
    `)
    .in('profile_id', profileIds);

  if (locationsError) {
    console.error(locationsError);
  }

  const locationsByProfile = {};

  (locations || []).forEach(location => {

    if (!locationsByProfile[location.profile_id]) {
      locationsByProfile[location.profile_id] = [];
    }

    locationsByProfile[location.profile_id].push(location);

  });

  const q = normalizeText(
    document.getElementById('q').value
  );

  const zone = normalizeText(
    document.getElementById('zone').value
  );

  const modality =
    document.getElementById('modality').value;

  const population =
    normalizeText(
      document.getElementById('population').value
    );


  const filtered = profiles.filter(profile => {

    const profileLocations =
      locationsByProfile[profile.id] || [];


    /*
     * TEXTO BUSCABLE
     */

    const locationText = profileLocations
      .map(location => [
        location.province,
        location.party,
        location.locality,
        location.neighborhood
      ].join(' '))
      .join(' ');


    const searchableText = normalizeText([
      profile.display_name,
      profile.orientation,
      profile.population,
      locationText
    ].join(' '));


    /*
     * BÚSQUEDA GENERAL
     */

    const matchesQuery =
      !q || searchableText.includes(q);


    /*
     * FILTRO POR ZONA
     */

    const matchesZone =
      !zone ||
      profileLocations.some(location => {

        const completeLocation = normalizeText([
          location.province,
          location.party,
          location.locality,
          location.neighborhood
        ].join(' '));

        return completeLocation.includes(zone);

      });


    /*
     * FILTRO POR MODALIDAD
     */

    const matchesModality =
      !modality ||
      profile.modality === modality;


    /*
     * FILTRO POR POBLACIÓN
     */

    const profilePopulation =
      normalizeText(profile.population);

    const matchesPopulation =
      !population ||
      profilePopulation
        .split(',')
        .map(item => normalizeText(item))
        .some(item => item === population);


    return (
      matchesQuery &&
      matchesZone &&
      matchesModality &&
      matchesPopulation
    );

  });


  /*
   * CONTADOR
   */

  count.textContent =
    filtered.length === 1
      ? '1 profesional encontrado'
      : `${filtered.length} profesionales encontrados`;


  /*
   * SIN RESULTADOS
   */

  if (!filtered.length) {

    box.innerHTML = `
      <div class="empty">
        No encontramos profesionales con esos criterios.
      </div>
    `;

    return;
  }


  /*
   * TARJETAS
   */

  box.innerHTML = filtered.map(profile => {

    const initials =
      (profile.display_name || 'P')
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();


    /*
     * FOTO
     */

    const avatar = profile.photo_url
      ? `
        <img
          src="${escapeHTML(profile.photo_url)}"
          alt="${escapeHTML(profile.display_name)}"
          style="
            width:52px;
            height:52px;
            border-radius:50%;
            object-fit:cover;
          "
        >
      `
      : `
        <div class="avatar">
          ${escapeHTML(initials)}
        </div>
      `;


    /*
     * ZONAS
     */

    const profileLocations =
      locationsByProfile[profile.id] || [];


    const locationLabels =
      profileLocations.map(location => {

        if (location.neighborhood) {
          return location.neighborhood;
        }

        if (location.locality) {
          return location.locality;
        }

        if (location.party) {
          return location.party;
        }

        return location.province;

      });


    /*
     * CHIPS
     */

    const chips = [
      profile.orientation,
      profile.modality,
      profile.population,
      ...locationLabels
    ]
      .filter(Boolean)
      .map(item => `
        <span class="chip">
          ${escapeHTML(item)}
        </span>
      `)
      .join('');


    /*
     * TARJETA
     */

    return `
      <article class="pro-card">

        <div class="pro-top">

          ${avatar}

          <div>

            <h3>
              ${escapeHTML(
                profile.display_name ||
                'Profesional'
              )}
            </h3>

            <p>
              ${escapeHTML(
                profile.license || ''
              )}
            </p>

          </div>

        </div>


        <div class="chips">

          ${chips}

        </div>


        <p>

          ${escapeHTML(
            profile.bio ||
            'Profesional de la salud mental.'
          )}

        </p>


        <a
          class="btn primary full"
          href="profesional.html?id=${encodeURIComponent(profile.id)}"
        >
          Ver perfil
        </a>

      </article>
    `;

  }).join('');

}


/*
 * LIMPIAR FILTROS
 */

window.clearFilters = function () {

  document.getElementById('q').value = '';
  document.getElementById('zone').value = '';
  document.getElementById('modality').value = '';
  document.getElementById('population').value = '';

  loadProfiles();

};


loadProfiles();
