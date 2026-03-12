import { execSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Deploy generated workspace to Vercel.
 * All shell arguments come from process.env (system-controlled), never from user input.
 * The app slug is sanitized before writing to package.json (filesystem only, not shell).
 */

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
  // token and scope come from process.env — system-controlled, not user input
  for (const key of DEPLOY_ENV_KEYS) {
    const val = process.env[key] || ''
    if (!val) continue
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

  try {
    // Write sanitized slug to package.json — filesystem write, not shell injection
    const rawSlug = typeof productSpec?.slug === 'string' ? productSpec.slug : ''
    const safeSlug = rawSlug.replace(/[^a-z0-9-]/gi, '-').slice(0, 52) || 'denovo-app'
    const pkgPath = path.join(workspaceDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      pkg.name = safeSlug
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    }

    // token and scope are from process.env — safe to use in execSync
    const scopeArg = scope ? ` --scope ${scope}` : ''

    // Step 1: Link project (auto-creates Vercel project named after package.json#name)
    console.log(`[deployer] Linking project: ${safeSlug}`)
    try {
      execSync(`vercel link --token ${token} --yes${scopeArg}`, {
        cwd: workspaceDir, stdio: 'pipe', timeout: 60000,
      })
    } catch (e) {
      console.warn('[deployer] link warning:', e.message?.slice(0, 100))
    }

    // Step 2: Set env vars on the linked project
    console.log('[deployer] Setting env vars...')
    setVercelEnvVars(workspaceDir, token, scope)

    // Step 3: Deploy to production
    console.log('[deployer] Deploying...')
    const stdout = execSync(`vercel --token ${token} --prod --yes${scopeArg}`, {
      cwd: workspaceDir, stdio: 'pipe', timeout: 300000,
    }).toString()

    const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    const url = urlMatch ? urlMatch[0] : null
    console.log(`[deployer] Deployed: ${url || 'no URL in output'}`)
    return { deployed: !!url, url, stdout: stdout.slice(0, 500) }

  } catch (err) {
    const out = (err.stdout?.toString() || '') + (err.stderr?.toString() || '') + (err.message || '')
    const urlMatch = out.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    if (urlMatch) {
      console.log(`[deployer] Deployed (with warnings): ${urlMatch[0]}`)
      return { deployed: true, url: urlMatch[0] }
    }
    const reason = out.slice(0, 400)
    console.error('[deployer] Deploy failed:', reason.slice(0, 200))
    return { deployed: false, url: null, reason }
  }
}
