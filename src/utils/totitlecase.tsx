export default function toTitleCase(name: string): string {
  if (!name) return "";
  if (name.length == 0) return name;
  return name.substring(0, 1).toUpperCase().concat(name.substring(1));
}

