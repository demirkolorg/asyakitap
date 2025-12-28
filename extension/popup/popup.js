// AsyaKitap Chrome Extension - Popup Script

const DEFAULT_API_URL = 'https://asyakitap.vercel.app'

// State
let state = {
  token: null,
  user: null,
  apiUrl: DEFAULT_API_URL,
  books: [],
  stats: null,
  pageBook: null,
}

// Elements
const elements = {
  loginScreen: document.getElementById('loginScreen'),
  mainScreen: document.getElementById('mainScreen'),
  settingsScreen: document.getElementById('settingsScreen'),
  loginForm: document.getElementById('loginForm'),
  loginBtn: document.getElementById('loginBtn'),
  googleLoginBtn: document.getElementById('googleLoginBtn'),
  loginError: document.getElementById('loginError'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  settingsBtn: document.getElementById('settingsBtn'),
  backFromSettings: document.getElementById('backFromSettings'),
  saveSettings: document.getElementById('saveSettings'),
  apiUrlInput: document.getElementById('apiUrl'),
  logoutBtn: document.getElementById('logoutBtn'),
  userEmail: document.getElementById('userEmail'),
  readingList: document.getElementById('readingList'),
  statTotal: document.getElementById('statTotal'),
  statReading: document.getElementById('statReading'),
  statCompleted: document.getElementById('statCompleted'),
  pageBookSection: document.getElementById('pageBookSection'),
  pageBookCover: document.getElementById('pageBookCover'),
  pageBookTitle: document.getElementById('pageBookTitle'),
  pageBookAuthor: document.getElementById('pageBookAuthor'),
  addPageBookBtn: document.getElementById('addPageBookBtn'),
  pageBookMessage: document.getElementById('pageBookMessage'),
}

// API Client
async function api(endpoint, options = {}) {
  const url = `${state.apiUrl}/api/v1${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'API error')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Storage helpers
async function saveToStorage(key, value) {
  return chrome.storage.local.set({ [key]: value })
}

async function getFromStorage(key) {
  const result = await chrome.storage.local.get(key)
  return result[key]
}

async function removeFromStorage(key) {
  return chrome.storage.local.remove(key)
}

// Initialize
async function init() {
  // Load settings
  const savedApiUrl = await getFromStorage('apiUrl')
  if (savedApiUrl) {
    state.apiUrl = savedApiUrl
    elements.apiUrlInput.value = savedApiUrl
  }

  // Check for existing session
  const savedToken = await getFromStorage('token')
  const savedUser = await getFromStorage('user')

  if (savedToken && savedUser) {
    state.token = savedToken
    state.user = savedUser

    // Verify token is still valid
    try {
      await api('/auth/verify')
      showMainScreen()
      loadData()
    } catch {
      // Token expired
      await logout()
    }
  } else {
    showLoginScreen()
  }

  // Check current page for book
  checkCurrentPage()

  // Setup event listeners
  setupEventListeners()
}

function setupEventListeners() {
  // Login form
  elements.loginForm.addEventListener('submit', handleLogin)

  // Google login
  elements.googleLoginBtn.addEventListener('click', handleGoogleLogin)

  // Settings
  elements.settingsBtn.addEventListener('click', showSettingsScreen)
  elements.backFromSettings.addEventListener('click', () => {
    if (state.token) {
      showMainScreen()
    } else {
      showLoginScreen()
    }
  })
  elements.saveSettings.addEventListener('click', saveSettings)

  // Logout
  elements.logoutBtn.addEventListener('click', logout)

  // Add page book
  elements.addPageBookBtn.addEventListener('click', addPageBook)
}

// Screen navigation
function showLoginScreen() {
  elements.loginScreen.style.display = 'block'
  elements.mainScreen.style.display = 'none'
  elements.settingsScreen.style.display = 'none'
}

function showMainScreen() {
  elements.loginScreen.style.display = 'none'
  elements.mainScreen.style.display = 'block'
  elements.settingsScreen.style.display = 'none'
  elements.userEmail.textContent = state.user?.email || ''
}

function showSettingsScreen() {
  elements.loginScreen.style.display = 'none'
  elements.mainScreen.style.display = 'none'
  elements.settingsScreen.style.display = 'block'
}

// Google Login
async function handleGoogleLogin() {
  setButtonLoading(elements.googleLoginBtn, true)
  elements.loginError.textContent = ''

  try {
    // Open login page in new tab
    const loginUrl = `${state.apiUrl}/auth/extension-login`

    // Create a new tab with the login page
    const tab = await chrome.tabs.create({ url: loginUrl })

    // Listen for the tab to complete login
    const listener = async (tabId, changeInfo, tabInfo) => {
      if (tabId !== tab.id) return

      // Check if redirected to dashboard (login successful)
      if (changeInfo.url && changeInfo.url.includes('/dashboard')) {
        chrome.tabs.onUpdated.removeListener(listener)

        // Get session from the page
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Get Supabase session from localStorage
              const keys = Object.keys(localStorage)
              const supabaseKey = keys.find(k => k.includes('supabase') && k.includes('auth'))
              if (supabaseKey) {
                const data = JSON.parse(localStorage.getItem(supabaseKey))
                return data
              }
              return null
            }
          })

          if (results && results[0] && results[0].result) {
            const session = results[0].result
            if (session.access_token) {
              state.token = session.access_token
              state.user = session.user

              await saveToStorage('token', state.token)
              await saveToStorage('user', state.user)

              // Close the login tab
              chrome.tabs.remove(tab.id)

              showMainScreen()
              loadData()
            }
          }
        } catch (err) {
          console.error('Failed to get session:', err)
        }

        setButtonLoading(elements.googleLoginBtn, false)
      }

      // If tab is closed without login
      if (changeInfo.status === 'complete' && tabInfo.url === 'chrome://newtab/') {
        chrome.tabs.onUpdated.removeListener(listener)
        setButtonLoading(elements.googleLoginBtn, false)
      }
    }

    chrome.tabs.onUpdated.addListener(listener)

    // Also listen for tab close
    chrome.tabs.onRemoved.addListener(function onRemoved(tabId) {
      if (tabId === tab.id) {
        chrome.tabs.onRemoved.removeListener(onRemoved)
        chrome.tabs.onUpdated.removeListener(listener)
        setButtonLoading(elements.googleLoginBtn, false)
      }
    })

  } catch (error) {
    console.error('Google login error:', error)
    elements.loginError.textContent = 'Giriş başarısız'
    setButtonLoading(elements.googleLoginBtn, false)
  }
}

// Login
async function handleLogin(e) {
  e.preventDefault()

  const email = elements.email.value.trim()
  const password = elements.password.value

  if (!email || !password) return

  setButtonLoading(elements.loginBtn, true)
  elements.loginError.textContent = ''

  try {
    const response = await api('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    state.token = response.data.token
    state.user = response.data.user

    await saveToStorage('token', state.token)
    await saveToStorage('user', state.user)

    showMainScreen()
    loadData()
  } catch (error) {
    elements.loginError.textContent = error.message || 'Giriş başarısız'
  } finally {
    setButtonLoading(elements.loginBtn, false)
  }
}

// Logout
async function logout() {
  state.token = null
  state.user = null
  state.books = []
  state.stats = null

  await removeFromStorage('token')
  await removeFromStorage('user')

  showLoginScreen()
  elements.email.value = ''
  elements.password.value = ''
}

// Settings
async function saveSettings() {
  const apiUrl = elements.apiUrlInput.value.trim()
  if (apiUrl) {
    state.apiUrl = apiUrl
    await saveToStorage('apiUrl', apiUrl)
  }

  if (state.token) {
    showMainScreen()
  } else {
    showLoginScreen()
  }
}

// Load data
async function loadData() {
  try {
    const response = await api('/books?status=READING&limit=10')
    state.books = response.data.books
    state.stats = response.data.stats
    renderReadingList()
    renderStats()
  } catch (error) {
    console.error('Load data error:', error)
    elements.readingList.innerHTML = '<p class="empty-text">Veriler yüklenemedi</p>'
  }
}

// Render reading list
function renderReadingList() {
  if (!state.books || state.books.length === 0) {
    elements.readingList.innerHTML = '<p class="empty-text">Henüz okumakta olduğunuz kitap yok</p>'
    return
  }

  elements.readingList.innerHTML = state.books.map(book => `
    <div class="book-item" data-id="${book.id}">
      <img
        class="book-item-cover"
        src="${book.coverUrl || ''}"
        alt="${book.title}"
        onerror="this.style.display='none'"
      >
      <div class="book-item-info">
        <div class="book-item-title">${escapeHtml(book.title)}</div>
        <div class="book-item-author">${escapeHtml(book.author || '')}</div>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${book.progress}%"></div>
          </div>
          <span class="progress-text">${book.progress}%</span>
        </div>
        <div class="page-controls">
          <button class="page-btn" data-action="decrease" data-id="${book.id}">-10</button>
          <input
            type="number"
            class="page-input"
            value="${book.currentPage}"
            data-id="${book.id}"
            min="0"
            max="${book.pageCount || 9999}"
          >
          <span class="page-total">/ ${book.pageCount || '?'}</span>
          <button class="page-btn" data-action="increase" data-id="${book.id}">+10</button>
        </div>
      </div>
    </div>
  `).join('')

  // Add event listeners for page controls
  elements.readingList.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', handlePageButton)
  })

  elements.readingList.querySelectorAll('.page-input').forEach(input => {
    input.addEventListener('change', handlePageInput)
  })
}

// Handle page button click
async function handlePageButton(e) {
  const btn = e.currentTarget
  const bookId = btn.dataset.id
  const action = btn.dataset.action
  const book = state.books.find(b => b.id === bookId)

  if (!book) return

  let newPage = book.currentPage
  if (action === 'increase') {
    newPage = Math.min(newPage + 10, book.pageCount || newPage + 10)
  } else {
    newPage = Math.max(newPage - 10, 0)
  }

  await updateProgress(bookId, newPage)
}

// Handle page input change
async function handlePageInput(e) {
  const input = e.currentTarget
  const bookId = input.dataset.id
  const newPage = parseInt(input.value) || 0

  await updateProgress(bookId, newPage)
}

// Update progress
async function updateProgress(bookId, currentPage) {
  try {
    const response = await api(`/books/${bookId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPage }),
    })

    // Update local state
    const bookIndex = state.books.findIndex(b => b.id === bookId)
    if (bookIndex !== -1) {
      state.books[bookIndex] = {
        ...state.books[bookIndex],
        currentPage: response.data.book.currentPage,
        progress: response.data.book.progress,
        status: response.data.book.status,
      }

      // If completed, remove from reading list
      if (response.data.book.status === 'COMPLETED') {
        state.books.splice(bookIndex, 1)
        state.stats.reading--
        state.stats.completed++
      }

      renderReadingList()
      renderStats()
    }
  } catch (error) {
    console.error('Update progress error:', error)
  }
}

