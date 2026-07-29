// ============================================================
//  JMR — Toast Notifications
// ============================================================

function ensureContainer() {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

export function toast(message, type = 'info', duration = 3500) {
  const container = ensureContainer()

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ'
  }

  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `<span style="font-weight:700;color:var(--${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'})">${icons[type]}</span><span>${message}</span>`

  container.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(20px)'
    el.style.transition = 'all 0.25s ease'
    setTimeout(() => el.remove(), 260)
  }, duration)
}

export const toastSuccess = (msg) => toast(msg, 'success')
export const toastError   = (msg) => toast(msg, 'error')
export const toastWarning = (msg) => toast(msg, 'warning')
export const toastInfo    = (msg) => toast(msg, 'info')
