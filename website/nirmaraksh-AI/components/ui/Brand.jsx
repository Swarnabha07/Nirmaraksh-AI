import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";

export default function Brand({ showLogo = true }) {
  return (
    <Link className="brand" href="/" aria-label={`${site.name} home`}>
      {showLogo && (
        <Image
          className="brand-logo"
          src={site.logo.src}
          width={site.logo.width}
          height={site.logo.height}
          alt=""
          priority
        />
      )}
      <span>{site.name}</span>
    </Link>
  );
}
