import type { Plugin } from 'vite'

interface SizeOption{
  chunkSize:number,
  assetSize:number,
}

interface BundleEntryStat {
  fileName: string
  type: 'chunk' | 'asset'
  size: number
}

/**
 * 构建产物体积报告 — 我们一起写
 *
 * 路线图：
 *   第 1 步 ✅ 插件空壳（当前）
 *   第 2 步 ⬜ 限制只在 build 生效
 *   第 3 步 ⬜ buildStart 记录开始时间
 *   第 4 步 ⬜ generateBundle 遍历 bundle 打印文件名
 *   第 5 步 ⬜ 计算每个文件体积
 *   第 6 步 ⬜ 加 warn / fail 阈值
 *   第 7 步 ⬜ closeBundle 打印报告 + 超限抛错
 */

export function buildReportPlugin(size:SizeOption): Plugin {
  let buildStartTime = 0
  const {chunkSize,assetSize} = size
  const entries:BundleEntryStat[]=[]
  const errors:string[]=[]
  const warnings:string[]=[]
  return {
    name: 'build-report',
    apply:"build",
    enforce:"post",
    buildStart(){
      // 记录开始时间
      buildStartTime = Date.now()
    },
    generateBundle(_outputOptions, bundle){
      for(const file in bundle){
        const key:keyof typeof bundle = file
        const value:typeof bundle[keyof typeof bundle] = bundle[key]
        if(value.type === 'chunk'){
          if(value.code.length > chunkSize){
            errors.push(`[build-report] ${key} 超过限制: ${value.code.length} bytes`)
          }
        }else{
          if(value.source.length > assetSize){
            errors.push(`[build-report] ${key} 超过限制: ${value.source.length} bytes`)
          }
        }
        entries.push({
          fileName:key,
          type:value.type,
          size:value.type === 'chunk' ? value.code.length : value.source.length
        })
      }
    },
    closeBundle(){
      const durationMs = Date.now() - buildStartTime
      console.log(`[build-report] 构建产物体积报告 耗时: ${durationMs}ms`)
      if(errors.length > 0){
        const message = errors.map((error) => `  ✖ ${error}`).join('\n')
        throw new Error(`[build-report] 构建失败，产物体积超限：\n${message}`)
      }
      if(warnings.length > 0){
        const message = warnings.map((warning) => `  ⚠ ${warning}`).join('\n')
        console.warn(`[build-report] 体积警告：\n${message}`)
      }
      console.log('[build-report] 全部检查通过\n')
    },
  }
}
