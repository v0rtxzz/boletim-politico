type P = { className?: string };
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconeHoje = ({ className }: P) => (
  <svg {...base} className={className}><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" /><path d="M8 14h4" /></svg>
);
export const IconeArquivo = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 7.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M3 4h18v3.5H3z" /><path d="M10 12h4" /></svg>
);
export const IconeGlossario = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" /><path d="M9 8h6M9 11.5h4" /></svg>
);
export const IconeBusca = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconeTema = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" /></svg>
);
export const IconeExterno = ({ className }: P) => (
  <svg {...base} width={14} height={14} className={className}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
