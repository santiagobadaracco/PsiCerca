document.addEventListener('DOMContentLoaded', async () => {

  const user = await requireUser();

  if (!user) return;

  const sb = requireSupabase();

  const welcome =
    document.getElementById('welcome');

  const professionalName =
    document.getElementById('professionalName');

  const planBadge =
    document.getElementById('planBadge');

  const subscriptionTitle =
    document.getElementById('subscriptionTitle');

  const subscriptionDescription =
    document.getElementById('subscriptionDescription');

  const subscriptionLabel =
    document.getElementById('subscriptionLabel');

  const subscriptionButton =
    document.getElementById('subscriptionButton');

  const subscriptionMessage =
    document.getElementById('subscriptionMessage');

  const consultasContent =
    document.getElementById('consultasContent');

  const subscriptionContent =
    document.getElementById('subscriptionContent');

  const availabilityContent =
    document.getElementById('availabilityContent');

  const profileForm =
    document.getElementById('profileForm');

  const profileMessage =
    document.getElementById('msg');


  let subscription = null;

  let isPaidPro = false;

  let isCourtesyPro = false;

  let isPro = false;

  let appointmentDuration = 50;

  let appointmentBreak = 10;

  let currentProfile = null;


  // =====================================================
  // UTILIDADES DE PERFIL
  // =====================================================

  function setFieldValue(id, value) {

    const element =
      document.getElementById(id);

    if (!element) return;

    element.value =
      value === null ||
      value === undefined
        ? ''
        : value;

  }


  function setCheckbox(id, value) {

    const element =
      document.getElementById(id);

    if (!element) return;

    element.checked =
      value === true;

  }


  function normalizeArray(value) {

    if (Array.isArray(value)) {
      return value;
    }

    if (!value) {
      return [];
    }

    if (typeof value === 'string') {

      try {

        const parsed =
          JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed;
        }

      } catch (error) {
        // No era JSON.
      }

      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];

  }


  function getPopulationValues() {

    return Array.from(
      document.querySelectorAll(
        '.population-option:checked'
      )
    )
      .map(input => input.value);

  }


  function setPopulationValues(value) {

    const values =
      normalizeArray(value);

    document
      .querySelectorAll(
        '.population-option'
      )
      .forEach(input => {

        input.checked =
          values.includes(
            input.value
          );

      });


    const hidden =
      document.getElementById(
        'population'
      );

    if (hidden) {

      hidden.value =
        values.join(', ');

    }

  }


  function getContainerValues(containerId) {

    const container =
      document.getElementById(
        containerId
      );

    if (!container) {
      return [];
    }


    return Array.from(
      container.querySelectorAll(
        'input'
      )
    )
      .map(input =>
        input.value.trim()
      )
      .filter(Boolean);

  }


  function addSimpleInput(
    containerId,
    value = ''
  ) {

    const container =
      document.getElementById(
        containerId
      );

    if (!container) return;


    const wrapper =
      document.createElement('div');

    wrapper.style.cssText = `
      display:flex;
      gap:8px;
      align-items:center;
      margin-top:8px;
    `;


    const input =
      document.createElement('input');

    input.type =
      'text';

    input.value =
      value || '';

    input.style.width =
      '100%';


    const removeButton =
      document.createElement('button');

    removeButton.type =
      'button';

    removeButton.className =
      'btn secondary';

    removeButton.textContent =
      'Eliminar';

    removeButton.style.fontSize =
      '12px';


    removeButton.addEventListener(
      'click',
      () => {

        wrapper.remove();

      }
    );


    wrapper.appendChild(input);

    wrapper.appendChild(
      removeButton
    );

    container.appendChild(
      wrapper
    );

  }


  function clearContainer(id) {

    const container =
      document.getElementById(id);

    if (container) {
      container.innerHTML = '';
    }

  }


  function loadDynamicProfileFields(data) {

    // ---------------------------------------------------
    // OTRAS MATRÍCULAS
    // ---------------------------------------------------

    clearContainer(
      'licensesContainer'
    );


    const otherLicenses =
      data.other_licenses ??
      data.otherLicenses ??
      data.licenses;


    normalizeArray(
      otherLicenses
    )
      .forEach(value => {

        addSimpleInput(
          'licensesContainer',
          value
        );

      });


    // ---------------------------------------------------
    // ZONAS
    // ---------------------------------------------------

    clearContainer(
      'locationsContainer'
    );


    const locations =
      data.locations ??
      data.attention_locations ??
      data.attentionLocations;


    normalizeArray(
      locations
    )
      .forEach(value => {

        addSimpleInput(
          'locationsContainer',
          value
        );

      });


    // Si existe el campo zone pero no existe
    // un arreglo de locations, usamos zone
    // como zona inicial.

    if (
      normalizeArray(locations).length === 0 &&
      data.zone
    ) {

      addSimpleInput(
        'locationsContainer',
        data.zone
      );

    }


    // ---------------------------------------------------
    // POBLACIÓN
    // ---------------------------------------------------

    setPopulationValues(
      data.population
    );

  }


  function updatePhotoPreview(photoUrl, name) {

    const preview =
      document.getElementById(
        'photoPreview'
      );

    if (!preview) return;


    if (photoUrl) {

      preview.innerHTML = '';

      const image =
        document.createElement('img');

      image.src =
        photoUrl;

      image.alt =
        name ||
        'Foto de perfil';

      image.style.cssText = `
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      `;

      preview.appendChild(
        image
      );

      return;

    }


    const initials =
      String(
        name || 'PS'
      )
        .trim()
        .split(/\s+/)
        .slice(0,2)
        .map(
          word =>
            word.charAt(0)
              .toUpperCase()
        )
        .join('');


    preview.textContent =
      initials || 'PS';

  }


  // =====================================================
  // PERFIL
  // =====================================================

  async function loadProfile() {

    const {
      data,
      error
    } = await sb
      .from('profiles')
      .select('*')
      .eq(
        'id',
        user.id
      )
      .single();


    if (error) {

      console.error(
        'Error cargando perfil:',
        error
      );


      if (welcome) {

        welcome.textContent =
          'No se pudo cargar el perfil.';

      }


      return null;

    }


    currentProfile =
      data;


    appointmentDuration =
      Number(
        data.appointment_duration
      ) || 50;


    appointmentBreak =
      Number(
        data.appointment_break
      );


    if (
      !Number.isInteger(
        appointmentBreak
      )
    ) {

      appointmentBreak =
        10;

    }


    const name =
      data.display_name ||
      'Profesional';


    if (professionalName) {

      professionalName.textContent =
        name;

    }


    if (welcome) {

      welcome.textContent =
        `Hola, ${name}.`;

    }


    const profileName =
      document.getElementById(
        'profileName'
      );


    if (profileName) {

      profileName.textContent =
        data.display_name ||
        'Profesional';

    }


    const profileLicense =
      document.getElementById(
        'profileLicense'
      );


    if (profileLicense) {

      profileLicense.textContent =
        data.license ||
        'No especificada';

    }


    const profileModality =
      document.getElementById(
        'profileModality'
      );


    if (profileModality) {

      profileModality.textContent =
        data.modality ||
        'No especificada';

    }


    const profileZone =
      document.getElementById(
        'profileZone'
      );


    if (profileZone) {

      profileZone.textContent =
        data.zone ||
        'No especificada';

    }


    // ===================================================
    // VOLCAR DATOS EN EL FORMULARIO
    // ===================================================

    setFieldValue(
      'display_name',
      data.display_name
    );


    setFieldValue(
      'jurisdiction',
      data.jurisdiction
    );


    setFieldValue(
      'license',
      data.license
    );


    setFieldValue(
      'modality',
      data.modality
    );


    setFieldValue(
      'orientation',
      data.orientation
    );


    setFieldValue(
      'whatsapp',
      data.whatsapp ??
      data.public_whatsapp ??
      ''
    );


    setFieldValue(
      'bio',
      data.bio
    );


    setCheckbox(
      'is_public',
      data.is_public === true
    );


    loadDynamicProfileFields(
      data
    );


    updatePhotoPreview(
      data.photo_url,
      data.display_name
    );


    return data;

  }


  // =====================================================
  // GUARDAR PERFIL
  // =====================================================

 async function saveProfile(event) {

  event.preventDefault();

  if (!profileForm) {
    return;
  }

  const button =
    profileForm.querySelector(
      'button[type="submit"]'
    );

  const displayName =
    document
      .getElementById('display_name')
      ?.value
      .trim() || '';

  const jurisdiction =
    document
      .getElementById('jurisdiction')
      ?.value
      .trim() || '';

  const license =
    document
      .getElementById('license')
      ?.value
      .trim() || '';

  const modality =
    document
      .getElementById('modality')
      ?.value
      .trim() || '';

  const orientation =
    document
      .getElementById('orientation')
      ?.value
      .trim() || '';

  const whatsapp =
    document
      .getElementById('whatsapp')
      ?.value
      .trim() || '';

  const bio =
    document
      .getElementById('bio')
      ?.value
      .trim() || '';

  const isPublic =
    document
      .getElementById('is_public')
      ?.checked === true;

  const population =
    getPopulationValues();

  const otherLicenses =
    getContainerValues(
      'licensesContainer'
    );

  const locations =
    getContainerValues(
      'locationsContainer'
    );


  // ===================================================
  // VALIDACIONES
  // ===================================================

  if (!displayName) {

    showMessage(
      'msg',
      'Ingresá tu nombre profesional.',
      true
    );

    return;

  }


  if (!license) {

    showMessage(
      'msg',
      'Ingresá tu matrícula.',
      true
    );

    return;

  }


  // ===================================================
  // ESTADO DEL BOTÓN
  // ===================================================

  if (button) {

    button.disabled = true;

    button.textContent =
      'Guardando…';

  }


  showMessage(
    'msg',
    'Guardando…'
  );


  try {

    // =================================================
    // POBLACIÓN
    // =================================================

    let populationValue = null;

    if (population.length > 0) {

      if (
        Array.isArray(
          currentProfile?.population
        )
      ) {

        populationValue =
          population;

      } else {

        populationValue =
          population.join(', ');

      }

    }


    // =================================================
    // DATOS PRINCIPALES
    // =================================================

    const updateData = {

      display_name:
        displayName,

      jurisdiction:
        jurisdiction || null,

      license:
        license,

      modality:
        modality || null,

      orientation:
        orientation || null,

      population:
        populationValue,

      bio:
        bio || null,

      is_public:
        isPublic

    };


    // =================================================
    // CAMPOS OPCIONALES
    // =================================================

    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'whatsapp'
      )
    ) {

      updateData.whatsapp =
        whatsapp || null;

    }


    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'public_whatsapp'
      )
    ) {

      updateData.public_whatsapp =
        whatsapp || null;

    }


    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'other_licenses'
      )
    ) {

      updateData.other_licenses =
        otherLicenses.length
          ? otherLicenses
          : null;

    }


    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'locations'
      )
    ) {

      updateData.locations =
        locations.length
          ? locations
          : null;

    }


    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'attention_locations'
      )
    ) {

      updateData.attention_locations =
        locations.length
          ? locations
          : null;

    }


    if (
      currentProfile &&
      Object.prototype.hasOwnProperty.call(
        currentProfile,
        'updated_at'
      )
    ) {

      updateData.updated_at =
        new Date().toISOString();

    }


    // =================================================
    // FOTO
    // =================================================

    const photoInput =
      document.getElementById(
        'photo'
      );

    const photoFile =
      photoInput?.files?.[0];


    if (photoFile) {

      if (
        photoFile.size >
        2 * 1024 * 1024
      ) {

        throw new Error(
          'La foto no puede superar los 2 MB.'
        );

      }


      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];


      if (
        !allowedTypes.includes(
          photoFile.type
        )
      ) {

        throw new Error(
          'La foto debe estar en formato JPG, PNG o WebP.'
        );

      }


      let extension =
        'jpg';


      if (
        photoFile.type ===
        'image/png'
      ) {

        extension =
          'png';

      }


      if (
        photoFile.type ===
        'image/webp'
      ) {

        extension =
          'webp';

      }


      const filePath =
        `${user.id}/profile.${extension}`;


      const {
        error: uploadError
      } = await sb
        .storage
        .from('profile-photos')
        .upload(
          filePath,
          photoFile,
          {
            upsert: true,
            contentType:
              photoFile.type
          }
        );


      if (uploadError) {

        console.error(
          'Error subiendo foto:',
          uploadError
        );

        throw new Error(
          'No se pudo subir la foto de perfil.'
        );

      }


      const {
        data: publicUrlData
      } =
        sb
          .storage
          .from('profile-photos')
          .getPublicUrl(
            filePath
          );


      const photoUrl =
        publicUrlData?.publicUrl;


      if (photoUrl) {

        updateData.photo_url =
          photoUrl;

      }

    }


    // =================================================
    // GUARDAR PERFIL EN SUPABASE
    // =================================================

    const {
      error
    } = await sb
      .from('profiles')
      .update(
        updateData
      )
      .eq(
        'id',
        user.id
      );


    if (error) {

      console.error(
        'ERROR REAL AL GUARDAR PERFIL:',
        error
      );

      console.error(
        'DATOS ENVIADOS:',
        updateData
      );

      throw new Error(
        error.message ||
        'No se pudieron guardar los datos del perfil.'
      );

    }


    // =================================================
    // ACTUALIZAR ESTADO LOCAL
    // =================================================

    currentProfile = {
      ...(currentProfile || {}),
      ...updateData
    };


    // =================================================
    // ACTUALIZAR INTERFAZ
    // =================================================

    if (professionalName) {

      professionalName.textContent =
        displayName;

    }


    if (welcome) {

      welcome.textContent =
        `Hola, ${displayName}.`;

    }


    const profileName =
      document.getElementById(
        'profileName'
      );

    if (profileName) {

      profileName.textContent =
        displayName;

    }


    const profileLicense =
      document.getElementById(
        'profileLicense'
      );

    if (profileLicense) {

      profileLicense.textContent =
        license ||
        'No especificada';

    }


    const profileModality =
      document.getElementById(
        'profileModality'
      );

    if (profileModality) {

      profileModality.textContent =
        modality ||
        'No especificada';

    }


    const profileZone =
      document.getElementById(
        'profileZone'
      );

    if (profileZone) {

      profileZone.textContent =
        locations[0] ||
        currentProfile?.zone ||
        'No especificada';

    }


    if (updateData.photo_url) {

      updatePhotoPreview(
        updateData.photo_url,
        displayName
      );

    }


    // =================================================
    // CONFIRMACIÓN
    // =================================================

    showMessage(
      'msg',
      'Perfil guardado correctamente.'
    );


    await loadProfile();


  } catch (error) {

    console.error(
      'Error guardando perfil:',
      error
    );


    showMessage(
      'msg',
      error.message ||
      'No se pudieron guardar los datos del perfil.',
      true
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        'Guardar cambios';

    }

  }

}


  // =====================================================
  // AGREGAR MATRÍCULA
  // =====================================================

  const addLicense =
    document.getElementById(
      'addLicense'
    );


  if (addLicense) {

    addLicense.addEventListener(
      'click',
      () => {

        addSimpleInput(
          'licensesContainer'
        );

      }
    );

  }


  // =====================================================
  // AGREGAR ZONA
  // =====================================================

  const addLocation =
    document.getElementById(
      'addLocation'
    );


  if (addLocation) {

    addLocation.addEventListener(
      'click',
      () => {

        addSimpleInput(
          'locationsContainer'
        );

      }
    );

  }


  // =====================================================
  // POBLACIÓN
  // =====================================================

  document
    .querySelectorAll(
      '.population-option'
    )
    .forEach(input => {

      input.addEventListener(
        'change',
        () => {

          const hidden =
            document.getElementById(
              'population'
            );


          if (hidden) {

            hidden.value =
              getPopulationValues()
                .join(', ');

          }

        }
      );

    });


  // =====================================================
  // FORMULARIO DE PERFIL
  // =====================================================

  if (profileForm) {

    profileForm.addEventListener(
      'submit',
      saveProfile
    );

  }


  // =====================================================
  // PREVISUALIZACIÓN DE FOTO
  // =====================================================

  const photoInput =
    document.getElementById(
      'photo'
    );


  if (photoInput) {

    photoInput.addEventListener(
      'change',
      () => {

        const file =
          photoInput.files?.[0];


        if (!file) {
          return;
        }


        if (
          file.size >
          2 * 1024 * 1024
        ) {

          showMessage(
            'msg',
            'La foto no puede superar los 2 MB.',
            true
          );


          photoInput.value =
            '';

          return;

        }


        const reader =
          new FileReader();


        reader.onload =
          event => {

            const preview =
              document.getElementById(
                'photoPreview'
              );


            if (!preview) {
              return;
            }


            preview.innerHTML = '';


            const image =
              document.createElement(
                'img'
              );


            image.src =
              event.target.result;


            image.alt =
              'Vista previa';


            image.style.cssText = `
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
            `;


            preview.appendChild(
              image
            );

          };


        reader.readAsDataURL(
          file
        );

      }
    );

  }


  // =====================================================
  // SUSCRIPCIÓN PRO PAGA
  // =====================================================

  async function loadPaidSubscription() {

    const {
      data,
      error
    } = await sb
      .from('professional_subscriptions')
      .select(`
        id,
        profile_id,
        plan,
        status,
        expires_at,
        created_at,
        cancel_at_period_end,
        cancelled_at,
        next_payment_at
      `)
      .eq(
        'profile_id',
        user.id
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();


    if (error) {

      console.error(
        'Error cargando suscripción:',
        error
      );


      subscription =
        null;

      isPaidPro =
        false;

      return;

    }


    subscription =
      data;


    isPaidPro =
      !!subscription &&
      subscription.plan === 'pro' &&
      subscription.status === 'active' &&
      (
        !subscription.expires_at ||
        new Date(
          subscription.expires_at
        ) > new Date()
      );


    console.log(
      'Suscripción paga:',
      subscription
    );


    console.log(
      '¿PRO pago?:',
      isPaidPro
    );

  }


  // =====================================================
  // PRO DE CORTESÍA
  // =====================================================

  async function loadCourtesyPro() {

    try {

      const {
        data,
        error
      } = await sb.rpc(
        'has_courtesy_pro',
        {
          target_profile_id:
            user.id
        }
      );


      if (error) {

        console.error(
          'Error comprobando PRO de cortesía:',
          error
        );


        isCourtesyPro =
          false;

        return;

      }


      isCourtesyPro =
        data === true;


      console.log(
        '¿PRO de cortesía?:',
        isCourtesyPro
      );


    } catch (error) {

      console.error(
        'Error verificando PRO de cortesía:',
        error
      );


      isCourtesyPro =
        false;

    }

  }


  // =====================================================
  // CARGAR ESTADO COMPLETO DE PRO
  // =====================================================

  async function loadSubscription() {

    await loadPaidSubscription();

    await loadCourtesyPro();


    isPro =
      isPaidPro ||
      isCourtesyPro;


    updatePlanUI();

  }


  // =====================================================
  // UI DEL PLAN
  // =====================================================

  function updatePlanUI() {

    if (planBadge) {

      if (isPro) {

        if (
          isCourtesyPro &&
          !isPaidPro
        ) {

          planBadge.textContent =
            'PRO DE CORTESÍA';

        } else {

          planBadge.textContent =
            'PRO';

        }

        planBadge.className =
          'badge success';

      } else {

        planBadge.textContent =
          'GRATUITO';

        planBadge.className =
          'badge';

      }

    }


    if (subscriptionTitle) {

      subscriptionTitle.textContent =
        isPro
          ? 'PsiCerca PRO'
          : 'PsiCerca FREE';

    }


    if (subscriptionDescription) {

      if (
        isCourtesyPro &&
        !isPaidPro
      ) {

        subscriptionDescription.textContent =
          'Tenés acceso a PsiCerca PRO de cortesía, sin costo.';

      }

      else if (
        isPaidPro &&
        isCourtesyPro
      ) {

        subscriptionDescription.textContent =
          'Tenés activo el plan PRO y además contás con un beneficio PRO de cortesía.';

      }

      else if (
        isPaidPro &&
        subscription?.cancel_at_period_end &&
        subscription?.expires_at
      ) {

        const endDate =
          new Date(
            subscription.expires_at
          ).toLocaleDateString(
            'es-AR',
            {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }
          );


        subscriptionDescription.textContent =
          `Tu plan PRO está activo hasta el ${endDate}. La suscripción fue cancelada y no se realizarán nuevos cobros.`;

      }

      else if (isPaidPro) {

        subscriptionDescription.textContent =
          'Tenés activo el plan PRO.';

      }

      else {

        subscriptionDescription.textContent =
          'Estás utilizando el plan gratuito.';

      }

    }


    if (subscriptionLabel) {

      subscriptionLabel.textContent =
        isPro
          ? 'PLAN ACTIVO'
          : 'SUSCRIPCIÓN';

    }


    if (subscriptionButton) {

      subscriptionButton.textContent =
        isPro
          ? 'Ver detalles'
          : 'Conocer PRO';

      subscriptionButton.href =
        '#suscripcion';

    }


    renderCancellationUI();

  }


  // =====================================================
  // CANCELACIÓN DE SUSCRIPCIÓN
  // =====================================================

  function renderCancellationUI() {

    const oldBox =
      document.getElementById(
        'cancelSubscriptionBox'
      );


    if (oldBox) {
      oldBox.remove();
    }


    if (
      isCourtesyPro &&
      !isPaidPro
    ) {
      return;
    }


    let container =
      document.getElementById(
        'subscriptionContent'
      );


    if (!container) {

      container =
        document.getElementById(
          'subscriptionMessage'
        );

    }


    if (!container && subscriptionButton) {

      container =
        subscriptionButton.parentElement;

    }


    if (!container) {

      container =
        document.getElementById(
          'suscripcion'
        );

    }


    if (!container) {
      return;
    }


    if (!isPaidPro) {
      return;
    }


    if (
      subscription?.cancel_at_period_end &&
      subscription?.expires_at
    ) {

      const endDate =
        new Date(
          subscription.expires_at
        ).toLocaleDateString(
          'es-AR',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }
        );


      const box =
        document.createElement(
          'div'
        );


      box.id =
        'cancelSubscriptionBox';


      box.style.cssText = `
        margin-top:20px;
        padding:18px;
        border-radius:14px;
        background:var(--soft);
        border:1px solid rgba(0,0,0,.08);
      `;


      box.innerHTML = `

        <strong>
          Suscripción cancelada
        </strong>

        <p
          class="small"
          style="margin-top:8px;"
        >
          Tu plan PRO seguirá activo hasta
          el ${escapeHTML(endDate)}.
          No se realizarán nuevos cobros.
        </p>

      `;


      container.appendChild(
        box
      );

      return;

    }


    const box =
      document.createElement(
        'div'
      );


    box.id =
      'cancelSubscriptionBox';


    box.style.cssText = `
      margin-top:20px;
      padding:18px;
      border-radius:14px;
      background:var(--soft);
      border:1px solid rgba(0,0,0,.08);
    `;


    box.innerHTML = `

      <strong>
        Cancelar suscripción PRO
      </strong>

      <p
        class="small"
        style="margin-top:8px;"
      >
        Podés cancelar la renovación automática
        de tu suscripción.
      </p>

      <p
        class="small"
        style="margin-top:8px;"
      >
        Tu acceso PRO continuará durante el período
        que ya abonaste. No se realizará el próximo cobro.
      </p>

      <button
        type="button"
        id="cancelSubscriptionButton"
        class="btn secondary"
        style="
          margin-top:12px;
          border-color:#b91c1c;
          color:#b91c1c;
          cursor:pointer;
        "
      >
        Cancelar suscripción
      </button>

    `;


    container.appendChild(
      box
    );


    const cancelButton =
      document.getElementById(
        'cancelSubscriptionButton'
      );


    if (cancelButton) {

      cancelButton.addEventListener(
        'click',
        cancelSubscription
      );

    }

  }


  // =====================================================
  // EJECUTAR CANCELACIÓN
  // =====================================================

  async function cancelSubscription() {

    if (
      !subscription ||
      !isPaidPro
    ) {
      return;
    }


    const confirmed =
      confirm(
        '¿Querés cancelar tu suscripción PRO?\n\n' +
        'No se realizarán nuevos cobros.\n\n' +
        'Tu acceso PRO continuará hasta el final del período que ya abonaste.\n\n' +
        'Esta acción cancela la renovación automática.'
      );


    if (!confirmed) {
      return;
    }


    const button =
      document.getElementById(
        'cancelSubscriptionButton'
      );


    if (button) {

      button.disabled =
        true;

      button.textContent =
        'Cancelando…';

    }


    if (subscriptionMessage) {

      subscriptionMessage.textContent =
        'Procesando la cancelación.';

      subscriptionMessage.className =
        'message';

    }


    try {

      const {
        data,
        error
      } = await sb.functions.invoke(
        'cancel-subscription'
      );


      if (error) {

        throw new Error(
          'No se pudo cancelar la suscripción.'
        );

      }


      if (
        !data ||
        !data.success
      ) {

        throw new Error(
          data?.error ||
          'No se pudo cancelar la suscripción.'
        );

      }


      if (subscriptionMessage) {

        subscriptionMessage.textContent =
          'La suscripción fue cancelada correctamente. Tu plan PRO continuará activo hasta el final del período abonado.';

        subscriptionMessage.className =
          'message success';

      }


      await loadSubscription();

      await loadProfessionalInquiries();

      await loadAvailability();


    } catch (error) {

      console.error(
        'Error en cancelación:',
        error
      );


      if (subscriptionMessage) {

        subscriptionMessage.textContent =
          error.message ||
          'No se pudo cancelar la suscripción.';

        subscriptionMessage.className =
          'message error';

      }


      if (button) {

        button.disabled =
          false;

        button.textContent =
          'Cancelar suscripción';

      }

    }

  }


  // =====================================================
  // DISPONIBILIDAD / AGENDA
  // =====================================================

  async function loadAvailability() {

    if (!availabilityContent) {
      return;
    }


    if (!isPro) {

      availabilityContent.innerHTML = `

        <strong>
          🔒 Agenda digital disponible con PsiCerca PRO
        </strong>

        <p class="small">

          Configurá tus horarios de atención,
          agregá tiempos de descanso y permití
          que tus pacientes puedan reservar turnos online.

        </p>

        <a
          class="btn primary"
          href="#suscripcion"
        >
          Conocer PsiCerca PRO
        </a>

      `;

      return;

    }


    const {
      data,
      error
    } = await sb
      .from('professional_availability')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        modality,
        zone,
        is_active
      `)
      .eq(
        'professional_id',
        user.id
      )
      .order(
        'day_of_week',
        {
          ascending: true
        }
      )
      .order(
        'start_time',
        {
          ascending: true
        }
      );


    if (error) {

      console.error(
        'Error cargando disponibilidad:',
        error
      );


      availabilityContent.innerHTML = `

        <div class="message error">
          No se pudo cargar tu disponibilidad.
        </div>

      `;

      return;

    }


    const {
      data: unavailableData,
      error: unavailableError
    } = await sb
      .from('professional_unavailability')
      .select(`
        id,
        day_of_week,
        specific_date,
        start_time,
        end_time,
        reason,
        is_active
      `)
      .eq(
        'professional_id',
        user.id
      )
      .order(
        'day_of_week',
        {
          ascending: true,
          nullsFirst: false
        }
      )
      .order(
        'start_time',
        {
          ascending: true
        }
      );


    if (unavailableError) {

      console.error(
        'Error cargando bloques sin atención:',
        unavailableError
      );


      availabilityContent.innerHTML = `

        <div class="message error">

          No se pudieron cargar los bloques
          de no atención.

        </div>

      `;

      return;

    }


    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];


    const rows =
      data || [];


    const unavailableRows =
      unavailableData || [];


    availabilityContent.innerHTML = `

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:15px;
          flex-wrap:wrap;
          margin-bottom:20px;
        "
      >

        <div>

          <h3 style="margin:0;">
            🗓️ Mi agenda
          </h3>

          <p
            class="small muted"
            style="margin-top:6px;"
          >
            Configurá tus horarios habituales,
            la duración de las consultas y el tiempo
            de descanso entre pacientes.
          </p>

        </div>

      </div>


      <div
        class="card"
        style="
          padding:20px;
          margin-bottom:20px;
        "
      >

        <h3 style="margin-top:0;">
          ⚙️ Configuración de turnos
        </h3>

        <p
          class="small muted"
          style="margin-top:6px;"
        >
          Estas opciones se utilizarán para construir
          automáticamente los horarios disponibles
          para tus pacientes.
        </p>


        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(220px,1fr)
              );
            gap:14px;
            align-items:end;
            margin-top:18px;
          "
        >

          <label>

            <span class="small">
              Duración de la consulta
            </span>

            <select
              id="appointmentDuration"
              style="
                width:100%;
                margin-top:5px;
              "
            >

              <option value="30">
                30 minutos
              </option>

              <option value="45">
                45 minutos
              </option>

              <option value="50">
                50 minutos
              </option>

              <option value="60">
                60 minutos
              </option>

              <option value="custom">
                Personalizada
              </option>

            </select>

          </label>


          <label
            id="customDurationContainer"
            style="display:none;"
          >

            <span class="small">
              Duración personalizada
            </span>

            <input
              type="number"
              id="customAppointmentDuration"
              min="1"
              max="240"
              step="1"
              placeholder="Ej. 75"
              style="
                width:100%;
                margin-top:5px;
              "
            >

          </label>


          <label>

            <span class="small">
              Tiempo de descanso
            </span>

            <select
              id="appointmentBreak"
              style="
                width:100%;
                margin-top:5px;
              "
            >

              <option value="0">
                Sin descanso
              </option>

              <option value="5">
                5 minutos
              </option>

              <option value="10">
                10 minutos
              </option>

              <option value="15">
                15 minutos
              </option>

              <option value="20">
                20 minutos
              </option>

              <option value="30">
                30 minutos
              </option>

              <option value="custom">
                Personalizado
              </option>

            </select>

          </label>


          <label
            id="customBreakContainer"
            style="display:none;"
          >

            <span class="small">
              Descanso personalizado
            </span>

            <input
              type="number"
              id="customAppointmentBreak"
              min="0"
              max="120"
              step="1"
              placeholder="Ej. 25"
              style="
                width:100%;
                margin-top:5px;
              "
            >

          </label>


          <div>

            <button
              type="button"
              id="saveAppointmentSettings"
              class="btn primary"
            >
              Guardar configuración
            </button>

          </div>

        </div>


        <div
          id="appointmentSettingsMessage"
          style="margin-top:12px;"
        ></div>


        <div
          style="
            margin-top:18px;
            padding:14px;
            border-radius:12px;
            background:var(--background);
          "
        >

          <div class="small">
            Ejemplo
          </div>

          <strong
            id="appointmentSettingsExample"
            style="
              display:block;
              margin-top:4px;
            "
          >
            50 minutos de consulta + 10 minutos
            de descanso = turnos cada 60 minutos.
          </strong>

        </div>

      </div>


      <form
        id="availabilityForm"
        class="card"
        style="
          padding:20px;
          margin-bottom:20px;
        "
      >

        <h3 style="margin-top:0;">
          ➕ Agregar horario habitual
        </h3>

        <p
          class="small muted"
          style="margin-top:6px;"
        >
          Indicá cuándo atendés normalmente.
          Después podés agregar bloques en los que
          no querés recibir turnos.
        </p>


        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(180px,1fr)
              );
            gap:14px;
            margin-top:16px;
          "
        >

          <label>

            <span class="small">
              Día
            </span>

            <select
              id="availabilityDay"
              required
              style="
                width:100%;
                margin-top:5px;
              "
            >

              <option value="">
                Seleccionar día
              </option>

              <option value="1">
                Lunes
              </option>

              <option value="2">
                Martes
              </option>

              <option value="3">
                Miércoles
              </option>

              <option value="4">
                Jueves
              </option>

              <option value="5">
                Viernes
              </option>

              <option value="6">
                Sábado
              </option>

              <option value="0">
                Domingo
              </option>

            </select>

          </label>


          <label>

            <span class="small">
              Desde
            </span>

            <input
              type="time"
              id="availabilityStart"
              required
              style="
                width:100%;
                margin-top:5px;
              "
            >

          </label>


          <label>

            <span class="small">
              Hasta
            </span>

            <input
              type="time"
              id="availabilityEnd"
              required
              style="
                width:100%;
                margin-top:5px;
              "
            >

          </label>


          <label>

            <span class="small">
              Modalidad
            </span>

            <select
              id="availabilityModality"
              required
              style="
                width:100%;
                margin-top:5px;
              "
            >

              <option value="virtual">
                Virtual
              </option>

              <option value="presencial">
                Presencial
              </option>

              <option value="ambas">
                Ambas
              </option>

            </select>

          </label>


          <label>

            <span class="small">
              Zona
            </span>

            <input
              type="text"
              id="availabilityZone"
              maxlength="100"
              placeholder="Ej. Avellaneda"
              style="
                width:100%;
                margin-top:5px;
              "
            >

          </label>

        </div>


        <button
          type="submit"
          class="btn primary"
          style="margin-top:18px;"
        >
          + Agregar horario
        </button>


        <div
          id="availabilityFormMessage"
          style="margin-top:12px;"
        ></div>

      </form>


      <div
        style="
          margin-bottom:28px;
        "
      >

        <h3>
          Horarios configurados
        </h3>


        ${
          rows.length === 0

            ? `

              <div class="card">

                <p style="margin:0;">
                  Todavía no configuraste ningún horario.
                </p>

                <p
                  class="small muted"
                  style="margin-top:6px;"
                >
                  Agregá arriba los días y horarios
                  en los que atendés.
                </p>

              </div>

            `

            : rows
                .map(row => {

                  const day =
                    days[
                      Number(
                        row.day_of_week
                      )
                    ] ||
                    'Día';


                  const start =
                    String(
                      row.start_time || ''
                    ).slice(
                      0,
                      5
                    );


                  const end =
                    String(
                      row.end_time || ''
                    ).slice(
                      0,
                      5
                    );


                  const modalityLabel =
                    row.modality === 'presencial'
                      ? 'Presencial'
                      : row.modality === 'ambas'
                        ? 'Presencial y virtual'
                        : 'Virtual';


                  const zone =
                    row.zone
                      ? escapeHTML(
                          row.zone
                        )
                      : '';


                  return `

                    <article
                      class="card"
                      style="
                        padding:18px;
                        margin-bottom:12px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                        flex-wrap:wrap;
                        opacity:${
                          row.is_active
                            ? '1'
                            : '.55'
                        };
                      "
                    >

                      <div>

                        <strong>
                          ${escapeHTML(day)}
                        </strong>

                        <div style="margin-top:5px;">
                          ${start} – ${end}
                        </div>

                        <div
                          class="small muted"
                          style="margin-top:5px;"
                        >
                          ${escapeHTML(modalityLabel)}
                          ${
                            zone
                              ? ` · ${zone}`
                              : ''
                          }
                        </div>

                      </div>


                      <div
                        style="
                          display:flex;
                          gap:8px;
                          flex-wrap:wrap;
                        "
                      >

                        <button
                          type="button"
                          class="
                            btn
                            secondary
                            toggle-availability
                          "
                          data-id="${row.id}"
                          data-active="${row.is_active}"
                          style="font-size:12px;"
                        >
                          ${
                            row.is_active
                              ? 'Desactivar'
                              : 'Activar'
                          }
                        </button>


                        <button
                          type="button"
                          class="
                            btn
                            secondary
                            delete-availability
                          "
                          data-id="${row.id}"
                          style="
                            font-size:12px;
                            border-color:#b91c1c;
                            color:#b91c1c;
                          "
                        >
                          🗑 Eliminar
                        </button>

                      </div>

                    </article>

                  `;

                })
                .join('')

        }

      </div>


      <div
        class="card"
        style="
          padding:20px;
          margin-bottom:20px;
        "
      >

        <h3 style="margin-top:0;">
          🚫 Horarios en los que no atendés
        </h3>

        <p
          class="small muted"
          style="margin-top:6px;"
        >
          Podés bloquear períodos dentro de tus horarios
          habituales. Por ejemplo, si atendés de 08:00 a
          20:00, podés bloquear de 12:00 a 13:00 para almorzar.
        </p>


        <form
          id="unavailabilityForm"
          style="margin-top:18px;"
        >

          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(180px,1fr)
                );
              gap:14px;
            "
          >

            <label>

              <span class="small">
                Día
              </span>

              <select
                id="unavailabilityDay"
                required
                style="
                  width:100%;
                  margin-top:5px;
                "
              >

                <option value="">
                  Seleccionar día
                </option>

                <option value="1">
                  Lunes
                </option>

                <option value="2">
                  Martes
                </option>

                <option value="3">
                  Miércoles
                </option>

                <option value="4">
                  Jueves
                </option>

                <option value="5">
                  Viernes
                </option>

                <option value="6">
                  Sábado
                </option>

                <option value="0">
                  Domingo
                </option>

              </select>

            </label>


            <label>

              <span class="small">
                Desde
              </span>

              <input
                type="time"
                id="unavailabilityStart"
                required
                style="
                  width:100%;
                  margin-top:5px;
                "
              >

            </label>


            <label>

              <span class="small">
                Hasta
              </span>

              <input
                type="time"
                id="unavailabilityEnd"
                required
                style="
                  width:100%;
                  margin-top:5px;
                "
              >

            </label>


            <label>

              <span class="small">
                Motivo (opcional)
              </span>

              <input
                type="text"
                id="unavailabilityReason"
                maxlength="150"
                placeholder="Ej. Almuerzo"
                style="
                  width:100%;
                  margin-top:5px;
                "
              >

            </label>

          </div>


          <button
            type="submit"
            class="btn secondary"
            style="margin-top:18px;"
          >
            + Agregar período sin atención
          </button>


          <div
            id="unavailabilityFormMessage"
            style="margin-top:12px;"
          ></div>

        </form>


        <div
          style="
            margin-top:24px;
          "
        >

          <h4>
            Bloques configurados
          </h4>


          ${
            unavailableRows.length === 0

              ? `

                <p class="small muted">
                  Todavía no configuraste bloques
                  de no atención.
                </p>

              `

              : unavailableRows
                  .map(row => {

                    const day =
                      row.day_of_week !== null &&
                      row.day_of_week !== undefined

                        ? days[
                            Number(
                              row.day_of_week
                            )
                          ]

                        : 'Fecha específica';


                    const start =
                      String(
                        row.start_time || ''
                      ).slice(0,5);


                    const end =
                      String(
                        row.end_time || ''
                      ).slice(0,5);


                    const reason =
                      row.reason
                        ? escapeHTML(
                            row.reason
                          )
                        : 'Sin motivo indicado';


                    return `

                      <article
                        class="card"
                        style="
                          padding:16px;
                          margin-bottom:10px;
                          display:flex;
                          justify-content:space-between;
                          align-items:center;
                          gap:12px;
                          flex-wrap:wrap;
                          opacity:${
                            row.is_active
                              ? '1'
                              : '.55'
                          };
                        "
                      >

                        <div>

                          <strong>
                            ${escapeHTML(day)}
                          </strong>

                          <div
                            style="
                              margin-top:4px;
                            "
                          >
                            ${start} – ${end}
                          </div>

                          <div
                            class="small muted"
                            style="
                              margin-top:4px;
                            "
                          >
                            ${reason}
                          </div>

                        </div>


                        <div
                          style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                          "
                        >

                          <button
                            type="button"
                            class="
                              btn
                              secondary
                              toggle-unavailability
                            "
                            data-id="${row.id}"
                            data-active="${row.is_active}"
                            style="font-size:12px;"
                          >
                            ${
                              row.is_active
                                ? 'Desactivar'
                                : 'Activar'
                            }
                          </button>


                          <button
                            type="button"
                            class="
                              btn
                              secondary
                              delete-unavailability
                            "
                            data-id="${row.id}"
                            style="
                              font-size:12px;
                              border-color:#b91c1c;
                              color:#b91c1c;
                            "
                          >
                            🗑 Eliminar
                          </button>

                        </div>

                      </article>

                    `;

                  })
                  .join('')

          }

        </div>

      </div>

    `;


    // ===================================================
    // CONFIGURACIÓN DE DURACIÓN
    // ===================================================

    const durationSelect =
      document.getElementById(
        'appointmentDuration'
      );

    const customDurationContainer =
      document.getElementById(
        'customDurationContainer'
      );

    const customDurationInput =
      document.getElementById(
        'customAppointmentDuration'
      );


    const breakSelect =
      document.getElementById(
        'appointmentBreak'
      );

    const customBreakContainer =
      document.getElementById(
        'customBreakContainer'
      );

    const customBreakInput =
      document.getElementById(
        'customAppointmentBreak'
      );


    const settingsMessage =
      document.getElementById(
        'appointmentSettingsMessage'
      );

    const settingsExample =
      document.getElementById(
        'appointmentSettingsExample'
      );

    const saveSettingsButton =
      document.getElementById(
        'saveAppointmentSettings'
      );


    const standardDurations =
      [30,45,50,60];

    const standardBreaks =
      [0,5,10,15,20,30];


    if (durationSelect) {

      if (
        standardDurations.includes(
          appointmentDuration
        )
      ) {

        durationSelect.value =
          String(
            appointmentDuration
          );

      } else {

        durationSelect.value =
          'custom';

        if (customDurationContainer) {

          customDurationContainer.style.display =
            'block';

        }

        if (customDurationInput) {

          customDurationInput.value =
            appointmentDuration;

        }

      }


      durationSelect.addEventListener(
        'change',
        () => {

          if (
            durationSelect.value ===
            'custom'
          ) {

            if (customDurationContainer) {

              customDurationContainer.style.display =
                'block';

            }

          } else {

            if (customDurationContainer) {

              customDurationContainer.style.display =
                'none';

            }

          }

          updateSettingsExample();

        }
      );

    }


    if (breakSelect) {

      if (
        standardBreaks.includes(
          appointmentBreak
        )
      ) {

        breakSelect.value =
          String(
            appointmentBreak
          );

      } else {

        breakSelect.value =
          'custom';

        if (customBreakContainer) {

          customBreakContainer.style.display =
            'block';

        }

        if (customBreakInput) {

          customBreakInput.value =
            appointmentBreak;

        }

      }


      breakSelect.addEventListener(
        'change',
        () => {

          if (
            breakSelect.value ===
            'custom'
          ) {

            if (customBreakContainer) {

              customBreakContainer.style.display =
                'block';

            }

          } else {

            if (customBreakContainer) {

              customBreakContainer.style.display =
                'none';

            }

          }

          updateSettingsExample();

        }
      );

    }


    function getSelectedDuration() {

      if (
        durationSelect?.value ===
        'custom'
      ) {

        return Number(
          customDurationInput?.value
        );

      }

      return Number(
        durationSelect?.value
      );

    }


    function getSelectedBreak() {

      if (
        breakSelect?.value ===
        'custom'
      ) {

        return Number(
          customBreakInput?.value
        );

      }

      return Number(
        breakSelect?.value
      );

    }


    function updateSettingsExample() {

      const duration =
        getSelectedDuration();

      const breakMinutes =
        getSelectedBreak();


      if (
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 240
      ) {
        return;
      }


      if (
        !Number.isInteger(breakMinutes) ||
        breakMinutes < 0 ||
        breakMinutes > 120
      ) {
        return;
      }


      const frequency =
        duration +
        breakMinutes;


      if (settingsExample) {

        settingsExample.textContent =
          `${duration} minutos de consulta + ${breakMinutes} minutos de descanso = turnos cada ${frequency} minutos.`;

      }

    }


    updateSettingsExample();


    // ===================================================
    // GUARDAR DURACIÓN + DESCANSO
    // ===================================================

    if (saveSettingsButton) {

      saveSettingsButton.addEventListener(
        'click',
        async () => {

          const newDuration =
            getSelectedDuration();

          const newBreak =
            getSelectedBreak();


          if (
            !Number.isInteger(newDuration) ||
            newDuration < 1 ||
            newDuration > 240
          ) {

            if (settingsMessage) {

              settingsMessage.innerHTML = `

                <div class="message error">
                  La duración debe ser un número entero
                  entre 1 y 240 minutos.
                </div>

              `;

            }

            return;

          }


          if (
            !Number.isInteger(newBreak) ||
            newBreak < 0 ||
            newBreak > 120
          ) {

            if (settingsMessage) {

              settingsMessage.innerHTML = `

                <div class="message error">
                  El tiempo de descanso debe ser un número
                  entero entre 0 y 120 minutos.
                </div>

              `;

            }

            return;

          }


          saveSettingsButton.disabled =
            true;

          saveSettingsButton.textContent =
            'Guardando…';


          if (settingsMessage) {
            settingsMessage.innerHTML = '';
          }


          const {
            error
          } = await sb
            .from('profiles')
            .update({

              appointment_duration:
                newDuration,

              appointment_break:
                newBreak

            })
            .eq(
              'id',
              user.id
            );


          if (error) {

            console.error(
              'Error guardando configuración:',
              error
            );


            if (settingsMessage) {

              settingsMessage.innerHTML = `

                <div class="message error">
                  No se pudo guardar la configuración.
                </div>

              `;

            }


            saveSettingsButton.disabled =
              false;

            saveSettingsButton.textContent =
              'Guardar configuración';

            return;

          }


          appointmentDuration =
            newDuration;

          appointmentBreak =
            newBreak;


          if (settingsMessage) {

            settingsMessage.innerHTML = `

              <div class="message success">
                Configuración guardada correctamente.
              </div>

            `;

          }


          saveSettingsButton.disabled =
            false;

          saveSettingsButton.textContent =
            'Guardar configuración';


          updateSettingsExample();

        }
      );

    }


    // ===================================================
    // AGREGAR HORARIO HABITUAL
    // ===================================================

    const form =
      document.getElementById(
        'availabilityForm'
      );


    if (form) {

      form.addEventListener(
        'submit',
        async event => {

          event.preventDefault();


          const day =
            document.getElementById(
              'availabilityDay'
            )?.value;


          const start =
            document.getElementById(
              'availabilityStart'
            )?.value;


          const end =
            document.getElementById(
              'availabilityEnd'
            )?.value;


          const modality =
            document.getElementById(
              'availabilityModality'
            )?.value;


          const zone =
            document.getElementById(
              'availabilityZone'
            )?.value.trim();


          const message =
            document.getElementById(
              'availabilityFormMessage'
            );


          if (
            !day ||
            !start ||
            !end
          ) {

            if (message) {

              message.innerHTML = `

                <div class="message error">
                  Completá el día y el horario.
                </div>

              `;

            }

            return;

          }


          if (end <= start) {

            if (message) {

              message.innerHTML = `

                <div class="message error">
                  La hora de finalización debe ser
                  posterior a la hora de inicio.
                </div>

              `;

            }

            return;

          }


          const button =
            form.querySelector(
              'button[type="submit"]'
            );


          if (button) {

            button.disabled =
              true;

            button.textContent =
              'Guardando…';

          }


          const {
            error
          } = await sb
            .from('professional_availability')
            .insert({

              professional_id:
                user.id,

              day_of_week:
                Number(day),

              start_time:
                start,

              end_time:
                end,

              modality:
                modality,

              zone:
                zone || null,

              is_active:
                true

            });


          if (error) {

            console.error(
              'Error guardando disponibilidad:',
              error
            );


            if (message) {

              message.innerHTML = `

                <div class="message error">
                  No se pudo guardar el horario.
                </div>

              `;

            }


            if (button) {

              button.disabled =
                false;

              button.textContent =
                '+ Agregar horario';

            }

            return;

          }


          await loadAvailability();

        }
      );

    }


    // ===================================================
    // AGREGAR BLOQUE SIN ATENCIÓN
    // ===================================================

    const unavailabilityForm =
      document.getElementById(
        'unavailabilityForm'
      );


    if (unavailabilityForm) {

      unavailabilityForm.addEventListener(
        'submit',
        async event => {

          event.preventDefault();


          const day =
            document.getElementById(
              'unavailabilityDay'
            )?.value;


          const start =
            document.getElementById(
              'unavailabilityStart'
            )?.value;


          const end =
            document.getElementById(
              'unavailabilityEnd'
            )?.value;


          const reason =
            document.getElementById(
              'unavailabilityReason'
            )?.value.trim();


          const message =
            document.getElementById(
              'unavailabilityFormMessage'
            );


          if (
            !day ||
            !start ||
            !end
          ) {

            if (message) {

              message.innerHTML = `

                <div class="message error">
                  Completá el día y el horario.
                </div>

              `;

            }

            return;

          }


          if (end <= start) {

            if (message) {

              message.innerHTML = `

                <div class="message error">
                  La hora de finalización debe ser
                  posterior a la hora de inicio.
                </div>

              `;

            }

            return;

          }


          const button =
            unavailabilityForm.querySelector(
              'button[type="submit"]'
            );


          if (button) {

            button.disabled =
              true;

            button.textContent =
              'Guardando…';

          }


          const {
            error
          } = await sb
            .from('professional_unavailability')
            .insert({

              professional_id:
                user.id,

              day_of_week:
                Number(day),

              specific_date:
                null,

              start_time:
                start,

              end_time:
                end,

              reason:
                reason || null,

              is_active:
                true

            });


          if (error) {

            console.error(
              'Error guardando bloque sin atención:',
              error
            );


            if (message) {

              message.innerHTML = `

                <div class="message error">
                  No se pudo guardar el período
                  de no atención.
                </div>

              `;

            }


            if (button) {

              button.disabled =
                false;

              button.textContent =
                '+ Agregar período sin atención';

            }

            return;

          }


          await loadAvailability();

        }
      );

    }


    // ===================================================
    // ACTIVAR / DESACTIVAR HORARIOS
    // ===================================================

    availabilityContent
      .querySelectorAll(
        '.toggle-availability'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;


            const active =
              button.dataset.active ===
              'true';


            if (!id) {
              return;
            }


            button.disabled =
              true;


            const {
              error
            } = await sb
              .from('professional_availability')
              .update({

                is_active:
                  !active,

                updated_at:
                  new Date().toISOString()

              })
              .eq(
                'id',
                id
              )
              .eq(
                'professional_id',
                user.id
              );


            if (error) {

              console.error(
                'Error actualizando disponibilidad:',
                error
              );


              button.disabled =
                false;


              alert(
                'No se pudo actualizar el horario.'
              );

              return;

            }


            await loadAvailability();

          }
        );

      });


    // ===================================================
    // ELIMINAR HORARIO
    // ===================================================

    availabilityContent
      .querySelectorAll(
        '.delete-availability'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;


            if (!id) {
              return;
            }


            const confirmed =
              confirm(
                '¿Eliminar este horario?\n\n' +
                'Esta acción no se puede deshacer.'
              );


            if (!confirmed) {
              return;
            }


            button.disabled =
              true;

            button.textContent =
              'Eliminando…';


            const {
              error
            } = await sb
              .from('professional_availability')
              .delete()
              .eq(
                'id',
                id
              )
              .eq(
                'professional_id',
                user.id
              );


            if (error) {

              console.error(
                'Error eliminando disponibilidad:',
                error
              );


              button.disabled =
                false;

              button.textContent =
                '🗑 Eliminar';


              alert(
                'No se pudo eliminar el horario.'
              );

              return;

            }


            await loadAvailability();

          }
        );

      });


    // ===================================================
    // ACTIVAR / DESACTIVAR BLOQUES
    // ===================================================

    availabilityContent
      .querySelectorAll(
        '.toggle-unavailability'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;


            const active =
              button.dataset.active ===
              'true';


            if (!id) {
              return;
            }


            button.disabled =
              true;


            const {
              error
            } = await sb
              .from('professional_unavailability')
              .update({

                is_active:
                  !active,

                updated_at:
                  new Date().toISOString()

              })
              .eq(
                'id',
                id
              )
              .eq(
                'professional_id',
                user.id
              );


            if (error) {

              console.error(
                'Error actualizando bloque:',
                error
              );


              button.disabled =
                false;


              alert(
                'No se pudo actualizar el bloque.'
              );

              return;

            }


            await loadAvailability();

          }
        );

      });


    // ===================================================
    // ELIMINAR BLOQUE
    // ===================================================

    availabilityContent
      .querySelectorAll(
        '.delete-unavailability'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;


            if (!id) {
              return;
            }


            const confirmed =
              confirm(
                '¿Eliminar este período sin atención?\n\n' +
                'Esta acción no se puede deshacer.'
              );


            if (!confirmed) {
              return;
            }


            button.disabled =
              true;

            button.textContent =
              'Eliminando…';


            const {
              error
            } = await sb
              .from('professional_unavailability')
              .delete()
              .eq(
                'id',
                id
              )
              .eq(
                'professional_id',
                user.id
              );


            if (error) {

              console.error(
                'Error eliminando bloque:',
                error
              );


              button.disabled =
                false;

              button.textContent =
                '🗑 Eliminar';


              alert(
                'No se pudo eliminar el bloque.'
              );

              return;

            }


            await loadAvailability();

          }
        );

      });

  }


  // =====================================================
  // CONSULTAS
  // =====================================================
async function loadAppointments() {

  const container =
    document.getElementById('appointmentsContent');

  if (!container) return;

  if (!isPro) {
    container.innerHTML = `
      <p class="small">
        La gestión de turnos está disponible con el plan Pro.
      </p>
    `;
    return;
  }

  container.innerHTML = `
    <p class="small">
      Cargando turnos…
    </p>
  `;

  const {
    data,
    error
  } = await sb
    .from('professional_appointments')
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      modality,
      zone,
      status,
      patient_name,
      patient_whatsapp,
      patient_email,
      notes,
      created_at
    `)
    .eq('professional_id', user.id)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error cargando turnos:', error);

    container.innerHTML = `
      <p class="small" style="color:#b42318;">
        No se pudieron cargar los turnos.
      </p>
    `;

    return;
  }

    // Acá termina loadAppointments()
}
  
 async function loadProfessionalInquiries() {

  if (!consultasContent) {
    return;
  }

  const {
    data,
    error
  } = await sb
    .from('professional_inquiries')
    .select(`
      id,
      patient_name,
      patient_age,
      patient_whatsapp,
      patient_email,
      modality,
      availability,
      zone,
      reason,
      message,
      professional_reply,
      status,
      created_at,
      updated_at
    `)
    .eq(
      'professional_id',
      user.id
    )
    .order(
      'created_at',
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      'Error cargando consultas:',
      error
    );

    consultasContent.innerHTML = `
      <div class="message error">
        No se pudieron cargar las consultas.
      </div>
    `;

    return;
  }


  const inquiries = data || [];


  if (inquiries.length === 0) {

    consultasContent.innerHTML = `
      <div class="card">
        <p style="margin:0;">
          Todavía no recibiste consultas.
        </p>

        <p
          class="small muted"
          style="margin-top:6px;"
        >
          Cuando un paciente te escriba desde tu perfil,
          la consulta aparecerá acá.
        </p>
      </div>
    `;

    return;
  }


  consultasContent.innerHTML = inquiries
    .map(inquiry => {

      const createdDate =
        inquiry.created_at
          ? new Date(
              inquiry.created_at
            ).toLocaleString(
              'es-AR',
              {
                dateStyle: 'medium',
                timeStyle: 'short'
              }
            )
          : '';


      const hasReply =
        Boolean(
          inquiry.professional_reply &&
          inquiry.professional_reply.trim()
        );


      const statusLabel =
        inquiry.status === 'responded'
          ? 'Respondida'
          : 'Nueva';


      const statusClass =
        inquiry.status === 'responded'
          ? 'success'
          : '';


      return `

        <article
          class="card"
          style="
            padding:20px;
            margin-bottom:16px;
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:12px;
              flex-wrap:wrap;
            "
          >

            <div>

              <strong
                style="
                  font-size:18px;
                "
              >
                ${escapeHTML(
                  inquiry.patient_name ||
                  'Paciente'
                )}
              </strong>

              ${
                inquiry.patient_age
                  ? `
                    <div
                      class="small muted"
                      style="margin-top:4px;"
                    >
                      ${escapeHTML(
                        inquiry.patient_age
                      )} años
                    </div>
                  `
                  : ''
              }

            </div>


            <span
              class="badge ${statusClass}"
            >
              ${statusLabel}
            </span>

          </div>


          <div
            class="small muted"
            style="margin-top:8px;"
          >
            ${escapeHTML(createdDate)}
          </div>


          <div
            style="
              margin-top:18px;
              padding:16px;
              border-radius:12px;
              background:var(--background);
            "
          >

            <strong>
              Consulta del paciente
            </strong>

            ${
              inquiry.modality
                ? `
                  <div
                    class="small"
                    style="margin-top:8px;"
                  >
                    <strong>Modalidad:</strong>
                    ${escapeHTML(
                      inquiry.modality
                    )}
                  </div>
                `
                : ''
            }


            ${
              inquiry.availability
                ? `
                  <div
                    class="small"
                    style="margin-top:5px;"
                  >
                    <strong>Disponibilidad:</strong>
                    ${escapeHTML(
                      inquiry.availability
                    )}
                  </div>
                `
                : ''
            }


            ${
              inquiry.zone
                ? `
                  <div
                    class="small"
                    style="margin-top:5px;"
                  >
                    <strong>Zona:</strong>
                    ${escapeHTML(
                      inquiry.zone
                    )}
                  </div>
                `
                : ''
            }


            ${
              inquiry.reason
                ? `
                  <div
                    class="small"
                    style="margin-top:5px;"
                  >
                    <strong>Motivo:</strong>
                    ${escapeHTML(
                      inquiry.reason
                    )}
                  </div>
                `
                : ''
            }


            <div
              style="
                margin-top:14px;
                line-height:1.6;
              "
            >
              ${escapeHTML(
                inquiry.message ||
                ''
              ).replace(
                /\n/g,
                '<br>'
              )}
            </div>

          </div>


          ${
            hasReply

              ? `

                <div
                  style="
                    margin-top:18px;
                    padding:16px;
                    border-radius:12px;
                    border:1px solid rgba(34,197,94,.25);
                    background:rgba(34,197,94,.06);
                  "
                >

                  <div
                    style="
                      font-weight:600;
                      margin-bottom:8px;
                    "
                  >
                    ✓ Respuesta enviada
                  </div>

                  <div
                    style="
                      line-height:1.6;
                    "
                  >
                    ${escapeHTML(
                      inquiry.professional_reply
                    ).replace(
                      /\n/g,
                      '<br>'
                    )}
                  </div>

                </div>

                <div
                  style="
                    margin-top:14px;
                  "
                >

                  <button
                    type="button"
                    class="btn secondary edit-inquiry-reply"
                    data-id="${inquiry.id}"
                  >
                    Editar respuesta
                  </button>

                </div>

                <div
                  class="inquiry-reply-editor"
                  data-id="${inquiry.id}"
                  style="
                    display:none;
                    margin-top:14px;
                  "
                >

                  <textarea
                    class="inquiry-reply"
                    data-id="${inquiry.id}"
                    rows="5"
                    style="
                      width:100%;
                      resize:vertical;
                    "
                  >${escapeHTML(
                    inquiry.professional_reply
                  )}</textarea>

                  <div
                    style="
                      display:flex;
                      gap:8px;
                      flex-wrap:wrap;
                      margin-top:10px;
                    "
                  >

                    <button
                      type="button"
                      class="btn primary save-inquiry-reply"
                      data-id="${inquiry.id}"
                    >
                      Guardar respuesta
                    </button>

                    <button
                      type="button"
                      class="btn secondary cancel-inquiry-edit"
                      data-id="${inquiry.id}"
                    >
                      Cancelar
                    </button>

                  </div>

                </div>

              `

              : `

                <div
                  style="
                    margin-top:18px;
                  "
                >

                  <strong>
                    Responder al paciente
                  </strong>

                  <textarea
                    class="inquiry-reply"
                    data-id="${inquiry.id}"
                    rows="5"
                    placeholder="Escribí tu respuesta..."
                    style="
                      width:100%;
                      margin-top:8px;
                      resize:vertical;
                    "
                  ></textarea>

                  <button
                    type="button"
                    class="btn primary save-inquiry-reply"
                    data-id="${inquiry.id}"
                    style="margin-top:10px;"
                  >
                    Guardar respuesta
                  </button>

                </div>

              `
          }


          ${
            inquiry.status !== 'responded'
              ? `
                <button
                  type="button"
                  class="btn secondary mark-inquiry-responded"
                  data-id="${inquiry.id}"
                  style="
                    margin-top:10px;
                  "
                >
                  Marcar como respondida
                </button>
              `
              : ''
          }


          <button
            type="button"
            class="btn secondary delete-inquiry"
            data-id="${inquiry.id}"
            style="
              margin-top:10px;
              border-color:#b91c1c;
              color:#b91c1c;
            "
          >
            Eliminar consulta
          </button>

        </article>

      `;

    })
    .join('');


  // ===================================================
  // GUARDAR RESPUESTA
  // ===================================================

  consultasContent
    .querySelectorAll(
      '.save-inquiry-reply'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const inquiryId =
            button.dataset.id;


          const textarea =
            consultasContent.querySelector(
              `.inquiry-reply[data-id="${inquiryId}"]`
            );


          const reply =
            textarea?.value.trim() || '';


          if (!reply) {

            alert(
              'Escribí una respuesta antes de guardarla.'
            );

            return;

          }


          button.disabled =
            true;

          button.textContent =
            'Enviando…';


          const {
            error
          } = await sb
            .from('professional_inquiries')
            .update({
              professional_reply:
                reply,

              status:
                'responded',

              updated_at:
                new Date().toISOString()
            })
            .eq(
              'id',
              inquiryId
            )
            .eq(
              'professional_id',
              user.id
            );


          if (error) {

            console.error(
              'Error guardando respuesta:',
              error
            );


            button.disabled =
              false;

            button.textContent =
              'Guardar respuesta';


            alert(
              'No se pudo enviar la respuesta.'
            );

            return;

          }


          await loadProfessionalInquiries();

        }
      );

    });


  // ===================================================
  // EDITAR RESPUESTA
  // ===================================================

  consultasContent
    .querySelectorAll(
      '.edit-inquiry-reply'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const inquiryId =
            button.dataset.id;


          const editor =
            consultasContent.querySelector(
              `.inquiry-reply-editor[data-id="${inquiryId}"]`
            );


          if (editor) {

            editor.style.display =
              'block';

          }


          button.style.display =
            'none';

        }
      );

    });


  // ===================================================
  // CANCELAR EDICIÓN
  // ===================================================

  consultasContent
    .querySelectorAll(
      '.cancel-inquiry-edit'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const inquiryId =
            button.dataset.id;


          const editor =
            consultasContent.querySelector(
              `.inquiry-reply-editor[data-id="${inquiryId}"]`
            );


          const editButton =
            consultasContent.querySelector(
              `.edit-inquiry-reply[data-id="${inquiryId}"]`
            );


          if (editor) {

            editor.style.display =
              'none';

          }


          if (editButton) {

            editButton.style.display =
              'inline-block';

          }

        }
      );

    });


  // ===================================================
  // MARCAR COMO RESPONDIDA
  // ===================================================

  consultasContent
    .querySelectorAll(
      '.mark-inquiry-responded'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const inquiryId =
            button.dataset.id;


          button.disabled =
            true;


          const {
            error
          } = await sb
            .from('professional_inquiries')
            .update({

              status:
                'responded',

              updated_at:
                new Date().toISOString()

            })
            .eq(
              'id',
              inquiryId
            )
            .eq(
              'professional_id',
              user.id
            );


          if (error) {

            console.error(
              'Error marcando consulta:',
              error
            );


            button.disabled =
              false;


            alert(
              'No se pudo actualizar la consulta.'
            );

            return;

          }


          await loadProfessionalInquiries();

        }
      );

    });


  // ===================================================
  // ELIMINAR CONSULTA
  // ===================================================

  consultasContent
    .querySelectorAll(
      '.delete-inquiry'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const inquiryId =
            button.dataset.id;


          const confirmed =
            confirm(
              '¿Eliminar esta consulta?\n\n' +
              'Esta acción no se puede deshacer.'
            );


          if (!confirmed) {
            return;
          }


          button.disabled =
            true;

          button.textContent =
            'Eliminando…';


          const {
            error
          } = await sb
            .from('professional_inquiries')
            .delete()
            .eq(
              'id',
              inquiryId
            )
            .eq(
              'professional_id',
              user.id
            );


          if (error) {

            console.error(
              'Error eliminando consulta:',
              error
            );


            button.disabled =
              false;

            button.textContent =
              'Eliminar consulta';


            alert(
              'No se pudo eliminar la consulta.'
            );

            return;

          }


          await loadProfessionalInquiries();

        }
      );

    });

}


  // =====================================================
  // LOGOUT
  // =====================================================

  const logoutButton =
    document.getElementById(
      'logoutButton'
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      'click',
      async () => {

        await logout();

      }
    );

  }


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  try {

    await loadProfile();

    await loadSubscription();

    await loadProfessionalInquiries();

    await loadAppointments();

    await loadAvailability();


    console.log(
      'Dashboard cargado correctamente.'
    );


  } catch (error) {

    console.error(
      'Error general del dashboard:',
      error
    );


    if (subscriptionTitle) {

      subscriptionTitle.textContent =
        'No se pudo cargar el panel';

    }


    if (subscriptionDescription) {

      subscriptionDescription.textContent =
        'Ocurrió un error al consultar los datos.';

    }


    if (subscriptionMessage) {

      subscriptionMessage.textContent =
        'Ocurrió un error al cargar el dashboard.';

      subscriptionMessage.className =
        'message error';

    }

  }

});
