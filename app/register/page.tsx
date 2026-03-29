'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createRegistrationForm, getLocations } from '@/lib/api';
import type { Location, Registration } from '@/lib/api';
import { RegistrationSuccessModal } from '@/components/RegistrationSuccessModal';

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' },
];

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successReg, setSuccessReg] = useState<Registration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [locationId, setLocationId] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getLocations(true)
      .then(({ locations: locs }) => {
        const filtered =
          user.role === 'admin' && user.location
            ? locs.filter((l) => l._id === user.location!._id)
            : locs;
        setLocations(filtered);
        if (user.role === 'admin' && user.location?._id) {
          setLocationId(user.location._id);
        } else if (filtered.length) {
          setLocationId(filtered[0]._id);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load locations'));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', fullName.trim());
      fd.append('gender', gender);
      fd.append('age', String(Number(age)));
      fd.append('phone', phone.trim());
      if (email.trim()) fd.append('email', email.trim());
      fd.append('address', address.trim());
      fd.append('locationId', locationId);
      fd.append('nextOfKinName', nextOfKinName.trim());
      fd.append('nextOfKinPhone', nextOfKinPhone.trim());
      if (profileFile) fd.append('profilePicture', profileFile);

      const { registration } = await createRegistrationForm(fd);
      setSuccessReg(registration as Registration);
      setModalOpen(true);
      setFullName('');
      setAge('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNextOfKinName('');
      setNextOfKinPhone('');
      setProfileFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setProfileFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px' }} />
          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const locationLocked = user.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none'
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Image src="/logo.svg" alt="DCLM" width={32} height={32} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>DCLM Easter Retreat</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem'
      }}>
        {/* Page Title */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            📝
          </div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            Camp Registration Form
          </h1>
          <p style={{ margin: '0.75rem 0 0', color: 'var(--muted)', fontSize: '1rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Capture participant details for DCLM Easter Retreat. All fields except email and photo are required.
          </p>
        </div>

        {/* Registration Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={onSubmit}>
            {/* Personal Information Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>1</span>
                Personal Information
              </h2>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    className="form-control"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    {genders.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="age">Age *</label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    className="form-control"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter age"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>2</span>
                Contact Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email (Optional)</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  className="form-control"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  required
                />
              </div>
            </div>

            {/* Location Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>3</span>
                Camp Location
              </h2>

              <div className="form-group">
                <label htmlFor="locationId">Location / Center *</label>
                <select
                  id="locationId"
                  className="form-control"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  disabled={locationLocked}
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {locationLocked && (
                  <p className="form-hint">
                    Registrations are limited to your assigned center.
                  </p>
                )}
              </div>
            </div>

            {/* Next of Kin Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>4</span>
                Next of Kin
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nokName">Next of Kin Name *</label>
                  <input
                    id="nokName"
                    className="form-control"
                    value={nextOfKinName}
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    placeholder="Enter next of kin name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nokPhone">Next of Kin Phone *</label>
                  <input
                    id="nokPhone"
                    type="tel"
                    className="form-control"
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    placeholder="Enter next of kin phone"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Profile Photo Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>5</span>
                Profile Photo
              </h2>

              <div className="form-group">
                <label htmlFor="photo">Profile Picture (Optional)</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {previewUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '1rem',
                          border: '3px solid var(--primary-light)'
                        }}
                      />
                      <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        ✓ Photo selected
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        {profileFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'var(--primary-light)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        fontSize: '1.5rem'
                      }}>
                        📷
                      </div>
                      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                        Upload Profile Photo
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        Max 2MB, JPG/PNG/GIF/WebP
                      </p>
                    </div>
                  )}
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={onFileChange}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: 'var(--danger)', flexShrink: 0, marginTop: '0.125rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    Registration Error
                  </div>
                  <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{
                width: '100%',
                height: '3.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 'var(--radius)'
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }} />
                  Submitting Registration...
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Registration
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'var(--muted)',
          fontSize: '0.875rem'
        }}>
          By submitting this form, you agree to the camp&apos;s terms and conditions.
        </p>
      </main>

      {/* Success Modal */}
      <RegistrationSuccessModal open={modalOpen} registration={successReg} onClose={() => setModalOpen(false)} />
    </div>
  );
}
