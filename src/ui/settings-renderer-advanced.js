import { TOAST_SCRIPT, settingsPage, settingsBack, inlineTable } from '@/ui/settings-renderer.js';

const P = 'padding:10px 12px', TD = `style="${P};font-size:0.82rem"`, editBtn = (href) => `<a href="${href}" onclick="event.stopPropagation()" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:0.75rem;font-weight:600">Edit</a>`;
const trClick = (url) => `style="cursor:pointer" onclick="window.location='${url}'" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''"`;
const hdr = (title, addHref, addLabel) => `${settingsBack()}<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h1 style="font-size:1.4rem;font-weight:700;margin:0">${title}</h1><a href="${addHref}" style="background:#04141f;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">${addLabel}</a></div>`;
const bc = (label) => [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label }];

export function renderSettingsTemplates(user, templates = []) {
  const rows = templates.map(t => `<tr ${trClick('/review_template/'+t.id)}><td ${TD}>${t.name||'-'}</td><td style="${P}"><span style="background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600">${t.type||'standard'}</span></td><td style="${P}">${t.is_active?'<span style="color:#22c55e;font-weight:600;font-size:0.82rem">Active</span>':'<span style="color:#9ca3af;font-size:0.82rem">Inactive</span>'}</td><td style="${P}">${editBtn('/review_template/'+t.id+'/edit')}</td></tr>`).join('');
  return settingsPage(user, 'Templates - Settings', bc('Templates'), hdr('Templates', '/review_template/new', 'Add Template') + inlineTable(['Name', 'Type', 'Status', 'Actions'], rows, 'No templates found'));
}

export function renderSettingsChecklists(user, checklists = []) {
  const rows = checklists.map(c => `<tr ${trClick('/checklist/'+c.id)}><td ${TD}>${c.name||'-'}</td><td ${TD}>${c.type||'-'}</td><td style="${P};font-size:0.82rem;color:#888">${c.review_id||'-'}</td><td style="${P}">${editBtn('/checklist/'+c.id+'/edit')}</td></tr>`).join('');
  return settingsPage(user, 'Checklists - Settings', bc('Checklists'), hdr('Checklists', '/checklist/new', 'Add Checklist') + inlineTable(['Name', 'Type', 'Review', 'Actions'], rows, 'No checklists found'));
}

const inp = (type, id, extra='') => `<input type="${type}" id="${id}" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem${extra}"/>`;
const lbl = (text) => `<label style="font-size:0.75rem;font-weight:600;color:#555;display:block;margin-bottom:4px">${text}</label>`;

export function renderSettingsRecreation(user, logs = [], users = []) {
  const userOpts = users.map(u => `<option value="${u.id}">${u.name||u.email||u.id}</option>`).join('');
  const rows = logs.map(l => { const ts=l.timestamp||l.created_at; const date=ts?(typeof ts==='number'&&ts>1e9?new Date(ts*1000).toLocaleString():new Date(ts).toLocaleString()):'-'; return `<tr><td style="${P};font-size:0.78rem;color:#555">${date}</td><td ${TD}>${l.user_name||l.user_id||'-'}</td><td style="${P}"><span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600">${l.action||'-'}</span></td><td ${TD}>${l.entity_type||'-'}</td><td style="${P};font-size:0.75rem;color:#888">${l.entity_id||'-'}</td><td style="${P};font-size:0.75rem;color:#888">${l.reason||'-'}</td></tr>`; }).join('');
  const filters = `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end"><div>${lbl('Start Date')}${inp('date','filter-start')}</div><div>${lbl('End Date')}${inp('date','filter-end')}</div><div>${lbl('User')}<select id="filter-user" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem"><option value="">All Users</option>${userOpts}</select></div><button onclick="applyFilters()" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Filter</button></div>`;
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">Recreation Logs</h1>${filters}${inlineTable(['Date','User','Action','Entity','Entity ID','Details'],rows,'No recreation logs found')}`;
  const script = `function applyFilters(){const s=document.getElementById('filter-start').value;const e=document.getElementById('filter-end').value;const u=document.getElementById('filter-user').value;const p=new URLSearchParams();if(s)p.set('start',s);if(e)p.set('end',e);if(u)p.set('user_id',u);window.location='/admin/settings/recreation'+(p.toString()?'?'+p:'')}`;
  return settingsPage(user, 'Recreation Logs - Settings', bc('Recreation Logs'), content, [script]);
}

