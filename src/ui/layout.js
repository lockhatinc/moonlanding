import { h } from '@/ui/webjsx.js'
import { getNavItems, getAdminItems } from '@/ui/permissions-ui.js'
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
  const navItemsList = getNavItems(user)
  const adminItemsList = getAdminItems(user)
  const navLinks = navItemsList.map(n => h('a', { href: n.href, className: 'btn btn-ghost btn-sm' }, n.label)).join('')
  const adminLinks = adminItemsList.map(n => h('a', { href: n.href, className: 'btn btn-ghost btn-sm' }, n.label)).join('')
  const mobileItems = [...navItemsList, ...adminItemsList].map(n => h('a', { href: n.href, className: 'mobile-nav-item' }, n.label)).join('')
  return `<nav id="main-nav" class="navbar bg-white shadow-sm px-4" ${role.navigation} ${aria.label('Main navigation')}>
  <div class="navbar-start">
    <button id="mobile-menu-btn" type="button" class="btn btn-ghost btn-sm mobile-menu-toggle" ${aria.label('Open mobile menu')} ${aria.expanded('false')} ${aria.controls('mobile-nav-drawer')} onclick="toggleMobileMenu()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <a href="/" class="font-bold text-lg" ${aria.label('Home')}>Platform</a>
    <div class="hidden md:flex gap-1 ml-6">${navLinks}${adminLinks}</div>
  </div>
  <div class="navbar-end">
    <div id="user-dropdown" class="dropdown dropdown-end">
      <button type="button" onclick="toggleUserMenu(event)" class="btn btn-ghost btn-circle avatar placeholder" ${aria.label('User menu for ' + (user?.name || 'user'))} ${aria.haspopup('menu')} ${aria.expanded('false')} style="cursor:pointer">
        <div class="bg-primary text-white rounded-full w-10 flex items-center justify-content-center" style="display:flex;align-items:center;justify-content:center;height:2.5rem">
          <span aria-hidden="true">${user?.name?.charAt(0) || 'U'}</span>
        </div>
      </button>
      <ul class="dropdown-menu mt-2 w-52" ${role.menu}>
        <li class="dropdown-header" ${role.presentation}>${user?.email || ''}<br/><small class="text-gray-500">${user?.role || ''}</small></li>
        <li ${role.menuitem}><a href="/api/auth/logout">Logout</a></li>
      </ul>
    </div>
  </div>
</nav>
<div id="mobile-nav-overlay" class="mobile-nav-overlay" onclick="closeMobileMenu()" ${aria.hidden('true')}></div>
<div id="mobile-nav-drawer" class="mobile-nav-drawer" ${role.dialog} ${aria.label('Mobile navigation')} ${aria.hidden('true')}>
  <div class="mobile-nav-header">
    <span class="font-bold text-lg">Platform</span>
    <button type="button" class="btn btn-ghost btn-sm" ${aria.label('Close mobile menu')} onclick="closeMobileMenu()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="mobile-nav-items" ${role.navigation}>${mobileItems}</div>
  <div class="mobile-nav-footer">
    <div class="text-sm text-gray-500">${user?.email || ''}</div>
    <a href="/api/auth/logout" class="btn btn-ghost btn-sm w-full mt-2">Logout</a>
  </div>
</div>
<div id="idle-warning-dialog" class="confirm-overlay" style="display:none" ${role.alertdialog} ${aria.labelledBy('idle-dialog-title')} ${aria.describedBy('idle-dialog-msg')} ${aria.hidden('true')}>
  <div class="confirm-dialog">
    <h2 id="idle-dialog-title" class="confirm-title">Session Expiring</h2>
    <div id="idle-dialog-msg" class="confirm-message">Your session will expire due to inactivity. You will be logged out in <span id="idle-countdown" ${aria.live('polite')}>5:00</span>.</div>
    <div class="confirm-actions"><button type="button" onclick="stayLoggedIn()" class="btn btn-primary" ${aria.label('Stay logged in and reset timeout')}>Stay Logged In</button></div>
  </div>
</div>
<script>
function toggleUserMenu(e){e.stopPropagation();var d=document.getElementById('user-dropdown');var isOpen=d.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',isOpen)}
document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target)){d.classList.remove('open');var btn=d.querySelector('button');if(btn)btn.setAttribute('aria-expanded','false')}});
function toggleMobileMenu(){var drawer=document.getElementById('mobile-nav-drawer');var overlay=document.getElementById('mobile-nav-overlay');var btn=document.getElementById('mobile-menu-btn');var isOpen=drawer.classList.toggle('open');overlay.classList.toggle('open');btn.setAttribute('aria-expanded',isOpen);drawer.setAttribute('aria-hidden',!isOpen);overlay.setAttribute('aria-hidden',!isOpen);if(isOpen){var firstLink=drawer.querySelector('a');if(firstLink)firstLink.focus()}}
function closeMobileMenu(){var drawer=document.getElementById('mobile-nav-drawer');var overlay=document.getElementById('mobile-nav-overlay');var btn=document.getElementById('mobile-menu-btn');drawer.classList.remove('open');overlay.classList.remove('open');btn.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');overlay.setAttribute('aria-hidden','true');btn.focus()}
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
