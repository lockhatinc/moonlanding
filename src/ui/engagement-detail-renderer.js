import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';

const STAGE_CONFIG = [
  { key: 'info_gathering',  label: 'Info Gathering',  color: '#e53935', bg: '#ffebee' },
  { key: 'commencement',    label: 'Commencement',    color: '#e65100', bg: '#fff3e0' },
  { key: 'team_execution',  label: 'Team Execution',  color: '#1565c0', bg: '#e3f2fd' },
  { key: 'partner_review',  label: 'Partner Review',  color: '#283593', bg: '#e8eaf6' },
  { key: 'finalization',    label: 'Finalization',    color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'closeout',        label: 'Close Out',       color: '#33691e', bg: '#f1f8e9' },
];

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const cfg = STAGE_CONFIG.find(s => s.key === e.stage);
    const stageLbl = cfg ? `<span style="background:${cfg.bg};color:${cfg.color};padding:2px 6px;border-radius:8px;font-size:0.68rem;font-weight:700">${cfg.label}</span>` : '';
    const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
    return `<div onclick="location.href='/engagement/${esc(e.id)}'" style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;cursor:pointer;transition:box-shadow 0.15s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.08)'">
      <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px">${esc(e.name || 'Untitled')}</div>
      <div style="font-size:0.78rem;color:#666;margin-bottom:8px">${esc(e.client_name || '')}</div>
      ${stageLbl}
      <div style="margin-top:10px;background:#e0e0e0;border-radius:4px;height:4px"><div style="width:${pct}%;background:#1976d2;height:4px;border-radius:4px"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.7rem;color:#999"><span>${e.year || ''}</span><span>${pct}%</span></div>
    </div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${cards || '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#aaa">No engagements found</div>'}</div>`;
}

