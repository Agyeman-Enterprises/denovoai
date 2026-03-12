import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Deploy generated workspace to Vercel.
 * Uses Vercel CLI + token from process.env only.
 * Sets env vars on the Vercel project before building.
 */

// Env vars to inject into the Vercel project at deploy time
const DEPLOY_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PRO_MONTHLY',
  'NEXT_PUBLIC_APP_URL',
]

function setVercelEnvVars(workspaceDir, token, scope) {
  for (const key of DEPLOY_ENV_KEYS) {
    const val = process.env[key] || ''
    if (!val) continue
    // vercel env add KEY production reads value from stdin
    const args = ['env', 'add', key, 'production', '--token', token, '--force']
    if (scope) args.push('--scope', scope)
    try {
      spawnSync('vercel', args, {
        cwd: workspaceDir,
        input: val,
        stdio: ['pipe', 'ignore', 'ignore'],
      })
    } catch {}
  }
}

export async function deployToVercel(workspaceDir, productSpec) {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.warn('[deployer] VERCEL_TOKEN not set — skipping deploy')
    return { deployed: false, url: null, reason: 'VERCEL_TOKEN not set' }
  }

  const scope = process.env.VERCEL_SCOPE || ''
  const scopeFlag = scope ? ['--scope', scope] : []

  try {
    // Set a clean project name from the app slug
    const pkgPath = path.join(workspaceDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      pkg.name = productSpec?.slug || 'denovo-app'
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    }

    // Step 1: Link the project (creates .vercel/project.json)
    // Sanitize slug to alphanumeric + hyphens only — never interpolate raw user input into shell
    const rawSlug = typeof productSpec?.slug === 'string' ? productSpec.slug : ''
    const projectName = rawSlug.replace(/[^a-z0-9-]/gi, '-').slice(0, 52) || `denovo-${Date.now()}`
    console.log(`[deployer] Linking project as: ${projectName}`)
    // Use spawnSync array form — no shell interpolation
    const linkArgs = ['link', '--token', token, '--yes', '--name', projectName, ...scopeFlag]
    const linkResult = spawnSync('vercel', linkArgs, { cwd: workspaceDir, stdio: 'pipe', timeout: 60000 })
    if (linkResult.status !== 0) {
      const msg = (linkResult.stderr?.toString() || '').slice(0, 200)
      console.warn('[deployer] vercel link warning:', msg)
    }

    // Step 2: Set env vars so the Vercel build can access them
    console.log('[deployer] Setting env vars...')
    setVercelEnvVars(workspaceDir, token, scope)

    // Step 3: Deploy — use spawnSync array form (no shell interpolation)
    console.log('[deployer] Running vercel --prod...')
    const deployArgs = ['--token', token, '--prod', '--yes', ...scopeFlag]
    const result = spawnSync('vercel', deployArgs, {
      cwd: workspaceDir,
      stdio: 'pipe',
      timeout: 300000,
    })

    const stdout = (result.stdout?.toString() || '')
    const stderr = (result.stderr?.toString() || '')
    const combined = stdout + stderr

    const urlMatch = combined.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    const url = urlMatch ? urlMatch[0] : null

    if (result.status !== 0 && !url) {
      const reason = combined.slice(0, 300)
      console.error('[deployer] Deploy failed:', reason)
      return { deployed: false, url: null, reason }
    }

    console.log(`[deployer] Deployed: ${url || 'URL not found in output'}`)
    return { deployed: !!url, url, stdout: stdout.slice(0, 500) }
  } catch (err) {
    console.error('[deployer] Deploy error:', err.message?.slice(0, 300))
    return { deployed: false, url: null, reason: err.message?.slice(0, 300) }
  }
}
