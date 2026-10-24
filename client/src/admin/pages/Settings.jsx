import { useEffect, useState } from 'react';
import { Bike, Clock3, MapPin, Plus, Save, Store, Trash2, Wallet } from 'lucide-react';
import { api } from '../../lib/api.js';
import { cx } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { Button, Card, Field, Input, Skeleton, Switch } from '../../components/ui.jsx';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { reload, setKitchenOpen: setGlobalKitchenOpen } = useStore();

  useEffect(() => {
    api('/admin/settings')
      .then((d) => { setSettings(d.settings); setKitchenOpen(d.kitchenOpen); })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));
  const setNum = (key) => (e) => setSettings((s) => ({ ...s, [key]: Number(e.target.value) }));

  const save = async () => {
    setSaving(true);
    try {
      const data = await api('/admin/settings', { method: 'PATCH', body: { ...settings, kitchenOpen } });
      setSettings(data.settings);
      setGlobalKitchenOpen(data.kitchenOpen);
      await reload();
      toast('Settings saved — storefront updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateZone = (index, key, value) => {
    setSettings((s) => ({
      ...s,
      zones: s.zones.map((z, i) => (i === index ? { ...z, [key]: value } : z)),
    }));
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-muted">Changes reflect on the storefront immediately after saving.</p>
        <Button size="sm" onClick={save} loading={saving}><Save size={14} /> Save all changes</Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-ink-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', kitchenOpen ? 'bg-mint-500/15 text-mint-400' : 'bg-chili-500/15 text-chili-400')}>
              <Store size={16} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-cream">{kitchenOpen ? 'Kitchen is accepting orders' : 'Ordering is paused'}</p>
              <p className="text-[11px] text-muted">Pause when you're at capacity — customers can still browse.</p>
            </div>
          </div>
          <Switch checked={kitchenOpen} onChange={setKitchenOpen} label="Kitchen open" />
        </div>

        <h2 className="mt-5 flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><Store size={14} className="text-saffron-400" /> Restaurant details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Restaurant name"><Input value={settings.name} onChange={set('name')} /></Field>
          <Field label="Phone"><Input value={settings.phone} onChange={set('phone')} /></Field>
          <Field label="Tagline" className="sm:col-span-2"><Input value={settings.tagline} onChange={set('tagline')} /></Field>
          <Field label="Address" className="sm:col-span-2"><Input value={settings.address} onChange={set('address')} /></Field>
          <Field label="Opens at"><Input type="time" value={settings.openTime} onChange={set('openTime')} /></Field>
          <Field label="Closes at"><Input type="time" value={settings.closeTime} onChange={set('closeTime')} /></Field>
          <Field label="UPI ID" hint="Shown at checkout for UPI payments."><Input value={settings.upiId} onChange={set('upiId')} /></Field>
          <Field label="Delivery radius (km)"><Input type="number" value={settings.deliveryRadiusKm} onChange={setNum('deliveryRadiusKm')} /></Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><Wallet size={14} className="text-saffron-400" /> Charges & minimums</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Base delivery fee (₹)"><Input type="number" value={settings.deliveryFee} onChange={setNum('deliveryFee')} /></Field>
          <Field label="Free delivery above (₹)"><Input type="number" value={settings.freeDeliveryAbove} onChange={setNum('freeDeliveryAbove')} /></Field>
          <Field label="Packaging fee (₹)"><Input type="number" value={settings.packagingFee} onChange={setNum('packagingFee')} /></Field>
          <Field label="GST (%)"><Input type="number" value={settings.taxPercent} onChange={setNum('taxPercent')} /></Field>
          <Field label="Minimum order (₹)"><Input type="number" value={settings.minOrder} onChange={setNum('minOrder')} /></Field>
          <Field label="Avg. prep time (min)"><Input type="number" value={settings.avgPrepMinutes} onChange={setNum('avgPrepMinutes')} /></Field>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><MapPin size={14} className="text-saffron-400" /> Delivery zones</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">Each zone has its own fee and ETA across Raebareli.</p>
          </div>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setSettings((s) => ({ ...s, zones: [...s.zones, { name: 'New zone', eta: 30, fee: 20 }] }))}
          >
            <Plus size={12} /> Add zone
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="hidden grid-cols-[1.4fr_.8fr_.8fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted sm:grid">
            <span>Area</span><span>ETA (min)</span><span>Fee (₹)</span><span />
          </div>
          {settings.zones.map((z, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-white/[0.06] bg-ink-800/40 p-2.5 sm:grid-cols-[1.4fr_.8fr_.8fr_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-1">
              <Input value={z.name} onChange={(e) => updateZone(i, 'name', e.target.value)} className="h-9 text-[12px]" />
              <Input type="number" value={z.eta} onChange={(e) => updateZone(i, 'eta', Number(e.target.value))} className="h-9 text-[12px]" />
              <Input type="number" value={z.fee} onChange={(e) => updateZone(i, 'fee', Number(e.target.value))} className="h-9 text-[12px]" />
              <button
                onClick={() => setSettings((s) => ({ ...s, zones: s.zones.filter((_, idx) => idx !== i) }))}
                className="justify-self-end rounded-lg p-2 text-muted transition hover:bg-chili-500/10 hover:text-chili-400"
                aria-label={`Remove ${z.name}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-ink-850/50 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
          <Clock3 size={12} /> Hours are informational — use the kitchen switch to pause ordering instantly.
        </p>
        <Button size="sm" onClick={save} loading={saving}><Save size={14} /> Save changes</Button>
      </div>
    </div>
  );
}
