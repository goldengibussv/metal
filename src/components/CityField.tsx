import { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { QUOTE_CITIES } from "@/lib/site";
import { useT } from "@/lib/i18n";

export function CityField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? QUOTE_CITIES.filter((c) => c.toLowerCase().includes(q)) : QUOTE_CITIES;
    return list.length ? list : ["Other"];
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={t("Search your city")}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {options.map((c) => (
            <button
              key={c}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                onChange(c === "Other" ? t("Other") : c);
                setOpen(false);
              }}
            >
              {c === "Other" ? t("Other") : c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
