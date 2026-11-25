import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { RepoSummary } from './types';
import { SandboxView } from './components/SandboxView';
import { CodeExplorer } from './components/CodeExplorer';
import { WorkflowGuide } from './components/WorkflowGuide';

type TabId = 'overview' | 'sandbox' | 'code' | 'workflow';

const LOGO_URL = '/assets/aistudio/Generated_Image_November_25__2026_-_10_33AM_a893e4df.png';

const FEATURES = [
  {
    index: '01',
    title: 'Auto-Reject Cookies & Ad Blocker',
    meta: 'privacy.js · adblock.js · AdBlock.kt',
    description:
      'Clicks Reject/Decline/Essential-Only buttons across OneTrust, Cookiebot, Didomi, Quantcast, Funding Choices, Usercentrics Shadow DOM, and generic CMP dialogs while hiding banners and unlocking scroll. Paired with 46k+ blocked domains and expanded cosmetic rules.'
  },
  {
    index: '02',
    title: 'Auto-Fullscreen Video on Click',
    meta: 'automation.js · BrowserController.kt',
    description:
      'Clicking or starting a video automatically triggers playback directly in full-screen mode via player controls or requestFullscreen() / onShowCustomView(), while respecting manual Back exits.'
  },
  {
    index: '03',
    title: 'Age Verification Pop-up Bypass',
    meta: 'automation.js · Opt.AGE_BYPASS',
    description:
      'Detects 18+ and age-gate overlays, automatically ticks confirmation checkboxes, clicks Accept / Enter / Continue buttons, and restores page scrolling.'
  },
  {
    index: '04',
    title: 'Preferred Content Filter: Straight & Lesbian Only',
    meta: 'automation.js · Opt.CONTENT_PREF',
    description:
      'Detects orientation and content-type selectors (modals, checkboxes, radios, dropdowns, and button bars), selects Straight and Lesbian only, and deselects all other categories.'
  },
  {
    index: '05',
    title: 'Global Pop-up & Ad Window Blocker',
    meta: 'BrowserController.kt · AdBlock.kt · privacy.js',
    description:
      'Blocks unsolicited and dialog pop-ups, drops cross-site popunders inside onCreateWindow, blocks ad redirects in shouldOverrideUrlLoading, stubs window.open(), and removes invisible clickjacking overlays.'
  },
  {
    index: '06',
    title: 'Naughty Tube Fire TV Branding & APK CI',
    meta: 'tv_banner · WishyBrand.kt · build.yml',
    description:
      'Branded as Naughty Tube with Fire TV leanback banners, adaptive launcher icons, matching Naughty Crimson dark theme, and fixed GitHub Actions APK builds.'
  }
];

export default function App() {
  const [tab, setTab] = useState<TabId>('overview');
  const [summary, setSummary] = useState<RepoSummary | null>(null);

  useEffect(() => {
    fetch('/api/repo/summary')
      .then((r) => r.json())
      .then((d: RepoSummary) => setSummary(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1217] text-zinc-100">
      {/* Three-zone Top Bar */}
      <header className="border-b border-zinc-800/80 bg-[#0e1217]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
          >
            <img
              src={LOGO_URL}
              alt="Naughty Tube logo"
              className="h-9 w-16 rounded-md object-cover border border-zinc-700/70"
            />
            <span>Naughty Tube</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'sandbox' as const, label: 'Sandbox' },
              { id: 'code' as const, label: 'Code & Diffs' },
              { id: 'workflow' as const, label: 'GitHub APK CI' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  tab === item.id
                    ? 'text-white border-b-2 border-[#e1262d]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            <a
              href="/api/repo/download.zip"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#c81e25] hover:bg-[#e1262d] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Repo ZIP
            </a>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-zinc-800/80 px-6 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'sandbox' as const, label: 'Sandbox' },
            { id: 'code' as const, label: 'Code & Diffs' },
            { id: 'workflow' as const, label: 'GitHub APK CI' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 ${
                tab === item.id ? 'text-[#ff5258]' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {tab === 'overview' && (
          <>
            <section className="border-b border-zinc-800/80 pb-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>Naughty Tube</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Base {summary?.baseCommit || 'main'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Fire TV &amp; Android Kotlin</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance">
                  Naughty Tube Browser Repository
                </h1>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                  Branded for Fire TV with your logo and Naughty Crimson dark theme, plus cookie auto-rejection,
                  auto-fullscreen video playback, age verification bypass, Straight &amp; Lesbian filtering, global
                  pop-up blocking, and automated GitHub APK builds.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTab('sandbox')}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#c81e25] hover:bg-[#e1262d] rounded-lg transition-colors whitespace-nowrap"
                  >
                    Open Script Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('code')}
                    className="px-4 py-2 text-xs font-medium text-zinc-200 bg-[#161c24] hover:bg-[#1f2732] border border-zinc-700/80 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Inspect Changed Files
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#14191f]">
                  <img
                    src={LOGO_URL}
                    alt="Naughty Tube Fire TV Banner"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>
            </section>

            {/* 6 Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat) => (
                <div
                  key={feat.index}
                  className="bg-[#151a22] border border-zinc-800/90 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[#ff6b70] tabular-nums">
                      {feat.index} · {feat.meta}
                    </div>
                    <h2 className="text-base font-semibold text-white">{feat.title}</h2>
                    <p className="text-xs text-zinc-300 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Modified Files Table */}
            <section className="bg-[#151a22] border border-zinc-800/90 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Modified &amp; Added Repository Files</h2>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {summary?.modifiedFiles.length || 13} files
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-xs text-zinc-400">
                      <th className="py-2.5 px-5 font-medium">File Path</th>
                      <th className="py-2.5 px-4 font-medium">Change</th>
                      <th className="py-2.5 px-5 font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs">
                    {(summary?.modifiedFiles || []).map((file) => (
                      <tr key={file.path} className="hover:bg-[#1c232d] transition-colors">
                        <td className="py-3 px-5 font-mono text-zinc-200 whitespace-nowrap">{file.path}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={file.status === 'added' ? 'text-emerald-400' : 'text-[#ff5258]'}>
                            {file.status === 'added' ? 'Added' : 'Modified'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-zinc-300">{file.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === 'sandbox' && <SandboxView />}
        {tab === 'code' && <CodeExplorer modifiedFiles={summary?.modifiedFiles || []} />}
        {tab === 'workflow' && <WorkflowGuide />}
      </main>
    </div>
  );
}
