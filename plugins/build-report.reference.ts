/**
 * 参考实现（上次 AI 一次性写完的完整版）
 * 卡住了可以偷看，但建议先自己写，实在写不动再对照
 */
import type { OutputBundle } from 'rolldown'
import type { Plugin } from 'vite'

export interface BuildReportPluginOptions {
  chunkFailLimit?: number
  assetFailLimit?: number
  warnLimit?: number
}

interface BundleEntryStat {
  fileName: string
  type: 'chunk' | 'asset'
  size: number
}

interface BuildReportSnapshot {
  entries: BundleEntryStat[]
  errors: string[]
  warnings: string[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getBundleEntrySize(
  fileName: string,
  bundleItem: OutputBundle[string],
): BundleEntryStat {
  const size =
    bundleItem.type === 'chunk'
      ? bundleItem.code.length
      : bundleItem.source.length
  return { fileName, type: bundleItem.type, size }
}

function collectBundleStats(
  bundle: OutputBundle,
  options: Required<BuildReportPluginOptions>,
): BuildReportSnapshot {
  const entries: BundleEntryStat[] = []
  const errors: string[] = []
  const warnings: string[] = []

  for (const [fileName, bundleItem] of Object.entries(bundle)) {
    const entry = getBundleEntrySize(fileName, bundleItem)
    entries.push(entry)
    const failLimit =
      entry.type === 'chunk' ? options.chunkFailLimit : options.assetFailLimit
    const label = entry.type === 'chunk' ? 'chunk' : 'asset'
    if (entry.size > failLimit) {
      errors.push(
        `[${label}] ${fileName}: ${formatBytes(entry.size)} > 限制 ${formatBytes(failLimit)}`,
      )
      continue
    }
    if (entry.size > options.warnLimit) {
      warnings.push(`[${label}] ${fileName}: ${formatBytes(entry.size)}`)
    }
  }
  return { entries, errors, warnings }
}

function printBuildReport(
  snapshot: BuildReportSnapshot,
  durationMs: number,
): void {
  const sortedEntries = [...snapshot.entries].sort(
    (left, right) => right.size - left.size,
  )
  const totalSize = sortedEntries.reduce((sum, entry) => sum + entry.size, 0)
  console.log('\n[build-report] 构建产物体积报告')
  console.log('─'.repeat(60))
  for (const entry of sortedEntries) {
    console.log(
      `  ${entry.type.padEnd(5)} ${formatBytes(entry.size).padStart(10)}  ${entry.fileName}`,
    )
  }
  console.log('─'.repeat(60))
  console.log(
    `  合计 ${sortedEntries.length} 个文件，总大小 ${formatBytes(totalSize)}，耗时 ${(durationMs / 1000).toFixed(2)}s`,
  )
  if (snapshot.warnings.length > 0) {
    console.log('\n[build-report] 体积警告：')
    for (const warning of snapshot.warnings) {
      console.warn(`  ⚠ ${warning}`)
    }
  }
}

export function buildReportPlugin(
  options: BuildReportPluginOptions = {},
): Plugin {
  const resolvedOptions: Required<BuildReportPluginOptions> = {
    chunkFailLimit: options.chunkFailLimit ?? 500 * 1024,
    assetFailLimit: options.assetFailLimit ?? 1024 * 1024,
    warnLimit: options.warnLimit ?? 100 * 1024,
  }
  let buildStartTime = 0
  let reportSnapshot: BuildReportSnapshot | null = null
  return {
    name: 'build-report',
    apply: 'build',
    enforce: 'post',
    buildStart() {
      buildStartTime = Date.now()
    },
    generateBundle(_outputOptions, bundle) {
      reportSnapshot = collectBundleStats(bundle, resolvedOptions)
    },
    closeBundle() {
      if (reportSnapshot == null) return
      const durationMs = Date.now() - buildStartTime
      printBuildReport(reportSnapshot, durationMs)
      if (reportSnapshot.errors.length > 0) {
        const message = reportSnapshot.errors
          .map((error) => `  ✖ ${error}`)
          .join('\n')
        throw new Error(`[build-report] 构建失败，产物体积超限：\n${message}`)
      }
      console.log('[build-report] 全部检查通过\n')
    },
  }
}
