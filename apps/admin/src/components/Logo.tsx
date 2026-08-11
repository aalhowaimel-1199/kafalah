export function Logo({ white = false, className = "h-12" }: { white?: boolean; className?: string }) {
  return <img src={white ? "/logo-white.png" : "/logo.png"} alt="كفالة" className={className} />;
}
