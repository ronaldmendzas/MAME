import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'

import {
  handleLogin,
  handleMfaBegin,
  handleMfaConfirm,
  handleMfaVerify,
  handleRegister,
} from './auth-local-handlers.js'

const authLocalRoutes = new Hono<AppEnv>()

authLocalRoutes.post('/register', handleRegister)
authLocalRoutes.post('/login', handleLogin)
authLocalRoutes.post('/mfa/begin', handleMfaBegin)
authLocalRoutes.post('/mfa/confirm', handleMfaConfirm)
authLocalRoutes.post('/mfa/verify', handleMfaVerify)

export { authLocalRoutes }
