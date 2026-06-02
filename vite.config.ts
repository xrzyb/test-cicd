import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildReportPlugin } from './plugins/build-report.reference'
import { trimPlugin } from './plugins/trim'
const projectRoot = fileURLToPath(new URL('.', import.meta.url))

/** 将 transform 收到的 code 写到调试目录（id 在 Vite 里通常是绝对路径，不能和 __dirname 再拼） */
function writeTransformDump(id: string, code: string, suffix: string): void {
  const sourcePath = id.split('?')[0]
  if (!path.isAbsolute(sourcePath)) {
    return
  }
  const relativePath = path.relative(projectRoot, sourcePath)
  if (relativePath.startsWith('..') || relativePath.includes('node_modules')) {
    return
  }
  const outputPath = path.join(projectRoot, '.vite-plugin-dump', `${relativePath}${suffix}`)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, code, 'utf-8')
}
// const configPlugin=():Plugin=>{
//   return {
//     name:'config-plugin',
//     config(config,env){
//       if(env.command === 'build'){
//         console.log('打包环境')
//       }
//       console.log()
//       return config
//     }
//   }
// }




// const checkFileSizePlugin=():Plugin=>{
//   return {
//     name:'check-file-size',
//     generateBundle(_options,_bundle){
//       for(const file in _bundle){
//         const key:keyof typeof _bundle = file
//         const value:typeof _bundle[keyof typeof _bundle] = _bundle[key]
//         if(value.type === 'chunk'){
//           const limit = 4 * 1024 * 1024 // 4MB
//           if(value.code.length > limit){
//             throw new Error(`[check-file-size] ${key} 超过限制: ${value.code.length} bytes`)
//           }
//         }
//         // else{
//         //   const limit = 10 * 1024 * 1024 // 10MB
//         //   if(value.source.length > limit){
//         //     throw new Error(`[check-file-size] ${key} 超过限制: ${value.source.length} bytes`)
//         //   }
//         // }
//       }
//     }
//   }
// }

// const transformPlugin=():Plugin=>{
//   const imgType=['.png','.jpg','.jpeg','.gif','.webp','.svg']
//   return {
//     name:'transform-plugin',
//     apply:'build',
//     transform(_code:string,id:string){
//       if(imgType.includes(extname(id))){
//         console.log(id)
//       }
//     }
//   }
// }
const sourceMapPlugin=():Plugin=>{
  return {
    name:"source-map-plugin",
    apply:"serve",
    transform(_code:string,id:string){
      if(id.includes('.vue')){
        writeTransformDump(id, _code, '.vue.dump.txt')
      }
      return null
    }
  }
}

const buildSourceMapPlugin=():Plugin=>{
  return {
    name:"build-source-map-plugin",
    apply:"serve",
    transform(_code:string,id:string){
      if(id.includes('.js')){
        writeTransformDump(id, _code, '.js.dump.txt')
      }
      return null
    }
  }
}


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    sourceMapPlugin(),
    vue(),
    buildSourceMapPlugin(),
    buildReportPlugin(),
    trimPlugin({ verbose: true }),
  ],
})
