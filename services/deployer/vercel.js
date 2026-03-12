import { execSync, spawnSync } from 'node:child_process'
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
    console.log('[deployer] Linking project...')
    execSync(
      ['vercel', 'link', '--token', token, '--yes', ...scopeFlag].join(' '),
      { cwd: workspaceDir, stdio: 'pipe', timeout: 60000 }
    )

    // Step 2: Set env vars so the Vercel build can access them
    console.log('[deployer] Setting env vars...')
    setVercelEnvVars(workspaceDir, token, scope)

    // Step 3: Deploy
    console.log('[deployer] Running vercel --prod...')
    const stdout = execSync(
      ['vercel', '--token', token, '--prod', '--yes', ...scopeFlag].join(' '),
      { cwd: workspaceDir, stdio: 'pipe', timeout: 300000 }
    ).toString()

    const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    const url = urlMatch ? urlMatch[0] : null

    console.log(`[deployer] Deployed: ${url || 'URL not found in output'}`)
    return { deployed: true, url, stdout: stdout.slice(0, 500) }

  } catch (err) {
    const reason = (err.stdout?.toString() || err.message || '').slice(0, 500)
    console.error('[deployer] Deploy failed:', reason.slice(0, 300))
    return { deployed: false, url: null, reason: reason.slice(0, 300) }
  }
}
