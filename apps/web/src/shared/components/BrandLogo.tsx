import Image from "next/image";

interface BrandLogoProps {
  size?: "small" | "medium";
  showTagline?: boolean;
}

export function BrandLogo({ size = "medium", showTagline = false }: BrandLogoProps) {
  const isSmall = size === "small";

  return (
    <span className="inline-flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`relative block shrink-0 overflow-hidden rounded-xl bg-[#b7152b] shadow-md shadow-red-100 ${
          isSmall ? "h-8 w-8 rounded-lg" : "h-10 w-10"
        }`}
      >
        <Image
          src="/img/logo.png"
          alt=""
          width={isSmall ? 32 : 40}
          height={isSmall ? 32 : 40}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex flex-col">
        <span
          className={`font-extrabold leading-none tracking-tight text-[#b7152b] ${
            isSmall ? "text-lg" : "text-xl"
          }`}
        >
          KujiLingo
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Learn Japanese
          </span>
        )}
      </span>
    </span>
  );
}
