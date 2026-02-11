export function collaboratorManagementDialog(entityType, entityId) {
  return `<div id="collab-mgmt-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:640px">
      <div class="dialog-header"><span class="dialog-title">Manage Collaborators</span><button class="dialog-close" onclick="document.getElementById('collab-mgmt-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <div id="cmd-list" class="flex flex-col gap-2" style="max-height:300px;overflow:auto"><div class="text-gray-500 text-sm text-center py-4">Loading...</div></div>
        <div class="inline-form" style="margin-top:1rem">
          <div class="inline-form-row">
            <div class="inline-form-field" style="flex:1"><label>Email</label><input type="email" id="cmd-email" class="input input-bordered input-sm w-full" placeholder="collaborator@example.com"/></div>
            <div class="inline-form-field"><label>Role</label><select id="cmd-role" class="select select-bordered select-sm"><option value="viewer">Viewer</option><option value="commenter">Commenter</option><option value="reviewer" selected>Reviewer</option><option value="manager">Manager</option></select></div>
            <div class="inline-form-field"><label>&nbsp;</label><button class="btn btn-primary btn-sm" onclick="cmdAdd()">Add</button></div>
          </div>
        </div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('collab-mgmt-dialog').style.display='none'">Close</button></div>
    </div></div>
  <script>
  window.openCollabMgmt=function(){document.getElementById('collab-mgmt-dialog').style.display='flex';cmdLoad()};
  async function cmdLoad(){var c=document.getElementById('cmd-list');c.innerHTML='<div class="text-gray-500 text-sm text-center py-2">Loading...</div>';try{var res=await fetch('/api/collaborator?${entityType}_id=${entityId}');var d=await res.json();var items=d.data||d||[];c.innerHTML='';if(!items.length){c.innerHTML='<div class="text-gray-500 text-sm text-center py-2">No collaborators</div>';return}items.forEach(function(item){var div=document.createElement('div');div.className='flex items-center justify-between gap-2';div.style.padding='0.5rem 0';div.style.borderBottom='1px solid #f3f4f6';var expired=item.expires_at&&item.expires_at<=Math.floor(Date.now()/1000);var expiryText=item.expires_at?'Expires: '+new Date(item.expires_at*1000).toLocaleDateString():'Permanent';if(expired)expiryText='<span style="color:#ef4444">Expired</span>';div.innerHTML='<div><div class="text-sm font-medium">'+(item.email||item.name||'Unknown')+'</div><div class="text-xs text-gray-500">'+(item.role_type||item.access_type||'viewer')+' &middot; '+expiryText+'</div></div><div class="flex gap-1"><button class="btn btn-xs btn-ghost" onclick="cmdExtend(\\''+item.id+'\\')">Extend</button><button class="btn btn-xs btn-error btn-outline" onclick="cmdRevoke(\\''+item.id+'\\')">Revoke</button></div>';c.appendChild(div)})}catch(e){c.innerHTML='<div class="text-red-500 text-sm text-center">Error loading</div>'}}
  window.cmdAdd=async function(){var email=document.getElementById('cmd-email').value.trim();var role=document.getElementById('cmd-role').value;if(!email){showToast('Email required','error');return}try{var r=await fetch('/api/collaborator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role_type:role,${entityType}_id:'${entityId}'})});if(r.ok){showToast('Collaborator added','success');document.getElementById('cmd-email').value='';cmdLoad()}else{var d=await r.json().catch(function(){return{}});showToast(d.error||'Failed','error')}}catch(e){showToast('Error','error')}};
  window.cmdRevoke=async function(id){if(!confirm('Revoke access?'))return;try{var r=await fetch('/api/collaborator/'+id,{method:'DELETE'});if(r.ok){showToast('Revoked','success');cmdLoad()}else showToast('Failed','error')}catch(e){showToast('Error','error')}};
  window.cmdExtend=async function(id){var days=prompt('Extend by how many days?','7');if(!days)return;var ts=Math.floor(Date.now()/1000)+Number(days)*86400;try{var r=await fetch('/api/collaborator/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({expires_at:ts})});if(r.ok){showToast('Extended','success');cmdLoad()}else showToast('Failed','error')}catch(e){showToast('Error','error')}};
  </script>`;
}

export function collaboratorExpiryUI(entityType, entityId) {
  return `<div class="card bg-white shadow mb-4"><div class="card-body"><div class="flex justify-between items-center"><h3 class="card-title text-sm">Collaborator Access</h3><button class="btn btn-outline btn-sm" onclick="openCollabMgmt()">Manage</button></div><div id="collab-expiry-list" class="mt-3 flex flex-col gap-1"></div></div></div>
  <script>
  (function(){fetch('/api/collaborator?${entityType}_id=${entityId}').then(function(r){return r.json()}).then(function(d){var items=d.data||d||[];var el=document.getElementById('collab-expiry-list');var now=Math.floor(Date.now()/1000);var expiring=items.filter(function(c){return c.expires_at&&c.expires_at>now&&c.expires_at-now<3*86400});var expired=items.filter(function(c){return c.expires_at&&c.expires_at<=now});if(!expiring.length&&!expired.length){el.innerHTML='<div class="text-xs text-gray-500">All access current</div>';return}var html='';expired.forEach(function(c){html+='<div class="text-xs" style="color:#ef4444">'+c.email+' - Expired</div>'});expiring.forEach(function(c){var days=Math.ceil((c.expires_at-now)/86400);html+='<div class="text-xs" style="color:#f59e0b">'+c.email+' - Expires in '+days+'d</div>'});el.innerHTML=html}).catch(function(){})})();
  </script>`;
}
