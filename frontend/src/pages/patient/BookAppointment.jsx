import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ─── Doctor Data ──────────────────────────────────────────────────── */
const DOCTOR = {
  id: 'DOC-PRANAV-001',
  name: 'Dr. Pranav Raut',
  speciality: 'General Medicine',
  hospital: 'SmartEMR Clinic',
  experience: '10 years',
  fee: 500,
  available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  morning_slots: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'],
  evening_slots: ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'],
};

/* ─── Helpers ──────────────────────────────────────────────────────── */
function initDoctors() {
  if (!localStorage.getItem('registered_doctors')) {
    localStorage.setItem('registered_doctors', JSON.stringify([DOCTOR]));
  }
}

function getNext7Days() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayName: dayNames[d.getDay()],
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      ddmmyyyy: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
    });
  }
  return days;
}

function isSlotBooked(date_ddmmyyyy, time) {
  const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  return appointments.some(
    (a) => a.date === date_ddmmyyyy && a.time === time && a.doctor_id === DOCTOR.id && a.status !== 'cancelled'
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const S = {
  page: { maxWidth: 720, margin: '2rem auto', padding: '0 1rem' },
  h1: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text)' },
  sub: { fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow)' },
  stepBar: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' },
  stepDot: (active, done) => ({
    width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
    background: done ? '#0f9d58' : active ? 'var(--primary)' : 'var(--border)',
    color: done || active ? '#fff' : 'var(--text-muted)',
  }),
  stepLine: (done) => ({ flex: 1, height: 2, background: done ? '#0f9d58' : 'var(--border)', borderRadius: 1 }),
  chip: (active, disabled) => ({
    padding: '0.45rem 0.9rem', borderRadius: 999, border: '1.5px solid',
    borderColor: disabled ? 'var(--border)' : active ? 'var(--primary)' : 'var(--border)',
    background: disabled ? 'var(--bg)' : active ? 'var(--primary)' : 'var(--surface)',
    color: disabled ? 'var(--text-muted)' : active ? '#fff' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
  }),
  slotBtn: (active, booked) => ({
    padding: '0.45rem 0.9rem', borderRadius: 8, border: '1.5px solid',
    borderColor: booked ? 'var(--border)' : active ? '#0f9d58' : 'var(--border)',
    background: booked ? 'var(--bg)' : active ? '#0f9d5820' : 'var(--surface)',
    color: booked ? 'var(--text-muted)' : active ? '#0f9d58' : 'var(--text)',
    cursor: booked ? 'not-allowed' : 'pointer',
    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
    opacity: booked ? 0.5 : 1,
  }),
  btn: { padding: '0.65rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  btnGreen: { padding: '0.65rem 1.5rem', background: '#0f9d58', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  btnOutline: { padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' },
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  badge: (color) => ({ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: color + '22', color }),
  successBox: { textAlign: 'center', padding: '2.5rem 1rem' },
};

/* ─── Component ────────────────────────────────────────────────────── */
export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1,2,3,4,5(success)
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [appointmentId, setAppointmentId] = useState('');

  const days = getNext7Days();

  useEffect(() => { initDoctors(); }, []);

  /* Step 4 → Confirm */
  const confirmBooking = () => {
    const apt = {
      id: `APT-${Date.now()}`,
      patient_id: user?.id || user?._id || 'GUEST',
      patient_name: user?.name || 'Patient',
      patient_phone: user?.phone || '',
      doctor_id: DOCTOR.id,
      doctor_name: DOCTOR.name,
      speciality: DOCTOR.speciality,
      hospital: DOCTOR.hospital,
      date: selectedDate.ddmmyyyy,
      day: selectedDate.dayName,
      time: selectedSlot,
      fee: DOCTOR.fee,
      reason: reason.trim() || 'General Consultation',
      status: 'upcoming',
      created_at: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('appointments') || '[]');
    localStorage.setItem('appointments', JSON.stringify([...existing, apt]));
    setAppointmentId(apt.id);
    setStep(5);
  };

  /* ── Step 5: Success Screen ── */
  if (step === 5) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.successBox}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f9d58' }}>Appointment Confirmed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Appointment ID: <strong>{appointmentId}</strong>
            </p>
            <div style={{ ...S.card, maxWidth: 360, margin: '0 auto 1.5rem', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{DOCTOR.name}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>🏥 {DOCTOR.hospital}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>📅 {selectedDate?.label} at {selectedSlot}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>💰 Fee: ₹{DOCTOR.fee}</div>
            </div>
            <button style={S.btn} onClick={() => navigate('/patient/dashboard')}>Go to My Appointments</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>🗓️ Book Appointment</h1>
      <p style={S.sub}>Schedule a consultation with your doctor.</p>

      {/* Step Progress Bar */}
      <div style={S.stepBar}>
        {[1, 2, 3, 4].map((n, i) => (
          <React.Fragment key={n}>
            <div style={S.stepDot(step === n, step > n)}>{step > n ? '✓' : n}</div>
            {i < 3 && <div style={S.stepLine(step > n)} />}
          </React.Fragment>
        ))}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
          {step === 1 && 'Doctor Info'}
          {step === 2 && 'Select Date'}
          {step === 3 && 'Select Time'}
          {step === 4 && 'Confirm'}
        </span>
      </div>

      {/* ── STEP 1: Doctor Card ── */}
      {step === 1 && (
        <div style={S.card}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>🩺</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.2rem' }}>{DOCTOR.name}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>{DOCTOR.speciality}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>🏥 {DOCTOR.hospital}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={S.badge('var(--primary)')}>⭐ {DOCTOR.experience}</span>
                <span style={S.badge('#0f9d58')}>💰 ₹{DOCTOR.fee} / visit</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <strong>Available:</strong> {DOCTOR.available_days.join(', ')}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Morning: 9:00 AM – 12:00 PM &nbsp;|&nbsp; Evening: 4:00 PM – 7:00 PM
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
            <button style={S.btn} onClick={() => setStep(2)}>Book Appointment →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Select Date ── */}
      {step === 2 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Select Date</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {days.map((d) => {
              const avail = DOCTOR.available_days.includes(d.dayName);
              const isSelected = selectedDate?.ddmmyyyy === d.ddmmyyyy;
              return (
                <button
                  key={d.ddmmyyyy}
                  style={S.chip(isSelected, !avail)}
                  onClick={() => avail && setSelectedDate(d)}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Grey dates are unavailable (clinic closed).
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button style={S.btnOutline} onClick={() => setStep(1)}>← Back</button>
            <button style={{ ...S.btn, opacity: selectedDate ? 1 : 0.5, cursor: selectedDate ? 'pointer' : 'not-allowed' }}
              disabled={!selectedDate} onClick={() => setStep(3)}>Next: Pick Time →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Select Slot ── */}
      {step === 3 && (
        <div style={S.card}>
          <div style={{ marginBottom: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            📅 {selectedDate?.label}
          </div>

          <div style={S.sectionTitle}>🌅 Morning Slots</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {DOCTOR.morning_slots.map((slot) => {
              const booked = isSlotBooked(selectedDate?.ddmmyyyy, slot);
              const active = selectedSlot === slot;
              return (
                <button key={slot} style={S.slotBtn(active, booked)} onClick={() => !booked && setSelectedSlot(slot)}>
                  {slot}{booked ? ' · Booked' : ''}
                </button>
              );
            })}
          </div>

          <div style={S.sectionTitle}>🌆 Evening Slots</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {DOCTOR.evening_slots.map((slot) => {
              const booked = isSlotBooked(selectedDate?.ddmmyyyy, slot);
              const active = selectedSlot === slot;
              return (
                <button key={slot} style={S.slotBtn(active, booked)} onClick={() => !booked && setSelectedSlot(slot)}>
                  {slot}{booked ? ' · Booked' : ''}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button style={S.btnOutline} onClick={() => { setSelectedSlot(null); setStep(2); }}>← Back</button>
            <button style={{ ...S.btn, opacity: selectedSlot ? 1 : 0.5, cursor: selectedSlot ? 'pointer' : 'not-allowed' }}
              disabled={!selectedSlot} onClick={() => setStep(4)}>Next: Confirm →</button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Confirm ── */}
      {step === 4 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Booking Summary</div>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: '1.9' }}>
            <div><strong>Doctor:</strong> {DOCTOR.name} — {DOCTOR.speciality}</div>
            <div><strong>Hospital:</strong> {DOCTOR.hospital}</div>
            <div><strong>Date:</strong> {selectedDate?.label} ({selectedDate?.dayName})</div>
            <div><strong>Time:</strong> {selectedSlot}</div>
            <div><strong>Fee:</strong> ₹{DOCTOR.fee}</div>
            <div><strong>Patient:</strong> {user?.name || 'Patient'}</div>
          </div>

          <label style={S.label}>Reason for Visit (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. Fever since 2 days, routine check-up..."
            rows={3}
            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', background: 'var(--bg)', color: 'var(--text)' }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button style={S.btnOutline} onClick={() => setStep(3)}>← Back</button>
            <button style={S.btnGreen} onClick={confirmBooking}>✅ Confirm Appointment</button>
          </div>
        </div>
      )}
    </div>
  );
}
