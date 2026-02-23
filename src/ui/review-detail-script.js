import { esc } from '@/ui/render-helpers.js';
import { TOAST_SCRIPT } from '@/ui/render-helpers.js';

export function reviewDetailScript(reviewId) {
  const id = esc(reviewId || '');
  return `${TOAST_SCRIPT}
function switchTab(tab){
  document.querySelectorAll('.rv-panel').forEach(function(p){p.style.display='none'});
  var panel=document.getElementById('rvpanel-'+tab);if(panel)panel.style.display='';
  document.querySelectorAll('[id^="rvtab-"]').forEach(function(b){b.classList.remove('active')});
  var btn=document.getElementById('rvtab-'+tab);if(btn)btn.classList.add('active');
}
async function resolveHighlight(id){if(!confirm('Mark this highlight as resolved?'))return;try{var r=await fetch('/api/mwr/review/${id}/highlights/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolved:true,status:'resolved'})});if(r.ok){showToast('Resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function bulkResolve(reviewId){if(!confirm('Resolve all highlights?'))return;try{var r=await fetch('/api/mwr/review/'+reviewId+'/highlights/bulk-resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolve_all:true})});if(r.ok){showToast('All resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function exportPdf(reviewId){showToast('Generating PDF...','info');try{var r=await fetch('/api/mwr/review/'+reviewId+'/export-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});if(r.ok){var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='review-'+reviewId+'.pdf';a.click();showToast('PDF downloaded','success')}else showToast('Export failed','error')}catch(e){showToast('Error','error')}}
async function addCollaborator(reviewId){var email=document.getElementById('collab-email').value.trim();var role=document.getElementById('collab-role').value;if(!email){showToast('Email required','error');return}try{var r=await fetch('/api/mwr/review/'+reviewId+'/collaborators',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role:role})});if(r.ok){showToast('Collaborator added','success');document.getElementById('collab-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function removeCollaborator(collabId){if(!confirm('Remove this collaborator?'))return;try{var r=await fetch('/api/mwr/review/${id}/collaborators/'+collabId,{method:'DELETE'});if(r.ok){showToast('Removed','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;
}
