import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';
import { esc, statusBadge, TOAST_SCRIPT } from '@/ui/render-helpers.js';

const TOAST = TOAST_SCRIPT;

function questionRow(q, i, sections = []) {
  const section = sections.find(s => s.id === q.section_id || s.id === q.rfi_section_id);
  const sLabel = section ? `<span class="badge badge-flat-primary text-xs">${esc(section.name)}</span>` : '';
  const hasResp = q.responses > 0 || q.response_count > 0;
  const respBadge = hasResp ? `<span class="badge badge-success badge-flat-success text-xs">Responded</span>` : '';
  return `<tr class="hover">
    <td class="text-center text-sm text-base-content/40 w-8">${i+1}</td>
    <td class="text-sm max-w-sm">${esc(q.question_text||q.question||q.title||'Question')}</td>
    <td>${sLabel}</td>
    <td class="text-sm text-base-content/50">${q.deadline?new Date(typeof q.deadline==='number'?q.deadline*1000:q.deadline).toLocaleDateString():'-'}</td>
    <td>${respBadge}</td>
    <td>
      <div class="flex gap-2">
        <button onclick="openEditQuestion('${esc(q.id)}')" class="btn btn-ghost btn-xs">Edit</button>
        <button onclick="deleteQuestion('${esc(q.id)}')" class="btn btn-error btn-xs">Del</button>
      </div>
    </td>
  </tr>`;
}

function editQuestionDialog(rfiId, sections) {
  const sectionOpts = sections.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  return `<div id="q-dialog" data-rfi-id="${esc(rfiId)}" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('q-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-lg p-6">
      <h3 class="text-lg font-semibold mb-4" id="q-dialog-title">Edit Question</h3>
      <div class="form-group mb-3">
        <label class="label"><span class="label-text font-medium">Question Text</span></label>
        <textarea id="q-text" rows="4" class="textarea textarea-solid max-w-full"></textarea>
      </div>
      <div class="form-group mb-3">
        <label class="label"><span class="label-text font-medium">Section</span></label>
        <select id="q-section" class="select select-solid max-w-full"><option value="">No section</option>${sectionOpts}</select>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="form-group">
          <label class="label"><span class="label-text font-medium">Deadline</span></label>
          <input type="date" id="q-deadline" class="input input-solid max-w-full"/>
        </div>
        <div class="form-group">
          <label class="label"><span class="label-text font-medium">Category</span></label>
          <input type="text" id="q-category" placeholder="Category" class="input input-solid max-w-full"/>
        </div>
      </div>
      <input type="hidden" id="q-edit-id"/>
      <div class="modal-action">
        <button onclick="saveQuestion('${esc(rfiId)}')" class="btn btn-primary">Save</button>
        <button onclick="document.getElementById('q-dialog').style.display='none'" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;
}

function addSectionDialog(rfiId) {
  return `<div id="sec-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('sec-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-sm p-6">
      <h3 class="text-lg font-semibold mb-4">Add Section</h3>
      <div class="form-group mb-4">
        <label class="label"><span class="label-text font-medium">Section Name</span></label>
        <input type="text" id="sec-name" class="input input-solid max-w-full"/>
      </div>
      <div class="modal-action">
        <button onclick="saveSection('${esc(rfiId)}')" class="btn btn-primary">Add</button>
        <button onclick="document.getElementById('sec-dialog').style.display='none'" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;
}

