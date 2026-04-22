export const toTitleCase = (text?: unknown) => {
  if (text === null || text === undefined) return "";

  const safeText = String(text).trim();
  if (!safeText) return "";

  const exceptions = ["de", "del", "y", "en", "la", "el", "a"];

  return safeText
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (!word) return "";
      if (index !== 0 && exceptions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};