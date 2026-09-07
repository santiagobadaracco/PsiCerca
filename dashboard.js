document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireUser();

  if (!user) return;

  const sb = requireSupabase();

  const dashboardContent = document.getElementById('dashboardContent');
  const professionalName = document.getElementById('professionalName');
  const planBadge = document.getElementById('planBadge');

  let subscription = null;
  let isPro = false;

  // =========================================================
  // CARGAR PERFIL DEL PROFESIONAL
  // =========================================================

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
      console.error('Error cargando perfil:', error);
      return null;
    }

    if (professionalName) {
      professionalName.textContent =
        data.display_name || 'Profesional';
    }

    return data;
  }

  // =========================================================
  // CARGAR SUSCRIPCIÓN
  // =========================================================

  async function loadSubscription() {
    const { data, error } = await sb
      .from('subscriptions')
      .select(`
        id,
        plan,
        status,
        expires_at,
        created_at
      `)
      .eq('professional_id', user.id)
      .order('created_at', {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Error cargando suscripción:',
        error
      );

      subscription = null;
      isPro = false;

      return;
    }

    subscription = data;

    isPro =
      !!subscription &&
      subscription.plan === 'pro' &&
      subscription.status === 'active' &&
      (
        !subscription.expires_at ||
        new Date(subscription.expires_at) > new Date()
      );

    updatePlanUI();
  }

  // =========================================================
  // ACTUALIZAR UI DEL PLAN
  // =========================================================

  function updatePlanUI() {
    if (!planBadge) return;

    if (isPro) {
      planBadge.textContent = 'PRO';
      planBadge.className = 'badge success';
    } else {
      planBadge.textContent = 'GRATUITO';
      planBadge.className = 'badge';
    }
  }

  // =========================================================
  // CARGAR CONSULTAS
  // =========================================================

  async function loadProfessionalInquiries() {
    const container =
      document.getElementById(
        'professionalInquiries'
      );

    if (!container) return;

    // -------------------------------------------------------
    // Si no es PRO
    // -------------------------------------------------------

    if (!isPro) {
      container.innerHTML = `
        <div
          class="card"
          style="
            padding:20px;
            text-align:center;
          "
        >
          <h3>
            Consultas de pacientes
          </h3>

          <p class="muted">
            La recepción y gestión de consultas
            de pacientes está disponible en el
            plan PRO.
          </p>

          <a
            href="suscripcion.html"
            class="button"
          >
            Ver plan PRO
          </a>
        </div>
      `;

      return;
    }

    // -------------------------------------------------------
    // Cargar consultas
    // -------------------------------------------------------

    const { data, error } = await sb
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

      container.innerHTML = `
        <div class="card">
          <p class="message error">
            No se pudieron cargar las consultas.
          </p>
        </div>
      `;

      return;
    }

    // -------------------------------------------------------
    // Sin consultas
    // -------------------------------------------------------

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div
          class="card"
          style="
            padding:20px;
            text-align:center;
          "
        >
          <h3>
            No hay consultas todavía
          </h3>

          <p class="muted">
            Cuando un paciente te envíe una consulta,
            aparecerá aquí.
          </p>
        </div>
      `;

      return;
    }

    // -------------------------------------------------------
    // Renderizar consultas
    // -------------------------------------------------------

    container.innerHTML = data
      .map(inquiry => {

        const safeName =
          escapeHTML(
            inquiry.patient_name || ''
          );

        const safeAge =
          inquiry.patient_age !== null &&
          inquiry.patient_age !== undefined
            ? escapeHTML(
                String(inquiry.patient_age)
              )
            : '';

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

        const safeWhatsapp =
          escapeHTML(
            inquiry.patient_whatsapp || ''
          );

        const safeEmail =
          escapeHTML(
            inquiry.patient_email || ''
          );

        // ---------------------------------------------------
        // Normalizar WhatsApp para wa.me
        // ---------------------------------------------------

        const whatsappNumber =
          String(
            inquiry.patient_whatsapp || ''
          ).replace(
            /\D/g,
            ''
          );

        // ---------------------------------------------------
        // Fecha
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // Estado
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // Botón WhatsApp
        // ---------------------------------------------------

        const whatsappBlock =
          safeWhatsapp &&
          whatsappNumber
            ? `
              <div
                style="
                  padding:14px;
                  border:1px solid var(--line);
                  border-radius:12px;
                  background:rgba(0,0,0,.02);
                "
              >
                <div
                  class="small muted"
                >
                  WhatsApp
                </div>

                <div
                  style="
                    margin-top:5px;
                    display:flex;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                  "
                >
                  <a
                    href="https://wa.me/${whatsappNumber}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      font-weight:600;
                      text-decoration:none;
                    "
                  >
                    ${safeWhatsapp}
                  </a>

                  <a
                    href="https://wa.me/${whatsappNumber}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="button"
                    style="
                      display:inline-block;
                      padding:7px 12px;
                      font-size:13px;
                    "
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            `
            : '';

        // ---------------------------------------------------
        // Email
        // ---------------------------------------------------

        const emailBlock =
          safeEmail
            ? `
              <div
                style="
                  padding:14px;
                  border:1px solid var(--line);
                  border-radius:12px;
                  background:rgba(0,0,0,.02);
                "
              >
                <div
                  class="small muted"
                >
                  Email
                </div>

                <div
                  style="
                    margin-top:5px;
                    font-weight:600;
                  "
                >
                  <a
                    href="mailto:${safeEmail}"
                  >
                    ${safeEmail}
                  </a>
                </div>
              </div>
            `
            : '';

        // ---------------------------------------------------
        // Datos del paciente
        // ---------------------------------------------------

        const patientData = `
          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(180px, 1fr)
                );
              gap:10px;
              margin-top:15px;
            "
          >

            ${
              safeAge
                ? `
                  <div>
                    <span class="small muted">
                      Edad
                    </span>

                    <div
                      style="
                        margin-top:3px;
                        font-weight:600;
                      "
                    >
                      ${safeAge} años
                    </div>
                  </div>
                `
                : ''
            }

            ${
              safeModality
                ? `
                  <div>
                    <span class="small muted">
                      Modalidad
                    </span>

                    <div
                      style="
                        margin-top:3px;
                        font-weight:600;
                      "
                    >
                      ${safeModality}
                    </div>
                  </div>
                `
                : ''
            }

            ${
              safeZone
                ? `
                  <div>
                    <span class="small muted">
                      Zona
                    </span>

                    <div
                      style="
                        margin-top:3px;
                        font-weight:600;
                      "
                    >
                      ${safeZone}
                    </div>
                  </div>
                `
                : ''
            }

            ${
              safeAvailability
                ? `
                  <div>
                    <span class="small muted">
                      Disponibilidad
                    </span>

                    <div
                      style="
                        margin-top:3px;
                        font-weight:600;
                      "
                    >
                      ${safeAvailability}
                    </div>
                  </div>
                `
                : ''
            }

          </div>
        `;

        // ---------------------------------------------------
        // Motivo
        // ---------------------------------------------------

        const reasonBlock =
          safeReason
            ? `
              <div
                style="
                  margin-top:18px;
                "
              >
                <div
                  class="small muted"
                >
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
            : '';

        // ---------------------------------------------------
        // Mensaje
        // ---------------------------------------------------

        const messageBlock = `
          <div
            style="
              margin-top:18px;
            "
          >
            <div
              class="small muted"
            >
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
        `;

        // ---------------------------------------------------
        // Acción
        // ---------------------------------------------------

        const actionBlock =
          inquiry.status ===
          'new'
            ? `
              <button
                type="button"
                class="button secondary mark-inquiry-responded"
                data-id="${inquiry.id}"
                style="
                  margin-top:18px;
                "
              >
                Marcar como respondida
              </button>
            `
            : '';

        // ---------------------------------------------------
        // CARD COMPLETA
        // ---------------------------------------------------

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
                <h3
                  style="
                    margin:0;
                  "
                >
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

            ${patientData}

            ${
              whatsappBlock ||
              emailBlock
                ? `
                  <div
                    style="
                      margin-top:18px;
                      display:grid;
                      grid-template-columns:
                        repeat(
                          auto-fit,
                          minmax(220px, 1fr)
                        );
                      gap:10px;
                    "
                  >
                    ${whatsappBlock}
                    ${emailBlock}
                  </div>
                `
                : ''
            }

            ${reasonBlock}

            ${messageBlock}

            ${actionBlock}

          </article>
        `;
      })
      .join('');

    // -------------------------------------------------------
    // Eventos: marcar como respondida
    // -------------------------------------------------------

    container
      .querySelectorAll(
        '.mark-inquiry-responded'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          async () => {

            const inquiryId =
              button.dataset.id;

            if (!inquiryId) return;

            button.disabled = true;

            button.textContent =
              'Guardando...';

            const { error } =
              await sb
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
  }

  // =========================================================
  // DATOS GENERALES DEL DASHBOARD
  // =========================================================

  async function loadDashboard() {
    const profile =
      await loadProfile();

    await loadSubscription();

    await loadProfessionalInquiries();

    // -------------------------------------------------------
    // Datos básicos del dashboard
    // -------------------------------------------------------

    const profileName =
      document.getElementById(
        'profileName'
      );

    if (
      profileName &&
      profile
    ) {
      profileName.textContent =
        profile.display_name ||
        'Profesional';
    }

    const profileLicense =
      document.getElementById(
        'profileLicense'
      );

    if (
      profileLicense &&
      profile
    ) {
      profileLicense.textContent =
        profile.license ||
        'No especificada';
    }

    const profileModality =
      document.getElementById(
        'profileModality'
      );

    if (
      profileModality &&
      profile
    ) {
      profileModality.textContent =
        profile.modality ||
        'No especificada';
    }

    const profileZone =
      document.getElementById(
        'profileZone'
      );

    if (
      profileZone &&
      profile
    ) {
      profileZone.textContent =
        profile.zone ||
        'No especificada';
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

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

  // =========================================================
  // INICIAR DASHBOARD
  // =========================================================

  try {
    await loadDashboard();
  } catch (error) {
    console.error(
      'Error general del dashboard:',
      error
    );

    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="card">
          <p class="message error">
            Ocurrió un error al cargar el dashboard.
          </p>
        </div>
      `;
    }
  }
});
