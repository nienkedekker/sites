export const isExternal = (href: string) => /^https?:/.test(href);

export function externalProps(href: string) {
  return isExternal(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}
