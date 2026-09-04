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

  const { data, error } = await sb
    .from('profiles')
    .select(`
      id,
      display_name,
      license,
      jurisdiction,
      zone,
      modality,
      orientation,
      population,
      bio,
      photo_url
    `)
    .eq('is_public', true)
    .order('display_name', { ascending: true });

  if (error) {
    console.error(error);
    box.innerHTML = '<div class="empty">No se pudieron cargar los profesionales.</div>';
    count.textContent = '';
    return;
  }

  const q = normalizeText(document.getElementById('q').value);
  const zone = normalizeText(document.getElementById('zone').value);
  const modality = document.getElementById('modality').value;
  const population = normalizeText(document.getElementById('population').value);

  const filtered = data.filter(profile => {

    const searchableText = normalizeText([
      profile.display_name,
      profile.orientation,
      profile.population
    ].join(' '));

    const profileZone = normalizeText(profile.zone);
    const profilePopulation = normalizeText(profile.population);

    const matchesQuery =
      !q || searchableText.includes(q);

    const matchesZone =
      !zone || profileZone.includes(zone);

    const matchesModality =
      !modality || profile.modality === modality;

    const matchesPopulation =
      !population || profilePopulation
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

  count.textContent =
    filtered.length === 1
      ? '1 profesional encontrado'
      : `${filtered.length} profesionales encontrados`;

  if (!filtered.length) {
    box.innerHTML = `
      <div class="empty">
        No encontramos profesionales con esos criterios.
      </div>
    `;
    return;
  }

  box.innerHTML = filtered.map(profile => {

    const initials = (profile.display_name || 'P')
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const avatar = profile.photo_url
      ? `
        <img
          src="${escapeHTML(profile.photo_url)}"
          alt="${escapeHTML(profile.display_name)}"
          style="width:52px;height:52px;border-radius:50%;object-fit:cover;"
        >
      `
      : `
        <div class="avatar">
          ${escapeHTML(initials)}
        </div>
      `;

    const chips = [
      profile.orientation,
      profile.zone,
      profile.modality,
      profile.population
    ]
      .filter(Boolean)
      .map(item => `
        <span class="chip">
          ${escapeHTML(item)}
        </span>
      `)
      .join('');

    return `
      <article class="pro-card">

        <div class="pro-top">

          ${avatar}

          <div>
            <h3>
              ${escapeHTML(profile.display_name || 'Profesional')}
            </h3>

            <p>
              ${escapeHTML(profile.license || '')}
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

window.clearFilters = function () {

  document.getElementById('q').value = '';
  document.getElementById('zone').value = '';
  document.getElementById('modality').value = '';
  document.getElementById('population').value = '';

  loadProfiles();
};

loadProfiles();
