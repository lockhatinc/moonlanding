export function globalTagsSystem(entityType, entityId) {
  return `<div class="card bg-white shadow mb-4"><div class="card-body"><div class="flex justify-between items-center"><h3 class="card-title text-sm">Tags</h3><button class="btn btn-xs btn-ghost" onclick="gtsToggleEdit()">Edit</button></div><div id="gts-tags" class="ts-badges mt-2"></div><div id="gts-edit" style="display:none" class="mt-2"><div class="flex gap-2"><input id="gts-new" class="input input-bordered input-sm flex-1" placeholder="New tag..."/><button class="btn btn-primary btn-sm" onclick="gtsAdd()">Add</button></div></div></div></div>
  <script>
  var gtsEntityType='${entityType}',gtsEntityId='${entityId}',gtsTags=[];
  function gtsRender(){var el=document.getElementById('gts-tags');el.innerHTML='';if(!gtsTags.length){el.innerHTML='<span class="text-xs text-gray-500">No tags</span>';return}gtsTags.forEach(function(t,i){el.innerHTML+='<span class="ts-badge">'+t+' <span class="ts-badge-x" onclick="gtsRemove('+i+')">&times;</span></span>'})}
  (function(){fetch('/api/'+gtsEntityType+'/'+gtsEntityId).then(function(r){return r.json()}).then(function(d){var item=d.data||d;try{gtsTags=JSON.parse(item.tags||'[]')}catch(e){gtsTags=[]}gtsRender()}).catch(function(){})})();
  window.gtsToggleEdit=function(){var el=document.getElementById('gts-edit');el.style.display=el.style.display==='none'?'block':'none'};
  window.gtsAdd=async function(){var v=document.getElementById('gts-new').value.trim();if(!v)return;gtsTags.push(v);try{await fetch('/api/'+gtsEntityType+'/'+gtsEntityId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({tags:JSON.stringify(gtsTags)})});document.getElementById('gts-new').value='';gtsRender();showToast('Tag added','success')}catch(e){gtsTags.pop();showToast('Error','error')}};
  window.gtsRemove=async function(idx){var removed=gtsTags.splice(idx,1);try{await fetch('/api/'+gtsEntityType+'/'+gtsEntityId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({tags:JSON.stringify(gtsTags)})});gtsRender();showToast('Tag removed','success')}catch(e){gtsTags.splice(idx,0,removed[0]);showToast('Error','error')}};
  </script>`;
}
