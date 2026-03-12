export const APP_CONTRACT = {
  baseURL: process.env.E2E_URL ?? 'http://localhost:3004',
  hasAuth: false,
  hasBilling: false,
  hasRoles: false,

  routes: {
    root: '/',
    runs: '/runs',
    build: '/build',
    login: null as string | null,
    dashboard: '/',
    checkout: null as string | null,
  },

  testIds: {
    appRoot: 'app-root',
    heroHeading: 'hero-heading',
    featureCards: 'feature-cards',
    primaryList: 'primary-list',
    createPrimary: 'create-primary',
    searchPrimary: 'search-primary',
    createRunForm: 'create-run-form',
    runPromptInput: 'run-prompt-input',
    runItem: 'run-item',
    emptyState: 'empty-state',
    formError: 'form-error',
    successToast: 'success-toast',
    // Not applicable in this app
    navUserMenu: null as string | null,
    logout: null as string | null,
    checkout: null as string | null,
  },
}
