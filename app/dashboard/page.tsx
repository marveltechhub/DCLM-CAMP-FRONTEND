'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getStats,
  listRegistrations,
  deleteRegistration,
  getLocations,
  createLocation,
  updateLocation,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  downloadBlob,
  updateRegistrationForm,
  type StatsResponse,
  type Registration,
  type Location,
  type AdminUser,
} from '@/lib/api';

type Tab = 'overview' | 'locations' | 'admins' | 'registrations';

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsErr, setStatsErr] = useState('');

  const [locations, setLocations] = useState<Location[]>([]);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locMsg, setLocMsg] = useState('');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admPass, setAdmPass] = useState('');
  const [admLocId, setAdmLocId] = useState('');
  const [admMsg, setAdmMsg] = useState('');

  const [regs, setRegs] = useState<Registration[]>([]);
  const [regPage, setRegPage] = useState(1);
  const [regPages, setRegPages] = useState(1);
  const [regTotal, setRegTotal] = useState(0);
  const [regQ, setRegQ] = useState('');
  const [regLocFilter, setRegLocFilter] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regErr, setRegErr] = useState('');
  const [editing, setEditing] = useState<Registration | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getStats();
      setStats(s);
      setStatsErr('');
    } catch (e) {
      setStatsErr(e instanceof Error ? e.message : 'Failed to load stats');
    }
  }, [user]);

  const loadLocations = useCallback(async () => {
    if (!user || user.role !== 'super_admin') return;
    try {
      const { locations: locs } = await getLocations(true);
      setLocations(locs);
    } catch {
      /* ignore */
    }
  }, [user]);

  const loadAdmins = useCallback(async () => {
    if (!user || user.role !== 'super_admin') return;
    try {
      const { users } = await listAdmins();
      setAdmins(users);
    } catch {
      /* ignore */
    }
  }, [user]);

  const loadRegs = useCallback(async () => {
    if (!user) return;
    setRegLoading(true);
    setRegErr('');
    try {
      const { registrations, pagination } = await listRegistrations({
        page: regPage,
        limit: 15,
        q: regQ || undefined,
        locationId: user.role === 'super_admin' ? regLocFilter || undefined : user.location?._id,
      });
      setRegs(registrations);
      setRegPages(pagination.pages);
      setRegTotal(pagination.total);
    } catch (e) {
      setRegErr(e instanceof Error ? e.message : 'Failed to load registrations');
    } finally {
      setRegLoading(false);
    }
  }, [user, regPage, regQ, regLocFilter]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      setTab('registrations');
    }
  }, [user]);

  useEffect(() => {
    if (user) loadStats();
  }, [user, loadStats]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadLocations();
      loadAdmins();
    }
  }, [user, loadLocations, loadAdmins]);

  useEffect(() => {
    if (user && tab === 'registrations') loadRegs();
  }, [user, tab, loadRegs]);

  useEffect(() => {
    if (user?.role === 'super_admin' && tab === 'registrations') {
      getLocations(true).then(({ locations: locs }) => setLocations(locs));
    }
  }, [user, tab]);

  async function onExport() {
    try {
      const q = new URLSearchParams();
      if (regQ) q.set('q', regQ);
      if (user?.role === 'super_admin' && regLocFilter) q.set('locationId', regLocFilter);
      const qs = q.toString();
      const path = `/registrations/export${qs ? `?${qs}` : ''}`;
      await downloadBlob(path, 'dclm-easter-retreat-registrations.xlsx');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed');
    }
  }

  async function onCreateLocation(e: FormEvent) {
    e.preventDefault();
    setLocMsg('');
    try {
      await createLocation({ name: locName.trim(), code: locCode.trim() });
      setLocName('');
      setLocCode('');
      setLocMsg('Location created.');
      loadLocations();
      loadStats();
    } catch (err) {
      setLocMsg(err instanceof Error ? err.message : 'Error');
    }
  }

  async function onDeactivateLocation(id: string) {
    if (!confirm('Deactivate this location?')) return;
    try {
      await updateLocation(id, { isActive: false });
      loadLocations();
      loadStats();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function onCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setAdmMsg('');
    try {
      await createAdmin({
        name: admName.trim(),
        email: admEmail.trim(),
        password: admPass,
        locationId: admLocId,
      });
      setAdmName('');
      setAdmEmail('');
      setAdmPass('');
      setAdmMsg('Admin account created.');
      loadAdmins();
    } catch (err) {
      setAdmMsg(err instanceof Error ? err.message : 'Error');
    }
  }

  async function onToggleAdmin(a: AdminUser) {
    try {
      await updateAdmin(a.id, { isActive: !a.isActive });
      loadAdmins();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function onRemoveAdmin(a: AdminUser) {
    if (!confirm('Deactivate this admin?')) return;
    try {
      await deleteAdmin(a.id);
      loadAdmins();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function onDeleteReg(r: Registration) {
    if (!confirm(`Delete registration ${r.registrationNumber}?`)) return;
    try {
      await deleteRegistration(r._id);
      loadRegs();
      loadStats();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await updateRegistrationForm(editing._id, fd);
      setEditing(null);
      loadRegs();
      loadStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  }

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    );
  }

  const isSuper = user.role === 'super_admin';

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.svg" alt="" width={40} height={40} />
            <div>
              <div style={{ fontWeight: 800 }}>DCLM Easter Retreat</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {user.name} · {user.role === 'super_admin' ? 'Super Admin' : 'Registrar'}
                {user.location ? ` · ${user.location.name}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary">
              New registration
            </Link>
            <button type="button" className="btn btn-secondary" onClick={() => { logout(); router.replace('/login'); }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '1.5rem 1.25rem 3rem' }}>
        {isSuper && (
          <div className="tabs">
            {(['overview', 'locations', 'admins', 'registrations'] as Tab[]).map((t) => (
              <button key={t} type="button" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'overview' && 'Overview'}
                {t === 'locations' && 'Locations'}
                {t === 'admins' && 'Admins'}
                {t === 'registrations' && 'Registrations'}
              </button>
            ))}
          </div>
        )}
        {!isSuper && (
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Registrar dashboard</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>Manage registrations for {user.location?.name || 'your center'}.</p>
          </div>
        )}

        {tab === 'overview' && isSuper && (
          <section>
            {statsErr && <p className="err">{statsErr}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total registrations</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.total ?? '—'}</div>
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>By location</h2>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {(stats?.byLocation || []).map((row) => (
                  <li key={row.location.name}>
                    <strong>{row.location.name}</strong> — {row.count}
                  </li>
                ))}
                {!stats?.byLocation?.length && <li style={{ color: 'var(--muted)' }}>No data yet</li>}
              </ul>
            </div>
          </section>
        )}

        {tab === 'locations' && isSuper && (
          <section className="form-row" style={{ alignItems: 'start' }}>
            <div className="card" style={{ padding: '1.25rem', flex: 1, minWidth: 280 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add location</h2>
              <form onSubmit={onCreateLocation}>
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={locName} onChange={(e) => setLocName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Code (optional)</label>
                  <input className="form-control" value={locCode} onChange={(e) => setLocCode(e.target.value)} />
                </div>
                {locMsg && <p style={{ fontSize: '0.9rem', color: 'var(--success)' }}>{locMsg}</p>}
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </form>
            </div>
            <div className="card" style={{ padding: '1.25rem', flex: 2, minWidth: 300 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Locations</h2>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((l) => (
                      <tr key={l._id}>
                        <td>{l.name}</td>
                        <td>{l.code || '—'}</td>
                        <td>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} onClick={() => onDeactivateLocation(l._id)}>
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'admins' && isSuper && (
          <section className="form-row" style={{ alignItems: 'start' }}>
            <div className="card" style={{ padding: '1.25rem', flex: 1, minWidth: 280 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Create registrar</h2>
              <form onSubmit={onCreateAdmin}>
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={admName} onChange={(e) => setAdmName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={admEmail} onChange={(e) => setAdmEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" className="form-control" value={admPass} onChange={(e) => setAdmPass(e.target.value)} required minLength={8} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select className="form-control" value={admLocId} onChange={(e) => setAdmLocId(e.target.value)} required>
                    <option value="">Select</option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                {admMsg && <p style={{ fontSize: '0.9rem', color: admMsg.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{admMsg}</p>}
                <button type="submit" className="btn btn-primary">
                  Create admin
                </button>
              </form>
            </div>
            <div className="card" style={{ padding: '1.25rem', flex: 2, minWidth: 320 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Registrar accounts</h2>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td>{a.email}</td>
                        <td>{a.location?.name ?? '—'}</td>
                        <td>{a.isActive === false ? 'Inactive' : 'Active'}</td>
                        <td>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} onClick={() => onToggleAdmin(a)}>
                            Toggle
                          </button>{' '}
                          <button type="button" className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} onClick={() => onRemoveAdmin(a)}>
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {(tab === 'registrations' || !isSuper) && (
          <section>
            {!isSuper && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Registrations (your location)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.total ?? '—'}</div>
                </div>
                {statsErr && <p className="err" style={{ margin: 0 }}>{statsErr}</p>}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input
                className="form-control"
                style={{ maxWidth: 220 }}
                placeholder="Search name, phone, reg #"
                value={regQ}
                onChange={(e) => {
                  setRegQ(e.target.value);
                  setRegPage(1);
                }}
              />
              {isSuper && (
                <select className="form-control" style={{ maxWidth: 200 }} value={regLocFilter} onChange={(e) => { setRegLocFilter(e.target.value); setRegPage(1); }}>
                  <option value="">All locations</option>
                  {locations.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => loadRegs()}>
                Refresh
              </button>
              <button type="button" className="btn btn-primary" onClick={onExport}>
                Export Excel
              </button>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {regTotal} total
              </span>
            </div>
            {regErr && <p className="err">{regErr}</p>}
            {regLoading ? (
              <p style={{ color: 'var(--muted)' }}>Loading…</p>
            ) : (
              <div className="card table-wrap" style={{ padding: 0 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Reg #</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Age</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <span className="badge">{r.registrationNumber}</span>
                        </td>
                        <td>{r.fullName}</td>
                        <td>{r.location?.name}</td>
                        <td>{r.phone}</td>
                        <td>{r.age}</td>
                        <td>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} onClick={() => setEditing(r)}>
                            Edit
                          </button>{' '}
                          <button type="button" className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} onClick={() => onDeleteReg(r)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" disabled={regPage <= 1} onClick={() => setRegPage((p) => p - 1)}>
                Previous
              </button>
              <span style={{ fontSize: '0.9rem' }}>
                Page {regPage} / {regPages}
              </span>
              <button type="button" className="btn btn-secondary" disabled={regPage >= regPages} onClick={() => setRegPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </section>
        )}

      </main>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal-dialog card" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">
            <h2 style={{ marginTop: 0 }}>Edit registration</h2>
            <form key={editing._id} onSubmit={onSaveEdit}>
              <div className="form-group">
                <label>Full name</label>
                <input name="fullName" className="form-control" defaultValue={editing.fullName} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" className="form-control" defaultValue={editing.gender}>
                    {genders.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input name="age" type="number" className="form-control" defaultValue={editing.age} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" type="tel" className="form-control" defaultValue={editing.phone} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" className="form-control" defaultValue={editing.email || ''} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" className="form-control" rows={3} defaultValue={editing.address} required />
              </div>
              {isSuper && (
                <div className="form-group">
                  <label>Location</label>
                  <select name="locationId" className="form-control" defaultValue={typeof editing.location === 'object' ? editing.location._id : ''}>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!isSuper && <input type="hidden" name="locationId" value={editing.location._id} />}
              <div className="form-row">
                <div className="form-group">
                  <label>Next of kin name</label>
                  <input name="nextOfKinName" className="form-control" defaultValue={editing.nextOfKinName} required />
                </div>
                <div className="form-group">
                  <label>Next of kin phone</label>
                  <input name="nextOfKinPhone" type="tel" className="form-control" defaultValue={editing.nextOfKinPhone} required />
                </div>
              </div>
              <div className="form-group">
                <label>New profile photo (optional)</label>
                <input name="profilePicture" type="file" accept="image/jpeg,image/png,image/gif,image/webp" />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
