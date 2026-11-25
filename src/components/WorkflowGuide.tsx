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

  const gitCommands = `unzip NaughtyTube-repo.zip -d NaughtyTube
cd NaughtyTube
git init
git add .
git commit -m "Naughty Tube branding, theme, APK CI fix & browser automation"
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
        <div className="bg-[#151a22] border border-zinc-800/90 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Automatic GitHub Actions APK Build</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The workflow at <code className="text-xs font-mono text-[#ff6b70]">.github/workflows/build.yml</code> omits
            the deprecated <code className="text-xs font-mono text-[#ff6b70]">setup-android@v3</code> step (which fails
            on missing <code className="text-xs font-mono text-zinc-200">tools</code>), accepts Android SDK licenses
            directly, and builds the Naughty Tube APK automatically on every push.
          </p>
          <a
            href="/api/repo/download.zip"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#c81e25] hover:bg-[#e1262d] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download Naughty Tube Repo ZIP
          </a>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">Terminal Setup</span>
              <button
                type="button"
                onClick={copyCommands}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="bg-[#0e1217] border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
              {gitCommands}
            </pre>
          </div>
        </div>

        <div className="bg-[#151a22] border border-zinc-800/90 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">Optional Release Signing Secrets</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Without repository secrets, the workflow signs the APK with the debug key so builds succeed out-of-the-box.
            To sign with your own release keystore, add these GitHub repository secrets:
          </p>
          <ul className="text-xs font-mono text-zinc-300 space-y-1.5">
            <li>WISHY_KEYSTORE_BASE64</li>
            <li>WISHY_KEYSTORE_PASSWORD</li>
            <li>WISHY_KEY_ALIAS</li>
            <li>WISHY_KEY_PASSWORD</li>
          </ul>
        </div>
      </div>

      <div className="lg:col-span-7 bg-[#151a22] border border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-200">.github/workflows/build.yml</span>
          <span className="text-xs text-zinc-400">Triggers on all pushes · PRs · v* tags</span>
        </div>
        <pre className="p-4 bg-[#0e1217] text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-[540px]">
          {workflowYaml || 'Loading workflow...'}
        </pre>
      </div>
    </div>
  );
}
