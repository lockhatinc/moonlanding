import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';

const STAGE_CONFIG = [
  { key: 'info_gathering',  label: 'Info Gathering',  badge: 'stage-pill stage-info_gathering',  color: '#e53935' },
  { key: 'commencement',    label: 'Commencement',    badge: 'stage-pill stage-commencement',     color: '#e65100' },
  { key: 'team_execution',  label: 'Team Execution',  badge: 'stage-pill stage-team_execution',   color: '#1565c0' },
  { key: 'partner_review',  label: 'Partner Review',  badge: 'stage-pill stage-partner_review',   color: '#283593' },
  { key: 'finalization',    label: 'Finalization',    badge: 'stage-pill stage-finalization',     color: '#2e7d32' },
  { key: 'closeout',        label: 'Close Out',       badge: 'stage-pill stage-closeout',         color: '#33691e' },
];

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const cfg = STAGE_CONFIG.find(s => s.key === e.stage);
    const stageLbl = cfg ? `<span class="badge ${cfg.badge} text-xs">${cfg.label}</span>` : '';
    const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
    return `<div onclick="location.href='/engagement/${esc(e.id)}'" class="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
      <div class="card-body p-4">
        <div class="font-semibold text-sm mb-1">${esc(e.name || 'Untitled')}</div>
        <div class="text-xs text-base-content/60 mb-2">${esc(e.client_name || '')}</div>
        ${stageLbl}
        <progress class="progress progress-primary w-full mt-3" value="${pct}" max="100"></progress>
        <div class="flex justify-between mt-1 text-xs text-base-content/40"><span>${e.year || ''}</span><span>${pct}%</span></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${cards || '<div class="col-span-full text-center py-12 text-base-content/40">No engagements found</div>'}</div>`;
}

