// AsyaKitap Chrome Extension - Background Service Worker

const DEFAULT_API_URL = 'https://asyakitap.vercel.app'

// Get API URL from storage
async function getApiUrl() {
  const result = await chrome.storage.local.get('apiUrl')
  return result.apiUrl || DEFAULT_API_URL
}

// Get auth token from storage
async function getToken() {
  const result = await chrome.storage.local.get('token')
  return result.token
}

// API call helper
async function api(endpoint, options = {}) {
  const apiUrl = await getApiUrl()
  const token = await getToken()

  const url = `${apiUrl}/api/v1${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response.json()
}

// Update badge with reading count
async function updateBadge() {
  try {
    const token = await getToken()
    if (!token) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    const response = await api('/books?status=READING&limit=1')
    if (response.status === 'success' && response.data.stats) {
      const readingCount = response.data.stats.reading || 0
      chrome.action.setBadgeText({
        text: readingCount > 0 ? readingCount.toString() : ''
      })
      chrome.action.setBadgeBackgroundColor({ color: '#F94361' })
    }
  } catch (error) {
    console.error('Update badge error:', error)
  }
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes.token || changes.user)) {
    updateBadge()
  }
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'API_CALL':
      api(request.endpoint, request.options)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Will respond asynchronously

    case 'UPDATE_BADGE':
      updateBadge()
      sendResponse({ success: true })
      break

    case 'GET_STATS':
      api('/books?limit=1')
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true
  }
})

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('AsyaKitap extension installed')
  // Create alarm for periodic badge update
  chrome.alarms.create('updateBadge', { periodInMinutes: 30 })
  updateBadge()
})

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge()
  }
})

// Initial badge update
updateBadge()