const tog = tg => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0"><div><div style="font-size:0.85rem;font-weight:600">${tg.label}</div><div style="font-size:0.75rem;color:#888">${tg.desc}</div></div><input type="checkbox" name="${tg.id}" ${tg.checked ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#1565c0"/></div>`;
function toggleGroup(toggles) { return toggles.map(tog).join(''); }

export function renderSettingsNotifications(user, config = {}) {
  const t = config.thresholds || {};
  const rfi = t.rfi || {};
  const notif = t.notification || {};
  const toggles = [
    { id: 'rfi_reminders', label: 'RFI Reminders', desc: 'Send reminders for outstanding RFIs', checked: true },
    { id: 'deadline_alerts', label: 'Deadline Alerts', desc: 'Alert when deadlines are approaching', checked: true },
    { id: 'stage_transitions', label: 'Stage Transitions', desc: 'Notify on engagement stage changes', checked: true },
    { id: 'new_messages', label: 'New Messages', desc: 'Notify when new messages are received', checked: true },
    { id: 'weekly_reports', label: 'Weekly Reports', desc: 'Send weekly summary reports', checked: true },
  ];
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">Notifications</h1>
    <form id="notif-form">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:4px">Notification Toggles</div>${toggleGroup(toggles)}</div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:16px">Configuration</div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">RFI Notification Days</label><input type="text" name="notification_days" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${(rfi.notification_days || [7,3,1,0]).join(', ')}"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Escalation Delay (hours)</label><input type="number" name="escalation_delay_hours" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${rfi.escalation_delay_hours || 24}"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Batch Size</label><input type="number" name="batch_size" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${notif.batch_size || 50}"/></div>
      </div>
    </div>
    <div style="margin-top:20px"><button type="submit" style="background:#04141f;color:#fff;padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('notif-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#notif-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});try{const res=await fetch('/api/admin/settings/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(err){showToast('Error: '+err.message,'error')}})`;
  return settingsPage(user, 'Notifications - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Notifications' }], content, [script]);
}

const INTEGRATIONS = [
  { id: 'google_drive', icon: '&#128194;', name: 'Google Drive', desc: 'Document storage and collaboration' },
  { id: 'gmail', icon: '&#9993;', name: 'Gmail', desc: 'Email integration for notifications' },
  { id: 'firebase', icon: '&#128293;', name: 'Firebase (Legacy)', desc: 'Legacy data source for migration' },
];

export function renderSettingsIntegrations(user, integrations = {}) {
  const cards = INTEGRATIONS.map(integ => {
    const state = integrations[integ.id] || {};
    const connected = state.connected || false;
    return `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:1.4rem">${integ.icon}</div>
        <div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${integ.name}</div><div style="font-size:0.78rem;color:#888">${integ.desc}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span style="font-size:0.75rem;font-weight:600;color:${connected ? '#2e7d32' : '#888'}">${connected ? 'Connected' : 'Disconnected'}</span>
          <button onclick="toggleConfig('${integ.id}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Configure</button>
        </div>
      </div>
      <div id="config-${integ.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;display:none">
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:200px"><label style="font-size:0.75rem;font-weight:600;color:#555;display:block;margin-bottom:4px">API Key / Credentials</label><input type="password" id="key-${integ.id}" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" placeholder="Enter credentials"/></div>
          <div style="display:flex;gap:8px">
            <button onclick="saveIntegration('${integ.id}')" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save</button>
            <button onclick="testIntegration('${integ.id}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:0.82rem">Test</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">Integrations</h1>${cards}`;
  const script = `${TOAST_SCRIPT}
    function toggleConfig(id){const el=document.getElementById('config-'+id);el.style.display=el.style.display==='none'?'block':'none'}
    function saveIntegration(id){const key=document.getElementById('key-'+id).value;if(!key){showToast('Enter credentials','error');return}showToast('Integration saved','success');toggleConfig(id)}
    function testIntegration(id){showToast('Testing connection...','info');setTimeout(()=>showToast('Test complete','success'),1000)}`;
  return settingsPage(user, 'Integrations - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Integrations' }], content, [script]);
}

