import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Pages in 2025 | lansky.tech',
  description: 'In-depth analysis of high-performing SaaS and e-commerce landing pages with actionable insights for conversion optimization.',
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Landing Page Analyzer
          </Link>
          <div className="mt-2">
            <a 
              href="/blueprint" 
              className="text-gray-400 hover:text-blue-300 transition-colors text-sm"
            >
              📖 Also see: The Complete Blueprint for Digital Conversion →
            </a>
          </div>
        </nav>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-50 mb-4">
            Landing Pages in 2025
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            The Blueprint for Digital Conversion: An Actionable Guide to High-Performing SaaS and E-commerce Landing Pages
          </p>
          <div className="text-gray-400 text-sm">
            Published by{' '}
            <a 
              href="https://linkedin.com/in/gkobilansky" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-yellow-300 transition-colors underline"
            >
              Gene Kobilansky
            </a>
          </div>
          <div className="text-gray-500 text-xs mt-2 italic">
            This report was built with the help of Gemini Deep Research and Claude Code. All deep insights are mine, all mistakes are the AI&apos;s.
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#executive-summary" className="block text-blue-400 hover:text-blue-300 transition-colors">
              Executive Summary
            </a>
            <a href="#why-landing-pages-matter" className="block text-blue-400 hover:text-blue-300 transition-colors">
              I. Why Landing Pages Matter
            </a>
            <a href="#seven-pillars" className="block text-blue-400 hover:text-blue-300 transition-colors">
              II. Seven Pillars of High-Converting Pages
            </a>
            <a href="#saas-highlights" className="block text-blue-400 hover:text-blue-300 transition-colors">
              III. SaaS Highlights: Four Standouts
            </a>
            <a href="#ecommerce-spotlights" className="block text-blue-400 hover:text-blue-300 transition-colors">
              IV. E-commerce Spotlights: Four Best Practices
            </a>
            <a href="#advanced-tactics" className="block text-blue-400 hover:text-blue-300 transition-colors">
              V. Advanced Tactics & Emerging Trends
            </a>
            <a href="#action-plan" className="block text-blue-400 hover:text-blue-300 transition-colors">
              VI. Action Plan: From Audit to Execution
            </a>
            <a href="#scorecard" className="block text-blue-400 hover:text-blue-300 transition-colors">
              VII. Quick-Reference CRO Scorecard
            </a>
          </nav>
        </div>

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="text-gray-300 leading-relaxed space-y-8">
            
            <section id="executive-summary">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">Executive Summary</h2>
              
              <p>
                In today&apos;s crowded digital landscape, landing pages are the linchpins of conversion-driven marketing campaigns. Whether generating leads for SaaS products or driving direct sales for e-commerce stores, the most successful landing pages combine crystal-clear messaging, persuasive design, and data-driven optimization. This upgraded blueprint condenses proven principles, real-world examples, and tactical recommendations into a concise, actionable guide.
              </p>

              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6 my-8">
                <h4 className="text-lg font-semibold text-blue-200 mb-3">Key Findings</h4>
                <ul className="text-blue-100 space-y-2">
                  <li>• High-converting landing pages can achieve 50-60% conversion rates on gated content</li>
                  <li>• Mobile optimization alone can improve conversion rates by 27%</li>
                  <li>• Personalization strategies have driven conversion increases of 277%</li>
                  <li>• Simple A/B tests on CTA text can yield 104% improvements in trial rates</li>
                </ul>
              </div>
            </section>

            <section id="why-landing-pages-matter" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">I. Why Landing Pages Matter</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-900/20 border border-purple-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-200 mb-3">Dedicated Conversion Engines</h4>
                  <p className="text-purple-100 text-sm">Unlike homepages or blogs, landing pages focus exclusively on one goal—sign-ups, demo requests, or purchases.</p>
                </div>
                <div className="bg-green-900/20 border border-green-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-200 mb-3">ROI Multipliers</h4>
                  <p className="text-green-100 text-sm">Every percentage point of improvement on a high-traffic page translates into significant revenue gains.</p>
                </div>
                <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-orange-200 mb-3">Diagnostic Tools</h4>
                  <p className="text-orange-100 text-sm">Performance data from landing pages highlights misalignments in targeting, messaging, or design upstream.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Key Metrics</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-600 bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Metric</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">SaaS Goal</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">E-commerce Goal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Conversion Rate (CVR)</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Demo requests / sign-ups</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Completed sales</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Micro-conversions</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Content downloads, trial</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Add-to-cart, email sign-up</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Average Order Value</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">N/A</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Cart value</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Time to First Action</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Seconds/minutes</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Seconds/minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="seven-pillars" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">II. Seven Pillars of High-Converting Pages</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Clarity & UVP</h4>
                      <p className="text-gray-300 text-sm">Instant comprehension of who this is for and why it matters.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Compelling CTA</h4>
                      <p className="text-gray-300 text-sm">A single, prominent action button or link that stands out.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Trust & Social Proof</h4>
                      <p className="text-gray-300 text-sm">Testimonials, client logos, reviews, awards, security badges.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Seamless UX & Design</h4>
                      <p className="text-gray-300 text-sm">Clean layout, white space, mobile-first, fast loading.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Persuasive Copy</h4>
                      <p className="text-gray-300 text-sm">Benefit-focused headlines, concise body text, active language.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">6</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Urgency & Scarcity</h4>
                      <p className="text-gray-300 text-sm">Countdown timers, limited-quantity messages, exclusive offers.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">7</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Continuous Optimization</h4>
                      <p className="text-gray-300 text-sm">A/B testing roadmap, analytics tracking, iterative improvements.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6 my-8">
                <h4 className="text-lg font-semibold text-yellow-200 mb-3">✓ Checklist</h4>
                <p className="text-yellow-100">Does your page satisfy each pillar? Tick ✓ and iterate.</p>
              </div>
            </section>

            <section id="saas-highlights" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">III. SaaS Highlights: Four Standouts</h2>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-600 bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Company</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Primary Goal</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Tactics</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-blue-400">Mixpanel</div>
                          <a 
                            href="https://mixpanel.com/best-product-analytics/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Free Trials</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Dual CTAs: &apos;Watch Demo&apos; + &apos;Sign Up Free&apos;, 20K+ customer logos</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-blue-400">HubSpot</div>
                          <a 
                            href="https://www.hubspot.com/products/marketing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Lead Gen</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Customer carousel, Fitts&apos; Law placement, ROI statistics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-blue-400">Asana</div>
                          <a 
                            href="https://asana.com/product" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Direct Sign-ups</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Clean hero, request demo, explainer video</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-blue-400">Shopify</div>
                          <a 
                            href="https://www.shopify.com/website/builder" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Feature Adoption</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Dynamic visuals, 3D models, clear &quot;Start free trial&quot; CTA</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-200 mb-3">SaaS Takeaway</h4>
                <p className="text-blue-100">Tailor CTAs to different readiness levels, and make complex products tangible via demos.</p>
              </div>
            </section>

            <section id="ecommerce-spotlights" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">IV. E-commerce Spotlights: Four Best Practices</h2>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-600 bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Brand</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Product Type</th>
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Tactics</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-green-400">HelloFresh</div>
                          <a 
                            href="https://www.hellofresh.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-300 hover:text-green-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Meal Subscription</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Dual CTAs for urgency, header stripped of distractions</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-green-400">Nyraju</div>
                          <a 
                            href="https://nyrajuskincare.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-300 hover:text-green-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Skincare</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Persona-driven imagery, streamlined page flow (+277% CVR)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-green-400">OLIPOP</div>
                          <a 
                            href="https://drinkolipop.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-300 hover:text-green-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Beverage</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Side-by-side benefit comparisons, vibrant visuals</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-green-400">Indochino</div>
                          <a 
                            href="https://www.indochino.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-300 hover:text-green-200 transition-colors"
                          >
                            View Page →
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Custom Menswear</td>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300">Editorial-style pages, location-based personalization (17.4% CVR)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-green-900/20 border border-green-600 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-green-200 mb-3">E-commerce Takeaway</h4>
                <p className="text-green-100">Use lifestyle imagery, minimize navigation, and emphasize trust via clear policies and badges.</p>
              </div>
            </section>

            <section id="advanced-tactics" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">V. Advanced Tactics & Emerging Trends</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-900/20 border border-purple-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-200 mb-3">Hyper-Personalization</h4>
                  <p className="text-purple-100 text-sm mb-3">Dynamic content based on location, behavior, or referral source.</p>
                  <ul className="text-purple-100 text-xs space-y-1">
                    <li>• Indochino: 17.4% CVR with location targeting</li>
                    <li>• Nyraju: 277% increase via persona-based content</li>
                  </ul>
                </div>

                <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-orange-200 mb-3">Interactive Elements</h4>
                  <p className="text-orange-100 text-sm mb-3">Quizzes, calculators, live chat—engage users and reduce bounce.</p>
                  <ul className="text-orange-100 text-xs space-y-1">
                    <li>• Product configurators</li>
                    <li>• ROI calculators for SaaS</li>
                    <li>• Style quizzes for e-commerce</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-200 mb-3">AI-Powered Optimization</h4>
                  <p className="text-blue-100 text-sm mb-3">Automated A/B test suggestions, copy generation, personalization at scale.</p>
                  <ul className="text-blue-100 text-xs space-y-1">
                    <li>• Dynamic headline testing</li>
                    <li>• Predictive content optimization</li>
                    <li>• Behavioral trigger campaigns</li>
                  </ul>
                </div>

                <div className="bg-teal-900/20 border border-teal-600 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-teal-200 mb-3">Conversational Interfaces</h4>
                  <p className="text-teal-100 text-sm mb-3">Chatbots or voice-activated prompts to guide the visitor.</p>
                  <ul className="text-teal-100 text-xs space-y-1">
                    <li>• Smart chat routing</li>
                    <li>• Voice search optimization</li>
                    <li>• Progressive disclosure flows</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-200 mb-3">Privacy-First Tracking</h4>
                <p className="text-gray-300 text-sm">Leverage first-party data and contextual signals in a cookieless world. Focus on session replay, heatmaps, and customer surveys for optimization insights.</p>
              </div>
            </section>

            <section id="action-plan" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">VI. Action Plan: From Audit to Execution</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Audit Your Key Pages</h4>
                      <p className="text-gray-300 text-sm">Rate each pillar from 1 to 5 and identify gaps. Use the scorecard below.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Hypothesis-Driven Testing</h4>
                      <p className="text-gray-300 text-sm">Prioritize tests with high impact/low effort. Start with headline and CTA variations.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Choose Your Toolkit</h4>
                      <div className="text-gray-300 text-sm space-y-2">
                        <div><strong>Builders & Testing:</strong> Unbounce, Optimizely, VWO</div>
                        <div><strong>Analytics & Heatmaps:</strong> Google Analytics, Hotjar</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Implement Tests Rapidly</h4>
                      <p className="text-gray-300 text-sm">Deploy one change at a time, measure for at least two weeks.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Scale Wins</h4>
                      <p className="text-gray-300 text-sm">Roll out successful variants to other high-traffic pages.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">6</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100 mb-2">Document & Share</h4>
                      <p className="text-gray-300 text-sm">Maintain a CRO playbook of test results and learnings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="scorecard" className="mt-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">VII. Quick-Reference CRO Scorecard</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-600 bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="border border-gray-600 px-4 py-3 text-left text-gray-200 font-semibold">Element</th>
                      <th className="border border-gray-600 px-4 py-3 text-center text-gray-200 font-semibold">Score (1–5)</th>
                      <th className="border border-gray-600 px-4 py-3 text-center text-gray-200 font-semibold">Priority (H/M/L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Value Proposition Clarity</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">CTA Visibility & Copy</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Social Proof Strength</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Mobile Responsiveness</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Page Speed - load time less than 3 seconds</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">Urgency/Scarcity Signals</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600 px-4 py-3 text-gray-300 font-medium">A/B Test Pipeline</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                      <td className="border border-gray-600 px-4 py-3 text-center text-gray-400">___</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-gray-400 text-sm mt-4 italic">
                Slots for your teams ratings—drive alignment and focus.
              </p>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6 mt-8">
                <h4 className="text-lg font-semibold text-yellow-200 mb-3">Next Steps</h4>
                <p className="text-yellow-100">Use this guide to transform your landing pages into dynamic conversion engines. Start your CRO audit today and turn insights into revenue.</p>
              </div>
            </section>

          </div>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-700">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Landing Page Analyzer
          </Link>
        </div>
      </div>
    </main>
  )
}