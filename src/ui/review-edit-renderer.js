import { page } from '@/ui/layout.js';
import { esc, TOAST_SCRIPT } from '@/ui/render-helpers.js';
import { reviewZoneNav } from '@/ui/review-detail-renderer.js';

export function renderReviewEdit(user, review, engagements = [], teams = []) {
  const r = review || {};
  const id = esc(r.id || '');
  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${id}`, label: r.name || 'Review' }, { label: 'Edit' }];

  const statusOptions = ['active','open','in_progress','completed','closed','archived'].map(s =>
    `<option value="${s}"${r.status===s?' selected':''}>${s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`
  ).join('');

  const typeOptions = ['standard','tender'].map(t =>
    `<option value="${t}"${(r.review_type||r.type)===t?' selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
  ).join('');

  const priorityOptions = ['normal','high','critical'].map(p =>
    `<option value="${p}"${r.priority_level===p?' selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`
  ).join('');

  const engOptions = engagements.map(e =>
    `<option value="${esc(e.id)}"${r.engagement_id===e.id?' selected':''}>${esc(e.name||e.id)}</option>`
  ).join('');

  const teamOptions = `<option value="">None</option>` + teams.map(t =>
    `<option value="${esc(t.id)}"${r.team_id===t.id?' selected':''}>${esc(t.name||t.id)}</option>`
  ).join('');

  const deadlineVal = r.deadline ? (typeof r.deadline === 'number' ? new Date(r.deadline*1000).toISOString().slice(0,10) : String(r.deadline).slice(0,10)) : '';

  const formField = (label, input) => `<div class="form-group"><label class="label"><span class="label-text font-semibold">${label}</span></label>${input}</div>`;

  const content = `
    <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold">Edit Review</h1>
        <p class="text-sm text-base-content/50 mt-1">${esc(r.name||'')}</p>
      </div>
      <a href="/review/${id}" class="btn btn-ghost btn-sm">&larr; Back to Review</a>
    </div>
    ${reviewZoneNav(r.id, 'overview')}
    <div class="card-clean">
      <div class="card-clean-body">
        <form id="review-edit-form" class="space-y-4" novalidate>
          ${formField('Review Name <span class="text-error">*</span>', `<input type="text" name="name" class="input input-solid max-w-full" value="${esc(r.name||r.title||'')}" required placeholder="Enter review name"/>`)}
          ${engOptions ? formField('Engagement', `<select name="engagement_id" class="select select-solid max-w-full"><option value="">-- None --</option>${engOptions}</select>`) : ''}
          ${formField('Status', `<select name="status" class="select select-solid max-w-full">${statusOptions}</select>`)}
          ${formField('Review Type', `<select name="review_type" class="select select-solid max-w-full">${typeOptions}</select>`)}
          ${formField('Priority', `<select name="priority_level" class="select select-solid max-w-full">${priorityOptions}</select>`)}
          ${formField('Financial Year', `<input type="text" name="financial_year" class="input input-solid max-w-full" value="${esc(r.financial_year||'')}" placeholder="e.g. 2024"/>`)}
          ${formField('Deadline', `<input type="date" name="deadline" class="input input-solid max-w-full" value="${esc(deadlineVal)}"/>`)}
          ${formField('WIP Value', `<input type="number" name="wip_value" class="input input-solid max-w-full" value="${r.wip_value||''}" step="0.01" placeholder="0.00"/>`)}
          ${teamOptions.length > '<option value="">None</option>'.length ? formField('Team', `<select name="team_id" class="select select-solid max-w-full">${teamOptions}</select>`) : ''}
          <div class="form-group"><label class="label cursor-pointer justify-start gap-3"><input type="checkbox" name="is_private" class="checkbox checkbox-primary"${r.is_private?' checked':''}/><span class="label-text">Private Review</span></label></div>
          <div class="form-group"><label class="label cursor-pointer justify-start gap-3"><input type="checkbox" name="archived" class="checkbox checkbox-primary"${r.archived?' checked':''}/><span class="label-text">Archived</span></label></div>
          <div class="flex gap-3 pt-4 border-t border-base-200">
            <button type="submit" id="save-btn" class="btn btn-primary"><span class="btn-text">Save Changes</span><span class="btn-loading-text" style="display:none">Saving...</span></button>
            <a href="/review/${id}" class="btn btn-ghost">Cancel</a>
            <button type="button" onclick="deleteReview('${id}')" class="btn btn-error btn-outline ml-auto">Delete Review</button>
          </div>
        </form>
      </div>
    </div>`;

  const script = `${TOAST_SCRIPT}
const form=document.getElementById('review-edit-form');
const sb=document.getElementById('save-btn');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  sb.classList.add('btn-loading');
  sb.querySelector('.btn-text').style.display='none';
  sb.querySelector('.btn-loading-text').style.display='inline';
  sb.disabled=true;
  const fd=new FormData(form);
  const data={};
  for(const[k,v]of fd.entries())data[k]=v;
  form.querySelectorAll('input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});
  form.querySelectorAll('input[type=number]').forEach(inp=>{if(inp.name&&data[inp.name]!==undefined&&data[inp.name]!=='')data[inp.name]=Number(data[inp.name])});
  try{
    const res=await fetch('/api/review/${id}',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const result=await res.json();
    if(res.ok){showToast('Review updated successfully','success');setTimeout(()=>{window.location='/review/${id}'},600)}
    else{showToast(result.message||result.error||'Save failed','error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}
  }catch(err){showToast('Error: '+err.message,'error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}
});
window.deleteReview=async function(id){
  if(!confirm('Delete this review? This cannot be undone.'))return;
  try{
    const res=await fetch('/api/review/'+id,{method:'DELETE'});
    if(res.ok){showToast('Review deleted','success');setTimeout(()=>{window.location='/review'},800)}
    else{const r=await res.json();showToast(r.message||'Delete failed','error')}
  }catch(err){showToast('Error: '+err.message,'error')}
};`;

  return page(user, `Edit ${esc(r.name||'Review')} | MOONLANDING`, bc, content, [script]);
}
