export const inr = (n) => {
  const value = Number(n) || 0;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
};

export const shortInr = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `₹${v}`;
};

export function timeAgo(input) {
  if (!input) return '';
  const then = new Date(input.includes('T') ? input : input.replace(' ', 'T') + 'Z').getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function clock(input) {
  if (!input) return '';
  const d = new Date(input.includes('T') ? input : input.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function dayLabel(input) {
  const d = new Date(input);
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export const orderCode = (code) => code?.split('-')[0] ?? '';

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}