export function renderSettingsReviewSettings(user, config = {}) {
  const review = config.review || {};
  const toggles = [
    { id: 'auto_save', label: 'Auto-save', desc: 'Automatically save review changes', checked: review.auto_save !== false },
    { id: 'highlight_notifications', label: 'Highlight Notifications', desc: 'Notify on new highlights', checked: review.highlight_notifications !== false },
    { id: 'require_resolution', label: 'Require Resolution', desc: 'All highlights resolved before closing', checked: !!review.require_resolution },
    { id: 'allow_private', label: 'Allow Private Reviews', desc: 'Enable private review visibility', checked: review.allow_private !== false },
    { id: 'enable_sections', label: 'Enable Sections', desc: 'Allow reviews organized into sections', checked: review.enable_sections !== false },
    { id: 'enable_wip_value', label: 'Enable WIP Value', desc: 'Track work-in-progress value', checked: !!review.enable_wip_value },
  ];
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">Review Settings</h1>
    <form id="review-settings-form">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:4px">Review Options</div>${toggleGroup(toggles)}</div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:16px">Defaults</div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Default Status</label><select name="default_status" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%"><option value="active" ${review.default_status==='active'?'selected':''}>Active</option><option value="draft" ${review.default_status==='draft'?'selected':''}>Draft</option></select></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Max Highlights Per Review</label><input type="number" name="max_highlights" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${review.max_highlights || 500}" min="1"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Default Currency</label><select name="default_currency" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%"><option value="ZAR" ${review.default_currency==='ZAR'||!review.default_currency?'selected':''}>ZAR</option><option value="USD" ${review.default_currency==='USD'?'selected':''}>USD</option><option value="EUR" ${review.default_currency==='EUR'?'selected':''}>EUR</option><option value="GBP" ${review.default_currency==='GBP'?'selected':''}>GBP</option></select></div>
      </div>
    </div>
    <div style="margin-top:20px"><button type="submit" style="background:#04141f;color:#fff;padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save Review Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('review-settings-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#review-settings-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});document.querySelectorAll('#review-settings-form input[type=number]').forEach(n=>{if(data[n.name])data[n.name]=Number(data[n.name])});try{const res=await fetch('/api/admin/settings/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(e){showToast('Error: '+e.message,'error')}})`;
  return settingsPage(user, 'Review Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Review Settings' }], content, [script]);
}

