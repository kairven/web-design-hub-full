import { Link } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <img src="/brand/mark.svg" alt="" className="h-14 w-14" />
      <p className="mt-6 font-display text-[64px] font-semibold leading-none text-white/10">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-cream">Yeh plate khaali hai</h1>
      <p className="mt-2 max-w-sm text-[13px] text-muted">
        The page you're looking for isn't on our menu. Let's get you back to the good stuff.
      </p>
      <div className="mt-6 flex gap-2">
        <Button as={Link} to="/"><ArrowLeft size={15} /> Back home</Button>
        <Button as={Link} to="/menu" variant="outline"><UtensilsCrossed size={15} /> Browse menu</Button>
      </div>
    </div>
  );
}
