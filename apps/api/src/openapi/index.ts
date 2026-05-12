import { components } from './components.js'
import { info } from './info.js'
import { adminPaths } from './paths/admin.js'
import { reportSubPaths } from './paths/reports-sub.js'
import { reportPaths } from './paths/reports.js'
import { statsPaths } from './paths/stats.js'
import { systemPaths } from './paths/system.js'

export const openApiSpec = {
  ...info,
  components,
  paths: {
    ...systemPaths,
    ...reportPaths,
    ...reportSubPaths,
    ...adminPaths,
    ...statsPaths,
  },
} as const
