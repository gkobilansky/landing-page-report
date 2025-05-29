import Image from 'next/image'

export default function AboutSection() {
  return (
    <div className="max-w-3xl mx-auto text-left my-16 p-8 rounded-lg shadow-xl" style={{backgroundColor: 'var(--color-bg-card)'}}>
      <div className="flex items-start space-x-6 mb-8">
        <Image
          src="/gene-kobilansky-headshot-yellow-bg.png"
          alt="Gene Kobilansky"
          width={96}
          height={96}
          className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 flex-shrink-0"
        />
        <div>
          <p className="text-xl text-gray-200 leading-relaxed">
            Hi, I&apos;m Gene. I&apos;ve been working on landing pages for almost 20 years and there&apos;s a few things I&apos;ve found that quickly and easily improve any landing page.
          </p>
        </div>
      </div>
      <div className="text-gray-300 leading-relaxed space-y-4 mb-8">
        <p>Here are some key takeaways from my experience:</p>
        <ul className="list-disc list-inside space-y-3 pl-4">
          <li>
            <strong>Fast pages mean happy customers.</strong> Prioritize performance.
          </li>
          <li>
            An <strong>action-oriented CTA in the header</strong> is a must. Make it clear what you want users to do.
          </li>
          <li>
            <strong>Simplify your fonts.</strong> Too many can confuse readers and slow down loading times.
          </li>
          <li>
            Most pages don&apos;t have enough <strong>whitespace</strong>. Give your content breathing room; it reduces visual clutter and improves focus.
          </li>
          <li>
            Don&apos;t forget your <strong>social proof!</strong> Trust is the most valuable commodity we have. Showcase testimonials, reviews, or case studies.
          </li>
        </ul>
      </div>
      <p className="text-gray-300 leading-relaxed mb-10">
        I built this tool to make it easier to test your pages and make &apos;em awesome. Have ideas on how to improve it? Want some help help improving your Landing Page? Send me a note <a href="mailto:gene@lansky.tech" className='text-yellow-300'>gene@lansky.tech</a>
      </p>
      <div className="text-right">
        <Image
          src="/gk-initials-white.png"
          alt="GK Signature"
          width={128}
          height={128}
          className="w-32 h-auto inline-block"
        />
      </div>
    </div>
  )
}