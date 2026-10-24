import { useEffect, useMemo, useState } from 'react';
import { Crown, Download, Search, UserRound, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import { cx, inr, timeAgo } from '../../lib/format.js';
import { Avatar, Badge, Button, Card, EmptyState, RowSkeleton } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    api('/admin/customers')
      .then((d) => setCustomers(d.customers))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  const exportCsv = () => {
    const rows = [['Name', 'Phone', 'Orders', 'Spent', 'Last order'], ...filtered.map((c) => [c.name, c.phone, c.orders, c.spent, c.last_order ?? ''])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `zayka-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Customer list exported', 'success');
  };

  const totalSpent = customers.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Customers', value: customers.length, icon: Users },
          { label: 'Repeat customers', value: customers.filter((c) => c.orders > 1).length, icon: Crown },
          { label: 'Lifetime value', value: inr(totalSpent), icon: UserRound },
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-800/70 pl-9 pr-3 text-[12.5px] text-cream placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={exportCsv}><Download size={13} /> Export CSV</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_1fr_.6fr_.8fr_.9fr] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted sm:grid">
          <span>Customer</span><span>Contact</span><span>Orders</span><span>Spent</span><span>Last order</span>
        </div>
        {loading ? (
          <div className="p-4"><RowSkeleton rows={5} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5"><EmptyState icon={Users} title="No customers yet" description="Customers appear here after their first order." /></div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((c) => (
              <div key={c.id} className="grid gap-2 px-4 py-3 transition hover:bg-white/[0.02] sm:grid-cols-[1.6fr_1fr_.6fr_.8fr_.9fr] sm:items-center">
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-cream">{c.name}</p>
                    <p className="text-[10.5px] text-muted sm:hidden">+91 {c.phone}</p>
                  </div>
                  {c.orders > 2 && <Badge tone="saffron" className="hidden py-0 text-[9px] xl:inline-flex">Regular</Badge>}
                </div>
                <p className="hidden text-[11.5px] text-cream-dim sm:block">+91 {c.phone}</p>
                <p className={cx('text-[12px] font-semibold', c.orders ? 'text-cream' : 'text-muted')}>{c.orders}</p>
                <p className="text-[12px] font-semibold text-cream">{inr(c.spent)}</p>
                <p className="text-[11px] text-muted">{c.last_order ? timeAgo(c.last_order) : 'Never ordered'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
