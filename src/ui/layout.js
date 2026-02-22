import { h } from '@/ui/webjsx.js'
import { getNavItems, getAdminItems, isPartner, isClerk } from '@/ui/permissions-ui.js'
import { TOAST_SCRIPT } from '@/ui/render-helpers.js'
import { aria, role, skipLink, liveRegion } from '@/lib/accessibility'

export function generateHtml(title, bodyContent, scripts = [], pathname = '/') {
  const scriptTags = scripts.map(s =>
    typeof s === 'string' ? `<script type="module">${s}</script>` : `<script type="module" src="${s.src}"></script>`
  ).join('\n')

  const swRegistration = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }`

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preload" href="/ui/client.js" as="script">
  <link rel="preload" href="/ui/styles.css" as="style">
  <link rel="preload" href="/lib/webjsx/runtime.js" as="script">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/npm/rippleui@1.12.1/dist/css/styles.css" rel="stylesheet"/>
  <link href="/ui/styles.css" rel="stylesheet"/>
  <style>
    .skip-link{position:absolute;left:-9999px;z-index:999;padding:0.5rem 1rem;background:#000;color:#fff;text-decoration:none}
    .skip-link:focus{left:0;top:0}
    *:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;border-radius:2px}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
  </style>
</head>
<body>
  ${skipLink('#main-content', 'Skip to main content')}
  ${skipLink('#main-nav', 'Skip to navigation')}
  ${liveRegion('announcements', 'polite')}
  ${liveRegion('alerts', 'assertive')}
  <div id="app">${bodyContent}</div>
  <script type="importmap">
  { "imports": { "webjsx": "/lib/webjsx/index.js", "webjsx/jsx-runtime": "/lib/webjsx/jsx-runtime.js" } }
  </script>
  <script type="module" src="/ui/client.js"></script>
  ${scriptTags}
  <script>${swRegistration}</script>
</body>
</html>`
}

export function breadcrumb(items) {
  if (!items?.length) return ''
  return `<nav ${aria.label('Breadcrumb')} class="breadcrumb">${items.map((item, i) =>
    i === items.length - 1
      ? `<span ${aria.current('page')}>${item.label}</span>`
      : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator" aria-hidden="true">/</span>`
  ).join('')}</nav>`
}

export function nav(user) {
  // Gear icon SVG for MY FRIDAY logo
  const gearSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>`

  // Build right-side nav links with Friday's pipe-separated format
  const logoutLink = `<a href="/api/auth/logout" style="color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none;cursor:pointer">LOGOUT</a>`

  const clientsLink = !isClerk(user) ? `<span style="color:#0d4d6d">|</span><a href="/client" style="color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none">CLIENTS</a>` : ''

  const settingsLink = isPartner(user) ? `<span style="color:#0d4d6d">|</span><a href="/admin/settings" style="color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none">SETTINGS</a>` : ''

  const reviewLink = isClerk(user) || !isClerk(user) ? `<span style="color:#0d4d6d">|</span><a href="/review" style="color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none">MY REVIEW</a>` : ''

  const navLinksHtml = `${logoutLink}${clientsLink}${settingsLink}${reviewLink}`

  // Avatar with first letter
  const avatarInitial = user?.name?.charAt(0) || 'U'

  return `<nav id="main-nav" style="background:#04141f;height:50px;display:flex;align-items:center;padding:0 1rem" ${role.navigation} ${aria.label('Main navigation')}>
  <div style="display:flex;align-items:center;flex:1">
    <a href="/" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none" ${aria.label('Home')}>
      ${gearSvg}
      <span style="color:#f8f9fa;font-size:0.8rem;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;margin-left:0.25rem">MY FRIDAY</span>
    </a>
  </div>
  <div style="display:flex;align-items:center;gap:1rem;font-size:0.7rem">
    <div style="display:flex;align-items:center;gap:0.5rem">
      ${navLinksHtml}
    </div>
    <div style="display:flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border:2px solid #f8f9fa;border-radius:50%;background:#04141f;color:#f8f9fa;font-weight:600;cursor:pointer" id="user-avatar" onclick="toggleUserMenu(event)" title="${user?.name || 'User'}">
      ${avatarInitial}
    </div>
  </div>
  <div id="user-dropdown" style="position:absolute;top:50px;right:1rem;background:white;border:1px solid #e5e7eb;border-radius:0.375rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);min-width:200px;z-index:1000;display:none" ${role.menu}>
    <div style="padding:0.75rem;border-bottom:1px solid #e5e7eb;font-size:0.875rem">
      <div style="font-weight:600">${user?.email || ''}</div>
      <div style="color:#6b7280;font-size:0.75rem">${user?.role || ''}</div>
    </div>
    <a href="/api/auth/logout" style="display:block;padding:0.75rem;color:#374151;text-decoration:none;font-size:0.875rem">Logout</a>
  </div>
</nav>
<div id="idle-warning-dialog" class="confirm-overlay" style="display:none" ${role.alertdialog} ${aria.labelledBy('idle-dialog-title')} ${aria.describedBy('idle-dialog-msg')} ${aria.hidden('true')}>
  <div class="confirm-dialog">
    <h2 id="idle-dialog-title" class="confirm-title">Session Expiring</h2>
    <div id="idle-dialog-msg" class="confirm-message">Your session will expire due to inactivity. You will be logged out in <span id="idle-countdown" ${aria.live('polite')}>5:00</span>.</div>
    <div class="confirm-actions"><button type="button" onclick="stayLoggedIn()" class="btn btn-primary" ${aria.label('Stay logged in and reset timeout')}>Stay Logged In</button></div>
  </div>
</div>
<script>
function toggleUserMenu(e){e.stopPropagation();var d=document.getElementById('user-dropdown');d.style.display=d.style.display==='none'?'block':'none'}
document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target)&&e.target.id!=='user-avatar'){d.style.display='none'}})
(function(){var WARN_MS=25*60*1000,LOGOUT_MS=30*60*1000,last=Date.now(),warnTimer=null,logoutTimer=null,countdownId=null;
function reset(){last=Date.now();hideWarning();clearTimers();schedule()}
function schedule(){warnTimer=setTimeout(showWarning,WARN_MS);logoutTimer=setTimeout(doLogout,LOGOUT_MS)}
function clearTimers(){if(warnTimer){clearTimeout(warnTimer);warnTimer=null}if(logoutTimer){clearTimeout(logoutTimer);logoutTimer=null}if(countdownId){clearInterval(countdownId);countdownId=null}}
function showWarning(){var dlg=document.getElementById('idle-warning-dialog');if(dlg)dlg.style.display='flex';var remaining=LOGOUT_MS-(Date.now()-last);countdownId=setInterval(function(){remaining-=1000;if(remaining<=0){clearInterval(countdownId);doLogout();return}var m=Math.floor(remaining/60000),s=Math.floor((remaining%60000)/1000);var el=document.getElementById('idle-countdown');if(el)el.textContent=m+':'+(s<10?'0':'')+s},1000)}
function hideWarning(){var dlg=document.getElementById('idle-warning-dialog');if(dlg)dlg.style.display='none'}
function doLogout(){clearTimers();window.location.href='/api/auth/logout'}
window.stayLoggedIn=function(){fetch('/api/auth/me',{credentials:'same-origin'}).catch(function(){});reset()};
['mousemove','keypress','click','scroll','touchstart'].forEach(function(evt){document.addEventListener(evt,function(){var now=Date.now();if(now-last>60000){last=now;clearTimers();schedule()}else{last=now}},true)});
schedule()})();
</script>`
}

