import { esc } from '@/ui/render-helpers.js';

export function highlightRow(h) {
  const resolved = h.resolved || h.status === 'resolved';
  const badge = resolved
    ? '<span class="pill pill-success">Resolved</span>'
    : '<span class="pill pill-warning">Open</span>';
  return `<tr>
    <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.text||h.content||h.comment||'Highlight')}</td>
    <td style="font-size:13px;color:var(--color-text-muted)">p.${h.page||h.page_number||'-'}</td>
    <td>${badge}</td>
    <td style="font-size:13px;color:var(--color-text-muted)">${h.created_by_name||h.user_id||'-'}</td>
    <td>${!resolved ? `<button onclick="resolveHighlight('${esc(h.id)}')" class="btn-primary-clean" style="font-size:12px;padding:4px 10px">Resolve</button>` : ''}</td>
  </tr>`;
}

export function collaboratorRow(c) {
  return `<tr>
    <td>${esc(c.user_name||c.email||c.user_id||'-')}</td>
    <td><span class="pill pill-info">${esc(c.role||'viewer')}</span></td>
    <td style="font-size:13px;color:var(--color-text-muted)">${c.expires_at?new Date(typeof c.expires_at==='number'?c.expires_at*1000:c.expires_at).toLocaleDateString():'-'}</td>
    <td><button onclick="removeCollaborator('${esc(c.id)}')" class="btn-danger-clean" style="font-size:12px;padding:4px 10px">Remove</button></td>
  </tr>`;
}

export function addCollaboratorDialog(reviewId) {
  return `<div id="collab-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:400px;width:100%">
      <h3 style="font-size:16px;font-weight:600;color:var(--color-text);margin:0 0 16px">Add Collaborator</h3>
      <div class="form-field" style="margin-bottom:12px">
        <label class="form-label">Email</label>
        <input type="email" id="collab-email" class="form-input" placeholder="collaborator@example.com"/>
      </div>
      <div class="form-field" style="margin-bottom:16px">
        <label class="form-label">Role</label>
        <select id="collab-role" class="form-input">
          <option value="viewer">Viewer</option>
          <option value="commenter">Commenter</option>
          <option value="editor">Editor</option>
        </select>
      </div>
      <div class="form-actions" style="padding-top:0;margin-top:0">
        <button onclick="document.getElementById('collab-dialog').style.display='none'" class="btn-ghost-clean" style="font-size:13px;padding:8px 16px">Cancel</button>
        <button onclick="addCollaborator('${esc(reviewId)}')" class="btn-primary-clean" style="font-size:13px;padding:8px 16px">Add</button>
      </div>
    </div>
  </div>`;
}
