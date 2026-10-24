import { Quote, Star } from 'lucide-react';

export default function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <img src="/dishes/hero.jpg" alt="Zayka signature biryani spread" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark.svg" alt="" className="h-10 w-10" />
          <div>
            <p className="font-display text-[15px] font-semibold text-cream">Zayka E Raebareli</p>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.3em] text-saffron-400">Only in Raebareli</p>
          </div>
        </div>

        <div className="max-w-md">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={15} className="fill-saffron-400 text-saffron-400" />
            ))}
            <span className="ml-2 text-[12px] font-semibold text-cream">4.8 · 12,400+ orders</span>
          </div>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.05] tracking-tight text-cream xl:text-[42px]">
            Har dabbe me <span className="text-gradient">Raebareli ka zayka</span>.
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-cream-dim/80">
            Slow-dum biryani, Mughlai musallam aur crispy lollypops — cooked in our own kitchen,
            delivered by our own riders.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900/60 p-4 backdrop-blur-xl">
            <Quote size={15} className="text-saffron-500" />
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-dim">
              “Aajtak Raebareli me itni khushbudaar biryani nahi khaayi. 32 minute me garam-garam pahunch gayi.”
            </p>
            <p className="mt-2 text-[11px] font-semibold text-saffron-400">Shalini Tiwari · Civil Lines</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10.5px] uppercase tracking-widest text-cream-dim/60">
          <span>Fresh daily</span><span className="h-1 w-1 rounded-full bg-saffron-500" />
          <span>No aggregator fees</span><span className="h-1 w-1 rounded-full bg-saffron-500" />
          <span>Raebareli only</span>
        </div>
      </div>
    </div>
  );
}
