import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';

const TOAST = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem';document.body.appendChild(c)}const d=document.createElement('div');d.style.cssText='padding:10px 16px;border-radius:6px;font-size:0.82rem;font-weight:500;color:#fff;background:'+(t==='error'?'#c62828':t==='success'?'#2e7d32':'#1565c0');d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function statusBadge(status) {
  const map = { active: ['#2e7d32','#e8f5e9'], closed: ['#555','#f5f5f5'], responded: ['#1565c0','#e3f2fd'], pending: ['#e65100','#fff3e0'] };
  const [color, bg] = map[status] || ['#555','#f5f5f5'];
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:10px;font-size:0.75rem;font-weight:700;border:1px solid ${color}44">${status||'-'}</span>`;
}

function questionRow(q, i, sections = []) {
  const section = sections.find(s => s.id === q.section_id || s.id === q.rfi_section_id);
  const sLabel = section ? `<span style="background:#e3f2fd;color:#1565c0;padding:1px 6px;border-radius:4px;font-size:0.68rem;font-weight:600">${esc(section.name)}</span>` : '';
  const hasResp = q.responses > 0 || q.response_count > 0;
  const respBadge = hasResp ? `<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:4px;font-size:0.68rem;font-weight:600">Responded</span>` : '';
  return `<tr style="border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;width:36px;text-align:center;color:#aaa;font-size:0.78rem">${i+1}</td>
    <td style="padding:10px 12px;font-size:0.85rem;max-width:400px">${esc(q.question_text||q.question||q.title||'Question')}</td>
    <td style="padding:10px 12px">${sLabel}</td>
    <td style="padding:10px 12px;font-size:0.8rem;color:#888">${q.deadline?new Date(typeof q.deadline==='number'?q.deadline*1000:q.deadline).toLocaleDateString():'-'}</td>
    <td style="padding:10px 12px">${respBadge}</td>
    <td style="padding:10px 12px">
      <div style="display:flex;gap:6px">
        <button onclick="openEditQuestion('${esc(q.id)}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Edit</button>
        <button onclick="deleteQuestion('${esc(q.id)}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Del</button>
      </div>
    </td>
  </tr>`;
}

function editQuestionDialog(rfiId, sections) {
  const sectionOpts = sections.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  return `<div id="q-dialog" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:8px;padding:24px;max-width:520px;width:90%;max-height:90vh;overflow-y:auto">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700" id="q-dialog-title">Edit Question</h3>
      <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Question Text</label><textarea id="q-text" rows="4" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;resize:vertical;box-sizing:border-box"></textarea></div>
      <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Section</label><select id="q-section" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem"><option value="">No section</option>${sectionOpts}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Deadline</label><input type="date" id="q-deadline" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box"/></div>
        <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Category</label><input type="text" id="q-category" placeholder="Category" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box"/></div>
      </div>
      <input type="hidden" id="q-edit-id"/>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button onclick="document.getElementById('q-dialog').style.display='none'" style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:0.85rem">Cancel</button>
        <button onclick="saveQuestion('${esc(rfiId)}')" style="padding:7px 16px;background:#1976d2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">Save</button>
      </div>
    </div>
  </div>`;
}

function addSectionDialog(rfiId) {
  return `<div id="sec-dialog" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:8px;padding:24px;max-width:400px;width:90%">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Add Section</h3>
      <div style="margin-bottom:16px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Section Name</label><input type="text" id="sec-name" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box"/></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('sec-dialog').style.display='none'" style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:0.85rem">Cancel</button>
        <button onclick="saveSection('${esc(rfiId)}')" style="padding:7px 16px;background:#04141f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">Add</button>
      </div>
    </div>
  </div>`;
}