// Render stats
function renderStats() {
  if (!state.stats) return

  elements.statTotal.textContent = state.stats.total || 0
  elements.statReading.textContent = state.stats.reading || 0
  elements.statCompleted.textContent = state.stats.completed || 0
}

// Check current page for book
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url) return

    const supportedSites = [
      'kitapyurdu.com',
      'idefix.com',
      'amazon.com.tr',
      'goodreads.com',
      'dr.com.tr',
      'bkmkitap.com'
    ]

    const isBookSite = supportedSites.some(site => tab.url.includes(site))
    if (!isBookSite) return

    // Request book data from content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_BOOK_DATA' }, (response) => {
      if (chrome.runtime.lastError || !response) return

      if (response.book) {
        state.pageBook = response.book
        state.pageBook.url = tab.url
        showPageBook()
      }
    })
  } catch (error) {
    console.error('Check current page error:', error)
  }
}

// Show page book
function showPageBook() {
  if (!state.pageBook) return

  elements.pageBookSection.style.display = 'block'
  elements.pageBookCover.src = state.pageBook.coverUrl || ''
  elements.pageBookTitle.textContent = state.pageBook.title || 'Bilinmeyen Kitap'
  elements.pageBookAuthor.textContent = state.pageBook.author || ''
  elements.pageBookMessage.textContent = ''
  elements.pageBookMessage.className = 'message-text'
}

