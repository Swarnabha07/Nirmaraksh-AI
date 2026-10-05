import Link from "next/link";

export default function DownloadOverviewButton({ children, ...props }) {
  return (
    <Link href="/download#downloads" {...props}>
      {children}
    </Link>
  );
}
