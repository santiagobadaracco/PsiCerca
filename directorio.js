async function loadProfiles() {
  const box = document.getElementById('results');
  const count = document.getElementById('resultCount');

  box.innerHTML = '<div class="empty">Buscando…</div>';

  if (count) {
    count.textContent = '';
  }

  try {
    const sb = requireSupabase();

    let query = sb
      .from('profiles')
      .select(
        'id,display_name,license,jurisdiction,zone,modality,orientation,population,bio,photo_url'
      )
      .eq('is_public', true)
      .order('display_name');

    const q = document
      .getElementById('q')
      .value
      .trim();

    const zone = document
      .getElementById('zone')
      .value
      .trim();

    const modality = document
      .getElementById('modality')
      .value;

    const population = document
      .getElementById('population')
      .value;

    // ==============================
    // BÚSQUEDA GENERAL
    // ==============================

    if (q) {
      query = query.or(
        `display_name.ilike.%${q}%,orientation.ilike.%${q}%,population.ilike.%${q}%`
      );
    }

    // ==============================
    // ZONA
    // ==============================

    if (zone) {
      query = query.ilike(
        'zone',
        `%${zone}%`
      );
    }

    // ==============================
    // MODALIDAD
    // ==============================

    if (modality) {
      query = query.eq(
        'modality',
        modality
      );
    }

    // ==============================
    // POBLACIÓN
    // ==============================

    if (population) {
      query = query.ilike(
        'population',
        `%${population}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // ==============================
    // CONTADOR
    // ==============================

    if (count) {
      if (data.length === 1) {
        count.textContent =
          '1 profesional encontrado';
      } else {
        count.textContent =
          `${data.length} profesionales encontrados`;
      }
    }

    // ==============================
    // SIN RESULTADOS
    // ==============================

    if (!data.length) {
      box.innerHTML = `
        <div class="empty">
          No encontramos profesionales
          que coincidan con tu búsqueda.
        </div>
      `;

      return;
    }

    // ==============================
    // TARJETAS
    // ==============================

    box.innerHTML = data.map(p => {

      const initials =
        (p.display_name || 'PS')
          .split(' ')
          .filter(Boolean)
          .map(x => x[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

      const avatar = p.photo_url
        ? `
          <div
            class="avatar"
            style="overflow:hidden;"
          >
            <img
              src="${escapeHTML(p.photo_url)}"
              alt="Foto de ${escapeHTML(
                p.display_name || 'profesional'
              )}"
              style="
                width:100%;
                height:100%;
                object-fit:cover;
                border-radius:50%;
                display:block;
              "
            >
          </div>
        `
        : `
          <div class="avatar">
            ${escapeHTML(initials)}
          </div>
        `;

      return `
        <article class="pro-card">

          <div class="pro-top">

            ${avatar}

            <div>

              <h3>
                ${escapeHTML(
                  p.display_name ||
                  'Profesional'
                )}
              </h3>

              <div class="small">
                Matrícula:
                ${escapeHTML(
                  p.license || '—'
                )}
              </div>

            </div>

          </div>


          <div class="chips">

            ${
              [
                p.orientation,
                p.population,
                p.modality,
                p.zone
              ]
              .filter(Boolean)
              .map(
                x =>
                  `<span class="chip">
                    ${escapeHTML(x)}
                  </span>`
              )
              .join('')
            }

          </div>


          <p>
            ${escapeHTML(
              (p.bio || '').slice(0, 180)
            )}
            ${
              (p.bio || '').length > 180
                ? '…'
                : ''
            }
          </p>


          <a
            class="btn secondary full"
            href="profesional.html?id=${encodeURIComponent(
              p.id
            )}"
          >
            Ver perfil
          </a>

        </article>
      `;

    }).join('');

  } catch (err) {

    console.error(
      'Error cargando directorio:',
      err
    );

    if (count) {
      count.textContent = '';
    }

    box.innerHTML = `
      <div class="empty">

        No pudimos cargar el directorio.

        <br>

        <span class="small">
          ${escapeHTML(
            err.message || 'Error'
          )}
        </span>

      </div>
    `;
  }
}


// ==============================
// LIMPIAR FILTROS
// ==============================

function clearFilters() {

  document.getElementById('q').value = '';
  document.getElementById('zone').value = '';
  document.getElementById('modality').value = '';
  document.getElementById('population').value = '';

  loadProfiles();
}


// ==============================
// CARGA INICIAL
// ==============================

loadProfiles();
