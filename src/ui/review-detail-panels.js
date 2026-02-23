import { esc } from '@/ui/render-helpers.js';

export function highlightRow(h) {
  const resolved = h.resolved || h.status === 'resolved';
  return `<tr class="hover">
    <td class="text-sm max-w-xs">${esc(h.text||h.content||h.comment||'Highlight')}</td>
    <td class="text-sm text-base-content/50">p.${h.page||h.page_number||'-'}</td>
    <td><span class="badge ${resolved?'badge-success badge-flat-success':'badge-warning badge-flat-warning'} text-xs">${resolved?'Resolved':'Open'}</span></td>
    <td class="text-sm text-base-content/50">${h.created_by_name||h.user_id||'-'}</td>
    <td>${!resolved ? `<button onclick="resolveHighlight('${esc(h.id)}')" class="btn btn-success btn-xs">Resolve</button>` : ''}</td>
  </tr>`;
}

export function collaboratorRow(c) {
  return `<tr class="hover">
    <td class="text-sm">${esc(c.user_name||c.email||c.user_id||'-')}</td>
    <td><span class="badge badge-flat-primary text-xs">${esc(c.role||'viewer')}</span></td>
    <td class="text-sm text-base-content/50">${c.expires_at?new Date(typeof c.expires_at==='number'?c.expires_at*1000:c.expires_at).toLocaleDateString():'-'}</td>
    <td><button onclick="removeCollaborator('${esc(c.id)}')" class="btn btn-error btn-xs">Remove</button></td>
  </tr>`;
}

export function addCollaboratorDialog(reviewId) {
  return `<div id="collab-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('collab-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-sm p-6">
      <h3 class="text-lg font-semibold mb-4">Add Collaborator</h3>
      <div class="form-group mb-3">
        <label class="label"><span class="label-text font-medium">Email</span></label>
        <input type="email" id="collab-email" class="input input-solid max-w-full" placeholder="collaborator@example.com"/>
      </div>
      <div class="form-group mb-4">
        <label class="label"><span class="label-text font-medium">Role</span></label>
        <select id="collab-role" class="select select-solid max-w-full">
          <option value="viewer">Viewer</option>
          <option value="commenter">Commenter</option>
          <option value="editor">Editor</option>
        </select>
      </div>
      <div class="modal-action">
        <button onclick="addCollaborator('${esc(reviewId)}')" class="btn btn-primary">Add</button>
        <button onclick="document.getElementById('collab-dialog').style.display='none'" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;
}
