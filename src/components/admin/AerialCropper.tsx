import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Rect = { x: number; y: number; w: number; h: number };

/** Lets the admin rotate the satellite image and drag a square around the house, then returns the cropped image. */
export function AerialCropper({
  src,
  onApply,
  onCancel,
}: {
  src: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  const pos = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!start) return;
    const p = pos(e);
    // keep the selection square
    const size = Math.max(Math.abs(p.x - start.x), Math.abs(p.y - start.y));
    const x = p.x < start.x ? Math.max(0, start.x - size) : start.x;
    const y = p.y < start.y ? Math.max(0, start.y - size) : start.y;
    const s = Math.min(size, 1 - x, 1 - y);
    setRect({ x, y, w: s, h: s });
  };

  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const n = img.naturalWidth;
      const full = document.createElement("canvas");
      full.width = n;
      full.height = n;
      const fc = full.getContext("2d")!;
      fc.translate(n / 2, n / 2);
      fc.rotate((angle * Math.PI) / 180);
      fc.drawImage(img, -n / 2, -n / 2, n, n);
      const r = rect && rect.w > 0.03 ? rect : { x: 0, y: 0, w: 1, h: 1 };
      const out = document.createElement("canvas");
      out.width = 1024;
      out.height = 1024;
      out.getContext("2d")!.drawImage(full, r.x * n, r.y * n, r.w * n, r.h * n, 0, 0, 1024, 1024);
      onApply(out.toDataURL("image/png"));
    };
    img.src = src;
  };

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        className="relative mx-auto aspect-square w-full max-w-[460px] cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-border bg-muted"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          const p = pos(e);
          setStart(p);
          setRect({ ...p, w: 0, h: 0 });
        }}
        onPointerMove={onMove}
        onPointerUp={() => setStart(null)}
      >
        <img
          src={src}
          alt="Vista satelital para recortar"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        {rect && rect.w > 0 ? (
          <div
            className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
            style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
          />
        ) : null}
      </div>
      <div className="mx-auto flex max-w-[460px] items-center gap-3 text-sm">
        <span className="w-16 shrink-0">Rotar</span>
        <input type="range" min={-180} max={180} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="flex-1" />
        <span className="w-12 text-right tabular-nums">{angle}°</span>
      </div>
      <p className="mx-auto max-w-[460px] text-xs text-muted-foreground">
        Gira la imagen para dejar la fachada hacia abajo y arrastra un cuadro alrededor de la casa.
      </p>
      <div className="mx-auto flex max-w-[460px] justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={apply}>Aplicar recorte</Button>
      </div>
    </div>
  );
}
