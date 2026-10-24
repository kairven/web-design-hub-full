import { useEffect, useState } from 'react';
import { Bike, MapPin, Pencil, Phone, Plus, Star, Trash2, Truck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { cx } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, RowSkeleton, Select,
} from '../../components/ui.jsx';

const ZONES = ['Civil Lines', 'Indira Nagar', 'Railway Road', 'Ahiyapur', 'Bachhrawan', 'Jais'];
const STATUSES = [
  { value: 'available', label: 'Available', tone: 'green' },
  { value: 'on_delivery', label: 'On delivery', tone: 'saffron' },
  { value: 'offline', label: 'Offline', tone: 'neutral' },
];
const BLANK = { name: '', phone: '', vehicle: 'Bike', zone: 'Civil Lines' };

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api('/admin/riders')
      .then((d) => setRiders(d.riders))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const openNew = () => { setEditing(null); setDraft(BLANK); setError(''); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setDraft({ name: r.name, phone: r.phone.replace(/^91/, ''), vehicle: r.vehicle, zone: r.zone });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const data = await api(`/admin/riders/${editing.id}`, { method: 'PATCH', body: draft });
        setRiders((list) => list.map((r) => (r.id === editing.id ? data.rider : r)));
        toast('Rider updated', 'success');
      } else {
        const data = await api('/admin/riders', { method: 'POST', body: draft });
        setRiders((list) => [...list, data.rider]);
        toast(`${data.rider.name} added to the fleet`, 'success');
      }
      setModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (rider, status) => {
    setRiders((list) => list.map((r) => (r.id === rider.id ? { ...r, status } : r)));
    try {
      await api(`/admin/riders/${rider.id}`, { method: 'PATCH', body: { status } });
    } catch (err) {
      setRiders((list) => list.map((r) => (r.id === rider.id ? { ...r, status: rider.status } : r)));
      toast(err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api(`/admin/riders/${deleting.id}`, { method: 'DELETE' });
      setRiders((list) => list.filter((r) => r.id !== deleting.id));
      toast('Rider removed', 'info');
      setDeleting(null);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const available = riders.filter((r) => r.status === 'available').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone="green" dot>{available} available now</Badge>
          <Badge tone="saffron">{riders.filter((r) => r.status === 'on_delivery').length} on delivery</Badge>
          <Badge tone="neutral">{riders.length} total riders</Badge>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Add rider</Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><RowSkeleton rows={3} /></div>
      ) : riders.length === 0 ? (
        <EmptyState icon={Bike} title="No riders yet" description="Add your delivery partners so you can assign them to live orders."
          action={<Button size="sm" onClick={openNew}><Plus size={13} /> Add first rider</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {riders.map((r) => {
            const meta = STATUSES.find((s) => s.value === r.status) ?? STATUSES[2];
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-cream">{r.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted"><Phone size={9} /> +91 {r.phone}</p>
                  </div>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div>
                    <p className="flex items-center gap-1 text-[9.5px] uppercase tracking-widest text-muted"><MapPin size={9} /> Zone</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-cream-dim">{r.zone}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[9.5px] uppercase tracking-widest text-muted"><Truck size={9} /> Deliveries</p>
                    <p className="mt-0.5 text-[11.5px] text-cream-dim">{r.deliveries} · <span className="text-saffron-400">★ {r.rating}</span></p>
                  </div>
                </div>

                <p className="mt-2.5 flex items-center gap-1 truncate text-[10.5px] text-muted"><Bike size={10} /> {r.vehicle}</p>

                <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
                  <Select value={r.status} onChange={(e) => setStatus(r, e.target.value)} className="h-8 flex-1 text-[11px]">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                  <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream" aria-label={`Edit ${r.name}`}><Pencil size={13} /></button>
                  <button onClick={() => setDeleting(r)} className="rounded-lg p-1.5 text-muted transition hover:bg-chili-500/10 hover:text-chili-400" aria-label={`Remove ${r.name}`}><Trash2 size={13} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit rider' : 'Add a rider'}
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} loading={saving}>{editing ? 'Save rider' : 'Add rider'}</Button></div>}
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></Field>
          <Field label="Mobile number" required>
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" placeholder="98XXXXXXXX" required />
          </Field>
          <Field label="Zone">
            <Select value={draft.zone} onChange={(e) => setDraft({ ...draft, zone: e.target.value })}>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle" className="sm:col-span-2"><Input value={draft.vehicle} onChange={(e) => setDraft({ ...draft, vehicle: e.target.value })} placeholder="Bike · UP 33 AB 1234" /></Field>
          {error && <p className="sm:col-span-2 rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{error}</p>}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Remove ${deleting?.name}?`}
        message="They will be unassigned from any live orders. This can't be undone."
        confirmLabel="Remove rider"
      />
    </div>
  );
}
