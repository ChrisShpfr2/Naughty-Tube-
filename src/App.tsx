import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { RepoSummary } from './types';
import { SandboxView } from './components/SandboxView';
import { CodeExplorer } from './components/CodeExplorer';
import { WorkflowGuide } from './components/WorkflowGuide';

type TabId = 'overview' | 'sandbox' | 'code' | 'workflow';

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
    title: 'Automatic GitHub APK Build Workflow',
    meta: '.github/workflows/build.yml',
    description:
      'Configured to build a universal release APK on every push, pull request, or tag release, generate SHA-256 checksums, and upload the APK artifact automatically.'
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Three-zone Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className="text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
          >
            WishyBrowser Mod Studio
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
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
                    ? 'text-white border-b border-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            <a
              href="/api/repo/download.zip"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Repo ZIP
            </a>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-slate-800 px-6 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium">
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
                tab === item.id ? 'text-sky-400' : 'text-slate-400'
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
            <section className="border-b border-slate-800 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>Source: wishissue/WishyBrowser</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Base {summary?.baseCommit || 'main'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Android Kotlin + WebView</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance">
                  Cloned &amp; Enhanced WishyBrowser Repository
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  All requested browser protections, video full-screen automation, age-gate bypass, Straight &amp;
                  Lesbian content filtering, global pop-up blocking, and GitHub APK build workflow are applied in{' '}
                  <code className="font-mono text-xs text-sky-300">wishy-browser/</code>.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setTab('sandbox')}
                  className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Open Script Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setTab('code')}
                  className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Inspect Changed Files
                </button>
              </div>
            </section>

            {/* 6 Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat) => (
                <div
                  key={feat.index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400 tabular-nums">
                      {feat.index} · {feat.meta}
                    </div>
                    <h2 className="text-base font-semibold text-white">{feat.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Modified Files Table */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Modified &amp; Added Repository Files</h2>
                <span className="text-xs text-slate-400 tabular-nums">
                  {summary?.modifiedFiles.length || 9} files
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400">
                      <th className="py-2.5 px-5 font-medium">File Path</th>
                      <th className="py-2.5 px-4 font-medium">Change</th>
                      <th className="py-2.5 px-5 font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {(summary?.modifiedFiles || []).map((file) => (
                      <tr key={file.path} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-5 font-mono text-slate-200 whitespace-nowrap">{file.path}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={file.status === 'added' ? 'text-emerald-400' : 'text-sky-400'}>
                            {file.status === 'added' ? 'Added' : 'Modified'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-300">{file.summary}</td>
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
