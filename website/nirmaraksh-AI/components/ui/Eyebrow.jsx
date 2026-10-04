export default function Eyebrow({ as: Tag = "div", children }) {
  return (
    <Tag className="eyebrow">
      <span className="eyebrow-line" />{` ${children}`}
    </Tag>
  );
}