function stagePipelineHtml(e) {
  const currentIdx = STAGE_CONFIG.findIndex(s => s.key === e.stage);
  return STAGE_CONFIG.map((s, i) => {
    const isCurrent = i === currentIdx;
    const isPast = i < currentIdx;
    const bg = isCurrent ? s.color : isPast ? s.color + '88' : '#e0e0e0';
    const textColor = isCurrent || isPast ? '#fff' : '#999';
    const cursor = (!isCurrent && (isPartner || isManager)) ? 'pointer' : 'default';
    return `<div onclick="openStageTransition('${esc(s.key)}')" style="flex:1;padding:8px 4px;text-align:center;background:${bg};color:${textColor};font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;cursor:${cursor};position:relative">
      ${s.label}${isCurrent ? `<div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid ${s.color}"></div>` : ''}
    </div>`;
  }).join('');
}

function stageTransitionDialog(engId, currentStage) {
  const opts = STAGE_CONFIG.map(s =>
    `<option value="${s.key}" ${s.key === currentStage ? 'selected' : ''}>${s.label}</option>`
  ).join('');
  return `<div id="stage-dialog" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:8px;padding:24px;max-width:400px;width:90%">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Move Engagement Stage</h3>
      <select id="stage-select" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.9rem;margin-bottom:8px">${opts}</select>
      <textarea id="stage-note" rows="3" placeholder="Reason for stage change (optional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;resize:vertical;box-sizing:border-box;margin-bottom:16px"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('stage-dialog').style.display='none'" style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:0.85rem">Cancel</button>
        <button onclick="confirmStageTransition('${esc(engId)}')" style="padding:7px 16px;background:#1976d2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">Confirm</button>
      </div>
    </div>
  </div>`;
}

function chatPanel(engId) {
  return `<div id="tab-chat" class="eng-tab-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Team Chat</h2>
      <div id="chat-msgs" style="min-height:200px;max-height:400px;overflow-y:auto;border:1px solid #eee;border-radius:6px;padding:12px;margin-bottom:12px;background:#fafafa">
        <div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">Loading messages...</div>
      </div>
      <div style="display:flex;gap:8px">
        <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem" onkeydown="if(event.key==='Enter')sendChatMsg('${esc(engId)}')"/>
        <button onclick="sendChatMsg('${esc(engId)}')" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:0.85rem">Send</button>
      </div>
    </div>
  </div>`;
}

function checklistPanel(engId) {
  return `<div id="tab-checklist" class="eng-tab-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Checklists</h2>
        <a href="/review?engagement_id=${esc(engId)}" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Manage in Review</a>
      </div>
      <div id="checklist-items">
        <div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">Loading...</div>
      </div>
    </div>
  </div>`;
}

function activityPanel(engId) {
  return `<div id="tab-activity" class="eng-tab-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Activity Timeline</h2>
      <div id="activity-log" style="display:flex;flex-direction:column;gap:12px">
        <div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">Loading activity...</div>
      </div>
    </div>
  </div>`;
}

function filesPanel(engId) {
  return `<div id="tab-files" class="eng-tab-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Files</h2>
        <div style="display:flex;gap:8px">
          <label style="background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.82rem">
            Upload <input type="file" multiple style="display:none" onchange="uploadEngFiles(event,'${esc(engId)}')"/>
          </label>
          <button onclick="downloadFilesZip('${esc(engId)}')" style="background:#04141f;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.82rem">Download ZIP</button>
        </div>
      </div>
      <div id="eng-files-list">
        <div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">Loading files...</div>
      </div>
    </div>
  </div>`;
}

export function renderEngagementDetail(user, engagement, client, rfis = []) {
  const e = engagement || {};
  const stageCfg = STAGE_CONFIG.find(s => s.key === e.stage);
  const stageLabel = stageCfg ? stageCfg.label : (e.stage || '-');
  const stageColor = stageCfg ? stageCfg.color : '#555';
  const stageBg = stageCfg ? stageCfg.bg : '#f5f5f5';
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
    ? (e.assigned_users_resolved || []).map(u => `<span style="background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;margin-right:4px">${esc(u.name)}</span>`).join('')
    : '<span style="color:#aaa;font-style:italic;font-size:0.82rem">Not assigned</span>';
  const infoItems = [
    ['Client', esc(client?.name || e.client_name || e.client_id_display || e.client_id || '-')],
    ['Type', esc(e.type || e.engagement_type || e.repeat_interval || '-')],
    ['Year', esc(e.year || '-')],
    ['Team', esc(e.team_name || e.team_id_display || e.team_id || '-')],
    ['Status', e.status ? `<span style="background:${e.status==='active'?'#e8f5e9':'#fff3e0'};color:${e.status==='active'?'#2e7d32':'#e65100'};padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:700">${e.status}</span>` : '-'],
    ['Fee', fmtCurrency(e.fee || e.fees)],
    ['Commenced', fmtDate(e.commencement_date)],
    ['Deadline', fmtDate(e.deadline_date || e.deadline)],
    ['Created', fmtDate(e.created_at)],
    ['Assigned Users', assignedUsersHtml],
  ];

  const infoGrid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px">` +
    infoItems.map(([label, val]) => `<div><div style="font-size:0.72rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">${label}</div><div style="font-size:0.88rem;color:#222">${val}</div></div>`).join('') +
    `</div>`;

  const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
  const progressBar = `<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:0.78rem;font-weight:600;color:#555">Overall Progress</span><span style="font-size:0.78rem;color:#888">${pct}%</span></div><div style="background:#e0e0e0;border-radius:6px;height:8px"><div style="width:${pct}%;background:#1976d2;height:8px;border-radius:6px"></div></div></div>`;

  const rfiRows = rfis.map(r => {
    const rs = r.status || 'pending';
    const rc = rs==='active'?['#2e7d32','#e8f5e9']:rs==='closed'?['#555','#f5f5f5']:['#e65100','#fff3e0'];
    return `<tr onclick="location.href='/rfi/${esc(r.id)}'" style="cursor:pointer;border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''"><td style="padding:8px 12px;font-size:0.82rem">${esc(r.name||r.title||'RFI')}</td><td style="padding:8px 12px"><span style="background:${rc[1]};color:${rc[0]};padding:2px 7px;border-radius:8px;font-size:0.7rem;font-weight:700">${rs}</span></td><td style="padding:8px 12px;font-size:0.8rem">${r.deadline?new Date(r.deadline).toLocaleDateString():'-'}</td></tr>`;
  }).join('') || `<tr><td colspan="3" style="padding:24px;text-align:center;color:#aaa;font-size:0.82rem">No RFIs</td></tr>`;

  const stageBtn = canTransition ? `<button onclick="openStageTransition('${esc(e.stage)}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:7px 14px;border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer">Move Stage</button>` : '';
  const editBtn = canEdit(user, 'engagement') ? `<a href="/engagement/${esc(e.id)}/edit" style="background:#1976d2;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Edit</a>` : '';
  const newRfiBtn = `<a href="/rfi/new?engagement_id=${esc(e.id)}" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">+ RFI</a>`;

  const TABS = ['Details','RFIs','Chat','Checklist','Activity','Files'];
  const tabBar = `<div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:16px;background:#fff;border-radius:8px 8px 0 0;padding:0 16px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">` +
    TABS.map((t,i) => `<button onclick="switchEngTab('${t.toLowerCase()}')" id="engtab-${t.toLowerCase()}" style="padding:12px 16px;font-size:0.82rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:${i===0?'2px solid #1976d2;color:#1976d2':'2px solid transparent;color:#666'};margin-bottom:-2px">${t}</button>`).join('') +
    `</div>`;

  const detailsPanel = `<div id="tab-details" class="eng-tab-panel">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px;color:#333">Engagement Details</h2>
        ${infoGrid}${progressBar}
      </div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-size:0.95rem;font-weight:700;margin:0">RFIs (${rfis.length})</h2>
          ${newRfiBtn}
        </div>
        <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0"><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">NAME</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">STATUS</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">DEADLINE</th></tr></thead><tbody>${rfiRows}</tbody></table>
      </div>
    </div>
  </div>`;

  const rfisPanel = `<div id="tab-rfis" class="eng-tab-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">All RFIs</h2>${newRfiBtn}
      </div>
      <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0"><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">NAME</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">STATUS</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">DEADLINE</th></tr></thead><tbody>${rfiRows}</tbody></table>
    </div>
  </div>`;

  const content = `
    <div style="margin-bottom:16px"><a href="/engagements" style="color:#1976d2;text-decoration:none;font-size:0.85rem;font-weight:500">&#8592; Back to Engagements</a></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:1.5rem;font-weight:700;margin:0 0 6px;color:#1a1a1a">${esc(e.name || e.client_name || 'Engagement')}</h1>
        <span style="background:${stageBg};color:${stageColor};padding:4px 12px;border-radius:12px;font-size:0.78rem;font-weight:700;border:1px solid ${stageColor}44">${stageLabel}</span>
      </div>
      <div style="display:flex;gap:8px">${stageBtn}${editBtn}</div>
    </div>
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;margin-bottom:20px">
      <div style="display:flex">${stagePipelineHtml(e)}</div>
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
  document.querySelectorAll('[id^="engtab-"]').forEach(function(b){b.style.borderBottomColor='transparent';b.style.color='#666'});
  var btn=document.getElementById('engtab-'+tab);
  if(btn){btn.style.borderBottomColor='#1976d2';btn.style.color='#1976d2'}
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
  var btn=document.querySelector('#stage-dialog button[onclick*=confirmStage]');
  if(btn){btn.disabled=true;btn.textContent='Moving...'}
  try{var r=await fetch('/api/friday/engagement/transition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engagementId:engId,toStage:stage,reason:note})});
  var d=await r.json();
  if(r.ok||d.success){document.getElementById('stage-dialog').style.display='none';showToast('Stage updated to '+stage,'success');setTimeout(function(){location.reload()},800)}else{showToast(d.error||d.message||'Transition failed','error');if(btn){btn.disabled=false;btn.textContent='Confirm'}}}
  catch(e){showToast('Error: '+e.message,'error');if(btn){btn.disabled=false;btn.textContent='Confirm'}}
}
var _chatRfiId=null;
async function loadChat(){
  var el=document.getElementById('chat-msgs');
  try{
    if(!_chatRfiId){
      var re=await fetch('/api/rfi?engagement_id=${esc(e.id)}&limit=1');var rd=await re.json();
      var rfis=rd.data?.items||rd.data||rd||[];
      _chatRfiId=rfis[0]?.id||null;
    }
    if(!_chatRfiId){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No RFIs yet. Create an RFI to enable team chat.</div>';return}
    var r=await fetch('/api/message?rfi_id='+_chatRfiId);var d=await r.json();var msgs=d.data||d||[];
    el.innerHTML=msgs.length?msgs.map(function(m){return'<div style="margin-bottom:12px"><div style="font-size:0.75rem;color:#888;margin-bottom:2px">'+(m.created_by_display?.name||m.user_id||'User')+' &bull; '+(m.created_at?new Date(typeof m.created_at==='number'?m.created_at*1000:m.created_at).toLocaleString():'')+'</div><div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px;font-size:0.85rem">'+(m.content||'')+'</div></div>'}).join(''):'<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No messages yet</div>';
    el.scrollTop=el.scrollHeight}catch(err){el.innerHTML='<div style="color:#aaa;text-align:center;padding:16px">Could not load messages</div>'}
}
async function sendChatMsg(engId){
  var inp=document.getElementById('chat-input');var txt=inp.value.trim();if(!txt)return;
  if(!_chatRfiId){showToast('No RFI found for chat','error');return}
  var btn=inp.nextElementSibling;if(btn){btn.disabled=true}
  try{var r=await fetch('/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rfi_id:_chatRfiId,content:txt})});
  if(r.ok){inp.value='';loadChat();showToast('Sent','success')}else{var d=await r.json();showToast(d.message||'Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}
  finally{if(btn){btn.disabled=false}}
}
async function loadChecklist(){
  var el=document.getElementById('checklist-items');
  try{
    var re=await fetch('/api/review?engagement_id=${esc(e.id)}&limit=1');var rd=await re.json();
    var reviews=rd.data?.items||rd.data||[];
    if(!reviews.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No reviews yet. <a href="/review/new" style="color:#1976d2">Create a review</a> to add checklists.</div>';return}
    var reviewId=reviews[0].id;
    var r=await fetch('/api/checklist?review_id='+reviewId);var d=await r.json();var checklists=d.data||d||[];
    if(!checklists.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No checklists. <a href="/review/'+reviewId+'" style="color:#1976d2">Open the review</a> to manage checklists.</div>';return}
    var items=[];
    for(var i=0;i<checklists.length;i++){var ci=checklists[i];if(ci.section_items){try{var arr=JSON.parse(ci.section_items);items=items.concat(arr.map(function(it){return{id:it.id||ci.id,name:ci.name+': '+(it.name||it.label||it),completed:it.is_done||it.completed||false}}))}catch(e){items.push({id:ci.id,name:ci.name,completed:false})}}}
    el.innerHTML=items.length?items.map(function(item){return'<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0"><input type="checkbox"'+(item.completed?' checked':'')+' onchange="toggleCheckItem(\''+item.id+'\',this.checked)" style="width:18px;height:18px;cursor:pointer;accent-color:#1976d2"/><span style="font-size:0.85rem;'+(item.completed?'text-decoration:line-through;color:#aaa':'')+'">'+(item.name||'Item')+'</span></div>'}).join(''):'<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No checklist items yet</div>'}
  catch(err){el.innerHTML='<div style="color:#aaa;text-align:center;padding:16px">Could not load checklists</div>'}
}
async function toggleCheckItem(id,checked){try{await fetch('/api/checklist_item/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_done:checked})});showToast(checked?'Completed':'Unchecked','success')}catch(e){showToast('Error','error')}}
async function loadActivity(){
  var el=document.getElementById('activity-log');
  try{
    var r=await fetch('/api/audit/logs?entityType=engagement&entityId=${esc(e.id)}&limit=30');
    var d=await r.json();var items=d.data||d||[];
    if(!Array.isArray(items))items=[];
    el.innerHTML=items.length?items.map(function(a){var ts=a.timestamp||a.created_at;var date=ts?(typeof ts==='number'&&ts>1e9?new Date(ts*1000).toLocaleString():new Date(ts).toLocaleString()):'-';return'<div style="display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f5f5f5"><div style="width:32px;height:32px;border-radius:50%;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#1976d2;flex-shrink:0">'+(a.user_id||'S').charAt(0).toUpperCase()+'</div><div><div style="font-size:0.75rem;color:#888">'+(a.user_id||'System')+' &bull; '+date+'</div><div style="font-size:0.85rem;margin-top:2px;color:#333">'+(a.action||a.operation||a.type||'Activity')+(a.details?' &mdash; <span style="color:#888;font-size:0.78rem">'+JSON.stringify(a.details).substring(0,80)+'</span>':'')+'</div></div></div>'}).join(''):'<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No activity recorded yet</div>'}
  catch(err){el.innerHTML='<div style="color:#aaa;text-align:center;padding:16px">Activity log unavailable</div>'}
}
async function loadFiles(){
  var el=document.getElementById('eng-files-list');
  try{
    var re=await fetch('/api/rfi?engagement_id=${esc(e.id)}&limit=100');var rd=await re.json();
    var rfis=rd.data?.items||rd.data||[];
    if(!rfis.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No RFIs yet. Files are attached to RFIs.</div>';return}
    var allFiles=[];
    for(var i=0;i<Math.min(rfis.length,5);i++){
      try{var fr=await fetch('/api/file?rfi_id='+rfis[i].id);var fd=await fr.json();var ff=fd.data||fd||[];if(Array.isArray(ff))allFiles=allFiles.concat(ff.map(function(f){return{...f,_rfi:rfis[i].title||rfis[i].name||'RFI'}}))}catch(e){}
    }
    el.innerHTML=allFiles.length?'<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0"><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">FILE</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">RFI</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">SIZE</th><th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">DATE</th></tr></thead><tbody>'+allFiles.map(function(f){var ts=f.created_at;var date=ts?(typeof ts==='number'&&ts>1e9?new Date(ts*1000).toLocaleDateString():new Date(ts).toLocaleDateString()):'-';return'<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:8px 12px;font-size:0.82rem"><a href="/api/files/'+f.id+'" target="_blank" style="color:#1976d2">'+(f.path?.split('/').pop()||f.id)+'</a></td><td style="padding:8px 12px;font-size:0.78rem;color:#888">'+(f._rfi||'-')+'</td><td style="padding:8px 12px;font-size:0.82rem">'+(f.size?Math.round(f.size/1024)+'KB':'-')+'</td><td style="padding:8px 12px;font-size:0.8rem">'+date+'</td></tr>'}).join('')+'</tbody></table>':'<div style="text-align:center;color:#aaa;font-size:0.82rem;padding:32px">No files uploaded yet</div>'}
  catch(err){el.innerHTML='<div style="color:#aaa;text-align:center;padding:16px">Could not load files</div>'}
}
async function uploadEngFiles(event,engId){
  var files=event.target.files;if(!files.length)return;
  var re=await fetch('/api/rfi?engagement_id='+engId+'&limit=1');var rd=await re.json();
  var rfis=rd.data?.items||rd.data||[];
  if(!rfis.length){showToast('Create an RFI first to upload files','error');return}
  showToast('Uploading '+files.length+' file(s)...','info');
  var ok=0;
  for(var i=0;i<files.length;i++){var fd=new FormData();fd.append('file',files[i]);fd.append('rfi_id',rfis[0].id);try{var r=await fetch('/api/friday/upload/post-rfi',{method:'POST',body:fd});if(r.ok)ok++}catch(err){}}
  showToast(ok+' file(s) uploaded','success');if(ok>0)loadFiles()
}
async function downloadFilesZip(engId){try{var r=await fetch('/api/friday/engagement/files-zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engagement_id:engId})});if(r.ok){var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='engagement-files.zip';a.click()}else showToast('No files to download','error')}catch(e){showToast('Error','error')}}
`;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px" id="main-content">${content}</main></div>`;
  return generateHtml(`${esc(e.name || 'Engagement')} | MY FRIDAY`, body, [script]);
}