export function page(user, title, bc, content, scripts = []) {
  const authData = user ? JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }) : 'null'
  const authScript = `window.__AUTH__=${authData};`
  const body = `<div class="min-h-screen">${nav(user)}<main id="main-content" ${role.main}><div class="p-6">${breadcrumb(bc)}${content}</div></main></div>`
  return generateHtml(title, body, [authScript, ...scripts])
}

export function statCards(cards) {
  return h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-8' },
    cards.map(c =>
      h('div', { className: `card bg-white shadow${c.border || ''}` },
        h('div', { className: 'card-body' },
          h('h3', { className: 'text-gray-500 text-sm' }, c.label),
          h('p', { className: `text-2xl font-bold${c.textClass || ''}` }, c.value),
          c.sub ? h('p', { className: 'text-xs text-gray-500 mt-2' }, c.sub) : ''
        )
      )
    )
  )
}

export function confirmDialog(entityName) {
  return `<div id="confirm-dialog" class="confirm-overlay" style="display:none" ${role.alertdialog} ${aria.labelledBy('confirm-title')} ${aria.describedBy('confirm-msg')} ${aria.hidden('true')}>
    <div class="confirm-dialog"><h2 id="confirm-title" class="confirm-title">Confirm Delete</h2>
    <div id="confirm-msg" class="confirm-message">Are you sure you want to delete this item? This action cannot be undone.</div>
    <div class="confirm-actions"><button type="button" onclick="cancelDelete()" class="btn btn-ghost" ${aria.label('Cancel deletion')}>Cancel</button>
    <button type="button" id="confirm-delete-btn" onclick="executeDelete()" class="btn btn-error" ${aria.label('Confirm deletion')}>Delete</button></div></div></div>`
}

export function dataTable(headers, rows, emptyMsg) {
  return `<div class="card bg-white shadow" style="overflow-x:auto" ${role.region} ${aria.label('Data table')}><table class="table table-zebra w-full"><thead><tr>${headers}</tr></thead><tbody id="table-body">${rows || `<tr><td colspan="100" class="text-center py-8 text-gray-500">${emptyMsg}</td></tr>`}</tbody></table></div>`
}
