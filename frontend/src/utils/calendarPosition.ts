/** Keep the floating calendar inside the viewport without adding page overflow. */
export function calendarPosition(anchor: { top: number; bottom: number; left: number },
  panelHeight: number, viewportWidth: number, viewportHeight: number) {
  const margin = 8;
  const gap = 6;
  const width = Math.min(320, viewportWidth - margin * 2);
  const maxHeight = viewportHeight - margin * 2;
  const height = Math.min(panelHeight, maxHeight);
  const below = viewportHeight - anchor.bottom - gap - margin;
  const above = anchor.top - gap - margin;
  const top = below < height && above > below ? anchor.top - gap - height : anchor.bottom + gap;
  return {
    left: Math.max(margin, Math.min(anchor.left, viewportWidth - width - margin)),
    top: Math.max(margin, Math.min(top, viewportHeight - height - margin)),
    width,
    maxHeight,
  };
}
