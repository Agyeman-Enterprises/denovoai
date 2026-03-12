const path = require('path')
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    const workspaceRoot = path.resolve(__dirname, '../..')
    const reactDir = path.join(workspaceRoot, 'node_modules/react')
    const reactDomDir = path.join(workspaceRoot, 'node_modules/react-dom')
    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactDir,
      'react-dom': reactDomDir,
      'react/jsx-runtime': path.join(reactDir, 'jsx-runtime'),
      'react/jsx-dev-runtime': path.join(reactDir, 'jsx-dev-runtime'),
    }
    return config
  },
}
module.exports = nextConfig