function stagePipelineHtml(e) {
  const currentIdx = STAGE_CONFIG.findIndex(s => s.key === e.stage);
  return STAGE_CONFIG.map((s, i) => {
    const isCurrent = i === currentIdx;
    const isPast = i < currentIdx;
    const opacity = isPast ? '0.6' : isCurrent ? '1' : '0.2';
    return `<div onclick="openStageTransition('${esc(s.key)}')" style="flex:1;padding:8px 4px;text-align:center;background:${isCurrent || isPast ? s.color : '#e0e0e0'};color:${isCurrent || isPast ? '#fff' : '#999'};opacity:${opacity};font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;cursor:pointer;position:relative">
      ${s.label}${isCurrent ? `<div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid ${s.color}"></div>` : ''}
    </div>`;
  }).join('');
}

function stageTransitionDialog(engId, currentStage) {
  const opts = STAGE_CONFIG.map(s =>
    `<option value="${s.key}" ${s.key === currentStage ? 'selected' : ''}>${s.label}</option>`
  ).join('');
  return `<div id="stage-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('stage-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Move Engagement Stage</h3>
      <div class="form-group mb-3">
        <label class="label"><span class="label-text font-medium">New Stage</span></label>
        <select id="stage-select" class="select select-solid max-w-full">${opts}</select>
      </div>
      <div class="form-group mb-4">
        <label class="label"><span class="label-text font-medium">Reason (optional)</span></label>
        <textarea id="stage-note" rows="3" placeholder="Reason for stage change..." class="textarea textarea-solid max-w-full"></textarea>
      </div>
      <div class="modal-action mt-4">
        <button onclick="confirmStageTransition('${esc(engId)}')" class="btn btn-primary">Confirm</button>
        <button onclick="document.getElementById('stage-dialog').style.display='none'" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;
}

function chatPanel(engId) {
  return `<div id="tab-chat" class="eng-tab-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h2 class="card-title text-sm mb-4">Team Chat</h2>
        <div id="chat-msgs" class="min-h-48 max-h-96 overflow-y-auto border border-base-200 rounded-box p-3 mb-3 bg-base-50">
          <div class="text-center text-base-content/40 text-sm py-8">Loading messages...</div>
        </div>
        <div class="flex gap-2">
          <input id="chat-input" type="text" placeholder="Type a message..." class="input input-solid flex-1" onkeydown="if(event.key==='Enter')sendChatMsg('${esc(engId)}')"/>
          <button onclick="sendChatMsg('${esc(engId)}')" class="btn btn-primary">Send</button>
        </div>
      </div>
    </div>
  </div>`;
}

function checklistPanel(engId) {
  return `<div id="tab-checklist" class="eng-tab-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Checklists</h2>
          <a href="/review?engagement_id=${esc(engId)}" class="btn btn-ghost btn-sm">Manage in Review</a>
        </div>
        <div id="checklist-items">
          <div class="text-center text-base-content/40 text-sm py-8">Loading...</div>
        </div>
      </div>
    </div>
  </div>`;
}

function activityPanel(engId) {
  return `<div id="tab-activity" class="eng-tab-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h2 class="card-title text-sm mb-4">Activity Timeline</h2>
        <div id="activity-log" class="flex flex-col gap-3">
          <div class="text-center text-base-content/40 text-sm py-8">Loading activity...</div>
        </div>
      </div>
    </div>
  </div>`;
}

function filesPanel(engId) {
  return `<div id="tab-files" class="eng-tab-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Files</h2>
          <div class="flex gap-2">
            <label class="btn btn-ghost btn-sm">
              Upload <input type="file" multiple style="display:none" onchange="uploadEngFiles(event,'${esc(engId)}')"/>
            </label>
            <button onclick="downloadFilesZip('${esc(engId)}')" class="btn btn-primary btn-sm">Download ZIP</button>
          </div>
        </div>
        <div id="eng-files-list">
          <div class="text-center text-base-content/40 text-sm py-8">Loading files...</div>
        </div>
      </div>
    </div>
  </div>`;
}

export function renderEngagementDetail(user, engagement, client, rfis = []) {
  const e = engagement || {};
  const stageCfg = STAGE_CONFIG.find(s => s.key === e.stage);
  const stageLabel = stageCfg ? stageCfg.label : (e.stage || '-');
  const stageBadgeCls = stageCfg ? stageCfg.badge : 'badge-flat-secondary';
  const canTransition = isPartner(user) || isManager(user);

  function fmtDate(v) {
    if (!v) return '-';
    const n = typeof v === 'number' ? (v > 1e10 ? v : v * 1000) : new Date(v).getTime();
    return new Date(n).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtCurrency(v) {
    if (!v && v !== 0) return '-';
    return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const assignedUsersHtml = (e.assigned_users_resolved || []).length
    ? (e.assigned_users_resolved || []).map(u => `<span class="badge badge-flat-primary text-xs mr-1">${esc(u.name)}</span>`).join('')
    : '<span class="text-base-content/40 text-sm italic">Not assigned</span>';

  const infoItems = [
    ['Client', esc(client?.name || e.client_name || e.client_id_display || e.client_id || '-')],
    ['Type', esc(e.type || e.engagement_type || e.repeat_interval || '-')],
    ['Year', esc(e.year || '-')],
    ['Team', esc(e.team_name || e.team_id_display || e.team_id || '-')],
    ['Status', e.status ? `<span class="badge ${e.status==='active'?'badge-success badge-flat-success':'badge-warning badge-flat-warning'} text-xs">${e.status}</span>` : '-'],
    ['Fee', fmtCurrency(e.fee || e.fees)],
    ['Commenced', fmtDate(e.commencement_date)],
    ['Deadline', fmtDate(e.deadline_date || e.deadline)],
    ['Created', fmtDate(e.created_at)],
    ['Assigned', assignedUsersHtml],
  ];

  const infoGrid = `<div class="grid grid-cols-2 gap-3">` +
    infoItems.map(([label, val]) => `<div><div class="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">${label}</div><div class="text-sm text-base-content">${val}</div></div>`).join('') +
    `</div>`;

  const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
  const progressHtml = `<div class="mt-4">
    <div class="flex justify-between mb-1"><span class="text-sm font-semibold text-base-content/60">Overall Progress</span><span class="text-sm text-base-content/50">${pct}%</span></div>
    <progress class="progress progress-primary w-full" value="${pct}" max="100"></progress>
  </div>`;

  const rfiRows = rfis.map(r => {
    const rs = r.status || 'pending';
    const rc = rs==='active'?'badge-success badge-flat-success':rs==='closed'?'badge-flat-secondary':'badge-warning badge-flat-warning';
    return `<tr class="hover cursor-pointer" onclick="location.href='/rfi/${esc(r.id)}'"><td class="text-sm">${esc(r.name||r.title||'RFI')}</td><td><span class="badge ${rc} text-xs">${rs}</span></td><td class="text-sm">${r.deadline?new Date(r.deadline).toLocaleDateString():'-'}</td></tr>`;
  }).join('') || `<tr><td colspan="3" class="text-center py-6 text-base-content/40 text-sm">No RFIs</td></tr>`;

  const stageBtn = canTransition ? `<button onclick="openStageTransition('${esc(e.stage)}')" class="btn btn-ghost btn-sm">Move Stage</button>` : '';
  const editBtn = canEdit(user, 'engagement') ? `<a href="/engagement/${esc(e.id)}/edit" class="btn btn-primary btn-sm">Edit</a>` : '';
  const newRfiBtn = `<a href="/rfi/new?engagement_id=${esc(e.id)}" class="btn btn-primary btn-sm">+ RFI</a>`;

  const TABS = ['Details','RFIs','Chat','Checklist','Activity','Files'];
  const tabBar = `<div class="tab-bar">` +
    TABS.map((t,i) => `<button onclick="switchEngTab('${t.toLowerCase()}')" id="engtab-${t.toLowerCase()}" class="tab ${i===0?'active':''}">${t}</button>`).join('') +
    `</div>`;

  const detailsPanel = `<div id="tab-details" class="eng-tab-panel">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-sm mb-4">Engagement Details</h2>
          ${infoGrid}${progressHtml}
        </div>
      </div>
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title text-sm">RFIs (${rfis.length})</h2>
            ${newRfiBtn}
          </div>
          <div class="table-container">
            <table class="table table-hover"><thead><tr><th>Name</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${rfiRows}</tbody></table>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const rfisPanel = `<div id="tab-rfis" class="eng-tab-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">All RFIs</h2>${newRfiBtn}
        </div>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>Name</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${rfiRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const content = `
    <nav class="breadcrumbs text-sm mb-4">
      <ul><li><a href="/">Home</a></li><li><a href="/engagements">Engagements</a></li><li>${esc(e.name || 'Engagement')}</li></ul>
    </nav>
    <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-base-content mb-2">${esc(e.name || e.client_name || 'Engagement')}</h1>
        <span class="badge ${stageBadgeCls}">${stageLabel}</span>
      </div>
      <div class="flex gap-2">${stageBtn}${editBtn}</div>
    </div>
    <div class="card bg-base-100 shadow-md overflow-hidden mb-4">
      <div class="flex">${stagePipelineHtml(e)}</div>
    </div>
    ${tabBar}
    ${detailsPanel}
    ${rfisPanel}
    ${chatPanel(e.id)}
    ${checklistPanel(e.id)}
    ${activityPanel(e.id)}
    ${filesPanel(e.id)}
    ${stageTransitionDialog(e.id, e.stage)}
  `;

  const script = `
var activeEngTab='details';
function switchEngTab(tab){
  document.querySelectorAll('.eng-tab-panel').forEach(function(p){p.style.display='none'});
  var panel=document.getElementById('tab-'+tab);
  if(panel)panel.style.display='';
  document.querySelectorAll('[id^="engtab-"]').forEach(function(b){b.classList.remove('active')});
  var btn=document.getElementById('engtab-'+tab);
  if(btn)btn.classList.add('active');
  activeEngTab=tab;
  if(tab==='chat')loadChat();
  else if(tab==='checklist')loadChecklist();
  else if(tab==='activity')loadActivity();
  else if(tab==='files')loadFiles();
}
function openStageTransition(stage){document.getElementById('stage-dialog').style.display='flex';if(stage)document.getElementById('stage-select').value=stage}
async function confirmStageTransition(engId){
  var stage=document.getElementById('stage-select').value;
  var note=document.getElementById('stage-note').value;
  var btn=document.querySelector('#stage-dialog .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Moving...'}
  try{var r=await fetch('/api/friday/engagement/transition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engagementId:engId,toStage:stage,reason:note})});
  var d=await r.json();
  if(r.ok||d.success){document.getElementById('stage-dialog').style.display='none';showToast('Stage updated','success');setTimeout(function(){location.reload()},800)}else{showToast(d.error||d.message||'Transition failed','error');if(btn){btn.disabled=false;btn.textContent='Confirm'}}}
  catch(e){showToast('Error: '+e.message,'error');if(btn){btn.disabled=false;btn.textContent='Confirm'}}
}
var _chatRfiId=null;
async function loadChat(){
  var el=document.getElementById('chat-msgs');
  try{
    if(!_chatRfiId){var re=await fetch('/api/rfi?engagement_id=${esc(e.id)}&limit=1');var rd=await re.json();var rfis=rd.data?.items||rd.data||rd||[];_chatRfiId=rfis[0]?.id||null;}
    if(!_chatRfiId){el.innerHTML='<div class="text-center text-base-content/40 text-sm py-8">No RFIs yet. Create an RFI to enable team chat.</div>';return}
    var r=await fetch('/api/message?rfi_id='+_chatRfiId);var d=await r.json();var msgs=d.data||d||[];
    el.innerHTML=msgs.length?msgs.map(function(m){return'<div class="mb-3"><div class="text-xs text-base-content/40 mb-1">'+(m.created_by_display?.name||m.user_id||'User')+' &bull; '+(m.created_at?new Date(typeof m.created_at=\'number\'?m.created_at*1000:m.created_at).toLocaleString():\'\')+'</div><div class="bg-base-100 border border-base-200 rounded-box p-2 text-sm">'+(m.content||'')+'</div></div>'}).join(''):'<div class="text-center text-base-content/40 text-sm py-8">No messages yet</div>';
    el.scrollTop=el.scrollHeight}catch(err){el.innerHTML='<div class="text-base-content/40 text-center p-4">Could not load messages</div>'}
}
async function sendChatMsg(engId){
  var inp=document.getElementById('chat-input');var txt=inp.value.trim();if(!txt)return;
  if(!_chatRfiId){showToast('No RFI found for chat','error');return}
  var btn=inp.nextElementSibling;if(btn)btn.disabled=true;
  try{var r=await fetch('/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rfi_id:_chatRfiId,content:txt})});
  if(r.ok){inp.value='';loadChat();showToast('Sent','success')}else{var d=await r.json();showToast(d.message||'Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}
  finally{if(btn)btn.disabled=false}
}
async function loadChecklist(){
  var el=document.getElementById('checklist-items');
  try{
    var re=await fetch('/api/review?engagement_id=${esc(e.id)}&limit=1');var rd=await re.json();var reviews=rd.data?.items||rd.data||[];
    if(!reviews.length){el.innerHTML='<div class="text-center text-base-content/40 text-sm py-8">No reviews yet. <a href="/review/new" class="text-primary">Create a review</a> to add checklists.</div>';return}
    var reviewId=reviews[0].id;var r=await fetch('/api/checklist?review_id='+reviewId);var d=await r.json();var checklists=d.data||d||[];
    if(!checklists.length){el.innerHTML='<div class="text-center text-base-content/40 text-sm py-8">No checklists. <a href="/review/'+reviewId+'" class="text-primary">Open the review</a> to manage checklists.</div>';return}
    var items=[];
    for(var i=0;i<checklists.length;i++){var ci=checklists[i];if(ci.section_items){try{var arr=JSON.parse(ci.section_items);items=items.concat(arr.map(function(it){return{id:it.id||ci.id,name:ci.name+': '+(it.name||it.label||it),completed:it.is_done||it.completed||false}}))}catch(e){items.push({id:ci.id,name:ci.name,completed:false})}}}
    el.innerHTML=items.length?items.map(function(item){return'<div class="flex items-center gap-3 py-2 border-b border-base-200"><input type="checkbox" class="checkbox" data-id="'+item.id+'"'+(item.completed?' checked':'')+' onchange="toggleCheckItem(this.dataset.id,this.checked)"/><span class="text-sm'+(item.completed?' line-through text-base-content/40':'')+'">'+(item.name||'Item')+'</span></div>'}).join(''):'<div class="text-center text-base-content/40 text-sm py-8">No checklist items yet</div>'}
  catch(err){el.innerHTML='<div class="text-base-content/40 text-center p-4">Could not load checklists</div>'}
}
async function toggleCheckItem(id,checked){try{await fetch('/api/checklist_item/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_done:checked})});showToast(checked?'Completed':'Unchecked','success')}catch(e){showToast('Error','error')}}
async function loadActivity(){
  var el=document.getElementById('activity-log');
  try{
    var r=await fetch('/api/audit/logs?entityType=engagement&entityId=${esc(e.id)}&limit=30');
    var d=await r.json();var items=d.data||d||[];if(!Array.isArray(items))items=[];
    el.innerHTML=items.length?items.map(function(a){var ts=a.timestamp||a.created_at;var date=ts?(typeof ts==='number'&&ts>1e9?new Date(ts*1000).toLocaleString():new Date(ts).toLocaleString()):'-';return'<div class="flex gap-3 items-start py-2 border-b border-base-100"><div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">'+(a.user_id||'S').charAt(0).toUpperCase()+'</div><div><div class="text-xs text-base-content/40">'+(a.user_id||'System')+' &bull; '+date+'</div><div class="text-sm mt-1">'+(a.action||a.operation||a.type||'Activity')+(a.details?' &mdash; <span class="text-xs text-base-content/40">'+JSON.stringify(a.details).substring(0,80)+'</span>':'')+'</div></div></div>'}).join(''):'<div class="text-center text-base-content/40 text-sm py-8">No activity recorded yet</div>'}
  catch(err){el.innerHTML='<div class="text-base-content/40 text-center p-4">Activity log unavailable</div>'}
}
async function loadFiles(){
  var el=document.getElementById('eng-files-list');
  try{
    var re=await fetch('/api/rfi?engagement_id=${esc(e.id)}&limit=100');var rd=await re.json();var rfis=rd.data?.items||rd.data||[];
    if(!rfis.length){el.innerHTML='<div class="text-center text-base-content/40 text-sm py-8">No RFIs yet. Files are attached to RFIs.</div>';return}
    var allFiles=[];
    for(var i=0;i<Math.min(rfis.length,5);i++){try{var fr=await fetch('/api/file?rfi_id='+rfis[i].id);var fd=await fr.json();var ff=fd.data||fd||[];if(Array.isArray(ff))allFiles=allFiles.concat(ff.map(function(f){return{...f,_rfi:rfis[i].title||rfis[i].name||'RFI'}}))}catch(e){}}
    el.innerHTML=allFiles.length?'<div class="table-container"><table class="table table-hover"><thead><tr><th>File</th><th>RFI</th><th>Size</th><th>Date</th></tr></thead><tbody>'+allFiles.map(function(f){var ts=f.created_at;var date=ts?(typeof ts==='number'&&ts>1e9?new Date(ts*1000).toLocaleDateString():new Date(ts).toLocaleDateString()):'-';return'<tr><td class="text-sm"><a href="/api/files/'+f.id+'" target="_blank" class="text-primary">'+(f.path?.split('/').pop()||f.id)+'</a></td><td class="text-xs text-base-content/50">'+(f._rfi||'-')+'</td><td class="text-sm">'+(f.size?Math.round(f.size/1024)+'KB':'-')+'</td><td class="text-sm">'+date+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="text-center text-base-content/40 text-sm py-8">No files uploaded yet</div>'}
  catch(err){el.innerHTML='<div class="text-base-content/40 text-center p-4">Could not load files</div>'}
}
async function uploadEngFiles(event,engId){
  var files=event.target.files;if(!files.length)return;
  var re=await fetch('/api/rfi?engagement_id='+engId+'&limit=1');var rd=await re.json();var rfis=rd.data?.items||rd.data||[];
  if(!rfis.length){showToast('Create an RFI first to upload files','error');return}
  showToast('Uploading '+files.length+' file(s)...','info');var ok=0;
  for(var i=0;i<files.length;i++){var fd=new FormData();fd.append('file',files[i]);fd.append('rfi_id',rfis[0].id);try{var r=await fetch('/api/friday/upload/post-rfi',{method:'POST',body:fd});if(r.ok)ok++}catch(err){}}
  showToast(ok+' file(s) uploaded','success');if(ok>0)loadFiles()
}
async function downloadFilesZip(engId){try{var r=await fetch('/api/friday/engagement/files-zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engagement_id:engId})});if(r.ok){var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='engagement-files.zip';a.click()}else showToast('No files to download','error')}catch(e){showToast('Error','error')}}
`;

  const body = `<div style="min-height:100vh;background:var(--color-bg)">${nav(user)}<main class="page-shell" id="main-content"><div class="page-shell-inner">${content}</div></main></div>`;
  return generateHtml(`${esc(e.name || 'Engagement')} | MY FRIDAY`, body, [script]);
}
