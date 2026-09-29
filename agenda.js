document.addEventListener('DOMContentLoaded', async () => {

  const user = await requireUser();

  if (!user) return;

  const sb = requireSupabase();

  // =========================================================
  // ESTADO
  // =========================================================

  let currentDate = new Date();
  let currentView = 'week';
  let appointments = [];

  const calendar = document.getElementById('calendar');
  const currentPeriod = document.getElementById('currentPeriod');
  const appointmentModal = document.getElementById('appointmentModal');
  const appointmentForm = document.getElementById('appointmentForm');

  // =========================================================
  // UTILIDADES
  // =========================================================

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function dateToString(date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-');
  }

  function formatShortDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short'
    });
  }

  function escapeHTML(value = '') {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  function getMonday(date) {
    const result = new Date(date);
    const day = result.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);
    result.setHours(0, 0, 0, 0);

    return result;
  }

  function getMonthStart(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );
  }

  function getMonthEnd(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    );
  }

  function getWeekDates(date) {
    const monday = getMonday(date);
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(day);
    }

    return dates;
  }

  function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function getPatientName(appointment) {
    return appointment.patient_name || 'Paciente';
  }

  // =========================================================
  // CARGAR TURNOS
  // =========================================================

  async function loadAppointments() {

    calendar.innerHTML = `
      <div class="empty">
        Cargando agenda...
      </div>
    `;

    let fromDate;
    let toDate;

    if (currentView === 'week') {

      const week = getWeekDates(currentDate);

      fromDate = dateToString(week[0]);
      toDate = dateToString(week[6]);

    } else {

      const monthStart = getMonthStart(currentDate);
      const monthEnd = getMonthEnd(currentDate);

      fromDate = dateToString(monthStart);
      toDate = dateToString(monthEnd);
    }

    const {
      data,
      error
    } = await sb
      .from('professional_appointments')
      .select(`
        id,
        professional_id,
        patient_id,
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
        created_at,
        updated_at
      `)
      .eq('professional_id', user.id)
      .gte('appointment_date', fromDate)
      .lte('appointment_date', toDate)
      .order('appointment_date', {
        ascending: true
      })
      .order('start_time', {
        ascending: true
      });

    if (error) {

      console.error(
        'Error cargando agenda:',
        error
      );

      calendar.innerHTML = `
        <div class="empty">
          No se pudo cargar la agenda.
        </div>
      `;

      return;
    }

    appointments = data || [];

    updateSummary();
    renderCalendar();
  }

  // =========================================================
  // RESUMEN
  // =========================================================

  function updateSummary() {

    const appointmentCount =
      document.getElementById('appointmentCount');

    const patientCount =
      document.getElementById('patientCount');

    const nextAppointment =
      document.getElementById('nextAppointment');

    appointmentCount.textContent =
      appointments.length;

    const patients = new Set();

    appointments.forEach(appointment => {

      if (appointment.patient_name) {
        patients.add(
          appointment.patient_name.trim()
        );
      }
    });

    patientCount.textContent =
      patients.size;

    const now = new Date();

    const futureAppointments =
      appointments
        .map(appointment => {

          const dateTime =
            new Date(
              `${appointment.appointment_date}T${appointment.start_time}`
            );

          return {
            appointment,
            dateTime
          };

        })
        .filter(item =>
          item.dateTime >= now
        )
        .sort((a, b) =>
          a.dateTime - b.dateTime
        );

    if (!futureAppointments.length) {

      nextAppointment.textContent = '—';

      return;
    }

    const next =
      futureAppointments[0].appointment;

    nextAppointment.textContent =
      `${getPatientName(next)} · ${formatShortDate(next.appointment_date)} · ${next.start_time.slice(0, 5)}`;
  }

  // =========================================================
  // TÍTULO
  // =========================================================

  function updatePeriodTitle() {

    if (currentView === 'week') {

      const dates =
        getWeekDates(currentDate);

      const first = dates[0];
      const last = dates[6];

      const firstMonth =
        first.toLocaleDateString('es-AR', {
          month: 'long'
        });

      const lastMonth =
        last.toLocaleDateString('es-AR', {
          month: 'long'
        });

      if (
        first.getMonth() === last.getMonth()
      ) {

        currentPeriod.textContent =
          `${capitalize(firstMonth)} ${first.getFullYear()}`;

      } else {

        currentPeriod.textContent =
          `${capitalize(firstMonth)} – ${capitalize(lastMonth)} ${last.getFullYear()}`;
      }

      return;
    }

    const month =
      currentDate.toLocaleDateString('es-AR', {
        month: 'long'
      });

    currentPeriod.textContent =
      `${capitalize(month)} ${currentDate.getFullYear()}`;
  }

  // =========================================================
  // RENDER
  // =========================================================

  function renderCalendar() {

    updatePeriodTitle();

    if (currentView === 'week') {
      renderWeek();
    } else {
      renderMonth();
    }
  }

  // =========================================================
  // VISTA SEMANAL
  // =========================================================

  function renderWeek() {

    const dates =
      getWeekDates(currentDate);

    const days = [
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
      'Dom'
    ];

    let html = `
      <div
        style="
          overflow-x:auto;
          padding:16px;
        "
      >

        <div
          style="
            min-width:900px;
            display:grid;
            grid-template-columns:70px repeat(7, 1fr);
            border:1px solid var(--line);
            border-radius:12px;
            overflow:hidden;
          "
        >

          <div
            style="
              background:var(--surface);
              border-right:1px solid var(--line);
            "
          ></div>
    `;

    dates.forEach((date, index) => {

      const isToday =
        dateToString(date) ===
        dateToString(new Date());

      html += `
        <div
          style="
            padding:12px 8px;
            text-align:center;
            border-right:1px solid var(--line);
            background:${isToday ? 'rgba(40,125,114,.08)' : 'var(--surface)'};
          "
        >

          <div
            class="small"
            style="font-weight:600;"
          >
            ${days[index]}
          </div>

          <strong
            style="
              display:block;
              margin-top:4px;
              font-size:20px;
            "
          >
            ${date.getDate()}
          </strong>

        </div>
      `;
    });

    for (let hour = 7; hour <= 22; hour++) {

      html += `
        <div
          style="
            min-height:72px;
            padding:8px;
            border-top:1px solid var(--line);
            border-right:1px solid var(--line);
            background:var(--surface);
            font-size:12px;
            color:var(--muted);
          "
        >
          ${pad(hour)}:00
        </div>
      `;

      dates.forEach(date => {

        const dateString =
          dateToString(date);

        const dayAppointments =
          appointments.filter(appointment =>
            appointment.appointment_date === dateString &&
            parseInt(
              appointment.start_time.split(':')[0],
              10
            ) === hour
          );

        html += `
          <div
            data-calendar-date="${dateString}"
            data-calendar-hour="${hour}"
            class="agenda-slot"
            style="
              min-height:72px;
              padding:5px;
              border-top:1px solid var(--line);
              border-right:1px solid var(--line);
              background:var(--surface);
              cursor:pointer;
            "
          >
        `;

        dayAppointments.forEach(appointment => {

          html += renderAppointmentCard(
            appointment
          );

        });

        html += `
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    calendar.innerHTML = html;

    attachSlotListeners();
    attachAppointmentListeners();
  }

  // =========================================================
  // VISTA MENSUAL
  // =========================================================

  function renderMonth() {

    const monthStart =
      getMonthStart(currentDate);

    const monthEnd =
      getMonthEnd(currentDate);

    const firstDay =
      monthStart.getDay() === 0
        ? 6
        : monthStart.getDay() - 1;

    const totalDays =
      monthEnd.getDate();

    const days = [
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
      'Dom'
    ];

    let html = `
      <div
        style="
          padding:16px;
          overflow-x:auto;
        "
      >

        <div
          style="
            min-width:700px;
            display:grid;
            grid-template-columns:repeat(7, 1fr);
            border:1px solid var(--line);
            border-radius:12px;
            overflow:hidden;
          "
        >
    `;

    days.forEach(day => {

      html += `
        <div
          style="
            padding:12px 8px;
            text-align:center;
            font-weight:600;
            font-size:13px;
            border-right:1px solid var(--line);
            border-bottom:1px solid var(--line);
            background:var(--surface);
          "
        >
          ${day}
        </div>
      `;
    });

    for (let i = 0; i < firstDay; i++) {

      html += `
        <div
          style="
            min-height:120px;
            border-right:1px solid var(--line);
            border-bottom:1px solid var(--line);
            background:rgba(0,0,0,.015);
          "
        ></div>
      `;
    }

    for (
      let dayNumber = 1;
      dayNumber <= totalDays;
      dayNumber++
    ) {

      const date =
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          dayNumber
        );

      const dateString =
        dateToString(date);

      const isToday =
        dateString ===
        dateToString(new Date());

      const dayAppointments =
        appointments.filter(
          appointment =>
            appointment.appointment_date ===
            dateString
        );

      html += `
        <div
          data-calendar-date="${dateString}"
          class="month-day"
          style="
            min-height:120px;
            padding:8px;
            border-right:1px solid var(--line);
            border-bottom:1px solid var(--line);
            background:${isToday ? 'rgba(40,125,114,.06)' : 'var(--surface)'};
            cursor:pointer;
          "
        >

          <div
            style="
              font-weight:${isToday ? '700' : '500'};
              margin-bottom:6px;
            "
          >
            ${dayNumber}
          </div>
      `;

      dayAppointments.forEach(appointment => {

        html += renderMonthAppointment(
          appointment
        );

      });

      html += `
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    calendar.innerHTML = html;

    attachMonthListeners();
    attachAppointmentListeners();
  }

  // =========================================================
  // TARJETA TURNO — SEMANA
  // =========================================================

  function renderAppointmentCard(
    appointment
  ) {

    const background =
      appointment.status === 'pending'
        ? 'rgba(220,170,60,.15)'
        : appointment.status === 'cancelled'
          ? 'rgba(0,0,0,.06)'
          : 'rgba(40,125,114,.12)';

    return `
      <div
        class="agenda-appointment"
        data-appointment-id="${escapeHTML(appointment.id)}"
        style="
          background:${background};
          border:1px solid var(--line);
          border-radius:8px;
          padding:7px;
          margin-bottom:5px;
          cursor:pointer;
          font-size:12px;
          ${appointment.status === 'cancelled'
            ? 'opacity:.55;text-decoration:line-through;'
            : ''}
        "
      >

        <strong>
          ${escapeHTML(
            appointment.start_time.slice(0, 5)
          )}
        </strong>

        <div
          style="
            margin-top:2px;
            font-weight:600;
          "
        >
          ${escapeHTML(
            getPatientName(appointment)
          )}
        </div>

        <div
          class="small"
          style="margin-top:2px;"
        >
          ${escapeHTML(
            appointment.modality || ''
          )}
        </div>

      </div>
    `;
  }

  // =========================================================
  // TARJETA TURNO — MES
  // =========================================================

  function renderMonthAppointment(
    appointment
  ) {

    const background =
      appointment.status === 'pending'
        ? 'rgba(220,170,60,.15)'
        : appointment.status === 'cancelled'
          ? 'rgba(0,0,0,.06)'
          : 'rgba(40,125,114,.12)';

    return `
      <div
        class="agenda-appointment"
        data-appointment-id="${escapeHTML(appointment.id)}"
        style="
          background:${background};
          border:1px solid var(--line);
          border-radius:6px;
          padding:4px 5px;
          margin-bottom:4px;
          cursor:pointer;
          font-size:11px;
          overflow:hidden;
          ${appointment.status === 'cancelled'
            ? 'opacity:.55;text-decoration:line-through;'
            : ''}
        "
      >

        <strong>
          ${escapeHTML(
            appointment.start_time.slice(0, 5)
          )}
        </strong>

        ${escapeHTML(
          getPatientName(appointment)
        )}

      </div>
    `;
  }

  // =========================================================
  // CLICK ESPACIO VACÍO
  // =========================================================

  function attachSlotListeners() {

    document
      .querySelectorAll('.agenda-slot')
      .forEach(slot => {

        slot.addEventListener(
          'click',
          event => {

            if (
              event.target.closest(
                '.agenda-appointment'
              )
            ) {
              return;
            }

            const date =
              slot.dataset.calendarDate;

            const hour =
              Number(
                slot.dataset.calendarHour
              );

            openNewAppointment(
              date,
              `${pad(hour)}:00`
            );
          }
        );
      });
  }

  function attachMonthListeners() {

    document
      .querySelectorAll('.month-day')
      .forEach(day => {

        day.addEventListener(
          'click',
          event => {

            if (
              event.target.closest(
                '.agenda-appointment'
              )
            ) {
              return;
            }

            openNewAppointment(
              day.dataset.calendarDate,
              '09:00'
            );
          }
        );
      });
  }

  // =========================================================
  // CLICK TURNO
  // =========================================================

  function attachAppointmentListeners() {

    document
      .querySelectorAll(
        '.agenda-appointment'
      )
      .forEach(card => {

        card.addEventListener(
          'click',
          event => {

            event.stopPropagation();

            const id =
              card.dataset.appointmentId;

            const appointment =
              appointments.find(
                item => item.id === id
              );

            if (appointment) {
              openEditAppointment(
                appointment
              );
            }
          }
        );
      });
  }

  // =========================================================
  // MODAL
  // =========================================================

  function showDeleteButton() {

    const button =
      document.getElementById(
        'deleteAppointmentBtn'
      );

    if (button) {
      button.style.display = 'inline-flex';
    }
  }

  function hideDeleteButton() {

    const button =
      document.getElementById(
        'deleteAppointmentBtn'
      );

    if (button) {
      button.style.display = 'none';
    }
  }

  function openNewAppointment(
    date = dateToString(new Date()),
    time = '09:00'
  ) {

    appointmentForm.reset();

    document.getElementById(
      'appointmentId'
    ).value = '';

    document.getElementById(
      'appointmentModalTitle'
    ).textContent = 'Nuevo turno';

    document.getElementById(
      'appointmentDate'
    ).value = date;

    document.getElementById(
      'appointmentStart'
    ).value = time;

    const [hour, minutes] =
      time.split(':').map(Number);

    const startMinutes =
      hour * 60 + minutes;

    const endMinutes =
      Math.min(startMinutes + 60, 23 * 60 + 59);

    const endHour =
      Math.floor(endMinutes / 60);

    const endMinute =
      endMinutes % 60;

    document.getElementById(
      'appointmentEnd'
    ).value =
      `${pad(endHour)}:${pad(endMinute)}`;

    document.getElementById(
      'appointmentStatus'
    ).value = 'confirmed';

    hideDeleteButton();

    appointmentModal.style.display =
      'block';

    document
      .getElementById('patientFirstName')
      .focus();
  }

  function openEditAppointment(
    appointment
  ) {

    const fullName =
      (appointment.patient_name || '')
        .trim()
        .split(/\s+/);

    const firstName =
      fullName.shift() || '';

    const lastName =
      fullName.join(' ');

    document.getElementById(
      'appointmentId'
    ).value = appointment.id;

    document.getElementById(
      'appointmentModalTitle'
    ).textContent = 'Editar turno';

    document.getElementById(
      'patientFirstName'
    ).value = firstName;

    document.getElementById(
      'patientLastName'
    ).value = lastName;

    document.getElementById(
      'patientWhatsapp'
    ).value =
      appointment.patient_whatsapp || '';

    document.getElementById(
      'patientEmail'
    ).value =
      appointment.patient_email || '';

    document.getElementById(
      'appointmentDate'
    ).value =
      appointment.appointment_date;

    document.getElementById(
      'appointmentStart'
    ).value =
      appointment.start_time.slice(0, 5);

    document.getElementById(
      'appointmentEnd'
    ).value =
      appointment.end_time.slice(0, 5);

    document.getElementById(
      'appointmentModality'
    ).value =
      appointment.modality || 'Online';

    document.getElementById(
      'appointmentZone'
    ).value =
      appointment.zone || '';

    document.getElementById(
      'appointmentStatus'
    ).value =
      appointment.status || 'confirmed';

    document.getElementById(
      'appointmentNotes'
    ).value =
      appointment.notes || '';

    showDeleteButton();

    appointmentModal.style.display =
      'block';
  }

  function closeModal() {

    appointmentModal.style.display =
      'none';

    appointmentForm.reset();

    document.getElementById(
      'appointmentId'
    ).value = '';

    hideDeleteButton();
  }

  document
    .getElementById('closeAppointmentModal')
    .addEventListener(
      'click',
      closeModal
    );

  document
    .getElementById('cancelAppointmentBtn')
    .addEventListener(
      'click',
      closeModal
    );

  appointmentModal.addEventListener(
    'click',
    event => {

      if (
        event.target ===
        appointmentModal
      ) {
        closeModal();
      }
    }
  );

  // =========================================================
  // CREAR / EDITAR TURNO
  // =========================================================

  appointmentForm.addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      const id =
        document.getElementById(
          'appointmentId'
        ).value;

      const firstName =
        document.getElementById(
          'patientFirstName'
        ).value.trim();

      const lastName =
        document.getElementById(
          'patientLastName'
        ).value.trim();

      const patientName =
        `${firstName} ${lastName}`.trim();

      const appointmentDate =
        document.getElementById(
          'appointmentDate'
        ).value;

      const startTime =
        document.getElementById(
          'appointmentStart'
        ).value;

      const endTime =
        document.getElementById(
          'appointmentEnd'
        ).value;

      if (
        !patientName ||
        !appointmentDate ||
        !startTime ||
        !endTime
      ) {

        alert(
          'Completá los datos obligatorios.'
        );

        return;
      }

      if (endTime <= startTime) {

        alert(
          'La hora de finalización debe ser posterior a la hora de inicio.'
        );

        return;
      }

      const payload = {

        professional_id:
          user.id,

        patient_name:
          patientName,

        patient_whatsapp:
          document.getElementById(
            'patientWhatsapp'
          ).value.trim() || null,

        patient_email:
          document.getElementById(
            'patientEmail'
          ).value.trim() || null,

        appointment_date:
          appointmentDate,

        start_time:
          startTime,

        end_time:
          endTime,

        modality:
          document.getElementById(
            'appointmentModality'
          ).value,

        zone:
          document.getElementById(
            'appointmentZone'
          ).value.trim() || null,

        status:
          document.getElementById(
            'appointmentStatus'
          ).value,

        notes:
          document.getElementById(
            'appointmentNotes'
          ).value.trim() || null
      };

      const submitButton =
        appointmentForm.querySelector(
          'button[type="submit"]'
        );

      submitButton.disabled = true;
      submitButton.textContent =
        'Guardando...';

      let result;

      if (id) {

        result = await sb
          .from('professional_appointments')
          .update(payload)
          .eq('id', id)
          .eq(
            'professional_id',
            user.id
          );

      } else {

        result = await sb
          .from('professional_appointments')
          .insert(payload);
      }

      submitButton.disabled = false;
      submitButton.textContent =
        'Guardar turno';

      if (result.error) {

        console.error(
          'Error guardando turno:',
          result.error
        );

        alert(
          'No se pudo guardar el turno.'
        );

        return;
      }

      closeModal();

      await loadAppointments();
    }
  );

  // =========================================================
  // BOTÓN CANCELAR TURNO
  // =========================================================

  const deleteButton =
    document.createElement('button');

  deleteButton.id =
    'deleteAppointmentBtn';

  deleteButton.type =
    'button';

  deleteButton.className =
    'btn secondary';

  deleteButton.textContent =
    'Cancelar turno';

  deleteButton.style.display =
    'none';

  const modalButtons =
    appointmentForm.lastElementChild;

  modalButtons.insertBefore(
    deleteButton,
    modalButtons.firstChild
  );

  deleteButton.addEventListener(
    'click',
    async () => {

      const id =
        document.getElementById(
          'appointmentId'
        ).value;

      if (!id) return;

      const confirmed =
        confirm(
          '¿Querés cancelar este turno?'
        );

      if (!confirmed) return;

      deleteButton.disabled =
        true;

      deleteButton.textContent =
        'Cancelando...';

      const { error } =
        await sb
          .from('professional_appointments')
          .update({
            status: 'cancelled'
          })
          .eq('id', id)
          .eq(
            'professional_id',
            user.id
          );

      deleteButton.disabled =
        false;

      deleteButton.textContent =
        'Cancelar turno';

      if (error) {

        console.error(
          'Error cancelando turno:',
          error
        );

        alert(
          'No se pudo cancelar el turno.'
        );

        return;
      }

      closeModal();

      await loadAppointments();
    }
  );

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  document
    .getElementById('prevBtn')
    .addEventListener(
      'click',
      async () => {

        if (currentView === 'week') {

          currentDate.setDate(
            currentDate.getDate() - 7
          );

        } else {

          currentDate.setMonth(
            currentDate.getMonth() - 1
          );
        }

        await loadAppointments();
      }
    );

  document
    .getElementById('nextBtn')
    .addEventListener(
      'click',
      async () => {

        if (currentView === 'week') {

          currentDate.setDate(
            currentDate.getDate() + 7
          );

        } else {

          currentDate.setMonth(
            currentDate.getMonth() + 1
          );
        }

        await loadAppointments();
      }
    );

  document
    .getElementById('todayBtn')
    .addEventListener(
      'click',
      async () => {

        currentDate = new Date();

        await loadAppointments();
      }
    );

  // =========================================================
  // CAMBIO DE VISTA
  // =========================================================

  document
    .getElementById('weekViewBtn')
    .addEventListener(
      'click',
      async () => {

        currentView = 'week';

        await loadAppointments();
      }
    );

  document
    .getElementById('monthViewBtn')
    .addEventListener(
      'click',
      async () => {

        currentView = 'month';

        await loadAppointments();
      }
    );

  // =========================================================
  // NUEVO TURNO
  // =========================================================

  document
    .getElementById('newAppointmentBtn')
    .addEventListener(
      'click',
      () => {

        openNewAppointment();
      }
    );

  // =========================================================
  // INICIO
  // =========================================================

  await loadAppointments();

});
