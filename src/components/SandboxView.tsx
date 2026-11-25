import { useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCcw, ShieldCheck } from 'lucide-react';

interface SandboxConfig {
  banners: boolean;
  popups: boolean;
  videoFs: boolean;
  ageBypass: boolean;
  contentPref: boolean;
}

interface EventLogEntry {
  id: number;
  time: string;
  action: string;
  detail: string;
}

export function SandboxView() {
  const [cfg, setCfg] = useState<SandboxConfig>({
    banners: true,
    popups: true,
    videoFs: true,
    ageBypass: true,
    contentPref: true
  });

  const [cookieState, setCookieState] = useState<'visible' | 'rejected' | 'accepted'>('visible');
  const [ageState, setAgeState] = useState<'visible' | 'bypassed' | 'exited'>('visible');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    Straight: false,
    Lesbian: false,
    Gay: true,
    Trans: true,
    Bisexual: false
  });
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [popupsBlocked, setPopupsBlocked] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [logs, setLogs] = useState<EventLogEntry[]>([]);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const logSeq = useRef(1);

  const pushLog = (action: string, detail: string) => {
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [{ id: logSeq.current++, time: now, action, detail }, ...prev].slice(0, 14));
  };

  const resetSimulation = () => {
    setCookieState('visible');
    setAgeState('visible');
    setPrefs({ Straight: false, Lesbian: false, Gay: true, Trans: true, Bisexual: false });
    setPrefsSaved(false);
    setPopupsBlocked(0);
    setVideoPlaying(false);
    setVideoFullscreen(false);
    setLogs([]);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Simulates the exact automation & privacy document-start sequence from privacy.js + automation.js
  useEffect(() => {
    const timers: number[] = [];

    if (cfg.banners && cookieState === 'visible') {
      timers.push(
        window.setTimeout(() => {
          setCookieState('rejected');
          pushLog('Cookie Auto-Reject', 'Clicked Reject All & unlocked page scroll');
        }, 380)
      );
    }

    if (cfg.ageBypass && ageState === 'visible') {
      timers.push(
        window.setTimeout(() => {
          setAgeState('bypassed');
          pushLog('Age Gate Bypass', 'Checked 18+ confirmation and clicked Enter Site');
        }, 560)
      );
    }

    if (cfg.contentPref && !prefsSaved) {
      timers.push(
        window.setTimeout(() => {
          setPrefs({
            Straight: true,
            Lesbian: true,
            Gay: false,
            Trans: false,
            Bisexual: false
          });
          setPrefsSaved(true);
          pushLog('Content Filter', 'Selected Straight & Lesbian only; deselected Gay, Trans, Bisexual');
        }, 740)
      );
    }

    return () => timers.forEach((id) => clearTimeout(id));
  }, [cfg.banners, cfg.ageBypass, cfg.contentPref, cookieState, ageState, prefsSaved]);

  useEffect(() => {
    const onFsChange = () => {
      setVideoFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const triggerTestPopup = () => {
    if (cfg.popups) {
      setPopupsBlocked((n) => n + 1);
      pushLog('Pop-up Blocked', 'Intercepted window.open("https://popads.net/afu.php") & neutralized _blank redirect');
    } else {
      pushLog('Pop-up Allowed', 'Blocker disabled — popunder URL would navigate tab');
    }
  };

  const handleVideoClick = () => {
    setVideoPlaying(true);
    if (cfg.videoFs) {
      setVideoFullscreen(true);
      pushLog('Auto-Fullscreen', 'Video clicked -> started playback directly in full-screen mode');
      if (videoContainerRef.current && videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen().catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      pushLog('Video Inline', 'Auto-fullscreen disabled — playing inline');
    }
  };

  const exitSimulatedFullscreen = () => {
    setVideoFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleOpt = (key: keyof SandboxConfig) => {
    setCfg((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Engine Switches</h2>
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Page
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {[
              { key: 'banners' as const, label: 'Auto-Reject Cookies', detail: 'privacy.js · Opt.COOKIE_BANNERS' },
              { key: 'popups' as const, label: 'Global Pop-up Blocker', detail: 'BrowserController + privacy.js · Opt.POPUPS' },
              { key: 'videoFs' as const, label: 'Auto-Fullscreen Video', detail: 'automation.js · Opt.AUTO_VIDEO_FULLSCREEN' },
              { key: 'ageBypass' as const, label: 'Age Verification Bypass', detail: 'automation.js · Opt.AGE_BYPASS' },
              { key: 'contentPref' as const, label: 'Straight & Lesbian Only', detail: 'automation.js · Opt.CONTENT_PREF' }
            ].map((item) => {
              const active = cfg[item.key];
              return (
                <div key={item.key} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                    <div className="text-xs text-slate-400 font-mono truncate">{item.detail}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => toggleOpt(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                      active ? 'bg-sky-500 border-sky-400' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Automation Event Log</h3>
            <span className="text-xs text-slate-400 tabular-nums">{logs.length} events</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500">Reset the simulated page or click elements to observe automation events.</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {logs.map((entry) => (
                <div key={entry.id} className="text-xs border-b border-slate-800/70 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-slate-200 font-medium">
                    <span>{entry.action}</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">{entry.time}</span>
                  </div>
                  <div className="text-slate-400 mt-0.5">{entry.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right simulated WebView viewport */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3 text-xs text-slate-400 min-w-0">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-mono truncate">https://stream-example.test/watch</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums shrink-0 text-slate-300">{popupsBlocked} pop-ups blocked</span>
          </div>
          <button
            type="button"
            onClick={triggerTestPopup}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Trigger Pop-up Ad
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Row of simulated gates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cookie consent box */}
            <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">CMP Cookie Dialog</span>
                <span className={`text-xs font-medium ${cookieState === 'rejected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {cookieState === 'rejected' ? 'Auto-Rejected' : cookieState === 'accepted' ? 'Accepted' : 'Waiting'}
                </span>
              </div>
              {cookieState === 'visible' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">We use cookies and 42 partners for personalized ads.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCookieState('rejected')}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md"
                    >
                      Reject All
                    </button>
                    <button
                      type="button"
                      onClick={() => setCookieState('accepted')}
                      className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-md"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Banner dismissed with Reject All and scroll unlocked.</p>
              )}
            </div>

            {/* Age verification box */}
            <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">18+ Age Verification Gate</span>
                <span className={`text-xs font-medium ${ageState === 'bypassed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ageState === 'bypassed' ? 'Bypassed' : ageState === 'exited' ? 'Exited' : 'Blocking'}
                </span>
              </div>
              {ageState === 'visible' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">This site contains age-restricted media. Confirm you are 18+.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgeState('bypassed')}
                      className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-md"
                    >
                      I am 18+ · Enter
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeState('exited')}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-md"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Age verification prompt accepted automatically.</p>
              )}
            </div>
          </div>

          {/* Preferred content selector */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-slate-300">Content Orientation Selector</div>
                <div className="text-xs text-slate-500 mt-0.5">Preferred filter enforces Straight and Lesbian only</div>
              </div>
              <span className={`text-xs font-medium ${prefsSaved ? 'text-emerald-400' : 'text-slate-400'}`}>
                {prefsSaved ? 'Filtered' : 'Default'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(prefs).map(([name, checked]) => (
                <label
                  key={name}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setPrefs((p) => ({ ...p, [name]: !p[name] }))}
                    className="accent-sky-500"
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Click-to-Fullscreen Video Player */}
          <div
            ref={videoContainerRef}
            className={`relative border border-slate-800 rounded-lg overflow-hidden bg-black ${
              videoFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 flex flex-col justify-center' : ''
            }`}
          >
            <div
              onClick={handleVideoClick}
              className={`relative cursor-pointer select-none flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black ${
                videoFullscreen ? 'h-full w-full' : 'h-56'
              }`}
            >
              <video ref={videoRef} className="hidden" muted playsInline />
              <div className="text-center px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-white">
                  {videoPlaying
                    ? videoFullscreen
                      ? 'Playing in Full-Screen Mode'
                      : 'Playing Inline'
                    : 'Click Video to Open & Play in Full-Screen'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Click triggers requestFullscreen() / onShowCustomView() automatically
                </div>
              </div>
              {videoFullscreen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exitSimulatedFullscreen();
                  }}
                  className="mt-6 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
                >
                  Exit Full-Screen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
