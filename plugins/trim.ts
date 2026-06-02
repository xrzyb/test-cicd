import type { Plugin } from 'vite'

export interface TrimPluginOptions {
  /** 要移除的语句关键字，默认去掉 console 与 debugger */
  removePatterns?: RegExp[]
  /** 是否打印被处理的文件（调试用） */
  verbose?: boolean
}

const DEFAULT_REMOVE_PATTERNS: RegExp[] = [
  // console.log(...) / console.debug(...) 等单行调用
  /console\.(log|debug|info|warn|error|trace)\([^)]*\);?\s*/g,
  // 单独的 debugger 语句
  /\bdebugger;?\s*/g,
]

/**
 * 生产构建「瘦身」插件 — 移除调试代码
 *
 * 路线图：
 *   第 1 步 ✅ 插件空壳 + apply: 'build'
 *   第 2 步 ✅ transform 过滤 node_modules
 *   第 3 步 ✅ 用正则移除 console / debugger
 *   第 4 步 ✅ 返回 { code, map } 让 Vite 继续处理
 *   第 5 步 ⬜ 可选：用 AST（如 esbuild）替代正则，更精准
 */
export function trimPlugin(options: TrimPluginOptions = {}): Plugin {
  const removePatterns = options.removePatterns ?? DEFAULT_REMOVE_PATTERNS
  const verbose = options.verbose ?? false
  let trimmedFileCount = 0

  return {
    name: 'trim-plugin',
    apply: 'build',
    enforce: 'pre',

    transform(code, id) {
      // 只处理项目源码，跳过依赖与虚拟模块
      if (id.includes('node_modules') || id.includes('\0')) {
        return null
      }

      const sourcePath = id.split('?')[0]
      const isSourceFile = /\.(vue|[jt]sx?)$/.test(sourcePath)
      if (!isSourceFile) {
        return null
      }

      let nextCode = code
      let hasChange = false

      for (const pattern of removePatterns) {
        // 每次 transform 用新正则，避免 lastIndex 污染
        const matcher = new RegExp(pattern.source, pattern.flags)
        const replaced = nextCode.replace(matcher, '')
        if (replaced !== nextCode) {
          hasChange = true
          nextCode = replaced
        }
      }

      if (!hasChange) {
        return null
      }

      trimmedFileCount += 1
      if (verbose) {
        console.log(`[trim-plugin] 已清理: ${sourcePath}`)
      }

      return { code: nextCode, map: null }
    },

    closeBundle() {
      console.log(`[trim-plugin] 共清理 ${trimmedFileCount} 个源文件中的调试代码\n`)
    },
  }
}
