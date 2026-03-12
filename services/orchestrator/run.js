#!/usr/bin/env node
/**
 * DeNovo Orchestrator — Claude-powered
 * Prompt → ProductSpec → Generate all screens → Deploy → Return live URL
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { interpretPrompt } from '../prompt-engine/index.js'
import { generateAllScreens } from '../code-generator/index.js'
import { deployToVercel } from '../deployer/vercel.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..', '..')
const runsDir = path.join(root, 'runs')
const templateDir = path.join(root, 'templates', 'saas-base')
fs.mkdirSync(runsDir, { recursive: true })

function parseArgs() {
  const argv = process.argv.slice(2)
  const promptIdx = argv.indexOf('--prompt')
  const runIdIdx = argv.indexOf('--run-id')
  return {
    prompt: promptIdx !== -1 ? argv[promptIdx + 1] : 'Build a project management tool for freelancers',
    runId: runIdIdx !== -1 ? argv[runIdIdx + 1] : `run-${Date.now()}`,
  }
}

function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

export function updateStatus(runDir, patch) {
  const logPath = path.join(runDir, 'run-log.json')
  const current = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : {}
  fs.writeFileSync(logPath, JSON.stringify({ ...current, ...patch, updatedAt: new Date().toISOString() }, null, 2))
}

/**
 * Fix common AI-generated code issues that cause syntax errors at build time.
 * - Unescaped apostrophes in single-quoted JSX strings: 'you're' → "you're"
 * - Strips markdown code fences if the LLM accidentally included them
 */
function sanitizeGeneratedFile(content) {
  // Replace single-quoted strings containing apostrophes with double-quoted strings
  // Pattern: '...you're...' or similar — only match JSX expression context (after ? : = {)
  let fixed = content.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, inner) => {
    if (inner.includes("'")) {
      // inner has a raw apostrophe — switch to double quotes if no double quotes inside
      if (!inner.includes('"')) return `"${inner}"`
    }
    return match
  })
  return fixed
}

function sanitizeWorkspace(workspaceDir) {
  const exts = ['.tsx', '.ts', '.jsx', '.js']
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
        // Add force-dynamic to app pages so they don't fail static prerender at build time
        let content = fs.readFileSync(full, 'utf8')
        if (!content.includes("export const dynamic")) {
          content = content.replace(/^('use client'|"use client")\n/m, `$&\nexport const dynamic = 'force-dynamic'\n`)
          if (!content.includes("export const dynamic")) {
            content = `export const dynamic = 'force-dynamic'\n` + content
          }
        }
        const fixed = sanitizeGeneratedFile(content)
        fs.writeFileSync(full, fixed)
      } else if (exts.some(e => entry.name.endsWith(e))) {
        const original = fs.readFileSync(full, 'utf8')
        const fixed = sanitizeGeneratedFile(original)
        if (fixed !== original) fs.writeFileSync(full, fixed)
      }
    }
  }
  walk(workspaceDir)
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`Template not found: ${src}`)
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(srcPath, destPath)
    else fs.copyFileSync(srcPath, destPath)
  }
}

