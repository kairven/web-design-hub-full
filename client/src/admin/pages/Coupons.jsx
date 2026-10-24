import { useEffect, useState } from 'react';
import { Percent, Plus, Tag, Trash2, Pencil, Ticket, TrendingUp, Zap } from 'lucide-react';
import { api } from '../../lib/api.js';
import { cx, inr } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, RowSkeleton, Select, Switch,
} from '../../components/ui.jsx';

const BLANK = { code: '', title: '', type: 'percent', value: '', minOrder: 149, maxDiscount: '', usageLimit: '' };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api('/admin/coupons')
      .then((d) => setCoupons(d.coupons))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const openNew = () => {
    setEditing(null);
    setDraft(BLANK);
    setError('');
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setDraft({
      code: c.code, title: c.title, type: c.type, value: c.value, minOrder: c.min_order,
      maxDiscount: c.max_discount ?? '', usageLimit: c.usage_limit ?? '',
    });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      ...draft,
      value: Number(draft.value),
      minOrder: Number(draft.minOrder || 0),
      maxDiscount: draft.maxDiscount ? Number(draft.maxDiscount) : null,
      usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null,
    };
    try {
      if (editing) {
        const data = await api(`/admin/coupons/${editing.id}`, { method: 'PATCH', body });
        setCoupons((list) => list.map((c) => (c.id === editing.id ? data.coupon : c)));
        toast('Offer updated', 'success');
      } else {
        const data = await api('/admin/coupons', { method: 'POST', body });
        setCoupons((list) => [data.coupon, ...list]);
        toast(`${data.coupon.code} is live`, 'success');
      }
      setModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon) => {
    setBusyId(coupon.id);
    const next = !coupon.active;
    setCoupons((list) => list.map((c) => (c.id === coupon.id ? { ...c, active: next ? 1 : 0 } : c)));
    try {
      await api(`/admin/coupons/${coupon.id}`, { method: 'PATCH', body: { active: next } });
      toast(next ? `${coupon.code} enabled` : `${coupon.code} paused`, next ? 'success' : 'info');
    } catch (err) {
      setCoupons((list) => list.map((c) => (c.id === coupon.id ? { ...c, active: coupon.active } : c)));
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await api(`/admin/coupons/${deleting.id}`, { method: 'DELETE' });
      setCoupons((list) => list.filter((c) => c.id !== deleting.id));
      toast('Coupon deleted', 'info');
      setDeleting(null);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const live = coupons.filter((c) => c.active).length;
  const redemptions = coupons.reduce((s, c) => s + c.usage_count, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Live offers', value: live, icon: Zap },
          { label: 'Total redemptions', value: redemptions, icon: TrendingUp },
          { label: 'Codes created', value: coupons.length, icon: Ticket },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/10 text-saffron-400"><s.icon size={15} /></span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted">{s.label}</p>
              <p className="font-display text-lg font-semibold text-cream">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted">Discounts apply on item subtotal, before delivery and taxes.</p>
        <Button size="sm" onClick={openNew}><Plus size={14} /> New offer</Button>
      </div>

      {loading ? (
        <RowSkeleton rows={3} />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Percent} title="No offers running" description="Create a coupon to bring customers back on a slow evening."
          action={<Button size="sm" onClick={openNew}><Plus size={13} /> Create first offer</Button>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const usage = c.usage_limit ? Math.min(100, (c.usage_count / c.usage_limit) * 100) : 0;
            return (
              <Card key={c.id} className={cx('relative overflow-hidden p-4', !c.active && 'opacity-70')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/12 text-saffron-400"><Tag size={15} /></span>
                    <div>
                      <p className="font-mono text-[13px] font-bold tracking-wide text-cream">{c.code}</p>
                      <p className="text-[10.5px] text-muted">{c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`} · min {inr(c.min_order)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={!!c.active} onChange={() => toggle(c)} disabled={busyId === c.id} label={`Toggle ${c.code}`} />
                  </div>
                </div>

                <p className="mt-3 text-[12px] font-medium text-cream-dim">{c.title}</p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10.5px] text-muted">
                    <span>{c.usage_count} redeemed{c.usage_limit ? ` of ${c.usage_limit}` : ''}</span>
                    <span>{c.active ? 'Live' : 'Paused'}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className={cx('h-full rounded-full', c.active ? 'bg-saffron-500' : 'bg-ink-500')} style={{ width: `${Math.max(usage, 4)}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                  <span className="text-[10px] text-muted">
                    {c.max_discount ? `Max ${inr(c.max_discount)} off` : 'No cap'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream" aria-label={`Edit ${c.code}`}><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(c)} className="rounded-lg p-1.5 text-muted transition hover:bg-chili-500/10 hover:text-chili-400" aria-label={`Delete ${c.code}`}><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit ${editing.code}` : 'Create an offer'}
        description="Customers apply this at checkout on the storefront."
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} loading={saving}>{editing ? 'Save offer' : 'Launch offer'}</Button></div>}
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Coupon code" required>
            <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="ZAYKA50" required disabled={!!editing} className="font-mono uppercase" />
          </Field>
          <Field label="Discount type">
            <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              <option value="percent">Percentage off</option>
              <option value="flat">Flat amount off</option>
            </Select>
          </Field>
          <Field label="Offer title" required className="sm:col-span-2">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="₹50 off your first order" required />
          </Field>
          <Field label={draft.type === 'percent' ? 'Percent off (%)' : 'Amount off (₹)'} required>
            <Input type="number" min="1" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} required />
          </Field>
          <Field label="Min order (₹)">
            <Input type="number" min="0" value={draft.minOrder} onChange={(e) => setDraft({ ...draft, minOrder: e.target.value })} />
          </Field>
          {draft.type === 'percent' && (
            <Field label="Max discount (₹)" hint="Leave blank for no cap.">
              <Input type="number" min="0" value={draft.maxDiscount} onChange={(e) => setDraft({ ...draft, maxDiscount: e.target.value })} />
            </Field>
          )}
          <Field label="Usage limit">
            <Input type="number" min="1" value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value })} placeholder="Unlimited" />
          </Field>
          {error && <p className="sm:col-span-2 rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{error}</p>}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleting?.code}?`}
        message="Customers will no longer be able to apply this code. Redemption history stays in past orders."
        confirmLabel="Delete coupon"
      />
    </div>
  );
}
