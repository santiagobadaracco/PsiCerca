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

  box.innerHTML =
    '<div class="empty">Buscando profesionales...</div>';

  const sb = requireSupabase();


  /*
   * =====================================================
   * CARGAR PROFESIONALES
   * =====================================================
   */

  const {
    data: profiles,
    error: profilesError
  } = await sb
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
      photo_url,
      zone
    `)
    .eq('is_public', true);


  if (profilesError) {

    console.error(
      'Error cargando profesionales:',
      profilesError
    );

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


  /*
   * =====================================================
   * PRO
   * =====================================================
   *
   * PRO puede venir de:
   *
   * 1. Suscripción PRO paga activa
   * 2. Membresía / cortesía PRO vigente
   *
   */


  const profileIds =
    profiles.map(profile => profile.id);


  const {
    data: subscriptions,
    error: subscriptionsError
  } = await sb
    .from('professional_subscriptions')
    .select(`
      profile_id,
      plan,
      status
    `)
    .in(
      'profile_id',
      profileIds
    )
    .eq(
      'plan',
      'pro'
    )
    .eq(
      'status',
      'active'
    );


  if (subscriptionsError) {

    console.error(
      'Error cargando suscripciones PRO:',
      subscriptionsError
    );

  }


  /*
   * MEMBRESÍAS PRO
   */

  const {
    data: courtesyPro,
    error: courtesyProError
  } = await sb
    .from('professional_courtesy_pro')
    .select(`
      profile_id,
      expires_at,
      revoked_at
    `)
    .in(
      'profile_id',
      profileIds
    )
    .is(
      'revoked_at',
      null
    );


  if (courtesyProError) {

    console.error(
      'Error cargando membresías PRO:',
      courtesyProError
    );

  }


  const proProfileIds =
    new Set();


  /*
   * PRO PAGO
   */

  (subscriptions || []).forEach(
    subscription => {

      proProfileIds.add(
        subscription.profile_id
      );

    }
  );


  /*
   * PRO CORTESÍA
   */

  const now =
    new Date();


  (courtesyPro || []).forEach(
    courtesy => {

      const active =
        !courtesy.expires_at ||
        new Date(
          courtesy.expires_at
        ) > now;


      if (active) {

        proProfileIds.add(
          courtesy.profile_id
        );

      }

    }
  );


  /*
   * =====================================================
   * FILTROS
   * =====================================================
   */

  const q =
    normalizeText(
      document.getElementById('q').value
    );


  const zone =
    normalizeText(
      document.getElementById('zone').value
    );


  const modality =
    document.getElementById(
      'modality'
    ).value;


  const population =
    normalizeText(
      document.getElementById(
        'population'
      ).value
    );


  /*
   * =====================================================
   * FILTRAR
   * =====================================================
   */

  const filtered =
    profiles.filter(profile => {


      /*
       * ZONA
       *
       * IMPORTANTE:
       *
       * La zona actualmente se guarda
       * en profiles.zone
       */

      const profileZone =
        normalizeText(
          profile.zone
        );


      /*
       * TEXTO BUSCABLE
       */

      const searchableText =
        normalizeText([
          profile.display_name,
          profile.orientation,
          profile.population,
          profile.zone
        ].join(' '));


      /*
       * BÚSQUEDA GENERAL
       */

      const matchesQuery =
        !q ||
        searchableText.includes(q);


      /*
       * FILTRO ZONA
       */

      const matchesZone =
        !zone ||
        profileZone.includes(zone);


      /*
       * FILTRO MODALIDAD
       */

      const matchesModality =
        !modality ||
        profile.modality === modality;


      /*
       * FILTRO POBLACIÓN
       */

      const profilePopulation =
        normalizeText(
          profile.population
        );


      const matchesPopulation =
        !population ||
        profilePopulation
          .split(',')
          .map(
            item =>
              normalizeText(item)
          )
          .some(
            item =>
              item === population
          );


      return (
        matchesQuery &&
        matchesZone &&
        matchesModality &&
        matchesPopulation
      );

    });


  /*
   * =====================================================
   * ORDEN ALEATORIO
   * =====================================================
   *
   * Los profesionales no aparecen
   * en orden alfabético.
   *
   * Cada vez que se carga el directorio
   * se mezcla la lista.
   *
   */

  filtered.sort(
    () => Math.random() - 0.5
  );


  /*
   * =====================================================
   * CONTADOR
   * =====================================================
   */

  count.textContent =
    filtered.length === 1
      ? '1 profesional encontrado'
      : `${filtered.length} profesionales encontrados`;


  /*
   * =====================================================
   * SIN RESULTADOS
   * =====================================================
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
   * =====================================================
   * TARJETAS
   * =====================================================
   */

  box.innerHTML =
    filtered.map(profile => {


      /*
       * INICIALES
       */

      const initials =
        (profile.display_name || 'P')
          .split(' ')
          .map(
            word =>
              word[0]
          )
          .slice(0, 2)
          .join('')
          .toUpperCase();


      /*
       * FOTO
       */

      const avatar =
        profile.photo_url
          ? `
            <img
              src="${escapeHTML(
                profile.photo_url
              )}"
              alt="${escapeHTML(
                profile.display_name
              )}"
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
              ${escapeHTML(
                initials
              )}
            </div>
          `;


      /*
       * DISTINTIVO PRO
       */

      const proBadge =
        proProfileIds.has(
          profile.id
        )
          ? `
            <span
              style="
                display:inline-flex;
                align-items:center;
                margin-left:7px;
                padding:3px 8px;
                border-radius:999px;
                background:#e8f5f2;
                color:#287d72;
                font-size:11px;
                font-weight:700;
                letter-spacing:.03em;
                vertical-align:middle;
              "
            >
              ✦ PRO
            </span>
          `
          : '';


      /*
       * ZONA
       */

      const zoneLabel =
        profile.zone
          ? `
            <span class="chip">
              ${escapeHTML(
                profile.zone
              )}
            </span>
          `
          : '';


      /*
       * CHIPS
       */

      const chips = [

        profile.orientation,

        profile.modality,

        profile.population

      ]
        .filter(Boolean)
        .map(
          item => `
            <span class="chip">
              ${escapeHTML(
                item
              )}
            </span>
          `
        )
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

                ${proBadge}

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

            ${zoneLabel}

          </div>


          <p>

            ${escapeHTML(
              profile.bio ||
              'Profesional de la salud mental.'
            )}

          </p>


          <a
            class="btn primary full"
            href="profesional.html?id=${encodeURIComponent(
              profile.id
            )}"
          >
            Ver perfil
          </a>

        </article>
      `;

    })
    .join('');

}


/*
 * =====================================================
 * LIMPIAR FILTROS
 * =====================================================
 */

window.clearFilters =
  function () {

    document.getElementById(
      'q'
    ).value = '';

    document.getElementById(
      'zone'
    ).value = '';

    document.getElementById(
      'modality'
    ).value = '';

    document.getElementById(
      'population'
    ).value = '';

    loadProfiles();

  };


/*
 * =====================================================
 * CARGA INICIAL
 * =====================================================
 */

loadProfiles();