export async function runOrchestrator({ prompt, runId }) {
  const runDir = path.join(runsDir, runId)
  const artifactsDir = path.join(runDir, 'artifacts')
  const workspaceDir = path.join(runDir, 'workspace')
  fs.mkdirSync(artifactsDir, { recursive: true })

  updateStatus(runDir, { id: runId, prompt, status: 'running', phase: 'intent', phaseLabel: 'Analyzing your idea...', startedAt: new Date().toISOString() })

  try {
    // Phase 1: Interpret prompt with Claude
    console.log('[orchestrator] Phase 1: Interpreting prompt...')
    const intent = await interpretPrompt(prompt)
    const { productSpec } = intent
    writeJSON(path.join(artifactsDir, 'ProductSpec.json'), productSpec)
    updateStatus(runDir, { phase: 'spec', phaseLabel: `Designing ${productSpec.displayName}...`, appName: productSpec.displayName, primaryColor: productSpec.primaryColor })

    // Phase 2: Copy base template
    console.log('[orchestrator] Phase 2: Copying template...')
    copyDir(templateDir, workspaceDir)

    // Phase 3: Generate all screens with Claude
    console.log('[orchestrator] Phase 3: Generating screens...')
    updateStatus(runDir, { phase: 'codegen', phaseLabel: 'Generating 7 screens with AI...' })
    const codegenResult = await generateAllScreens(workspaceDir, productSpec)
    writeJSON(path.join(artifactsDir, 'screens.json'), codegenResult)
    sanitizeWorkspace(workspaceDir)

    // Phase 4: Write app config and env
    console.log('[orchestrator] Phase 4: Writing config...')
    updateStatus(runDir, { phase: 'config', phaseLabel: 'Writing configuration...' })

    const envLines = [
      `NEXT_PUBLIC_APP_NAME="${productSpec.displayName}"`,
      `NEXT_PUBLIC_APP_TAGLINE="${productSpec.tagline}"`,
      `NEXT_PUBLIC_PRIMARY_COLOR="${productSpec.primaryColor}"`,
      `NEXT_PUBLIC_PRIMARY_FG="${productSpec.primaryForeground || '#ffffff'}"`,
      `NEXT_PUBLIC_SECONDARY_COLOR="${productSpec.secondaryColor}"`,
      `NEXT_PUBLIC_ACCENT_COLOR="${productSpec.accentColor}"`,
      `NEXT_PUBLIC_SIDEBAR_BG="${productSpec.sidebarBg || '#f8fafc'}"`,
      `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      `SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
      `STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || ''}`,
      `STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || ''}`,
      `STRIPE_PRICE_PRO_MONTHLY=${process.env.STRIPE_PRICE_PRO_MONTHLY || ''}`,
      `NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
      `APP_MAIN_TABLE=${productSpec.dbSchema?.mainTable || 'items'}`,
    ]
    fs.writeFileSync(path.join(workspaceDir, '.env.local'), envLines.join('\n'))

    if (productSpec.dbSchema?.sql) {
      fs.writeFileSync(path.join(artifactsDir, 'schema.sql'), productSpec.dbSchema.sql)
    }

    // Phase 5: Install dependencies
    console.log('[orchestrator] Phase 5: Installing dependencies...')
    updateStatus(runDir, { phase: 'install', phaseLabel: 'Installing packages (~60s)...' })
    try {
      execSync('npm install --ignore-scripts', {
        cwd: workspaceDir, stdio: 'pipe', timeout: 180000,
      })
    } catch (e) {
      console.warn('[orchestrator] npm install warning:', e.stderr?.toString()?.slice(0, 200))
    }

    // Phase 6: Deploy to Vercel
    console.log('[orchestrator] Phase 6: Deploying...')
    updateStatus(runDir, { phase: 'deploy', phaseLabel: 'Deploying to Vercel...' })
    const deployResult = await deployToVercel(workspaceDir, productSpec)
    writeJSON(path.join(artifactsDir, 'deploy.json'), deployResult)

    const finalStatus = {
      status: deployResult.deployed ? 'complete' : 'built',
      phase: 'complete',
      phaseLabel: deployResult.url ? 'Live! 🎉' : 'Built (set VERCEL_TOKEN to deploy)',
      deployUrl: deployResult.url || null,
      completedAt: new Date().toISOString(),
    }
    updateStatus(runDir, finalStatus)

    console.log(`[orchestrator] Done: ${productSpec.displayName}`)
    if (deployResult.url) console.log(`[orchestrator] Live: ${deployResult.url}`)
    return { ok: true, runId, ...finalStatus, productSpec }

  } catch (err) {
    console.error('[orchestrator] Error:', err.message)
    updateStatus(runDir, { status: 'error', error: err.message, phase: 'error', phaseLabel: 'Build failed' })
    return { ok: false, runId, error: err.message }
  }
}

// CLI entrypoint
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) {
  const { prompt, runId } = parseArgs()
  runOrchestrator({ prompt, runId }).then(result => {
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  })
}
