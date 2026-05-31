export function SectionColorDot({
  color,
  muted = false,
}: {
  color: string;
  muted?: boolean;
}) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${muted ? "opacity-40" : ""}`}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
