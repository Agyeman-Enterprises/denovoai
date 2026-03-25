import fs from 'node:fs'
import path from 'node:path'

/**
 * Deploy generated workspace to Vercel via REST API v13.
 * Uploads files directly — no Vercel CLI, no child_process, no persistent filesystem needed.
 */

function collectFiles(dir, root) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(root, full).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, root))
    } else {
      const content = fs.readFileSync(full)
      const isBinary = /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot)$/i.test(rel)
      files.push({
        file: rel,
        data: isBinary ? content.toString('base64') : content.toString('utf-8'),
        encoding: isBinary ? 'base64' : 'utf-8',
      })
    }
  }
  return files
}

export async function deployToVercel(workspaceDir, productSpec) {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.warn('[deployer] VERCEL_TOKEN not set — skipping deploy')
    return { deployed: false, url: null, reason: 'VERCEL_TOKEN not set' }
  }

  const rawSlug = typeof productSpec?.slug === 'string' ? productSpec.slug : ''
  const safeSlug = rawSlug.replace(/[^a-z0-9-]/gi, '-').slice(0, 52) || 'denovo-app'
  const appId = productSpec?.id || `app-${Date.now()}`

  try {
    const files = collectFiles(workspaceDir, workspaceDir)
    console.log(`[deployer] Uploading ${files.length} files for ${safeSlug}`)

    const body = {
      name: `denovo-${appId.slice(0, 12)}`,
      files: files.map((f) => ({ file: f.file, data: f.data, encoding: f.encoding })),
      projectSettings: { framework: 'nextjs' },
      target: 'preview',
    }

    const res = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Vercel deploy failed ${res.status}: ${err.slice(0, 300)}`)
    }

    const deployment = await res.json()
    const deployId = deployment.id
    let previewUrl = `https://${deployment.url}`
    console.log(`[deployer] Deployment created: ${deployId} — polling for ready state...`)

    // Poll until ready (up to 3 minutes)
    let attempts = 0
    while (attempts < 36) {
      await new Promise((r) => setTimeout(r, 5000))
      const poll = await fetch(`https://api.vercel.com/v13/deployments/${deployId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (poll.ok) {
        const d = await poll.json()
        previewUrl = `https://${d.url}`
        if (d.readyState === 'READY') {
          console.log(`[deployer] Ready: ${previewUrl}`)
          break
        }
        if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') {
          throw new Error(`Vercel deployment ${d.readyState}`)
        }
      }
      attempts++
    }

    return { deployed: true, url: previewUrl }

  } catch (err) {
    console.error('[deployer] Deploy failed:', err.message?.slice(0, 200))
    return { deployed: false, url: null, reason: err.message }
  }
}
