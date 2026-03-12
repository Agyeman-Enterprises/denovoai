const path = require('path')
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    // Force single React instance using require.resolve (gives canonical OS path)
    const reactPkg = require.resolve('react/package.json')
    const reactDomPkg = require.resolve('react-dom/package.json')
    const reactDir = path.dirname(reactPkg)
    const reactDomDir = path.dirname(reactDomPkg)
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
