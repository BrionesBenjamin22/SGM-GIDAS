import React from "react";

export function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${q})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? <mark key={i} className="bg-yellow-200">{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  );
}
