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

    const deleteAccountButton =
      document.getElementById('deleteAccount');

    const deleteAccountMsg =
      document.getElementById('deleteAccountMsg');

    const licensesContainer =
      document.getElementById('licensesContainer');

    const addLicenseButton =
      document.getElementById('addLicense');

    const locationsContainer =
      document.getElementById('locationsContainer');

    const addLocationButton =
      document.getElementById('addLocation');

    const fields = [
      'display_name',
      'license',
      'jurisdiction',
      'modality',
      'orientation',
      'bio',
      'is_public'
    ];

    let currentProfile = null;
    let photoWasRemoved = false;

    const CABA_BARRIOS = [
      'Agronomía',
      'Almagro',
      'Balvanera',
      'Barracas',
      'Belgrano',
      'Boedo',
      'Caballito',
      'Chacarita',
      'Coghlan',
      'Colegiales',
      'Constitución',
      'Flores',
      'Floresta',
      'La Boca',
      'La Paternal',
      'Liniers',
      'Mataderos',
      'Monte Castro',
      'Monserrat',
      'Nueva Pompeya',
      'Núñez',
      'Palermo',
      'Parque Avellaneda',
      'Parque Chacabuco',
      'Parque Chas',
      'Parque Patricios',
      'Puerto Madero',
      'Recoleta',
      'Retiro',
      'Saavedra',
      'San Cristóbal',
      'San Nicolás',
      'San Telmo',
      'Vélez Sarsfield',
      'Versalles',
      'Villa Crespo',
      'Villa del Parque',
      'Villa Devoto',
      'Villa General Mitre',
      'Villa Lugano',
      'Villa Luro',
      'Villa Ortúzar',
      'Villa Pueyrredón',
      'Villa Real',
      'Villa Riachuelo',
      'Villa Santa Rita',
      'Villa Soldati',
      'Villa Urquiza'
    ];

    welcome.textContent =
      user.email || 'Profesional';


    // ============================================================
    // SUSCRIPCIÓN
    // ============================================================

    async function loadSubscription() {

      const subscriptionTitle =
        document.getElementById(
          'subscriptionTitle'
        );

      const subscriptionDescription =
        document.getElementById(
          'subscriptionDescription'
        );

      const subscriptionLabel =
        document.getElementById(
          'subscriptionLabel'
        );

      const subscriptionButton =
        document.getElementById(
          'subscriptionButton'
        );

      const subscriptionDetails =
        document.getElementById(
          'subscriptionDetails'
        );

      const consultasContent =
        document.getElementById(
          'consultasContent'
        );

      const availabilityContent =
        document.getElementById(
          'availabilityContent'
        );

      const statisticsContent =
        document.getElementById(
          'statisticsContent'
        );


      if (subscriptionTitle) {
        subscriptionTitle.textContent =
          'Cargando…';
      }


      const {
        data: subscription,
        error: subscriptionError
      } =
        await sb
          .from('professional_subscriptions')
          .select(`
            plan,
            status,
            started_at,
            expires_at
          `)
          .eq('profile_id', user.id)
          .maybeSingle();


      if (subscriptionError) {
        console.error(
          'Error al cargar suscripción:',
          subscriptionError
        );

        if (subscriptionTitle) {
          subscriptionTitle.textContent =
            'No se pudo cargar el estado';
        }

        if (subscriptionDescription) {
          subscriptionDescription.textContent =
            'Intentá recargar la página.';
        }

        return;
      }


      /*
       * Si por alguna razón una cuenta profesional
       * existente no tiene todavía una fila de suscripción,
       * la consideramos FREE desde el punto de vista visual.
       *
       * No creamos filas desde el frontend.
       */

      const plan =
        subscription?.plan || 'free';

      const status =
        subscription?.status || 'active';

      const expiresAt =
        subscription?.expires_at
          ? new Date(subscription.expires_at)
          : null;


      const isExpired =
        expiresAt &&
        expiresAt.getTime() <= Date.now();


      const isPro =
        plan === 'pro' &&
        status === 'active' &&
        !isExpired;


      // ==========================================================
      // FREE
      // ==========================================================

      if (!isPro) {

        if (subscriptionLabel) {
          subscriptionLabel.textContent =
            'PLAN ACTUAL';
        }

        if (subscriptionTitle) {
          subscriptionTitle.textContent =
            'PsiCerca FREE';
        }

        if (subscriptionDescription) {

          if (
            plan === 'pro' &&
            isExpired
          ) {

            subscriptionDescription.textContent =
              'Tu suscripción PRO está vencida. Podés renovarla desde Suscripción.';

          } else if (
            plan === 'pro' &&
            status !== 'active'
          ) {

            subscriptionDescription.textContent =
              'Tu suscripción PRO no está activa actualmente.';

          } else {

            subscriptionDescription.textContent =
              'Tenés acceso a las herramientas básicas de PsiCerca.';

          }

        }

        if (subscriptionButton) {
          subscriptionButton.textContent =
            'Conocer PsiCerca PRO';

          subscriptionButton.href =
            '#suscripcion';
        }


        if (subscriptionDetails) {

          subscriptionDetails.innerHTML = `

            <h3>
              PsiCerca FREE
            </h3>

            <p class="small">
              Tu perfil profesional puede aparecer en el directorio público
              y recibir contactos de pacientes registrados.
            </p>

            <div
              style="
                margin-top:20px;
                padding:18px;
                border:1px solid var(--line);
                border-radius:14px;
              "
            >

              <strong>
                ⭐ PsiCerca PRO
              </strong>

              <p class="small">
                Desbloqueá herramientas adicionales para mejorar tu presencia
                dentro de PsiCerca y conocer el rendimiento de tu perfil.
              </p>

              <a
                class="btn primary"
                href="#suscripcion"
              >
                Conocer PsiCerca PRO
              </a>

            </div>

          `;

        }


        if (consultasContent) {

          consultasContent.innerHTML = `

            <strong>
              🔒 Disponible con PsiCerca PRO
            </strong>

            <p class="small">
              Recibí y gestioná consultas directamente desde PsiCerca,
              sin necesidad de compartir automáticamente tus datos personales.
            </p>

            <a
              class="btn primary"
              href="#suscripcion"
            >
              Conocer PsiCerca PRO
            </a>

          `;

        }


        if (availabilityContent) {

          availabilityContent.innerHTML = `

            <strong>
              🔒 Disponible con PsiCerca PRO
            </strong>

            <p class="small">
              Informá si estás tomando pacientes, si tenés disponibilidad
              limitada o si trabajás con lista de espera.
            </p>

            <a
              class="btn primary"
              href="#suscripcion"
            >
              Conocer PsiCerca PRO
            </a>

          `;

        }


        if (statisticsContent) {

          statisticsContent.innerHTML = `

            <strong>
              🔒 Disponible con PsiCerca PRO
            </strong>

            <p class="small">
              Consultá visitas a tu perfil, apariciones en búsquedas,
              consultas y otras métricas.
            </p>

            <a
              class="btn primary"
              href="#suscripcion"
            >
              Conocer PsiCerca PRO
            </a>

          `;

        }

        return;
      }


      // ==========================================================
      // PRO
      // ==========================================================

      if (subscriptionLabel) {
        subscriptionLabel.textContent =
          'PLAN ACTUAL';
      }

      if (subscriptionTitle) {
        subscriptionTitle.textContent =
          '⭐ PsiCerca PRO';
      }

      if (subscriptionDescription) {

        if (expiresAt) {

          const formattedDate =
            expiresAt.toLocaleDateString(
              'es-AR',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }
            );

          subscriptionDescription.textContent =
            `Tu suscripción PRO está activa. Renovación: ${formattedDate}.`;

        } else {

          subscriptionDescription.textContent =
            'Tu suscripción PRO está activa.';

        }

      }

      if (subscriptionButton) {
        subscriptionButton.textContent =
          'Administrar suscripción';

        subscriptionButton.href =
          '#suscripcion';
      }


      // ==========================================================
      // DETALLE PRO
      // ==========================================================

      if (subscriptionDetails) {

        let renewalText =
          'Suscripción activa.';

        if (expiresAt) {

          renewalText =
            `Próxima renovación: ${
              expiresAt.toLocaleDateString(
                'es-AR',
                {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }
              )
            }.`;

        }

        subscriptionDetails.innerHTML = `

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:20px;
              flex-wrap:wrap;
            "
          >

            <div>

              <span class="eyebrow">
                PLAN ACTUAL
              </span>

              <h3 style="margin:6px 0;">
                ⭐ PsiCerca PRO
              </h3>

              <p class="small">
                ${escapeHTML(renewalText)}
              </p>

            </div>

            <span
              style="
                display:inline-flex;
                align-items:center;
                padding:7px 12px;
                border-radius:999px;
                border:1px solid var(--line);
                font-size:13px;
                font-weight:600;
              "
            >
              Activa
            </span>

          </div>


          <div
            style="
              margin-top:24px;
              display:grid;
              grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
              gap:14px;
            "
          >

            <div
              style="
                padding:18px;
                border:1px solid var(--line);
                border-radius:14px;
              "
            >

              <strong>
                ⭐ Mayor visibilidad
              </strong>

              <p class="small">
                Distintivo PRO y mayor presencia dentro de las herramientas
                de descubrimiento de PsiCerca.
              </p>

            </div>


            <div
              style="
                padding:18px;
                border:1px solid var(--line);
                border-radius:14px;
              "
            >

              <strong>
                📩 Consultas
              </strong>

              <p class="small">
                Recibí consultas de personas interesadas directamente
                dentro de la plataforma.
              </p>

            </div>


            <div
              style="
                padding:18px;
                border:1px solid var(--line);
                border-radius:14px;
              "
            >

              <strong>
                🗓️ Disponibilidad
              </strong>

              <p class="small">
                Mostrá de forma clara si actualmente estás tomando pacientes.
              </p>

            </div>


            <div
              style="
                padding:18px;
                border:1px solid var(--line);
                border-radius:14px;
              "
            >

              <strong>
                📊 Estadísticas
              </strong>

              <p class="small">
                Conocé el rendimiento de tu perfil dentro de PsiCerca.
              </p>

            </div>

          </div>


          <div
            style="
              margin-top:24px;
              padding-top:20px;
              border-top:1px solid var(--line);
            "
          >

            <p class="small">
              La condición PRO mejora las herramientas y la visibilidad
              dentro de la plataforma. No representa una certificación
              ni implica una valoración superior de la calidad clínica
              del profesional.
            </p>

          </div>

        `;

      }


      // ==========================================================
      // CONSULTAS PRO
      // ==========================================================

      if (consultasContent) {

        consultasContent.innerHTML = `

          <strong>
            📩 Consultas
          </strong>

          <p class="small">
            Próximamente vas a poder recibir y gestionar consultas
            directamente desde PsiCerca.
          </p>

          <div
            style="
              margin-top:16px;
              padding:16px;
              border:1px solid var(--line);
              border-radius:12px;
            "
          >

            <span class="small">
              Tu acceso PRO está activo.
            </span>

            <p
              class="small"
              style="margin-bottom:0;"
            >
              El módulo de consultas todavía está en desarrollo.
            </p>

          </div>

        `;

      }


      // ==========================================================
      // DISPONIBILIDAD PRO
      // ==========================================================

      if (availabilityContent) {

        availabilityContent.innerHTML = `

          <strong>
            🗓️ Disponibilidad
          </strong>

          <p class="small">
            Próximamente vas a poder configurar tu estado de disponibilidad,
            modalidad y horarios generales.
          </p>

          <div
            style="
              margin-top:16px;
              padding:16px;
              border:1px solid var(--line);
              border-radius:12px;
            "
          >

            <span class="small">
              Tu acceso PRO está activo.
            </span>

            <p
              class="small"
              style="margin-bottom:0;"
            >
              El módulo de disponibilidad todavía está en desarrollo.
            </p>

          </div>

        `;

      }


      // ==========================================================
      // ESTADÍSTICAS PRO
      // ==========================================================

      if (statisticsContent) {

        statisticsContent.innerHTML = `

          <strong>
            📊 Estadísticas
          </strong>

          <p class="small">
            Próximamente vas a poder consultar las métricas de rendimiento
            de tu perfil profesional.
          </p>

          <div
            style="
              margin-top:16px;
              padding:16px;
              border:1px solid var(--line);
              border-radius:12px;
            "
          >

            <span class="small">
              Tu acceso PRO está activo.
            </span>

            <p
              class="small"
              style="margin-bottom:0;"
            >
              El módulo de estadísticas todavía está en desarrollo.
            </p>

          </div>

        `;

      }

    }


    // ============================================================
    // CARGAR SUSCRIPCIÓN
    // ============================================================

    loadSubscription().catch(error => {

      console.error(
        'Error inesperado al cargar la suscripción:',
        error
      );

    });


    // ============================================================
    // CONTRATAR PSI CERCA PRO
    // ============================================================

    async function startProSubscription() {

      const button =
        document.getElementById(
          'upgradeProButton'
        );


      if (!button) {
        return;
      }


      button.disabled =
        true;

      button.textContent =
        'Preparando pago...';


      try {

        const {
          data: { session }
        } =
          await sb.auth.getSession();


        if (!session) {

          window.location.href =
            'login.html';

          return;

        }


        const response =
          await fetch(
            `${window.PSICERCA_CONFIG.SUPABASE_URL}/functions/v1/create-pro-subscription`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                'Authorization':
                  `Bearer ${session.access_token}`
              }
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          !result.success ||
          !result.checkout_url
        ) {

          console.error(
            'Respuesta de Mercado Pago:',
            result
          );

          throw new Error(
            result.error ||
            'No se pudo iniciar la suscripción.'
          );

        }


        // Ir al checkout de Mercado Pago

        window.location.href =
          result.checkout_url;


      } catch (error) {

        console.error(
          'Error al iniciar suscripción PRO:',
          error
        );


        alert(
          error.message ||
          'No se pudo iniciar el proceso de pago.'
        );


        button.disabled =
          false;

        button.textContent =
          'Contratar PsiCerca PRO';

      }

    }


    // ============================================================
    // CONECTAR BOTÓN DE CONTRATACIÓN
    // ============================================================

    const upgradeProButton =
      document.getElementById(
        'upgradeProButton'
      );


    if (upgradeProButton) {

      upgradeProButton.addEventListener(
        'click',
        startProSubscription
      );

    }


    // ============================================================
    // NAVEGACIÓN INTERNA
    // ============================================================

    /*
     * Esta navegación utiliza delegación de eventos.
     *
     * Es importante porque algunos botones de PRO se crean
     * dinámicamente después de cargar la suscripción.
     */

    document.addEventListener(
      'click',
      event => {

        const element =
          event.target.closest(
            'a, button'
          );

        if (!element) {
          return;
        }


        const href =
          element.getAttribute('href');


        const text =
          typeof normalizeText === 'function'
            ? normalizeText(element.textContent)
            : element.textContent
                .toLowerCase()
                .trim();


        const isProButton =
          text.includes(
            'conoce psicerca pro'
          );


        const isSubscriptionLink =
          href === '#suscripcion';


        if (
          !isProButton &&
          !isSubscriptionLink
        ) {
          return;
        }


        const target =
          document.getElementById(
            'suscripcion'
          );


        if (!target) {
          return;
        }


        event.preventDefault();


        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });


        /*
         * Actualizamos también la URL para que el estado
         * de navegación sea coherente sin recargar la página.
         */

        if (
          window.history &&
          window.history.replaceState
        ) {

          window.history.replaceState(
            null,
            '',
            '#suscripcion'
          );

        }

      }
    );


    // ============================================================
    // ELIMINAR CUENTA
    // ============================================================

    if (deleteAccountButton) {

      deleteAccountButton.addEventListener(
        'click',
        async () => {

          const firstConfirmation =
            confirm(
              '¿Estás seguro de que querés eliminar tu cuenta de PsiCerca?\n\n' +
              'Se eliminarán permanentemente tu perfil profesional, matrículas, zonas de atención, contacto y demás datos asociados.\n\n' +
              'Esta acción NO se puede deshacer.'
            );

          if (!firstConfirmation) {
            return;
          }


          const confirmationText =
            prompt(
              'Para confirmar la eliminación, escribí exactamente:\n\nELIMINAR'
            );


          if (confirmationText !== 'ELIMINAR') {

            if (deleteAccountMsg) {

              showMessage(
                'deleteAccountMsg',
                'Eliminación cancelada.',
                true
              );

            }

            return;

          }


          try {

            deleteAccountButton.disabled =
              true;

            deleteAccountButton.textContent =
              'Eliminando cuenta…';


            if (deleteAccountMsg) {

              showMessage(
                'deleteAccountMsg',
                'Eliminando tu cuenta...'
              );

            }


            // ======================================================
            // ELIMINAR FOTO DEL STORAGE
            // ======================================================

            const extensions = [
              'jpg',
              'jpeg',
              'png',
              'webp'
            ];


            const photoPaths =
              extensions.map(
                extension =>
                  `${user.id}/profile.${extension}`
              );


            const {
              error: photoDeleteError
            } =
              await sb.storage
                .from('profile-photos')
                .remove(photoPaths);


            if (photoDeleteError) {

              console.warn(
                'No se pudo eliminar la foto del perfil:',
                photoDeleteError
              );

            }


            // ======================================================
            // ELIMINAR CUENTA
            // ======================================================

            const {
              error: deleteError
            } =
              await sb.rpc(
                'delete_my_account'
              );


            if (deleteError) {

              throw deleteError;

            }


            // ======================================================
            // CERRAR SESIÓN
            // ======================================================

            await sb.auth.signOut();


            window.location.href =
              'index.html';

          } catch (error) {

            console.error(
              'Error al eliminar la cuenta:',
              error
            );


            deleteAccountButton.disabled =
              false;

            deleteAccountButton.textContent =
              'Eliminar mi cuenta';


            if (deleteAccountMsg) {

              showMessage(
                'deleteAccountMsg',
                'No se pudo eliminar la cuenta. Intentá nuevamente.',
                true
              );

            }

          }

        }
      );

    }


    // ============================================================
    // CARGAR PERFIL
    // ============================================================

    const {
      data: profile,
      error: profileError
    } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();


    if (profileError) {
      throw profileError;
    }


    currentProfile = profile;


    // ============================================================
    // ACTUALIZAR SALUDO
    // ============================================================

    if (
      profile?.display_name &&
      welcome
    ) {

      welcome.textContent =
        `Hola, ${profile.display_name} 👋`;

    }


    // ============================================================
    // CARGAR CONTACTO PRIVADO
    // ============================================================

    const {
      data: contact,
      error: contactError
    } =
      await sb
        .from('professional_contacts')
        .select('whatsapp')
        .eq('profile_id', user.id)
        .maybeSingle();


    if (contactError) {
      throw contactError;
    }


    // ============================================================
    // CARGAR DATOS BÁSICOS
    // ============================================================

    if (profile) {

      fields.forEach(field => {

        const element =
          document.getElementById(field);

        if (!element) return;


        if (element.type === 'checkbox') {

          element.checked =
            Boolean(profile[field]);

        } else {

          element.value =
            profile[field] || '';

        }

      });


      // ==========================================================
      // WHATSAPP PRIVADO
      // ==========================================================

      const whatsappField =
        document.getElementById('whatsapp');


      if (whatsappField) {

        whatsappField.value =
          contact?.whatsapp || '';

      }


      // ==========================================================
      // POBLACIÓN
      // ==========================================================

      const savedPopulation =
        profile.population || '';


      const selectedPopulation =
        savedPopulation
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);


      document
        .querySelectorAll('.population-option')
        .forEach(option => {

          option.checked =
            selectedPopulation.includes(
              option.value
            );

        });


      // ==========================================================
      // FOTO
      // ==========================================================

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


    // ============================================================
    // POBLACIÓN
    // ============================================================

    function updatePopulationValue() {

      const selected =
        Array.from(
          document.querySelectorAll(
            '.population-option:checked'
          )
        ).map(option => option.value);


      const populationField =
        document.getElementById(
          'population'
        );


      if (populationField) {

        populationField.value =
          selected.join(', ');

      }

    }


    document
      .querySelectorAll('.population-option')
      .forEach(option => {

        option.addEventListener(
          'change',
          updatePopulationValue
        );

      });


    updatePopulationValue();


    // ============================================================
    // GEOGRAFÍA — API GEOREF
    // ============================================================

    async function georef(url) {

      const response =
        await fetch(url);


      if (!response.ok) {

        throw new Error(
          'No se pudo cargar la información geográfica.'
        );

      }


      return await response.json();

    }


    async function loadProvinces(select) {

      select.innerHTML = `
        <option value="">
          Seleccioná una provincia
        </option>
      `;


      const data =
        await georef(
          'https://apis.datos.gob.ar/georef/api/provincias?orden=nombre'
        );


      data.provincias.forEach(province => {

        const option =
          document.createElement('option');


        option.value =
          province.nombre;


        option.dataset.id =
          province.id;


        option.textContent =
          province.nombre;


        select.appendChild(option);

      });

    }


    async function loadDepartments(
      provinceId,
      select
    ) {

      select.innerHTML = `
        <option value="">
          Cargando partidos…
        </option>
      `;


      select.disabled = true;


      if (!provinceId) {

        select.innerHTML = `
          <option value="">
            Seleccioná un partido
          </option>
        `;

        return;

      }


      const data =
        await georef(
          `https://apis.datos.gob.ar/georef/api/departamentos?provincia=${encodeURIComponent(provinceId)}&max=500&orden=nombre`
        );


      select.innerHTML = `
        <option value="">
          Seleccioná un partido
        </option>
      `;


      data.departamentos.forEach(department => {

        const option =
          document.createElement('option');


        option.value =
          department.nombre;


        option.dataset.id =
          department.id;


        option.textContent =
          department.nombre;


        select.appendChild(option);

      });


      select.disabled = false;

    }


    async function loadLocalities(
      provinceId,
      departmentId,
      select
    ) {

      select.innerHTML = `
        <option value="">
          Cargando localidades…
        </option>
      `;


      select.disabled = true;


      if (!provinceId || !departmentId) {

        select.innerHTML = `
          <option value="">
            Seleccioná una localidad
          </option>
        `;

        return;

      }


      const data =
        await georef(
          `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provinceId)}&departamento=${encodeURIComponent(departmentId)}&max=500&orden=nombre`
        );


      select.innerHTML = `
        <option value="">
          Seleccioná una localidad
        </option>
      `;


      data.localidades.forEach(locality => {

        const option =
          document.createElement('option');


        option.value =
          locality.nombre;


        option.dataset.id =
          locality.id;


        option.textContent =
          locality.nombre;


        select.appendChild(option);

      });


      select.disabled = false;

    }


    // ============================================================
    // CREAR SELECTOR DE ZONA
    // ============================================================

    async function createLocationRow(
      savedLocation = null
    ) {

      const row =
        document.createElement('div');


      row.className =
        'location-row';


      row.style.border =
        '1px solid var(--line)';


      row.style.borderRadius =
        '14px';


      row.style.padding =
        '15px';


      row.style.marginBottom =
        '12px';


      row.innerHTML = `

        <div class="field">

          <label>
            Provincia / jurisdicción geográfica
          </label>

          <select class="location-province">
            <option value="">
              Cargando provincias…
            </option>
          </select>

        </div>


        <div class="field location-department-wrap">

          <label>
            Partido / departamento
          </label>

          <select class="location-department">
            <option value="">
              Seleccioná primero una provincia
            </option>
          </select>

        </div>


        <div class="field location-locality-wrap">

          <label>
            Localidad
          </label>

          <select class="location-locality">
            <option value="">
              Seleccioná primero un partido
            </option>
          </select>

        </div>


        <div class="field location-neighborhood-wrap">

          <label>
            Barrio
          </label>

          <select class="location-neighborhood">
            <option value="">
              Seleccioná un barrio
            </option>
          </select>

        </div>


        <button
          type="button"
          class="btn secondary remove-location"
        >
          Eliminar zona
        </button>

      `;


      locationsContainer.appendChild(row);


      const provinceSelect =
        row.querySelector(
          '.location-province'
        );


      const departmentSelect =
        row.querySelector(
          '.location-department'
        );


      const localitySelect =
        row.querySelector(
          '.location-locality'
        );


      const neighborhoodSelect =
        row.querySelector(
          '.location-neighborhood'
        );


      const departmentWrap =
        row.querySelector(
          '.location-department-wrap'
        );


      const localityWrap =
        row.querySelector(
          '.location-locality-wrap'
        );


      const neighborhoodWrap =
        row.querySelector(
          '.location-neighborhood-wrap'
        );


      neighborhoodWrap.style.display =
        'none';


      await loadProvinces(
        provinceSelect
      );


      // ==========================================================
      // CARGAR ZONA EXISTENTE
      // ==========================================================

      if (savedLocation) {

        const savedProvince =
          savedLocation.province || '';


        const savedParty =
          savedLocation.party || '';


        const savedLocality =
          savedLocation.locality || '';


        const savedNeighborhood =
          savedLocation.neighborhood || '';


        if (
          savedProvince ===
          'Ciudad Autónoma de Buenos Aires'
        ) {

          const cabaOption =
            Array.from(
              provinceSelect.options
            ).find(option =>
              option.textContent ===
                'Ciudad Autónoma de Buenos Aires'
            );


          if (cabaOption) {

            provinceSelect.value =
              cabaOption.value;

          }


          departmentWrap.style.display =
            'none';


          localityWrap.style.display =
            'none';


          neighborhoodWrap.style.display =
            'block';


          neighborhoodSelect.innerHTML = `
            <option value="">
              Seleccioná un barrio
            </option>
          `;


          CABA_BARRIOS.forEach(
            barrio => {

              const option =
                document.createElement(
                  'option'
                );


              option.value =
                barrio;


              option.textContent =
                barrio;


              neighborhoodSelect.appendChild(
                option
              );

            }
          );


          neighborhoodSelect.value =
            savedNeighborhood;

        } else {

          departmentWrap.style.display =
            'block';


          localityWrap.style.display =
            'block';


          neighborhoodWrap.style.display =
            'none';


          const provinceOption =
            Array.from(
              provinceSelect.options
            ).find(option =>
              option.textContent ===
                savedProvince ||
              option.value ===
                savedProvince
            );


          if (provinceOption) {

            provinceSelect.value =
              provinceOption.value;


            await loadDepartments(
              provinceOption.dataset.id,
              departmentSelect
            );


            const departmentOption =
              Array.from(
                departmentSelect.options
              ).find(option =>
                option.textContent ===
                  savedParty
              );


            if (departmentOption) {

              departmentSelect.value =
                departmentOption.value;


              await loadLocalities(
                provinceOption.dataset.id,
                departmentOption.dataset.id,
                localitySelect
              );


              localitySelect.value =
                savedLocality;

            }

          }

        }

      }


      // ==========================================================
      // CAMBIO DE PROVINCIA
      // ==========================================================

      provinceSelect.addEventListener(
        'change',
        async () => {

          const selectedOption =
            provinceSelect.options[
              provinceSelect.selectedIndex
            ];


          const provinceName =
            selectedOption?.textContent || '';


          const provinceId =
            selectedOption?.dataset.id || '';


          departmentSelect.innerHTML = `
            <option value="">
              Seleccioná un partido
            </option>
          `;


          localitySelect.innerHTML = `
            <option value="">
              Seleccioná una localidad
            </option>
          `;


          if (
            provinceName ===
            'Ciudad Autónoma de Buenos Aires'
          ) {

            departmentWrap.style.display =
              'none';


            localityWrap.style.display =
              'none';


            neighborhoodWrap.style.display =
              'block';


            neighborhoodSelect.innerHTML = `
              <option value="">
                Seleccioná un barrio
              </option>
            `;


            CABA_BARRIOS.forEach(
              barrio => {

                const option =
                  document.createElement(
                    'option'
                  );


                option.value =
                  barrio;


                option.textContent =
                  barrio;


                neighborhoodSelect.appendChild(
                  option
                );

              }
            );

          } else {

            departmentWrap.style.display =
              'block';


            localityWrap.style.display =
              'block';


            neighborhoodWrap.style.display =
              'none';


            await loadDepartments(
              provinceId,
              departmentSelect
            );

          }

        }
      );


      // ==========================================================
      // CAMBIO DE PARTIDO
      // ==========================================================

      departmentSelect.addEventListener(
        'change',
        async () => {

          const provinceOption =
            provinceSelect.options[
              provinceSelect.selectedIndex
            ];


          const departmentOption =
            departmentSelect.options[
              departmentSelect.selectedIndex
            ];


          await loadLocalities(
            provinceOption?.dataset.id || '',
            departmentOption?.dataset.id || '',
            localitySelect
          );

        }
      );


      // ==========================================================
      // ELIMINAR ZONA
      // ==========================================================

      row
        .querySelector('.remove-location')
        .addEventListener(
          'click',
          () => {

            row.remove();

          }
        );

    }


    addLocationButton.addEventListener(
      'click',
      async () => {

        try {

          await createLocationRow();

        } catch (error) {

          console.error(error);


          showMessage(
            'msg',
            'No se pudieron cargar las zonas geográficas.',
            true
          );

        }

      }
    );


    // ============================================================
    // CARGAR ZONAS EXISTENTES
    // ============================================================

    const {
      data: savedLocations,
      error: locationsError
    } = await sb
      .from('professional_locations')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', {
        ascending: true
      });


    if (locationsError) {
      throw locationsError;
    }


    if (savedLocations?.length) {

      for (
        const location
        of savedLocations
      ) {

        await createLocationRow(
          location
        );

      }

    }


    // ============================================================
    // MATRÍCULAS
    // ============================================================

    function createLicenseRow(
      savedLicense = null
    ) {

      const row =
        document.createElement('div');


      row.className =
        'license-row';


      row.style.display =
        'grid';


      row.style.gridTemplateColumns =
        '1fr 1fr auto';


      row.style.gap =
        '10px';


      row.style.alignItems =
        'end';


      row.style.marginBottom =
        '12px';


      row.innerHTML = `

        <div class="field">

          <label>
            Jurisdicción
          </label>

          <select class="additional-license-jurisdiction">

            <option value="">
              Seleccioná
            </option>

            <option value="Ciudad de Buenos Aires">
              Ciudad de Buenos Aires
            </option>

            <option value="Provincia de Buenos Aires">
              Provincia de Buenos Aires
            </option>

            <option value="Otra">
              Otra
            </option>

          </select>

        </div>


        <div class="field">

          <label>
            Matrícula
          </label>

          <input
            type="text"
            class="additional-license-number"
            placeholder="Número de matrícula"
          >

        </div>


        <button
          type="button"
          class="btn secondary remove-license"
        >
          Eliminar
        </button>

      `;


      licensesContainer.appendChild(
        row
      );


      if (savedLicense) {

        row.querySelector(
          '.additional-license-jurisdiction'
        ).value =
          savedLicense.jurisdiction || '';


        row.querySelector(
          '.additional-license-number'
        ).value =
          savedLicense.license || '';

      }


      row
        .querySelector('.remove-license')
        .addEventListener(
          'click',
          () => {

            row.remove();

          }
        );

    }


    addLicenseButton.addEventListener(
      'click',
      () => {

        createLicenseRow();

      }
    );


    // ============================================================
    // CARGAR MATRÍCULAS EXISTENTES
    // ============================================================

    const {
      data: savedLicenses,
      error: licensesError
    } = await sb
      .from('professional_licenses')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', {
        ascending: true
      });


    if (licensesError) {
      throw licensesError;
    }


    if (savedLicenses?.length) {

      const primaryLicense =
        profile?.license || '';


      const primaryJurisdiction =
        profile?.jurisdiction || '';


      savedLicenses
        .filter(license =>
          !(
            license.license ===
              primaryLicense &&
            license.jurisdiction ===
              primaryJurisdiction
          )
        )
        .forEach(
          license => {

            createLicenseRow(
              license
            );

          }
        );

    }


    // ============================================================
    // FOTO
    // ============================================================

    photoInput.addEventListener(
      'change',
      () => {

        const file =
          photoInput.files[0];


        if (!file) return;


        if (
          file.size >
          2 * 1024 * 1024
        ) {

          showMessage(
            'msg',
            'La foto no puede superar los 2 MB.',
            true
          );


          photoInput.value = '';


          return;

        }


        const reader =
          new FileReader();


        reader.onload =
          event => {

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

      }
    );


    // ============================================================
    // ELIMINAR FOTO
    // ============================================================

    function showRemoveButton() {

      let removeButton =
        document.getElementById(
          'removePhoto'
        );


      if (removeButton) return;


      removeButton =
        document.createElement(
          'button'
        );


      removeButton.id =
        'removePhoto';


      removeButton.type =
        'button';


      removeButton.className =
        'btn secondary';


      removeButton.style.marginTop =
        '8px';


      removeButton.textContent =
        'Eliminar foto';


      photoInput
        .parentElement
        .appendChild(
          removeButton
        );


      removeButton.addEventListener(
        'click',
        () => {

          photoInput.value = '';


          photoPreview.innerHTML =
            'PS';


          photoWasRemoved =
            true;


          removeButton.remove();

        }
      );

    }


    // ============================================================
    // GUARDAR PERFIL
    // ============================================================

    form.addEventListener(
      'submit',
      async event => {

        event.preventDefault();


        try {

          showMessage(
            'msg',
            'Guardando...'
          );


          updatePopulationValue();


          const populationField =
            document.getElementById(
              'population'
            );


          if (!populationField) {

            throw new Error(
              'No se encontró el campo de población.'
            );

          }


          const selectedPopulation =
            populationField.value;


          // ======================================================
          // RECOPILAR MATRÍCULAS
          // ======================================================

          const primaryLicense =
            document
              .getElementById('license')
              ?.value
              .trim() || '';


          const primaryJurisdiction =
            document
              .getElementById('jurisdiction')
              ?.value || '';


          const licensesToSave = [];


          if (
            primaryLicense &&
            primaryJurisdiction
          ) {

            licensesToSave.push({

              license:
                primaryLicense,

              jurisdiction:
                primaryJurisdiction

            });

          }


          document
            .querySelectorAll(
              '.license-row'
            )
            .forEach(row => {

              const license =
                row.querySelector(
                  '.additional-license-number'
                )
                  ?.value
                  .trim() || '';


              const jurisdiction =
                row.querySelector(
                  '.additional-license-jurisdiction'
                )
                  ?.value || '';


              if (
                license &&
                jurisdiction
              ) {

                licensesToSave.push({

                  license,
                  jurisdiction

                });

              }

            });


          // Evitar duplicados dentro de la misma cuenta

          const licenseKeys =
            licensesToSave.map(
              item =>
                `${item.license.toLowerCase()}::${item.jurisdiction.toLowerCase()}`
            );


          if (
            new Set(licenseKeys).size !==
            licenseKeys.length
          ) {

            throw new Error(
              'No podés ingresar dos veces la misma matrícula para la misma jurisdicción.'
            );

          }


          // ======================================================
          // RECOPILAR ZONAS
          // ======================================================

          const locationsToSave = [];


          document
            .querySelectorAll(
              '.location-row'
            )
            .forEach(row => {

              const provinceSelect =
                row.querySelector(
                  '.location-province'
                );


              const departmentSelect =
                row.querySelector(
                  '.location-department'
                );


              const localitySelect =
                row.querySelector(
                  '.location-locality'
                );


              const neighborhoodSelect =
                row.querySelector(
                  '.location-neighborhood'
                );


              const province =
                provinceSelect
                  ?.options[
                    provinceSelect
                      .selectedIndex
                  ]
                  ?.textContent
                  ?.trim() || '';


              const party =
                departmentSelect
                  ?.value
                  ?.trim() || '';


              const locality =
                localitySelect
                  ?.value
                  ?.trim() || '';


              const neighborhood =
                neighborhoodSelect
                  ?.value
                  ?.trim() || '';


              if (province) {

                locationsToSave.push({

                  province,

                  party:
                    party || null,

                  locality:
                    locality || null,

                  neighborhood:
                    neighborhood || null

                });

              }

            });


          // ======================================================
          // FOTO
          // ======================================================

          let photoUrl =
            currentProfile?.photo_url ||
            null;


          if (
            photoWasRemoved &&
            photoUrl
          ) {

            const extensions = [
              'jpg',
              'jpeg',
              'png',
              'webp'
            ];


            const paths =
              extensions.map(
                extension =>
                  `${user.id}/profile.${extension}`
              );


            await sb.storage
              .from('profile-photos')
              .remove(paths);


            photoUrl =
              null;

          }


          const file =
            photoInput.files[0];


          if (file) {

            const extension =
              file.name
                .split('.')
                .pop()
                .toLowerCase();


            const validExtensions = [
              'jpg',
              'jpeg',
              'png',
              'webp'
            ];


            if (
              !validExtensions.includes(
                extension
              )
            ) {

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


            const oldPaths =
              extensions
                .filter(
                  ext =>
                    ext !== extension
                )
                .map(
                  ext =>
                    `${user.id}/profile.${ext}`
                );


            await sb.storage
              .from('profile-photos')
              .remove(oldPaths);


            const path =
              `${user.id}/profile.${extension}`;


            const {
              error: uploadError
            } =
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


            const {
              data: publicData
            } =
              sb.storage
                .from('profile-photos')
                .getPublicUrl(
                  path
                );


            photoUrl =
              `${publicData.publicUrl}?v=${Date.now()}`;

          }


          // ======================================================
          // WHATSAPP PRIVADO
          // ======================================================

          const whatsapp =
            document
              .getElementById('whatsapp')
              ?.value
              .trim() || '';


          // ======================================================
          // GUARDAR PERFIL PRINCIPAL
          // ======================================================

          const payload = {

            id:
              user.id,

            display_name:
              document
                .getElementById(
                  'display_name'
                )
                ?.value
                .trim() || '',

            license:
              primaryLicense,

            jurisdiction:
              primaryJurisdiction,

            modality:
              document
                .getElementById(
                  'modality'
                )
                ?.value || '',

            orientation:
              document
                .getElementById(
                  'orientation'
                )
                ?.value
                .trim() || '',

            population:
              selectedPopulation,

            bio:
              document
                .getElementById(
                  'bio'
                )
                ?.value
                .trim() || '',

            is_public:
              document
                .getElementById(
                  'is_public'
                )
                ?.checked || false,

            photo_url:
              photoUrl

          };


          const {
            data: savedProfile,
            error: saveError
          } =
            await sb
              .from('profiles')
              .upsert(payload)
              .select()
              .single();


          if (saveError) {
            throw saveError;
          }


          currentProfile =
            savedProfile;


          // ======================================================
          // ACTUALIZAR SALUDO
          // ======================================================

          if (
            savedProfile?.display_name &&
            welcome
          ) {

            welcome.textContent =
              `Hola, ${savedProfile.display_name} 👋`;

          }


          // ======================================================
          // GUARDAR WHATSAPP PRIVADO
          // ======================================================

          if (whatsapp) {

            const {
              error: contactSaveError
            } =
              await sb
                .from('professional_contacts')
                .upsert(
                  {
                    profile_id:
                      user.id,

                    whatsapp:
                      whatsapp,

                    updated_at:
                      new Date().toISOString()
                  },
                  {
                    onConflict:
                      'profile_id'
                  }
                );


            if (contactSaveError) {
              throw contactSaveError;
            }

          } else {

            const {
              error: contactDeleteError
            } =
              await sb
                .from('professional_contacts')
                .delete()
                .eq(
                  'profile_id',
                  user.id
                );


            if (contactDeleteError) {
              throw contactDeleteError;
            }

          }


          // ======================================================
          // GUARDAR MATRÍCULAS
          // ======================================================

          const {
            error: deleteLicensesError
          } =
            await sb
              .from(
                'professional_licenses'
              )
              .delete()
              .eq(
                'profile_id',
                user.id
              );


          if (deleteLicensesError) {
            throw deleteLicensesError;
          }


          if (
            licensesToSave.length
          ) {

            const rows =
              licensesToSave.map(
                license => ({

                  profile_id:
                    user.id,

                  license:
                    license.license,

                  jurisdiction:
                    license.jurisdiction

                })
              );


            const {
              error: insertLicensesError
            } =
              await sb
                .from(
                  'professional_licenses'
                )
                .insert(rows);


            if (insertLicensesError) {
              throw insertLicensesError;
            }

          }


          // ======================================================
          // GUARDAR ZONAS
          // ======================================================

          const {
            error: deleteLocationsError
          } =
            await sb
              .from(
                'professional_locations'
              )
              .delete()
              .eq(
                'profile_id',
                user.id
              );


          if (deleteLocationsError) {
            throw deleteLocationsError;
          }


          if (
            locationsToSave.length
          ) {

            const rows =
              locationsToSave.map(
                location => ({

                  profile_id:
                    user.id,

                  province:
                    location.province,

                  party:
                    location.party,

                  locality:
                    location.locality,

                  neighborhood:
                    location.neighborhood

                })
              );


            const {
              error: insertLocationsError
            } =
              await sb
                .from(
                  'professional_locations'
                )
                .insert(rows);


            if (insertLocationsError) {
              throw insertLocationsError;
            }

          }


          // ======================================================
          // ACTUALIZAR FOTO
          // ======================================================

          photoWasRemoved =
            false;


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

            photoPreview.innerHTML =
              'PS';


            const removeButton =
              document.getElementById(
                'removePhoto'
              );


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
              'professional_licenses_unique_license_jurisdiction'
            ) ||
            error.message?.includes(
              'unique_license_jurisdiction'
            )
          ) {

            showMessage(
              'msg',
              'Una de las matrículas ingresadas ya está registrada en PsiCerca para esa jurisdicción.',
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

      }
    );


  } catch (error) {

    console.error(
      'Error en dashboard:',
      error
    );

  }

})();
