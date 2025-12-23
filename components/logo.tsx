import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-16 h-16", className)}
    >
      {/* Background Squircle */}
      <rect
        width="512"
        height="512"
        rx="80"
        fill="#F94361"
      />

      {/* Clip path to contain shadow within squircle */}
      <defs>
        <clipPath id="squircleClip">
          <rect width="512" height="512" rx="80" />
        </clipPath>
      </defs>

      {/* Long Shadow - 45 degree diagonal */}
      <g clipPath="url(#squircleClip)">
        <path
          d="
            M 256 65
            L 600 409
            L 600 600
            L 380 600
            L 380 440
            L 317 440
            L 317 600
            L 195 600
            L 195 440
            L 132 440
            L 132 600
            L -100 600
            L -100 197
            L 132 197
            L 132 440
            L 195 440
            L 195 340
            L 317 340
            L 317 440
            L 380 440
            L 380 197
            C 380 130 325 65 256 65
            Z
          "
          fill="#D63050"
        />
      </g>

      {/* The "A" Letter Shape - Pointed Arch Style */}
      <path
        d="
          M 256 65
          C 187 65 132 130 132 197
          L 132 440
          L 195 440
          L 195 340
          L 317 340
          L 317 440
          L 380 440
          L 380 197
          C 380 130 325 65 256 65
          Z
          M 195 280
          L 195 197
          C 195 157 222 125 256 125
          C 290 125 317 157 317 197
          L 317 280
          L 195 280
          Z
        "
        fill="white"
        fillRule="evenodd"
      />
    </svg>
  )
}

export function LogoIcon({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Background Squircle */}
      <rect
        width="512"
        height="512"
        rx="80"
        fill="#F94361"
      />

      {/* Clip path */}
      <defs>
        <clipPath id="squircleClipIcon">
          <rect width="512" height="512" rx="80" />
        </clipPath>
      </defs>

      {/* Long Shadow */}
      <g clipPath="url(#squircleClipIcon)">
        <path
          d="
            M 256 65
            L 600 409
            L 600 600
            L 380 600
            L 380 440
            L 317 440
            L 317 600
            L 195 600
            L 195 440
            L 132 440
            L 132 600
            L -100 600
            L -100 197
            L 132 197
            L 132 440
            L 195 440
            L 195 340
            L 317 340
            L 317 440
            L 380 440
            L 380 197
            C 380 130 325 65 256 65
            Z
          "
          fill="#D63050"
        />
      </g>

      {/* The "A" Shape */}
      <path
        d="
          M 256 65
          C 187 65 132 130 132 197
          L 132 440
          L 195 440
          L 195 340
          L 317 340
          L 317 440
          L 380 440
          L 380 197
          C 380 130 325 65 256 65
          Z
          M 195 280
          L 195 197
          C 195 157 222 125 256 125
          C 290 125 317 157 317 197
          L 317 280
          L 195 280
          Z
        "
        fill="white"
        fillRule="evenodd"
      />
    </svg>
  )
}

export function LogoWithText({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo className="w-10 h-10" />
      <span className="text-xl font-bold text-primary">AsyaKitap</span>
    </div>
  )
}
