import Brand from "@/components/ui/Brand";
import AuthButton from "@/components/auth/AuthButton";
import { ArrowIcon } from "@/components/ui/Icons";
import { site } from "@/data/site";

export default function Header() {
  return (
    <header className="site-header page-container">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        {site.nav.map(({ label, href }) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <AuthButton className="header-action">Get Started <ArrowIcon diagonal /></AuthButton>
    </header>
  );
}
