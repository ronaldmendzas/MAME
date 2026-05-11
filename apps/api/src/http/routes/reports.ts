import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'
import { ensureRegisteredMiddleware } from '../middleware/ensure-registered.js'
import { optionalAuthMiddleware } from '../middleware/optional-auth.js'
import { rateLimitWrite } from '../middleware/rate-limit.js'

import { handleCreateComment } from './comment-create.js'
import { handleDeleteComment } from './comment-delete.js'
import { handleGetComments } from './comment-list.js'
import { handleAddLink } from './evidence-link.js'
import { handleEvidenceList } from './evidence-list.js'
import { handleEvidenceUpload } from './evidence.js'
import { handleCreateReport } from './report-create.js'
import { handleReportDetail } from './report-detail.js'
import { handleFeed, handleMyReports } from './report-feed.js'
import { handleStatusHistory } from './report-history.js'
import { handleSearch } from './report-search.js'
import { handleSubmitReport } from './report-submit.js'
import { handleUpdateReport } from './report-update.js'
import { handleAddVote } from './vote-add.js'
import { handleRemoveVote } from './vote-remove.js'

const reportRoutes = new Hono<AppEnv>()

const auth = [authMiddleware, ensureRegisteredMiddleware] as const
const authWrite = [...auth, rateLimitWrite()] as const

reportRoutes.get('/', handleFeed)
reportRoutes.get('/search', handleSearch)
reportRoutes.get('/mine', ...auth, handleMyReports)
reportRoutes.get('/:id', optionalAuthMiddleware, handleReportDetail)
reportRoutes.get('/:id/history', handleStatusHistory)
reportRoutes.get('/:id/evidence', handleEvidenceList)
reportRoutes.get('/:id/comments', handleGetComments)

reportRoutes.post('/', ...authWrite, handleCreateReport)
reportRoutes.post('/:id/evidence', authMiddleware, rateLimitWrite(), handleEvidenceUpload)
reportRoutes.post('/:id/evidence/link', authMiddleware, rateLimitWrite(), handleAddLink)
reportRoutes.post('/:id/submit', ...authWrite, handleSubmitReport)
reportRoutes.post('/:id/comments', ...authWrite, handleCreateComment)
reportRoutes.post('/:id/vote', ...authWrite, handleAddVote)

reportRoutes.patch('/:id', ...authWrite, handleUpdateReport)

reportRoutes.delete('/:id/comments/:commentId', ...authWrite, handleDeleteComment)
reportRoutes.delete('/:id/vote', ...authWrite, handleRemoveVote)

export { reportRoutes }
