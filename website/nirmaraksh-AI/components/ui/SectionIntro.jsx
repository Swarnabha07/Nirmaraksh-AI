import Eyebrow from "@/components/ui/Eyebrow";

export function GradientText({ children }) {
  return <span className="gradient-text">{children}</span>;
}

export default function SectionIntro({ eyebrow, titleId, title, description, className = "" }) {
  return (
    <div className={className ? `section-intro ${className}` : "section-intro"}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={titleId}>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}