// Add page book
async function addPageBook() {
  if (!state.pageBook || !state.token) return

  setButtonLoading(elements.addPageBookBtn, true)
  elements.pageBookMessage.textContent = ''

  try {
    // First try to scrape via API (more reliable)
    let bookData = state.pageBook

    if (state.pageBook.url) {
      try {
        const scrapeResponse = await api('/scrape', {
          method: 'POST',
          body: JSON.stringify({ url: state.pageBook.url }),
        })
        bookData = { ...state.pageBook, ...scrapeResponse.data }
      } catch {
        // Use content script data if API scrape fails
      }
    }

    const response = await api('/books', {
      method: 'POST',
      body: JSON.stringify({
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        pageCount: bookData.pageCount,
        isbn: bookData.isbn,
        publisher: bookData.publisher,
        source: 'extension',
      }),
    })

    elements.pageBookMessage.textContent = response.data.message || 'Kitap eklendi!'
    elements.pageBookMessage.className = 'message-text success'

    // Refresh stats
    loadData()
  } catch (error) {
    elements.pageBookMessage.textContent = error.message || 'Kitap eklenemedi'
    elements.pageBookMessage.className = 'message-text error'
  } finally {
    setButtonLoading(elements.addPageBookBtn, false)
  }
}

// Utility functions
function setButtonLoading(button, loading) {
  const textEl = button.querySelector('.btn-text')
  const loaderEl = button.querySelector('.btn-loader')

  if (loading) {
    button.disabled = true
    if (textEl) textEl.style.display = 'none'
    if (loaderEl) loaderEl.style.display = 'block'
  } else {
    button.disabled = false
    if (textEl) textEl.style.display = 'inline'
    if (loaderEl) loaderEl.style.display = 'none'
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init)
