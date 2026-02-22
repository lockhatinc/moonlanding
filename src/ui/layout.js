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
  <meta name="theme-color" content="#04141f">
  <title>${title}</title>
  <link rel="preload" href="/ui/client.js" as="script" crossorigin>
  <link rel="preload" href="/ui/styles.css" as="style">
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

export function nav(user, pathname = '') {
  const gearSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>`
  const hamburgerSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`

  const isActive = (href) => pathname && (pathname === href || (href !== '/' && pathname.startsWith(href)))
  const linkStyle = (href) => isActive(href)
    ? 'color:#fff;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none;border-bottom:2px solid #fff;padding-bottom:2px'
    : 'color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none'

  const sep = `<span style="color:#0d4d6d" aria-hidden="true">|</span>`
  const logoutLink = `<a href="/api/auth/logout" style="${linkStyle('')}color:#ced4da;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;text-decoration:none">LOGOUT</a>`
  const engLink = !isClerk(user) ? `${sep}<a href="/engagements" style="${linkStyle('/engagements')}">ENGAGEMENTS</a>` : ''
  const clientLink = !isClerk(user) ? `${sep}<a href="/client" style="${linkStyle('/client')}">CLIENTS</a>` : ''
  const settingsLink = isPartner(user) ? `${sep}<a href="/admin/settings" style="${linkStyle('/admin/settings')}">SETTINGS</a>` : ''
  const reviewLink = `${sep}<a href="/review" style="${linkStyle('/review')}">MY REVIEW</a>`

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'
  const avatarColors = ['#1565c0','#2e7d32','#6a1b9a','#c62828','#e65100','#00695c']
  const avatarBg = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length]

  return `<nav id="main-nav" style="background:#04141f;height:50px;display:flex;align-items:center;padding:0 1rem;position:relative;z-index:100" ${role.navigation} ${aria.label('Main navigation')}>
  <div style="display:flex;align-items:center;flex:1;gap:1rem">
    <a href="/" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none" ${aria.label('Home')}>
      ${gearSvg}
      <span style="color:#f8f9fa;font-size:0.8rem;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;margin-left:0.25rem">MOONLANDING</span>
    </a>
  </div>
  <div class="nav-links-desktop" style="display:flex;align-items:center;gap:0.5rem">
    ${logoutLink}${engLink}${clientLink}${settingsLink}${reviewLink}
  </div>
  <div style="display:flex;align-items:center;gap:0.75rem;margin-left:1rem">
    <div style="display:flex;align-items:center;justify-content:center;width:2.2rem;height:2.2rem;border-radius:50%;background:${avatarBg};color:#fff;font-weight:700;font-size:0.82rem;cursor:pointer;flex-shrink:0" id="user-avatar" onclick="toggleUserMenu(event)" title="${user?.name || 'User'}" aria-label="User menu" role="button" tabindex="0">
      ${avatarInitial}
    </div>
    <button class="nav-hamburger" onclick="toggleMobileNav()" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav-drawer" style="display:none;background:none;border:none;color:#ced4da;cursor:pointer;padding:4px;border-radius:4px">
      ${hamburgerSvg}
    </button>
  </div>
  <div id="user-dropdown" style="position:absolute;top:50px;right:1rem;background:white;border:1px solid #e5e7eb;border-radius:0.375rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:200px;z-index:1000;display:none" ${role.menu}>
    <div style="padding:0.75rem;border-bottom:1px solid #e5e7eb;font-size:0.875rem">
      <div style="font-weight:600;color:#111">${user?.name || ''}</div>
      <div style="color:#6b7280;font-size:0.75rem">${user?.email || ''}</div>
      <div style="color:#9ca3af;font-size:0.7rem;margin-top:2px;text-transform:capitalize">${user?.role || ''}</div>
    </div>
    <a href="/api/auth/logout" style="display:flex;align-items:center;gap:8px;padding:0.75rem;color:#374151;text-decoration:none;font-size:0.875rem" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Logout
    </a>
  </div>
</nav>
<div id="mobile-nav-drawer" style="display:none;position:fixed;inset:0;z-index:200" aria-hidden="true">
  <div onclick="closeMobileNav()" style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:260px;background:#04141f;padding:0;display:flex;flex-direction:column">
    <div style="padding:1rem;border-bottom:1px solid #0d4d6d;display:flex;align-items:center;justify-content:space-between">
      <span style="color:#f8f9fa;font-weight:700;letter-spacing:1px;font-size:0.85rem">MOONLANDING</span>
      <button onclick="closeMobileNav()" style="background:none;border:none;color:#ced4da;cursor:pointer;font-size:1.2rem;padding:4px" aria-label="Close menu">&times;</button>
    </div>
    <nav style="flex:1;padding:1rem 0;overflow-y:auto">
      <a href="/" style="display:block;padding:12px 20px;color:#ced4da;text-decoration:none;font-size:0.82rem;font-weight:600;text-transform:uppercase;letter-spacing:1px" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">Dashboard</a>
      ${!isClerk(user) ? `<a href="/engagements" style="display:block;padding:12px 20px;color:#ced4da;text-decoration:none;font-size:0.82rem;font-weight:600;text-transform:uppercase;letter-spacing:1px" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">Engagements</a>` : ''}
      ${!isClerk(user) ? `<a href="/client" style="display:block;padding:12px 20px;color:#ced4da;text-decoration:none;font-size:0.82rem;font-weight:600;text-transform:uppercase;letter-spacing:1px" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">Clients</a>` : ''}
      <a href="/review" style="display:block;padding:12px 20px;color:#ced4da;text-decoration:none;font-size:0.82rem;font-weight:600;text-transform:uppercase;letter-spacing:1px" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">My Review</a>
      ${isPartner(user) ? `<a href="/admin/settings" style="display:block;padding:12px 20px;color:#ced4da;text-decoration:none;font-size:0.82rem;font-weight:600;text-transform:uppercase;letter-spacing:1px" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">Settings</a>` : ''}
    </nav>
    <div style="padding:1rem;border-top:1px solid #0d4d6d">
      <div style="color:#888;font-size:0.75rem;margin-bottom:4px">${user?.name || ''}</div>
      <div style="color:#666;font-size:0.7rem;margin-bottom:12px">${user?.email || ''}</div>
      <a href="/api/auth/logout" style="display:block;padding:8px 12px;background:rgba(255,255,255,0.08);color:#ced4da;text-decoration:none;font-size:0.78rem;font-weight:600;border-radius:4px;text-align:center;text-transform:uppercase;letter-spacing:1px">Logout</a>
    </div>
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
window.loadingBtn=function(btn,loading,label){if(!btn)return;btn.disabled=loading;btn.style.opacity=loading?'0.7':'1';if(loading){btn._orig=btn.innerHTML;btn.innerHTML='<span class="btn-spinner"></span>'+(label||'Loading...');}else{btn.innerHTML=btn._orig||label||btn.innerHTML;btn.disabled=false}}
window.showToast=window.showToast||function(m,t){var c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c)}var d=document.createElement('div');d.className='toast toast-'+(t||'info');d.textContent=m;c.appendChild(d);setTimeout(function(){d.style.opacity='0';setTimeout(function(){d.remove()},300)},3000)}
function toggleUserMenu(e){e.stopPropagation();var d=document.getElementById('user-dropdown');d.style.display=d.style.display==='none'?'block':'none'}
document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target)&&e.target.id!=='user-avatar'){d.style.display='none'}})
function toggleMobileNav(){var btn=document.querySelector('.nav-hamburger');var open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));var d=document.getElementById('mobile-nav-drawer');d.style.display=open?'none':'block';d.setAttribute('aria-hidden',String(open))}
function closeMobileNav(){var btn=document.querySelector('.nav-hamburger');if(btn)btn.setAttribute('aria-expanded','false');var d=document.getElementById('mobile-nav-drawer');if(d){d.style.display='none';d.setAttribute('aria-hidden','true')}}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMobileNav()})
;(function(){var WARN_MS=25*60*1000,LOGOUT_MS=30*60*1000,last=Date.now(),warnTimer=null,logoutTimer=null,countdownId=null;
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
