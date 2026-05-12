/**
 * k6 Peak Load Test — MAME Platform
 *
 * Target: 275 concurrent users (university 11am peak)
 * Thresholds: P95 < 200ms, error rate < 1%
 *
 * Usage (CI/staging):
 *   k6 run --env API_BASE_URL=https://api.staging.mame.app scripts/k6-peak.js
 *
 * Local (requires k6 installed):
 *   k6 run --env API_BASE_URL=http://localhost:8787 scripts/k6-peak.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('error_rate')
const feedDuration = new Trend('feed_duration', true)
const searchDuration = new Trend('search_duration', true)

export const options = {
  scenarios: {
    peak_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 }, // ramp up — pre-peak traffic
        { duration: '3m', target: 275 }, // ramp to university 11am peak
        { duration: '5m', target: 275 }, // sustained peak
        { duration: '2m', target: 50 }, // taper to mid-day baseline
        { duration: '1m', target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // P95 < 200ms (DoD requirement)
    error_rate: ['rate<0.01'], // < 1% error rate
    feed_duration: ['p(95)<200'],
    search_duration: ['p(95)<500'], // search allowed 500ms due to full-text
  },
}

const BASE_URL = __ENV.API_BASE_URL || 'https://api.mame.app'

const SEARCH_TERMS = [
  'corrupcion academica',
  'plagio docente',
  'fraude administrativo',
  'discriminacion',
  'nepotismo facultad',
]

export default function () {
  const scenario = Math.random()

  if (scenario < 0.7) {
    browseFeed()
  } else if (scenario < 0.9) {
    searchReports()
  } else {
    browseReport()
  }

  sleep(randomBetween(0.5, 2.5))
}

function browseFeed() {
  const res = http.get(`${BASE_URL}/reports?limit=20`, {
    tags: { scenario: 'feed' },
  })

  feedDuration.add(res.timings.duration)
  errorRate.add(res.status !== 200)

  check(res, {
    'feed: status 200': (r) => r.status === 200,
    'feed: has data array': (r) => {
      const body = JSON.parse(r.body)
      return body.success === true && Array.isArray(body.data)
    },
    'feed: has cache-control': (r) => r.headers['Cache-Control']?.includes('public') === true,
  })
}

function searchReports() {
  const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)]
  const res = http.get(`${BASE_URL}/reports/search?q=${encodeURIComponent(term)}&limit=20`, {
    tags: { scenario: 'search' },
  })

  searchDuration.add(res.timings.duration)
  errorRate.add(res.status !== 200)

  check(res, {
    'search: status 200': (r) => r.status === 200,
    'search: has meta': (r) => {
      const body = JSON.parse(r.body)
      return body.success === true && typeof body.meta?.count === 'number'
    },
  })
}

function browseReport() {
  const feedRes = http.get(`${BASE_URL}/reports?limit=5`, {
    tags: { scenario: 'feed_for_detail' },
  })

  if (feedRes.status !== 200) return

  const body = JSON.parse(feedRes.body)
  const reports = body.data

  if (!Array.isArray(reports) || reports.length === 0) return

  const report = reports[Math.floor(Math.random() * reports.length)]
  if (!report?.id) return

  const detailRes = http.get(`${BASE_URL}/reports/${report.id}`, {
    tags: { scenario: 'report_detail' },
  })

  errorRate.add(detailRes.status !== 200)

  check(detailRes, {
    'detail: status 200': (r) => r.status === 200,
  })
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}
