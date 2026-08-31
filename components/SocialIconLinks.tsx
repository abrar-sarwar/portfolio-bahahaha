// Instagram and TikTok as icon-only links. The text socials row already
// spells out email/LinkedIn/GitHub; these two read fine as brand marks, so
// they ride alongside without stretching the row. Both layouts (desktop
// aside and mobile stack) render this, so the handles live in one place.

type IconProps = { className?: string };

function InstagramMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.6 2h-3.02v13.6a2.62 2.62 0 1 1-2.62-2.62c.24 0 .47.03.69.1v-3.07a5.7 5.7 0 1 0 4.95 5.65V8.9a6.98 6.98 0 0 0 4.1 1.32V7.15a4.1 4.1 0 0 1-4.1-4.1V2z" />
    </svg>
  );
}

export const SOCIAL_ICON_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/abrartsarwar",
    Icon: InstagramMark,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@abrarts04",
    Icon: TikTokMark,
  },
];

type Props = {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
};

export default function SocialIconLinks({
  className = "",
  linkClassName = "",
  iconClassName = "h-4 w-4",
}: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {SOCIAL_ICON_LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={label}
          title={label}
          className={`transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 ${linkClassName}`}
        >
          <Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
