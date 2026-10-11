import type { CSSProperties, ReactNode } from "react";
import CardHead from "./card-head";

interface PanelProps {
  id: string;
  title: ReactNode;
  children: ReactNode;
  as?: "h2" | "h3";
  tag?: ReactNode;
  note?: ReactNode;
  align?: "top" | "bottom";
  className?: string;
  style?: CSSProperties;
}

export default function Panel({
  id,
  title,
  children,
  as,
  tag,
  note,
  align = "top",
  className = "",
  style,
}: PanelProps) {
  return (
    <section
      aria-labelledby={id}
      className={`panel flex flex-col ${className}`}
      style={style}
    >
      <CardHead as={as} id={id} tag={tag} note={note}>
        {title}
      </CardHead>
      <div className={align === "bottom" ? "mt-auto pt-6" : "mt-6"}>
        {children}
      </div>
    </section>
  );
}
