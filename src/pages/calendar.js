import { fetchBookings } from '../api.js';

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let allBookings = [];

function openDayModal(dateStr, bookings) {
  const modal = document.getElementById('day-modal');
  const dateObj = new Date(dateStr + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('modal-date-title').textContent = formatted;
  document.getElementById('modal-date-sub').textContent =
    bookings.length ? `${bookings.length} booking${bookings.length > 1 ? 's' : ''} on this day` : 'No bookings on this day';
  if (!bookings.length) {
    document.getElementById('modal-bookings-body').innerHTML =
      '<div style="text-align:center;padding:32px;color:var(--muted);font-size:14px;">No bookings on this day.</div>';
  } else {
    document.getElementById('modal-bookings-body').innerHTML = bookings.map(b => `
      <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:10px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:700;font-size:14px;">${b.phone_number || 'Unknown'}</div>
          <span class="badge badge-green">Booked</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">${new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
        ${b.summary ? `<div style="font-size:12px;color:var(--text);margin-top:6px;padding:8px;background:rgba(255,255,255,0.04);border-radius:6px;">${b.summary}</div>` : ''}
      </div>`).join('');
  }
  modal.classList.add('open');
}

function renderCalendarGrid() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('cal-month-label').textContent = `${months[calMonth]} ${calYear}`;
  const grid = document.getElementById('cal-grid');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const bookMap = {};
  allBookings.forEach(b => {
    const d = b.created_at ? b.created_at.slice(0, 10) : null;
    if (d) { bookMap[d] = bookMap[d] || []; bookMap[d].push(b); }
  });
  let html = days.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) {
    const d = new Date(calYear, calMonth, -startPad + i + 1);
    html += `<div class="cal-cell other-month"><div class="cal-num">${d.getDate()}</div></div>`;
  }
  for (let day = 1; day <= last.getDate(); day++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bks = bookMap[dateStr] || [];
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
    html += `<div class="cal-cell${isToday ? ' today' : ''}" data-date="${dateStr}" data-bookings='${JSON.stringify(bks)}'>
      <div class="cal-num">${day}</div>
      ${bks.length ? `<div class="cal-dot"></div><div class="cal-booking-count">${bks.length} booking${bks.length > 1 ? 's' : ''}</div>` : ''}
    </div>`;
  }
  const endPad = 6 - last.getDay();
  for (let i = 1; i <= endPad; i++) {
    html += `<div class="cal-cell other-month"><div class="cal-num">${i}</div></div>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      openDayModal(cell.dataset.date, JSON.parse(cell.dataset.bookings || '[]'));
    });
  });
}

export function renderCalendar() {
  return `
    <div class="page-header">
      <div class="page-title">Booking Calendar</div>
      <div class="page-sub">View confirmed appointments by date</div>
    </div>
    <div class="section-card">
      <div class="cal-header">
        <button class="btn btn-ghost btn-sm" id="cal-prev">Prev</button>
        <div style="font-size:16px;font-weight:700;" id="cal-month-label">Month Year</div>
        <button class="btn btn-ghost btn-sm" id="cal-next">Next</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>`;
}

export async function initCalendar() {
  try { allBookings = await fetchBookings(); } catch { allBookings = []; }
  renderCalendarGrid();
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendarGrid();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendarGrid();
  });
}