export function renderSettingsFileReview(user, config = {}) {
  const fr = config.fileReview || {};
  const toggles = [
    { id: 'auto_pdf_cache', label: 'Auto-cache PDFs', desc: 'Cache PDF files for faster loading', checked: fr.auto_pdf_cache !== false },
    { id: 'allow_annotations', label: 'Allow Annotations', desc: 'Enable PDF annotation tools', checked: fr.allow_annotations !== false },
    { id: 'mobile_resize', label: 'Mobile Resize', desc: 'Enable mobile-friendly resizable highlights', checked: fr.mobile_resize !== false },
    { id: 'coordinate_snap', label: 'Coordinate Snap', desc: 'Snap highlight coordinates to text boundaries', checked: !!fr.coordinate_snap },
  ];
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">File Review Settings</h1>
    <form id="file-review-settings-form">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:4px">File Review Options</div>${toggleGroup(toggles)}</div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;margin-bottom:16px">File Limits</div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Max File Size (MB)</label><input type="number" name="max_file_size_mb" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${fr.max_file_size_mb || 50}" min="1"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Max Files Per Review</label><input type="number" name="max_files_per_review" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${fr.max_files_per_review || 20}" min="1"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Allowed File Types</label><input type="text" name="allowed_types" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${fr.allowed_types || 'pdf,doc,docx,xls,xlsx,png,jpg'}"/></div>
      </div>
    </div>
    <div style="margin-top:20px"><button type="submit" style="background:#04141f;color:#fff;padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save File Review Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('file-review-settings-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#file-review-settings-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});document.querySelectorAll('#file-review-settings-form input[type=number]').forEach(n=>{if(data[n.name])data[n.name]=Number(data[n.name])});try{const res=await fetch('/api/admin/settings/file-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(e){showToast('Error: '+e.message,'error')}})`;
  return settingsPage(user, 'File Review Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'File Review Settings' }], content, [script]);
}

export function renderSettingsTemplateManage(user, template = {}, sections = []) {
  const sectionRows = sections.map((s, i) => `<tr data-id="${s.id}">
    <td style="padding:10px 12px"><span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:${s.color || '#B0B0B0'}"></span></td>
    <td style="padding:10px 12px;font-size:0.82rem">${s.name || '-'}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#888">${s.order ?? i}</td>
    <td style="padding:10px 12px;display:flex;gap:6px">
      <button onclick="editTplSection('${s.id}','${(s.name || '').replace(/'/g, "\\'")}','${s.color || '#B0B0B0'}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Edit</button>
      <button onclick="deleteTplSection('${s.id}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Delete</button>
    </td></tr>`).join('');
  const content = `${settingsBack()}<div style="margin-bottom:20px"><h1 style="font-size:1.4rem;font-weight:700;margin:0">${template.name || 'Template'}</h1><p style="color:#888;font-size:0.82rem;margin:4px 0 0">Manage template sections and configuration</p></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <div style="font-weight:700;margin-bottom:16px">Template Info</div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Name</label><input type="text" id="tpl-name" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%" value="${template.name || ''}"/></div>
        <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Type</label><select id="tpl-type" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:100%"><option value="standard" ${template.type==='standard'?'selected':''}>Standard</option><option value="checklist" ${template.type==='checklist'?'selected':''}>Checklist</option><option value="audit" ${template.type==='audit'?'selected':''}>Audit</option></select></div>
        <div style="margin-bottom:12px"><label style="display:flex;align-items:center;gap:8px;font-size:0.82rem;cursor:pointer"><input type="checkbox" id="tpl-active" ${template.is_active?'checked':''}/><span>Active</span></label></div>
        <button onclick="saveTplInfo()" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save Template Info</button>
      </div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-weight:700">Sections</div>
          <button onclick="addTplSection()" style="background:#04141f;color:#fff;padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:0.78rem;font-weight:600">Add Section</button>
        </div>
        ${inlineTable(['Color', 'Name', 'Order', 'Actions'], sectionRows, 'No sections defined')}
      </div>
    </div>
    <div id="tpl-section-form" style="display:none;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;margin-top:16px">
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Name</label><input type="text" id="tpl-sec-name" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem" placeholder="Section name"/></div>
        <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Color</label><input type="color" id="tpl-sec-color" value="#B0B0B0" style="height:34px;border:1px solid #ddd;border-radius:4px"/></div>
        <div style="display:flex;gap:8px"><button onclick="saveTplSection()" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save</button><button onclick="cancelTplSection()" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:0.82rem">Cancel</button></div>
      </div>
      <input type="hidden" id="tpl-sec-id" value=""/>
    </div>`;
  const script = `${TOAST_SCRIPT}
  var tplId='${template.id || ''}';
  window.saveTplInfo=async function(){var body={name:document.getElementById('tpl-name').value,type:document.getElementById('tpl-type').value,is_active:document.getElementById('tpl-active').checked?1:0};try{var res=await fetch('/api/review_template/'+tplId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(res.ok){showToast('Template updated','success')}else{showToast('Update failed','error')}}catch(e){showToast('Error','error')}};
  window.addTplSection=function(){document.getElementById('tpl-section-form').style.display='block';document.getElementById('tpl-sec-id').value='';document.getElementById('tpl-sec-name').value=''};
  window.editTplSection=function(id,name,color){document.getElementById('tpl-section-form').style.display='block';document.getElementById('tpl-sec-id').value=id;document.getElementById('tpl-sec-name').value=name;document.getElementById('tpl-sec-color').value=color};
  window.cancelTplSection=function(){document.getElementById('tpl-section-form').style.display='none'};
  window.saveTplSection=async function(){var id=document.getElementById('tpl-sec-id').value;var body={name:document.getElementById('tpl-sec-name').value,color:document.getElementById('tpl-sec-color').value,review_template_id:tplId};if(!body.name){showToast('Name required','error');return}var url=id?'/api/review_template_section/'+id:'/api/review_template_section';var method=id?'PUT':'POST';try{var res=await fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(res.ok){showToast(id?'Updated':'Created','success');setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  window.deleteTplSection=async function(id){if(!confirm('Delete this section?'))return;try{var res=await fetch('/api/review_template_section/'+id,{method:'DELETE'});if(res.ok){showToast('Deleted','success');setTimeout(function(){location.reload()},500)}else{showToast('Delete failed','error')}}catch(e){showToast('Error','error')}};`;
  return settingsPage(user, `Manage Template - ${template.name || 'Template'}`, [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/templates', label: 'Templates' }, { label: template.name || 'Template' }], content, [script]);
}
