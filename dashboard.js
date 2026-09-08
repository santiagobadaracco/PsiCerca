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


  let subscription = null;

  let isPaidPro = false;

  let isCourtesyPro = false;

  let isPro = false;


  // =====================================================
  // PERFIL
  // =====================================================

  async function loadProfile() {

    const { data, error } = await sb
      .from('profiles')
      .select(`
        display_name,
        license,
        jurisdiction,
        zone,
        modality,
        orientation,
        population,
        bio,
        photo_url,
        user_role
      `)
      .eq('id', user.id)
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


    return data;

  }


  // =====================================================
  // SUSCRIPCIÓN PRO PAGA
  // =====================================================

  async function loadPaidSubscription() {

    const { data, error } = await sb
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

      subscription = null;

      isPaidPro = false;

      return;

    }


    subscription = data;


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


    /*
     * Una cuenta tiene PRO si:
     *
     * - tiene PRO pago activo
     * O
     * - tiene PRO de cortesía activo
     */

    isPro =
      isPaidPro ||
      isCourtesyPro;


    console.log(
      '================================='
    );

    console.log(
      'ESTADO PRO'
    );

    console.log(
      'PRO pago:',
      isPaidPro
    );

    console.log(
      'PRO cortesía:',
      isCourtesyPro
    );

    console.log(
      'PRO total:',
      isPro
    );

    console.log(
      '================================='
    );


    updatePlanUI();

  }


  // =====================================================
  // UI DEL PLAN
  // =====================================================

  function updatePlanUI() {

    if (planBadge) {

      if (isPro) {

        planBadge.textContent =
          'PRO';

        planBadge.className =
          'badge success';

      } else {

        planBadge.textContent =
          'GRATUITO';

        planBadge.className =
          'badge';

      }

    }


    // ---------------------------------------------------
    // TÍTULO
    // ---------------------------------------------------

    if (subscriptionTitle) {

      subscriptionTitle.textContent =
        isPro
          ? 'PsiCerca PRO'
          : 'PsiCerca FREE';

    }


    // ---------------------------------------------------
    // DESCRIPCIÓN
    // ---------------------------------------------------

    if (subscriptionDescription) {


      // PRO DE CORTESÍA

      if (
        isCourtesyPro &&
        !isPaidPro
      ) {

        subscriptionDescription.textContent =
          'Tenés acceso a PsiCerca PRO de cortesía.';

      }


      // PRO PAGO CANCELADO

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


      // PRO PAGO NORMAL

      else if (isPaidPro) {

        subscriptionDescription.textContent =
          'Tenés activo el plan PRO.';

      }


      // PRO PAGO + CORTESÍA

      else if (
        isPro &&
        isCourtesyPro
      ) {

        subscriptionDescription.textContent =
          'Tenés activo el plan PRO.';

      }


      // FREE

      else {

        subscriptionDescription.textContent =
          'Estás utilizando el plan gratuito.';

      }

    }


    // ---------------------------------------------------
    // LABEL
    // ---------------------------------------------------

    if (subscriptionLabel) {

      subscriptionLabel.textContent =
        isPro
          ? 'PLAN ACTIVO'
          : 'SUSCRIPCIÓN';

    }


    // ---------------------------------------------------
    // BOTÓN
    // ---------------------------------------------------

    if (subscriptionButton) {

      subscriptionButton.textContent =
        isPro
          ? 'Ver detalles'
          : 'Conocer PRO';

      subscriptionButton.href =
        '#suscripcion';

    }


    // ---------------------------------------------------
    // CANCELACIÓN
    // ---------------------------------------------------

    renderCancellationUI();

  }


  // =====================================================
  // CANCELACIÓN DE SUSCRIPCIÓN
  // =====================================================

  function renderCancellationUI() {

    /*
     * Eliminamos cualquier bloque anterior.
     */

    const oldBox =
      document.getElementById(
        'cancelSubscriptionBox'
      );


    if (oldBox) {

      oldBox.remove();

    }


    /*
     * Si el usuario tiene PRO exclusivamente
     * por cortesía, NO mostramos ningún botón
     * de cancelación.
     */

    if (
      isCourtesyPro &&
      !isPaidPro
    ) {

      return;

    }


    /*
     * Buscamos dónde insertar el bloque.
     */

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

      console.error(
        'No se encontró ningún contenedor para mostrar la cancelación.'
      );

      return;

    }


    /*
     * Si no tiene PRO pago activo,
     * no mostramos cancelación.
     */

    if (!isPaidPro) {

      return;

    }


    // ===================================================
    // PRO PAGO YA CANCELADO
    // ===================================================

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


    // ===================================================
    // PRO PAGO ACTIVO — MOSTRAR CANCELAR
    // ===================================================

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


    if (!cancelButton) {

      console.error(
        'No se pudo crear el botón de cancelación.'
      );

      return;

    }


    cancelButton.addEventListener(
      'click',
      cancelSubscription
    );

  }


  // =====================================================
  // EJECUTAR CANCELACIÓN
  // =====================================================

  async function cancelSubscription() {

    /*
     * Solo se puede cancelar una suscripción
     * PRO paga.
     */

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
        'Procesando la cancelación…';

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

        console.error(
          'Error cancelando suscripción:',
          error
        );

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


      console.log(
        'Cancelación realizada:',
        data
      );


      if (subscriptionMessage) {

        subscriptionMessage.textContent =
          'La suscripción fue cancelada correctamente. Tu plan PRO continuará activo hasta el final del período abonado.';

        subscriptionMessage.className =
          'message success';

      }


      await loadSubscription();

      await loadProfessionalInquiries();


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
  // CONSULTAS
  // =====================================================

  async function loadProfessionalInquiries() {

    if (!consultasContent) {

      return;

    }


    // ---------------------------------------------------
    // FREE
    // ---------------------------------------------------

    if (!isPro) {

      consultasContent.innerHTML = `

        <strong>
          🔒 Disponible con PsiCerca PRO
        </strong>

        <p class="small">

          Recibí consultas de personas interesadas
          y gestioná sus datos de contacto desde
          tu panel profesional.

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


    // ---------------------------------------------------
    // CONSULTAS PRO
    // ---------------------------------------------------

    const {
      data,
      error
    } = await sb
      .from(
        'professional_inquiries'
      )
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


    // ---------------------------------------------------
    // SIN CONSULTAS
    // ---------------------------------------------------

    if (
      !data ||
      data.length === 0
    ) {

      consultasContent.innerHTML = `

        <strong>
          📩 Consultas de pacientes
        </strong>

        <p class="small">

          Todavía no recibiste ninguna consulta.
          Cuando una persona interesada te contacte,
          aparecerá aquí.

        </p>

      `;

      return;

    }


    // ---------------------------------------------------
    // RENDER
    // ---------------------------------------------------

    consultasContent.innerHTML =
      data
        .map(inquiry => {

          const safeName =
            escapeHTML(
              inquiry.patient_name || ''
            );


          const safeAge =
            inquiry.patient_age !== null &&
            inquiry.patient_age !== undefined

              ? escapeHTML(
                  String(
                    inquiry.patient_age
                  )
                )

              : '';


          const rawWhatsapp =
            String(
              inquiry.patient_whatsapp || ''
            );


          const whatsappDigits =
            rawWhatsapp.replace(
              /\D/g,
              ''
            );


          const safeWhatsapp =
            escapeHTML(
              rawWhatsapp
            );


          const rawEmail =
            String(
              inquiry.patient_email || ''
            );


          const safeEmail =
            escapeHTML(
              rawEmail
            );


          const safeModality =
            escapeHTML(
              inquiry.modality || ''
            );


          const safeAvailability =
            escapeHTML(
              inquiry.availability || ''
            );


          const safeZone =
            escapeHTML(
              inquiry.zone || ''
            );


          const safeReason =
            escapeHTML(
              inquiry.reason || ''
            );


          const safeMessage =
            escapeHTML(
              inquiry.message || ''
            );


          const createdDate =
            inquiry.created_at

              ? new Date(
                  inquiry.created_at
                ).toLocaleString(
                  'es-AR',
                  {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  }
                )

              : '';


          let statusLabel =
            'Nueva';


          let statusClass =
            'warning';


          if (
            inquiry.status ===
            'responded'
          ) {

            statusLabel =
              'Respondida';

            statusClass =
              'success';

          }


          if (
            inquiry.status ===
            'archived'
          ) {

            statusLabel =
              'Archivada';

            statusClass =
              '';

          }


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

                  <h3 style="margin:0;">

                    ${safeName}

                  </h3>


                  ${
                    createdDate
                      ? `

                        <div
                          class="small muted"
                          style="
                            margin-top:4px;
                          "
                        >

                          ${createdDate}

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


              <!-- DATOS DE CONTACTO -->

              ${
                safeWhatsapp ||
                safeEmail

                  ? `

                    <div
                      style="
                        margin-top:20px;
                        padding:16px;
                        border-radius:14px;
                        background:var(--soft);
                      "
                    >

                      <div
                        class="small muted"
                        style="
                          margin-bottom:10px;
                        "
                      >

                        Datos de contacto

                      </div>


                      ${
                        safeWhatsapp
                          ? `

                            <div
                              style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                flex-wrap:wrap;
                                margin-bottom:
                                  ${safeEmail ? '9px' : '0'};
                              "
                            >

                              <strong>
                                📱 WhatsApp
                              </strong>

                              <span>
                                ${safeWhatsapp}
                              </span>


                              ${
                                whatsappDigits
                                  ? `

                                    <a
                                      class="btn secondary"
                                      href="https://wa.me/${whatsappDigits}"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style="
                                        font-size:12px;
                                        padding:
                                          7px 11px;
                                      "
                                    >

                                      Abrir WhatsApp

                                    </a>

                                  `
                                  : ''
                              }

                            </div>

                          `
                          : ''
                      }


                      ${
                        safeEmail
                          ? `

                            <div
                              style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                flex-wrap:wrap;
                              "
                            >

                              <strong>
                                ✉️ Email
                              </strong>

                              <a
                                href="mailto:${safeEmail}"
                              >

                                ${safeEmail}

                              </a>

                            </div>

                          `
                          : ''
                      }

                    </div>

                  `

                  : `

                    <div
                      class="message error"
                      style="
                        margin-top:20px;
                      "
                    >

                      Esta consulta no tiene
                      datos de contacto.

                    </div>

                  `

              }


              <!-- DATOS DE LA CONSULTA -->

              ${
                safeAge ||
                safeModality ||
                safeZone ||
                safeAvailability

                  ? `

                    <div
                      style="
                        display:grid;
                        grid-template-columns:
                          repeat(
                            auto-fit,
                            minmax(
                              180px,
                              1fr
                            )
                          );
                        gap:12px;
                        margin-top:18px;
                      "
                    >

                      ${
                        safeAge
                          ? `

                            <div>

                              <div class="small muted">
                                Edad
                              </div>

                              <strong>
                                ${safeAge} años
                              </strong>

                            </div>

                          `
                          : ''
                      }


                      ${
                        safeModality
                          ? `

                            <div>

                              <div class="small muted">
                                Modalidad
                              </div>

                              <strong>
                                ${safeModality}
                              </strong>

                            </div>

                          `
                          : ''
                      }


                      ${
                        safeZone
                          ? `

                            <div>

                              <div class="small muted">
                                Zona
                              </div>

                              <strong>
                                ${safeZone}
                              </strong>

                            </div>

                          `
                          : ''
                      }


                      ${
                        safeAvailability
                          ? `

                            <div>

                              <div class="small muted">
                                Disponibilidad
                              </div>

                              <strong>
                                ${safeAvailability}
                              </strong>

                            </div>

                          `
                          : ''
                      }

                    </div>

                  `

                  : ''

              }


              <!-- MOTIVO -->

              ${
                safeReason

                  ? `

                    <div
                      style="
                        margin-top:18px;
                      "
                    >

                      <div class="small muted">

                        Motivo de consulta

                      </div>

                      <div
                        style="
                          margin-top:5px;
                        "
                      >

                        ${safeReason}

                      </div>

                    </div>

                  `

                  : ''

              }


              <!-- MENSAJE -->

              <div
                style="
                  margin-top:18px;
                "
              >

                <div class="small muted">

                  Mensaje

                </div>


                <div
                  style="
                    margin-top:5px;
                    white-space:pre-wrap;
                    line-height:1.5;
                  "
                >

                  ${safeMessage}

                </div>

              </div>


              <!-- ACCIONES -->

              <div
                style="
                  margin-top:20px;
                  display:flex;
                  gap:10px;
                  flex-wrap:wrap;
                "
              >

                ${
                  inquiry.status ===
                  'new'

                    ? `

                      <button
                        type="button"
                        class="
                          btn
                          secondary
                          mark-inquiry-responded
                        "
                        data-id="${inquiry.id}"
                      >

                        Marcar como respondida

                      </button>

                    `

                    : ''

                }


                <button
                  type="button"
                  class="
                    btn
                    secondary
                    delete-inquiry
                  "
                  data-id="${inquiry.id}"
                  style="
                    border-color:#b91c1c;
                    color:#b91c1c;
                  "
                >

                  🗑 Eliminar consulta

                </button>

              </div>

            </article>

          `;

        })
        .join('');


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


            if (!inquiryId) {

              return;

            }


            button.disabled =
              true;

            button.textContent =
              'Guardando…';


            const {
              error
            } = await sb
              .from(
                'professional_inquiries'
              )
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
                'Error actualizando consulta:',
                error
              );


              button.disabled =
                false;

              button.textContent =
                'Marcar como respondida';


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
    // ELIMINAR
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


            if (!inquiryId) {

              return;

            }


            const confirmed =
              confirm(
                '¿Eliminar esta consulta?\n\n' +
                'La consulta se eliminará definitivamente. ' +
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
              .from(
                'professional_inquiries'
              )
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
                '🗑 Eliminar consulta';


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
