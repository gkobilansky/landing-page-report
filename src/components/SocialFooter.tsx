import Link from 'next/link'

const socials = [
  {
    href: 'https://github.com/gkobilansky',
    label: 'GitHub',
    icon: (
      <svg aria-label="Github" className="h-5 w-5" fill="currentColor" viewBox="0 0 92 98" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0Z"
        />
      </svg>
    ),
  },
  {
    href: 'https://threads.net/@lansky.tech',
    label: 'Threads',
    icon: (
      <svg aria-label="Threads" className="h-5 w-5" fill="currentColor" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com/@lanskytech',
    label: 'YouTube',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
      </svg>
    ),
  },
  {
    href: 'https://linkedin.com/in/gkobilansky',
    label: 'LinkedIn',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export default function SocialFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-gray-800 bg-gradient-to-br from-gray-900/80 via-[#0f1424] to-black/80 text-gray-300">
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-lg font-semibold text-white">Landing Page Report</p>
                <p className="text-sm text-gray-400">Straightforward teardowns to unlock more conversions.</p>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              Built with 🦾 by{' '}
              <a href="https://lansky.tech" className="text-[#FFCC00] hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                lansky.tech
              </a>{' '}
              — the same crew behind{' '}
              <a href="https://computeprices.com" className="text-[#FFCC00] hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                computeprices.com
              </a>
              . Need a team that ships? Let&apos;s talk.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 rounded-lg border border-[#FFCC00]/40 bg-[#FFCC00]/10 px-4 py-2 text-sm font-semibold text-[#FFCC00] transition hover:bg-[#FFCC00]/20"
              >
                📊 View public reports
              </Link>
              <Link
                href="/blueprint"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:text-white"
              >
                🧠 Landing page blueprint
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/reports" className="text-gray-400 transition hover:text-white">
                  All reports
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 transition hover:text-white">
                  Run a new analysis
                </Link>
              </li>
              <li>
                <Link href="/blueprint" className="text-gray-400 transition hover:text-white">
                  Landing page blueprint
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">More from Lansky Tech</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://lansky.tech" className="text-gray-400 transition hover:text-white" target="_blank" rel="noopener noreferrer">
                  lansky.tech
                </a>
              </li>
              <li>
                <a href="https://computeprices.com" className="text-gray-400 transition hover:text-white" target="_blank" rel="noopener noreferrer">
                  computeprices.com
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Connect</h3>
            <p className="text-sm text-gray-400">
              Follow along for build-in-public updates, landing page teardowns, and shipping notes.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 text-gray-300 transition hover:border-[#FFCC00]/60 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-gray-800 pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
          <span className="text-gray-400">© {year} landingpage.report. Crafted for teams that ship.</span>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://lansky.tech" className="text-gray-500 transition hover:text-white" target="_blank" rel="noopener noreferrer">
              Work with us
            </a>
            <span className="hidden text-gray-700 md:inline">•</span>
            <a href="/reports" className="text-gray-500 transition hover:text-white">
              Recent analyses
            </a>
            <span className="hidden text-gray-700 md:inline">•</span>
            <a href="/blueprint" className="text-gray-500 transition hover:text-white">
              Free blueprint
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
