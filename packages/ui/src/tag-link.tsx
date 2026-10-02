import type { ElementType, ReactNode } from "react";

interface TagLinkProps {
  href: string;
  children: ReactNode;
  as?: ElementType;
}

export default function TagLink({
  href,
  children,
  as: Anchor = "a",
}: TagLinkProps) {
  const external = /^https?:/.test(href);

  return (
    <Anchor
      href={href}
      className="tag whitespace-nowrap"
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children} <span aria-hidden="true">↗</span>
    </Anchor>
  );
}
