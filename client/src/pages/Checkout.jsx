import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Banknote, Bike, CheckCircle2, ChevronRight, Clock3, MapPin, MessageSquare, Plus, ShieldCheck, Smartphone, Tag, Utensils, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { previewCart, useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { cx, inr } from '../lib/format.js';
import {
  Badge, Button, Card, DishImage, EmptyState, Field, Input, Modal, Select, SpiceLevel, VegMark,
} from '../components/ui.jsx';

const EMPTY_ADDRESS = { label: 'Home', name: '', phone: '', line1: '', area: 'Civil Lines', pincode: '229001' };

export default function Checkout() {
  const { user, addresses, addAddress } = useAuth();
  const { lines, zone, setZone, coupon, setCoupon, clear, subtotal } = useCart();
  const { restaurant, kitchenOpen, menu } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [payment, setPayment] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [addressModal, setAddressModal] = useState(false);
  const [draft, setDraft] = useState(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const saved = addresses.find((a) => a.is_default) || addresses[0];
    if (saved && !selectedAddress) {
      setSelectedAddress(saved.id);
      setZone(saved.area);
    }
  }, [addresses, selectedAddress, setZone]);

  const quote = useMemo(
    () => previewCart({ lines, zone, restaurant, coupon }),
    [lines, zone, restaurant, coupon]
  );
  const code = coupon?.code;
  const belowMin = subtotal < (restaurant?.minOrder ?? 0);

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setFormError('');
    try {
      const address = await addAddress({ ...draft, name: draft.name || user.name, phone: draft.phone || user.phone });
      setSelectedAddress(address.id);
      setZone(address.area);
      setAddressModal(false);
      setDraft(EMPTY_ADDRESS);
      toast('Address saved', 'success');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    setError('');
    if (!selectedAddress) { setError('Choose a delivery address first.'); return; }
    setPlacing(true);
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          addressId: selectedAddress,
          zone,
          couponCode: code,
          paymentMethod: payment,
          notes,
        },
      });
      clear();
      toast('Order placed! Our kitchen is on it 🔥', 'success', { title: `Order ${data.order.code}` });
      navigate(`/orders/${data.order.code}?new=1`);
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Utensils}
          title="Nothing to check out yet"
          description="Add a few dishes from the menu and come back — we'll keep your cart saved."
          action={<Button as={Link} to="/menu">Browse the menu</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/menu" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition hover:text-cream">
        <ArrowLeft size={14} /> Keep browsing
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">Checkout</h1>
          <p className="mt-1 text-[13px] text-muted">Almost there — confirm your address and payment.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-mint-500/20 bg-mint-500/[0.07] px-3 py-2 text-[11.5px] text-mint-400">
          <Clock3 size={13} /> Arriving in ~{quote.zoneEta} min to {zone}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-5">
          {/* Address */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-cream">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-500/15 text-[11px] font-bold text-saffron-400">1</span>
                Delivery address
              </h2>
              <Button size="xs" variant="ghost" onClick={() => { setDraft({ ...EMPTY_ADDRESS, name: user?.name || '', phone: user?.phone || '' }); setFormError(''); setAddressModal(true); }}>
                <Plus size={13} /> New address
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/12 px-4 py-6 text-center">
                <MapPin size={20} className="mx-auto text-muted" />
                <p className="mt-2 text-[13px] font-semibold text-cream">No saved address yet</p>
                <p className="mt-1 text-[12px] text-muted">Add one to continue — we deliver only inside Raebareli.</p>
                <Button size="sm" className="mt-3" onClick={() => setAddressModal(true)}>Add address</Button>
              </div>
            ) : (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {addresses.map((a) => {
                  const active = selectedAddress === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAddress(a.id); setZone(a.area); }}
                      className={cx(
                        'relative rounded-xl border p-3.5 text-left transition',
                        active ? 'border-saffron-500/60 bg-saffron-500/[0.07]' : 'border-white/[0.08] bg-ink-800/40 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge tone={active ? 'saffron' : 'neutral'}>{a.label}</Badge>
                        {a.is_default ? <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Default</span> : null}
                        {active && <CheckCircle2 size={15} className="ml-auto text-saffron-400" />}
                      </div>
                      <p className="mt-2 text-[12.5px] font-semibold text-cream">{a.name} · {a.phone}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted">{a.line1}, {a.area}, {a.city} {a.pincode}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Delivery area</span>
              <Select value={zone} onChange={(e) => setZone(e.target.value)} className="h-9 w-auto flex-1 text-[12px] sm:flex-none sm:w-56">
                {(restaurant?.zones ?? []).map((z) => (
                  <option key={z.name} value={z.name}>{z.name} · {z.fee === 0 ? 'free delivery' : `${inr(z.fee)} fee`} · ~{z.eta}m</option>
                ))}
              </Select>
              <span className="text-[11px] text-muted">Only Raebareli district</span>
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-cream">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-500/15 text-[11px] font-bold text-saffron-400">2</span>
              Payment method
            </h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {[
                { id: 'cod', icon: Banknote, title: 'Cash on delivery', desc: 'Pay our rider in cash. Keep change ready.' },
                { id: 'upi', icon: Smartphone, title: 'UPI on delivery', desc: `Scan & pay ${restaurant?.upiId || 'zaykaraebareli@upi'} at the door.` },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={cx(
                    'flex items-start gap-3 rounded-xl border p-3.5 text-left transition',
                    payment === p.id ? 'border-saffron-500/60 bg-saffron-500/[0.07]' : 'border-white/[0.08] bg-ink-800/40 hover:border-white/20'
                  )}
                >
                  <span className={cx('mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg', payment === p.id ? 'bg-saffron-500/20 text-saffron-300' : 'bg-white/5 text-muted')}>
                    <p.icon size={16} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-cream">
                      {p.title}{payment === p.id && <CheckCircle2 size={13} className="text-saffron-400" />}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">{p.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={12} className="text-mint-500" /> No advance payment needed. We never store card details.
            </p>
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-cream">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-500/15 text-[11px] font-bold text-saffron-400">3</span>
              Anything for the kitchen?
            </h2>
            <div className="mt-3">
              <Field hint="Optional · e.g. less spicy, extra raita, don't ring the bell">
                <div className="relative">
                  <MessageSquare size={14} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                    placeholder="Notes for the kitchen or rider…"
                    className="min-h-[76px] w-full rounded-xl border border-white/10 bg-ink-800/80 py-3 pl-9 pr-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-500/10"
                  />
                </div>
              </Field>
              <p className="mt-1 text-right text-[10.5px] text-muted">{notes.length}/300</p>
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="font-display text-[15px] font-semibold text-cream">Order summary</h2>
              <p className="mt-0.5 text-[11.5px] text-muted">{lines.length} dish{lines.length === 1 ? '' : 'es'} · {zone}</p>
            </div>

            <ul className="max-h-[280px] divide-y divide-white/[0.05] overflow-y-auto">
              {lines.map((l) => {
                const menuItem = menu.find((m) => m.id === l.id);
                return (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-2.5">
                    <DishImage src={l.image} name={l.name} className="h-10 w-10 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <VegMark isVeg={l.isVeg} size={11} />
                        <p className="truncate text-[12.5px] font-medium text-cream">{l.name}</p>
                      </div>
                      <p className="text-[11px] text-muted">
                        {l.qty} × {inr(l.price)}
                        {menuItem ? <span className="ml-1.5"><SpiceLevel level={menuItem.spiceLevel} /></span> : null}
                      </p>
                    </div>
                    <span className="text-[12.5px] font-semibold tabular-nums text-cream">{inr(l.price * l.qty)}</span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-1.5 border-t border-white/[0.06] px-5 py-4 text-[12.5px]">
              <Line label="Item total" value={inr(quote.subtotal)} />
              {quote.discount > 0 && <Line label={`Coupon ${code}`} value={`− ${inr(quote.discount)}`} accent="text-mint-400" />}
              <Line label="Delivery fee" value={quote.deliveryFee === 0 ? 'FREE' : inr(quote.deliveryFee)} accent={quote.deliveryFee === 0 ? 'text-mint-400' : undefined} />
              <Line label="Packaging" value={inr(quote.packagingFee)} />
              <Line label={`GST (${quote.taxPercent}%)`} value={inr(quote.tax)} />
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.08] pt-2.5">
                <span className="text-[13px] font-semibold text-cream">To pay</span>
                <span className="font-display text-xl font-semibold text-cream">{inr(quote.total)}</span>
              </div>
            </div>

            <div className="space-y-2 px-5 pb-5">
              {code ? (
                <div className="flex items-center justify-between rounded-lg border border-mint-500/25 bg-mint-500/[0.08] px-3 py-2 text-[12px]">
                  <span className="flex items-center gap-1.5 font-semibold text-mint-400"><Tag size={12} /> {code} applied</span>
                  <button onClick={() => setCoupon(null)} className="text-[11px] text-muted hover:text-cream">Remove</button>
                </div>
              ) : null}
              {error && <p className="rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{error}</p>}
              {!kitchenOpen && (
                <p className="rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">
                  Kitchen is closed — ordering reopens at {restaurant?.openTime || '11:00'}.
                </p>
              )}
              {belowMin && (
                <p className="rounded-lg bg-saffron-500/10 px-3 py-2 text-[12px] text-saffron-300">
                  Minimum order is {inr(restaurant?.minOrder)}. Add {inr((restaurant?.minOrder ?? 0) - subtotal)} more.
                </p>
              )}
              <Button size="lg" className="w-full" onClick={placeOrder} loading={placing} disabled={!kitchenOpen || belowMin || !selectedAddress}>
                {placing ? 'Placing your order…' : `Place order · ${inr(quote.total)}`}
              </Button>
              <p className="text-center text-[11px] text-muted">
                {payment === 'cod' ? 'Pay cash when it arrives' : 'Pay via UPI at your door'} · Cancel free until cooking starts
              </p>
            </div>
          </Card>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850/50 px-3.5 py-2.5 text-[11px] text-muted">
            <Bike size={14} className="shrink-0 text-saffron-400" />
            Delivered by our own Raebareli riders. Average 28 minutes.
          </div>
        </div>
      </div>

      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title="Add delivery address"
        description="We currently deliver inside Raebareli district only."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddressModal(false)}>Cancel</Button>
            <Button onClick={saveAddress} loading={savingAddress}>Save address</Button>
          </div>
        }
      >
        <form onSubmit={saveAddress} className="grid gap-3 sm:grid-cols-2">
          <Field label="Save as" className="sm:col-span-2">
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => setDraft((d) => ({ ...d, label: l }))}
                  className={cx(
                    'rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition',
                    draft.label === l ? 'border-saffron-500/60 bg-saffron-500/15 text-saffron-300' : 'border-white/10 text-muted'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Receiver name" required>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Full name" required />
          </Field>
          <Field label="Mobile" required>
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit number" inputMode="numeric" required />
          </Field>
          <Field label="House / street" required className="sm:col-span-2">
            <Input value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} placeholder="House no., street, landmark" required />
          </Field>
          <Field label="Area" required>
            <Select value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
              {['Civil Lines', 'Indira Nagar', 'Railway Road', 'Ahiyapur', 'Bachhrawan', 'Jais'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pincode" required error={formError || undefined}>
            <Input value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" placeholder="229001" required />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  );
}

function Line({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cx('tabular-nums text-cream-dim', accent)}>{value}</span>
    </div>
  );
}
