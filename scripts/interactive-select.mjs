/**
 * 终端方向键选择列表示例
 * 运行：node scripts/interactive-select.mjs
 * 或在 package.json 里：npm run select-demo
 */
import * as clack from '@clack/prompts'

const selectedCommand = await clack.select({
  message: '你想执行什么？',
  options: [
    { value: 'dev', label: '启动开发服务器', hint: 'vite dev' },
    { value: 'build', label: '打包生产环境', hint: 'vite build' },
    { value: 'preview', label: '预览 dist', hint: 'vite preview' },
    { value: 'report', label: '只看构建报告插件', hint: 'plugins/build-report.ts' },
  ],
})

if (clack.isCancel(selectedCommand)) {
  clack.cancel('已取消')
  process.exit(0)
}

clack.log.success(`你选择了：${selectedCommand}`)

const selectedEnv = await clack.multiselect({
  message: '还要勾选哪些检查项？（空格选中，回车确认）',
  options: [
    { value: 'typecheck', label: 'TypeScript 类型检查' }, 
    { value: 'lint', label: 'ESLint' },
    { value: 'size', label: '产物体积检查' },
  ],
  required: false,
})

if (clack.isCancel(selectedEnv)) {
  clack.cancel('已取消')
  process.exit(0)
}

clack.note(
  `即将执行：${selectedCommand}\n附加：${selectedEnv.length > 0 ? selectedEnv.join(', ') : '无'}`,
  '预览',
)

const shouldRun = await clack.confirm({
  message: '确认执行吗？',
  initialValue: true,
})

if (!shouldRun) {
  clack.cancel('已取消')
  process.exit(0)
}

clack.outro('搞定！这里可以接 child_process.spawn 真正跑命令')
