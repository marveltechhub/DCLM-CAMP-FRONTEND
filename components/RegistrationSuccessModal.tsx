'use client';

import { useEffect } from 'react';
import type { Registration } from '@/lib/api';
import { downloadIdCardPng, printIdCard } from '@/lib/idCard';

type Props = {
  open: boolean;
  registration: Registration | null;
  onClose: () => void;
};

export function RegistrationSuccessModal({ open, registration, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !registration) return null;

  async function handleDownload() {
    if (!registration) return;
    try {
      await downloadIdCardPng(registration);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Could not generate ID card');
    }
  }

  async function handlePrint() {
    if (!registration) return;
    try {
      await printIdCard(registration);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ maxWidth: '520px' }}
      >
        {/* Success Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '2rem',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '1.25rem',
              lineHeight: 1
            }}
          >
            ×
          </button>

          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#fff">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 id="modal-title" style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Registration Successful!
          </h2>
          <p style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.9375rem'
          }}>
            The participant has been registered for DCLM Easter Retreat
          </p>
        </div>

        {/* Registration Details */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Registration Number
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.25rem'
                }}>
                  {registration.registrationNumber}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🎫
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Full Name</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{registration.fullName}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Location</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{registration.location?.name}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Phone</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{registration.phone}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Next of Kin</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {registration.nextOfKinName}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Next of Kin Phone</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {registration.nextOfKinPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              style={{
                width: '100%',
                height: '3rem',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download ID Card
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
              style={{
                width: '100%',
                height: '3rem',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print ID Card
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{
                width: '100%',
                height: '3rem',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Register Another Participant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
