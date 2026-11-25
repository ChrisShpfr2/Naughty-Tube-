import { useEffect, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';

export function WorkflowGuide() {
  const [workflowYaml, setWorkflowYaml] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    fetch('/api/repo/file?path=.github/workflows/build.yml')
      .then((r) => r.json())
      .then((d) => setWorkflowYaml(d.content || ''))
      .catch(() => {});
  }, []);

  const gitCommands = `unzip WishyBrowser-modified-repo.zip -d WishyBrowser
cd WishyBrowser
git init
git add .
git commit -m "Add cookie auto-reject, global popup blocker, video fullscreen, age bypass & Straight/Lesbian filter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push -u origin main`;

  const copyCommands = () => {
    navigator.clipboard.writeText(gitCommands).then(() => {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 1800);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Automatic GitHub Actions APK Build</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The workflow is placed at both the repository root{' '}
            <code className="text-xs font-mono text-sky-300">.github/workflows/build.yml</code> and inside{' '}
            <code className="text-xs font-mono text-sky-300">wishy-browser/</code>, so syncing this project directly to
            GitHub or pushing the extracted ZIP triggers the universal APK build automatically under the Actions tab.
          </p>
          <a
            href="/api/repo/download.zip"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download Modified Repo ZIP
          </a>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Terminal Setup</span>
              <button
                type="button"
                onClick={copyCommands}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              {gitCommands}
            </pre>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">Optional Release Signing Secrets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Without repository secrets, the workflow signs the APK with the debug key so builds succeed out-of-the-box.
            To sign with your own release keystore, add these GitHub repository secrets:
          </p>
          <ul className="text-xs font-mono text-slate-300 space-y-1.5">
            <li>WISHY_KEYSTORE_BASE64</li>
            <li>WISHY_KEYSTORE_PASSWORD</li>
            <li>WISHY_KEY_ALIAS</li>
            <li>WISHY_KEY_PASSWORD</li>
          </ul>
        </div>
      </div>

      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-200">.github/workflows/build.yml</span>
          <span className="text-xs text-slate-400">Triggers on all pushes · PRs · v* tags</span>
        </div>
        <pre className="p-4 bg-slate-950 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[540px]">
          {workflowYaml || 'Loading workflow...'}
        </pre>
      </div>
    </div>
  );
}
