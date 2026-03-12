import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Deploy generated workspace to Vercel.
 * Uses Vercel CLI + token. Parses the deployment URL from stdout.
 */
export async function deployToVercel(workspaceDir, productSpec) {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.warn('[deployer] VERCEL_TOKEN not set — skipping deploy')
    return { deployed: false, url: null, reason: 'VERCEL_TOKEN not set' }
  }

  try {
    // Set a clean project name from the app slug
    const pkgPath = path.join(workspaceDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      pkg.name = productSpec?.slug || 'denovo-app'
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    }

    console.log('[deployer] Running vercel --prod...')
    const stdout = execSync(
      `vercel --token ${token} --prod --yes`,
      { cwd: workspaceDir, stdio: 'pipe', timeout: 180000 }
    ).toString()

    // Extract the deployment URL from stdout
    const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    const url = urlMatch ? urlMatch[0] : null

    console.log(`[deployer] Deployed: ${url || 'URL not found in output'}`)
    return { deployed: true, url, stdout: stdout.slice(0, 500) }

  } catch (err) {
    console.error('[deployer] Deploy failed:', err.message?.slice(0, 300))
    return { deployed: false, url: null, reason: err.message?.slice(0, 300) }
  }
}