export function renderRfiDetail(user, rfi = {}, questions = [], sections = [], engagement = null) {
  const canEditRfi = canEdit(user, 'rfi');
  const qRows = questions.map((q, i) => questionRow(q, i, sections)).join('') ||
    `<tr><td colspan="6" style="padding:32px;text-align:center;color:#aaa;font-size:0.85rem">No questions yet. Add one above.</td></tr>`;

  const sectionTabs = sections.length ? sections.map(s =>
    `<button onclick="filterBySection('${esc(s.id)}')" id="stab-${esc(s.id)}" style="padding:6px 14px;border:1px solid #ddd;border-radius:20px;background:#fff;cursor:pointer;font-size:0.78rem;font-weight:600">${esc(s.name)}</button>`
  ).join('') : '';

  const engLink = engagement ? `<a href="/engagement/${esc(engagement.id)}" style="color:#1976d2;text-decoration:none;font-size:0.82rem">&#8592; ${esc(engagement.name||'Engagement')}</a>` : `<a href="/rfi" style="color:#1976d2;text-decoration:none;font-size:0.82rem">&#8592; RFI List</a>`;

  const headerBtns = canEditRfi ? `
    <div style="display:flex;gap:8px">
      <button onclick="openAddQuestion()" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:0.82rem;font-weight:600">+ Question</button>
      <button onclick="document.getElementById('sec-dialog').style.display='flex'" style="background:#f5f5f5;border:1px solid #ddd;color:#333;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:0.82rem">+ Section</button>
      <button onclick="sendReminder('${esc(rfi.id)}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:0.82rem">Send Reminder</button>
      <a href="/rfi/${esc(rfi.id)}/edit" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Edit RFI</a>
    </div>` : '';

  const infoGrid = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px 24px;margin-bottom:20px">
    ${[['Engagement', esc(engagement?.name||rfi.engagement_id||'-')],['Status',statusBadge(rfi.status)],['Deadline',rfi.deadline?new Date(typeof rfi.deadline==='number'?rfi.deadline*1000:rfi.deadline).toLocaleDateString():'-'],['Questions',questions.length],['Sections',sections.length],['Mandatory',rfi.mandatory!==false?'Yes':'No']].map(([l,v])=>`<div><div style="font-size:0.72rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">${l}</div><div style="font-size:0.88rem;color:#222">${v}</div></div>`).join('')}
  </div>`;

  const content = `
    <div style="margin-bottom:16px">${engLink}</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:1.4rem;font-weight:700;margin:0 0 6px">${esc(rfi.name||rfi.title||'RFI')}</h1>
        ${rfi.description ? `<p style="color:#666;font-size:0.85rem;margin:0">${esc(rfi.description)}</p>` : ''}
      </div>
      ${headerBtns}
    </div>
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px;margin-bottom:16px">
      ${infoGrid}
    </div>
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Questions (${questions.length})</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button onclick="filterBySection('')" id="stab-all" style="padding:6px 14px;border:1px solid #1976d2;border-radius:20px;background:#1976d2;color:#fff;cursor:pointer;font-size:0.78rem;font-weight:600">All</button>
          ${sectionTabs}
          <input type="text" placeholder="Search..." oninput="filterQuestions(this.value)" style="padding:5px 10px;border:1px solid #ddd;border-radius:20px;font-size:0.78rem;outline:none"/>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse" id="q-table">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">#</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">QUESTION</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">SECTION</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">DEADLINE</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">STATUS</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">ACTIONS</th>
          </tr></thead>
          <tbody id="q-tbody">${qRows}</tbody>
        </table>
      </div>
    </div>
    ${editQuestionDialog(rfi.id, sections)}
    ${addSectionDialog(rfi.id)}
  `;

  const script = `${TOAST}
var activeSection='';
function filterBySection(sid){activeSection=sid;document.querySelectorAll('[id^="stab-"]').forEach(function(b){b.style.background=b.id==='stab-'+(sid||'all')?'#1976d2':'#fff';b.style.color=b.id==='stab-'+(sid||'all')?'#fff':'#333';b.style.borderColor=b.id==='stab-'+(sid||'all')?'#1976d2':'#ddd'});filterRows()}
function filterRows(){var q=(document.querySelector('#q-table input')?.value||'').toLowerCase();document.querySelectorAll('#q-tbody tr').forEach(function(r){var text=(r.textContent||'').toLowerCase();var secSpan=r.querySelector('td:nth-child(3) span');var rowSec=secSpan?secSpan.textContent:'';var showSec=!activeSection||rowSec===document.getElementById('stab-'+activeSection)?.textContent;r.style.display=(!q||text.includes(q))&&showSec?'':'none'})}
function filterQuestions(q){filterRows()}
function openAddQuestion(){document.getElementById('q-dialog').style.display='flex';document.getElementById('q-dialog-title').textContent='Add Question';document.getElementById('q-edit-id').value='';document.getElementById('q-text').value='';document.getElementById('q-section').value='';document.getElementById('q-deadline').value='';document.getElementById('q-category').value=''}
async function openEditQuestion(id){document.getElementById('q-dialog').style.display='flex';document.getElementById('q-dialog-title').textContent='Edit Question';document.getElementById('q-edit-id').value=id;try{var r=await fetch('/api/rfi_question/'+id);var d=await r.json();var q=d.data||d;document.getElementById('q-text').value=q.question_text||q.question||q.title||'';document.getElementById('q-section').value=q.section_id||q.rfi_section_id||'';document.getElementById('q-deadline').value=q.deadline?(new Date(typeof q.deadline==='number'?q.deadline*1000:q.deadline)).toISOString().split('T')[0]:'';document.getElementById('q-category').value=q.category||''}catch(e){showToast('Error loading','error')}}
async function saveQuestion(rfiId){var id=document.getElementById('q-edit-id').value;var data={question_text:document.getElementById('q-text').value.trim(),rfi_id:rfiId,section_id:document.getElementById('q-section').value||null,category:document.getElementById('q-category').value.trim()};var dl=document.getElementById('q-deadline').value;if(dl)data.deadline=Math.floor(new Date(dl).getTime()/1000);if(!data.question_text){showToast('Question text required','error');return}try{var url=id?'/api/rfi_question/'+id:'/api/rfi_question';var r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(r.ok){showToast(id?'Updated':'Added','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}document.getElementById('q-dialog').style.display='none'}
async function deleteQuestion(id){if(!confirm('Delete this question?'))return;try{var r=await fetch('/api/rfi_question/'+id,{method:'DELETE'});if(r.ok){showToast('Deleted','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function saveSection(rfiId){var name=document.getElementById('sec-name').value.trim();if(!name){showToast('Name required','error');return}try{var r=await fetch('/api/rfi_section',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,rfi_id:rfiId})});if(r.ok){showToast('Section added','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}document.getElementById('sec-dialog').style.display='none'}
async function sendReminder(rfiId){try{var r=await fetch('/api/friday/rfi/reminder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rfi_id:rfiId})});if(r.ok)showToast('Reminder sent','success');else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px" id="main-content">${content}</main></div>`;
  return generateHtml(`${esc(rfi.name||'RFI')} | MY FRIDAY`, body, [script]);
}
