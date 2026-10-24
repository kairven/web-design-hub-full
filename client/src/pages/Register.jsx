import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field, Input } from '../components/ui.jsx';
import AuthVisual from '../components/AuthVisual.jsx';

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await register(form);
      toast(`Welcome to Zayka, ${user.name.split(' ')[0]}! 🎉`, 'success');
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <AuthVisual />

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition hover:text-cream">
            <ArrowLeft size={14} /> Back to store
          </Link>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-cream">Create your account</h1>
          <p className="mt-1.5 text-[13px] text-muted">Order in seconds and get ₹50 off your first meal with <b className="text-saffron-400">ZAYKA50</b>.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Full name">
              <div className="relative">
                <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input value={form.name} onChange={set('name')} placeholder="Amit Srivastava" className="pl-10" required />
              </div>
            </Field>
            <Field label="Mobile number" hint="We only deliver inside Raebareli — this is for delivery updates.">
              <div className="relative">
                <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="98XXXXXXXX" inputMode="numeric" className="pl-10" required
                />
              </div>
            </Field>
            <Field label="Email" hint="Optional — for order receipts.">
              <div className="relative">
                <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className="pl-10" />
              </div>
            </Field>
            <Field label="Password" hint="At least 6 characters.">
              <div className="relative">
                <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" className="pl-10" minLength={6} required autoComplete="new-password" />
              </div>
            </Field>

            {error && <p className="rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{error}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
            <p className="text-center text-[10.5px] leading-relaxed text-muted">
              By continuing you agree to our fair-use and delivery policy. We never share your number.
            </p>
          </form>

          <p className="mt-4 text-center text-[12.5px] text-muted">
            Already have an account? <Link to="/login" className="font-semibold text-saffron-400 hover:text-saffron-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