export function renderRfiDetail(user, rfi = {}, questions = [], sections = [], engagement = null) {
  const canEditRfi = canEdit(user, 'rfi');
  const qRows = questions.map((q, i) => questionRow(q, i, sections)).join('') ||
    `<tr><td colspan="6" class="text-center py-8 text-base-content/40 text-sm">No questions yet. Add one using the button above.</td></tr>`;

  const sectionTabs = sections.length ? `<div class="tabs tabs-boxed bg-base-200 flex-wrap gap-1">
    <button onclick="filterBySection('')" id="stab-all" class="tab-btn active">All</button>
    ${sections.map(s => `<button onclick="filterBySection('${esc(s.id)}')" id="stab-${esc(s.id)}" class="tab-btn">${esc(s.name)}</button>`).join('')}
  </div>` : '';

  const engLink = engagement
    ? `<a href="/engagement/${esc(engagement.id)}" class="text-primary text-sm">&#8592; ${esc(engagement.name||'Engagement')}</a>`
    : `<a href="/rfi" class="text-primary text-sm">&#8592; RFI List</a>`;

  const headerBtns = canEditRfi ? `
    <div class="flex gap-2 flex-wrap">
      <button onclick="openAddQuestion()" class="btn btn-primary btn-sm">+ Question</button>
      <button onclick="document.getElementById('sec-dialog').style.display='flex'" class="btn btn-ghost btn-sm">+ Section</button>
      <button onclick="sendReminder('${esc(rfi.id)}')" class="btn btn-ghost btn-sm">Send Reminder</button>
      <a href="/rfi/${esc(rfi.id)}/edit" class="btn btn-outline-primary btn-sm">Edit RFI</a>
    </div>` : '';

  const infoItems = [
    ['Engagement', engagement?.name ? esc(engagement.name) : '<span class="text-base-content/30">—</span>'],
    ['Status', statusBadge(rfi.status)],
    ['Deadline', rfi.deadline?new Date(typeof rfi.deadline==='number'?rfi.deadline*1000:rfi.deadline).toLocaleDateString():'-'],
    ['Questions', questions.length],
    ['Sections', sections.length],
    ['Mandatory', rfi.mandatory!==false?'Yes':'No'],
  ];

  const infoGrid = `<div class="grid grid-cols-2 md:grid-cols-3 gap-4">` +
    infoItems.map(([l,v]) => `<div><div class="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">${l}</div><div class="text-sm text-base-content">${v}</div></div>`).join('') +
    `</div>`;

  const content = `
    <nav class="breadcrumbs text-sm mb-4">
      <ul><li>${engLink}</li></ul>
    </nav>
    <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-base-content mb-1">${esc(rfi.display_name||rfi.name||rfi.title||(engagement?'RFI – '+(engagement.name||''):'RFI'))}</h1>
        ${rfi.description ? `<p class="text-base-content/60 text-sm">${esc(rfi.description)}</p>` : ''}
      </div>
      ${headerBtns}
    </div>
    <div class="card bg-base-100 shadow-md mb-4">
      <div class="card-body">${infoGrid}</div>
    </div>
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 class="card-title text-sm">Questions (${questions.length})</h2>
          <div class="flex gap-2 items-center flex-wrap">
            ${sectionTabs}
            <input type="text" placeholder="Search..." oninput="filterQuestions(this.value)" class="input input-solid" style="max-width:160px"/>
          </div>
        </div>
        <div class="table-container">
          <table class="table table-hover" id="q-table">
            <thead><tr><th>#</th><th>Question</th><th>Section</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="q-tbody">${qRows}</tbody>
          </table>
        </div>
      </div>
    </div>
    ${editQuestionDialog(rfi.id, sections)}
    ${addSectionDialog(rfi.id)}
  `;

  const script = `${TOAST}
var activeSection='';
function filterBySection(sid){
  activeSection=sid;
  document.querySelectorAll('[id^="stab-"]').forEach(b=>b.classList.toggle('active',b.id==='stab-'+(sid||'all')));
  filterRows()
}
function filterRows(){var q=(document.querySelector('#q-table input')?.value||'').toLowerCase();document.querySelectorAll('#q-tbody tr').forEach(function(r){var text=(r.textContent||'').toLowerCase();var secSpan=r.querySelector('td:nth-child(3) span');var rowSec=secSpan?secSpan.textContent:'';var showSec=!activeSection||rowSec===document.getElementById('stab-'+activeSection)?.textContent;r.style.display=(!q||text.includes(q))&&showSec?'':'none'})}
function filterQuestions(q){filterRows()}
function openAddQuestion(){document.getElementById('q-dialog').style.display='flex';document.getElementById('q-dialog-title').textContent='Add Question';document.getElementById('q-edit-id').value='';document.getElementById('q-text').value='';document.getElementById('q-section').value='';document.getElementById('q-deadline').value='';document.getElementById('q-category').value=''}
async function openEditQuestion(id){document.getElementById('q-dialog').style.display='flex';document.getElementById('q-dialog-title').textContent='Edit Question';document.getElementById('q-edit-id').value=id;try{var rfiId=document.getElementById('q-dialog').dataset.rfiId;var r=await fetch('/api/rfi/'+rfiId+'/questions/'+id);var d=await r.json();var q=d.data||d;document.getElementById('q-text').value=q.question_text||q.question||q.title||'';document.getElementById('q-section').value=q.section_id||q.rfi_section_id||'';document.getElementById('q-deadline').value=q.deadline?(new Date(typeof q.deadline==='number'?q.deadline*1000:q.deadline)).toISOString().split('T')[0]:'';document.getElementById('q-category').value=q.category||''}catch(e){showToast('Error loading','error')}}
async function saveQuestion(rfiId){var id=document.getElementById('q-edit-id').value;var questionText=document.getElementById('q-text').value.trim();if(!questionText){showToast('Question text required','error');return}var data={question:questionText,category:document.getElementById('q-category').value.trim()||null,section_id:document.getElementById('q-section').value||null};var dl=document.getElementById('q-deadline').value;if(dl)data.due_date=Math.floor(new Date(dl).getTime()/1000);var btn=event?.target;if(btn){btn.disabled=true;btn.textContent='Saving...'}try{var url=id?'/api/rfi/'+rfiId+'/questions/'+id:'/api/rfi/'+rfiId+'/questions';var r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});var result=await r.json();if(r.ok){showToast(id?'Question updated':'Question added','success');document.getElementById('q-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast(result.message||result.error||'Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}finally{if(btn){btn.disabled=false;btn.textContent='Save'}}}
async function deleteQuestion(id){if(!confirm('Delete this question?'))return;var rfiId=document.getElementById('q-dialog').dataset.rfiId;try{var r=await fetch('/api/rfi/'+rfiId+'/questions/'+id,{method:'DELETE'});if(r.ok){showToast('Question deleted','success');setTimeout(function(){location.reload()},500)}else showToast('Delete failed','error')}catch(e){showToast('Error','error')}}
async function saveSection(rfiId){var name=document.getElementById('sec-name').value.trim();if(!name){showToast('Name required','error');return}try{var r=await fetch('/api/rfi_section',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,rfi_id:rfiId})});if(r.ok){showToast('Section added','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}document.getElementById('sec-dialog').style.display='none'}
async function sendReminder(rfiId){try{var r=await fetch('/api/friday/rfi/reminder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rfi_id:rfiId})});if(r.ok)showToast('Reminder sent','success');else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  const body = `<div style="min-height:100vh;background:var(--color-bg)">${nav(user)}<main class="page-shell" id="main-content"><div class="page-shell-inner">${content}</div></main></div>`;
  return generateHtml(`${esc(rfi.name||'RFI')} | MOONLANDING`, body, [script]);
}
