import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field, Input } from '../components/ui.jsx';
import AuthVisual from '../components/AuthVisual.jsx';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = params.get('next');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(identifier.trim(), password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      const admin = user.role === 'admin' || user.role === 'staff';
      navigate(next || (admin ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fill = (id, pw) => {
    setIdentifier(id);
    setPassword(pw);
    setError('');
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <AuthVisual />

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition hover:text-cream">
            <ArrowLeft size={14} /> Back to store
          </Link>

          <div className="flex items-center gap-2.5">
            <img src="/brand/mark.svg" alt="" className="h-10 w-10" />
            <div>
              <p className="font-display text-[15px] font-semibold text-cream">Zayka E Raebareli</p>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-muted">Only in Raebareli</p>
            </div>
          </div>

          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-cream">Welcome back</h1>
          <p className="mt-1.5 text-[13px] text-muted">Sign in to order, track deliveries and manage your addresses.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Mobile number or email">
              <div className="relative">
                <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="pl-10"
                  autoComplete="username"
                  required
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-cream" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>

            {error && <p className="rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{error}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
          </form>

          <p className="mt-4 text-center text-[12.5px] text-muted">
            New to Zayka? <Link to="/register" className="font-semibold text-saffron-400 hover:text-saffron-300">Create an account</Link>
          </p>

          <div className="mt-7 rounded-2xl border border-white/[0.07] bg-ink-850/60 p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted">
              <ShieldCheck size={12} className="text-saffron-500" /> Demo accounts
            </p>
            <div className="mt-2.5 space-y-2">
              {[
                { label: 'Customer', id: '919876543200', pw: 'zayka123', note: 'Order + track' },
                { label: 'Admin', id: '9194210086', pw: 'admin123', note: 'Full dashboard' },
                { label: 'Kitchen staff', id: '9194210087', pw: 'staff123', note: 'Orders only' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => fill(d.id, d.pw)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-left transition hover:border-saffron-500/40 hover:bg-saffron-500/[0.05]"
                >
                  <span>
                    <span className="block text-[12px] font-semibold text-cream">{d.label}</span>
                    <span className="text-[10.5px] text-muted">{d.note}</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-saffron-400">{d.pw}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted">Tap a card to autofill, then press Sign in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
