import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, KeyRound, LogOut, MapPin, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/format.js';
import {
  Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select,
} from '../components/ui.jsx';

const BLANK = { label: 'Home', name: '', phone: '', line1: '', area: 'Civil Lines', pincode: '229001' };

export default function Account() {
  const { user, addresses, updateProfile, addAddress, updateAddress, deleteAddress, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPwSaving(true);
    try {
      await api('/auth/password', { method: 'POST', body: pw });
      toast('Password changed', 'success');
      setPwOpen(false);
      setPw({ current: '', next: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setDraft({ ...BLANK, name: user.name, phone: user.phone });
    setFormError('');
    setAddressModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setDraft({ label: a.label, name: a.name, phone: a.phone, line1: a.line1, area: a.area, pincode: a.pincode });
    setFormError('');
    setAddressModal(true);
  };

  const saveAddress = async (e) => {
    e?.preventDefault();
    setSavingAddress(true);
    setFormError('');
    try {
      if (editing) await updateAddress(editing.id, draft);
      else await addAddress(draft);
      toast(editing ? 'Address updated' : 'Address added', 'success');
      setAddressModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAddress(deleting.id);
      toast('Address removed', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron-500">Your account</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">Profile & settings</h1>
        </div>
        <Button variant="ghost" onClick={() => { logout(); navigate('/'); }}><LogOut size={14} /> Sign out</Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[16px] font-semibold text-cream">{user?.name}</p>
                <p className="text-[12px] text-muted">+91 {user?.phone}</p>
              </div>
              <Badge tone={user?.role === 'customer' ? 'neutral' : 'saffron'}>{user?.role === 'customer' ? 'Customer' : 'Staff'}</Badge>
            </div>

            <form onSubmit={saveProfile} className="mt-5 space-y-3">
              <Field label="Name">
                <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="Email" hint="Used for receipts only.">
                <Input type="email" value={profile.email || ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="Add an email" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" loading={savingProfile}>Save changes</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setPwOpen(true)}><KeyRound size={13} /> Change password</Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted">Quick links</p>
            <div className="mt-2.5 space-y-1">
              {[
                { to: '/orders', icon: Home, label: 'My orders & tracking' },
                { to: '/menu', icon: User, label: 'Browse the menu' },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[12.5px] text-cream-dim transition hover:bg-white/5 hover:text-cream">
                  <l.icon size={14} className="text-muted" /> {l.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><MapPin size={15} className="text-saffron-400" /> Saved addresses</h2>
            <Button size="xs" variant="soft" onClick={openNew}><Plus size={12} /> Add</Button>
          </div>

          {addresses.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={MapPin} title="No addresses saved" description="Add a delivery address to speed up checkout." action={<Button size="sm" onClick={openNew}>Add address</Button>} />
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-saffron-400"><MapPin size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[12.5px] font-semibold text-cream">{a.label}</p>
                      {a.is_default ? <Badge tone="saffron" className="py-0.5 text-[9.5px]">Default</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">{a.name} · {a.phone}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-cream-dim/80">{a.line1}, {a.area}, {a.city} {a.pincode}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => openEdit(a)} className="flex items-center gap-1 text-[11px] font-semibold text-saffron-400 hover:text-saffron-300"><Pencil size={11} /> Edit</button>
                      {!a.is_default && (
                        <button onClick={() => updateAddress(a.id, { isDefault: true }).then(() => toast('Default address updated', 'success'))} className="text-[11px] font-semibold text-muted hover:text-cream">Make default</button>
                      )}
                      <button onClick={() => setDeleting(a)} className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-chili-400"><Trash2 size={11} /> Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title={editing ? 'Edit address' : 'Add address'}
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAddressModal(false)}>Cancel</Button><Button onClick={saveAddress} loading={savingAddress}>{editing ? 'Save changes' : 'Add address'}</Button></div>}
      >
        <form onSubmit={saveAddress} className="grid gap-3 sm:grid-cols-2">
          <Field label="Save as" className="sm:col-span-2">
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((l) => (
                <button key={l} type="button" onClick={() => setDraft((d) => ({ ...d, label: l }))}
                  className={cx('rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition', draft.label === l ? 'border-saffron-500/60 bg-saffron-500/15 text-saffron-300' : 'border-white/10 text-muted')}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Receiver name" required><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></Field>
          <Field label="Mobile" required><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" required /></Field>
          <Field label="House / street" required className="sm:col-span-2"><Input value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} placeholder="House no., street, landmark" required /></Field>
          <Field label="Area" required>
            <Select value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
              {['Civil Lines', 'Indira Nagar', 'Railway Road', 'Ahiyapur', 'Bachhrawan', 'Jais'].map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Pincode" required error={formError || undefined}><Input value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" required /></Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button><Button onClick={savePassword} loading={pwSaving}>Update password</Button></div>}
      >
        <div className="space-y-3">
          <Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} /></Field>
          <Field label="New password" hint="Minimum 6 characters."><Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} /></Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Remove this address?"
        message={`${deleting?.label} — ${deleting?.line1}, ${deleting?.area} will be removed from your saved addresses.`}
        confirmLabel="Remove address"
      />
    </div>
  );
}
