import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileCode, Search } from 'lucide-react';
import type { ModifiedFileInfo, RepoFilePayload, RepoTreeItem } from '../types';

interface CodeExplorerProps {
  modifiedFiles: ModifiedFileInfo[];
}

export function CodeExplorer({ modifiedFiles }: CodeExplorerProps) {
  const [tree, setTree] = useState<RepoTreeItem[]>([]);
  const [filterMode, setFilterMode] = useState<'modified' | 'all'>('modified');
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>(
    modifiedFiles[0]?.path || 'app/src/main/assets/automation.js'
  );
  const [fileData, setFileData] = useState<RepoFilePayload | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [viewMode, setViewMode] = useState<'source' | 'diff'>('source');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/repo/tree')
      .then((r) => r.json())
      .then((d) => setTree(d.files || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPath) return;
    setLoadingFile(true);
    fetch(`/api/repo/file?path=${encodeURIComponent(selectedPath)}`)
      .then((r) => r.json())
      .then((d: RepoFilePayload) => {
        setFileData(d);
        if (!d.diff && viewMode === 'diff') setViewMode('source');
      })
      .catch(() => {})
      .finally(() => setLoadingFile(false));
  }, [selectedPath]);

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filterMode === 'modified') {
      return modifiedFiles.filter(
        (m) => !q || m.path.toLowerCase().includes(q) || m.feature.toLowerCase().includes(q)
      );
    }
    return tree
      .filter((t) => t.type === 'file')
      .filter((t) => !q || t.path.toLowerCase().includes(q))
      .map((t) => ({
        path: t.path,
        status: (t.status as 'added' | 'modified') || undefined,
        feature: t.name,
        summary: ''
      }));
  }, [filterMode, modifiedFiles, tree, query]);

  const copyContent = () => {
    const text = viewMode === 'diff' && fileData?.diff ? fileData.diff : fileData?.content || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar file list */}
      <div className="lg:col-span-4 bg-[#151a22] border border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center gap-1 p-1 bg-[#0e1217] rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setFilterMode('modified')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'modified' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Changed ({modifiedFiles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Files ({tree.filter((t) => t.type === 'file').length})
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter repository files..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0e1217] border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#e1262d]"
            />
          </div>
        </div>

        <div className="max-h-[540px] overflow-y-auto divide-y divide-zinc-800/70">
          {visibleFiles.map((item) => {
            const active = item.path === selectedPath;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => setSelectedPath(item.path)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                  active ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                }`}
              >
                <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#ff5258]' : 'text-zinc-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-100 truncate">{item.path}</span>
                    {item.status && (
                      <span
                        className={`text-[11px] font-medium shrink-0 ${
                          item.status === 'added' ? 'text-emerald-400' : 'text-[#ff5258]'
                        }`}
                      >
                        {item.status === 'added' ? 'New' : 'Mod'}
                      </span>
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.feature}</p>
                  )}
                </div>
              </button>
            );
          })}
          {visibleFiles.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">No files match "{query}".</div>
          )}
        </div>
      </div>

      {/* Right file viewer */}
      <div className="lg:col-span-8 bg-[#151a22] border border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-4">
          <span className="text-xs font-mono text-zinc-200 truncate">{selectedPath}</span>
          <div className="flex items-center gap-2 shrink-0">
            {fileData?.diff && (
              <div className="flex items-center gap-1 p-0.5 bg-[#0e1217] rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode('source')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'source' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Source
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('diff')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'diff' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Git Diff
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={copyContent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto bg-[#0e1217] p-4">
          {loadingFile ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
              <div className="h-4 bg-zinc-800 rounded w-5/6" />
            </div>
          ) : fileData?.binary ? (
            <div className="text-xs text-zinc-400 py-8 text-center">
              Binary asset ({selectedPath}). Included in the downloadable repository ZIP.
            </div>
          ) : (
            <pre className="text-xs font-mono leading-relaxed text-zinc-200 whitespace-pre">
              {viewMode === 'diff' && fileData?.diff ? fileData.diff : fileData?.content || ''}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
