(async function(){
 'use strict';
 const $=id=>document.getElementById(id),D=window.R05DATA;
 try {
  await window.courtyardAppearance.ready;
  const A=window.courtyard,T=window.treePlacement,{scene,camera,renderer}=A;
  document.title='C04 · '+D.label;
  $('r05-mean').textContent=D.case.metrics.dull_mean_DLI.toFixed(2);$('r05-coverage').textContent=(D.case.metrics.dull_share_ge4*100).toFixed(1)+'%';
  T.setOrientation('foyer');T.setOffset(D.pose.actual_pot_y_m);
  T.clearanceUniforms.enabled.value=0;T.clashes.visible=false;
  T.solidLayer.position.fromArray(D.pose.tree_origin_render_m);
  T.solidLayer.rotation.z=Math.PI;T.solidLayer.updateMatrixWorld(true);
  const v=a=>new THREE.Vector3(...a),layer=new THREE.Group(),bodyMeshes=[],groups=[],tags=[];
  layer.name='R05 exact saved fixture layout';scene.add(layer);
  const leafMeshes=[];T.solidLayer.traverse(o=>{if(o.isMesh&&(o.userData.leaf||o.userData.volume))leafMeshes.push([o,o.visible]);});
  const decode=s=>{const raw=atob(s),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return new Float32Array(bytes.buffer);};
  const xyz=decode(D.xyz),electric=D.electric.map(decode),days={dull:decode(D.daylight.dull),typical:decode(D.daylight.typical)};
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(xyz,3));
  geom.setAttribute('color',new THREE.BufferAttribute(new Float32Array(D.point_count*3),3));
  const cloud=new THREE.Points(geom,new THREE.PointsMaterial({size:.016,vertexColors:true,sizeAttenuation:true,toneMapped:false}));
  cloud.name='R05 retained scored foliage';cloud.visible=false;scene.add(cloud);
  function rod(a,b,r,color,parent){const direction=v(b).sub(v(a));if(direction.length()<1e-6)return;
   const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),12),new THREE.MeshStandardMaterial({color,roughness:.65}));
   mesh.position.copy(v(a).add(v(b)).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());parent.add(mesh);return mesh;}
  function line(a,b,color,parent){const g=new THREE.BufferGeometry().setFromPoints([v(a),v(b)]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.6}));parent.add(l);}
  const poleGroup=new THREE.Group();poleGroup.name='R05 two provisional pole shafts';layer.add(poleGroup);
  const axes=new Map();
  D.schedule.fixtures.filter(f=>f.role==='pole').forEach(f=>axes.set(JSON.stringify(f.pole_axis_xy_m),f));
  const supports=new THREE.Group();supports.name='R05 two-point bay-window and rear-wall grips';layer.add(supports);
  axes.forEach(f=>{const [x,y]=f.pole_axis_xy_m;rod([x,y,-.55],[x,y,2.35],.03,0x56675d,poleGroup);for(const z of [-.35,.45]){const support=rod([x,y,z],[x,.545,z],.016,0x74847a,supports);support.userData={start:[x,y,z],end:[x,.545,z],qualification:'ILLUSTRATIVE_NOT_ENGINEERED'};const plate=new THREE.Mesh(new THREE.BoxGeometry(.08,.008,.09),new THREE.MeshStandardMaterial({color:0x74847a}));plate.position.set(x,.541,z);supports.add(plate);}line([x,.545,.57],[x,.545,3.0338],0xd09b38,supports);});
  D.schedule.fixtures.forEach((f,i)=>{
   const group=new THREE.Group(),beams=new THREE.Group();group.name=f.id;group.userData.fixtureIndex=i;group.add(beams);layer.add(group);
   const color=f.role==='overhead'?0xc16a35:f.product_id.includes('maxi')?0x755791:f.role==='pole'?0x307f7a:0x416eb1;
   const mat=new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.25});
   const body=new THREE.Mesh(new THREE.BoxGeometry(...f.body_dimensions_m),mat),R=f.rotation_local_to_world;
   body.position.fromArray(f.body_center_m);
   body.setRotationFromMatrix(new THREE.Matrix4().makeBasis(v(R.map(r=>r[0])),v(R.map(r=>r[1])),v(R.map(r=>r[2]))));
   body.userData.fixtureIndex=i;group.add(body);bodyMeshes.push(body);
   const marker=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),new THREE.MeshBasicMaterial({color:0xffe8b5}));
   marker.position.fromArray(f.source_m);group.add(marker);
   if(f.role==='pole'){rod(f.mount_anchor_m,f.hinge_m,.014,0x6a796d,group);rod(f.hinge_m,f.body_center_m,.012,0x6a796d,group);}
   else if(f.role==='wall'||f.role==='soffit'){
    const normal=v(f.mount_plane_normal),u=v(f.mount_u),vv=new THREE.Vector3().crossVectors(normal,u).normalize();
    const plate=new THREE.Mesh(new THREE.BoxGeometry(...f.base_dimensions_m),new THREE.MeshStandardMaterial({color:0x8190a0,roughness:.6}));
    plate.name='Assumed direct-mount base';plate.position.copy(v(f.mount_anchor_m).addScaledVector(normal,.0015));plate.setRotationFromMatrix(new THREE.Matrix4().makeBasis(u,vv,normal));group.add(plate);
    rod(f.mount_anchor_m,f.hinge_m,.012,0x8190a0,group);rod(f.hinge_m,f.body_center_m,.010,0x8190a0,group);
   } else line(f.mount_anchor_m,f.body_center_m,0x78887b,group);
   const source=v(f.source_m),axis=v(f.optical_axis).normalize(),length=1.35,end=source.clone().addScaledVector(axis,length);
   beams.add(new THREE.ArrowHelper(axis,source,length,color,.12,.06));
   const radius=length*Math.tan(D.beams[i]*Math.PI/360);
   const u=new THREE.Vector3(0,0,1).cross(axis).normalize();if(u.length()<.1)u.set(1,0,0);
   const q=axis.clone().cross(u).normalize(),ring=[];
   for(let k=0;k<=48;k++){const p=end.clone().addScaledVector(u,radius*Math.cos(k/48*2*Math.PI)).addScaledVector(q,radius*Math.sin(k/48*2*Math.PI));ring.push(p);if(k%12===0)line(source.toArray(),p.toArray(),color,beams);}
   beams.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),new THREE.LineBasicMaterial({color,transparent:true,opacity:.36})));
   const tag=document.createElement('span');tag.className='r05-tag';tag.textContent=D.names[i].split(' · ')[0]+' · '+(f.role==='overhead'?f.watts+' W':f.product_id.includes('maxi')?'Maxi':'Medium');tag.style.borderColor='#'+color.toString(16);$('r05-tags').append(tag);
   tags.push({tag,source:source.clone().add(new THREE.Vector3(0,0,.13)),i});groups.push({group,beams,body});
   const option=document.createElement('option');option.value=String(i);option.textContent=D.names[i];$('r05-source').append(option);
  });
  function selected(){const s=$('r05-source').value;return D.schedule.fixtures.map((f,i)=>i).filter(i=>s==='all'||s===String(i)||(s==='targetti'&&D.schedule.fixtures[i].product_id.startsWith('targetti'))||(s==='maxi'&&D.schedule.fixtures[i].product_id.includes('maxi'))||D.schedule.fixtures[i].role===s);}
  function updateEye(){const i=Number($('r05-receiver').value);if(!Number.isInteger(i)||!D.receivers[i])return;const e=D.receivers[i],sum=selected().reduce((s,k)=>s+D.eye[k][i],0);
   let max=0;D.receivers.forEach((r,j)=>{if(r.zone===e.zone)max=Math.max(max,D.eye.reduce((s,a)=>s+a[j],0));});
   $('r05-eye-score').textContent='Selected view: '+sum.toFixed(1)+' lx. All-light maximum across this location, both heights: '+max.toFixed(1)+' lx. Centre sheer raised.';}
  function fillEyes(){const zone=$('r05-zone').value,posture=$('r05-posture').value,sel=$('r05-receiver');sel.replaceChildren();let worst=-1,best=-1;
   D.receivers.forEach((r,i)=>{if(r.zone!==zone||r.posture!==posture)return;const opt=document.createElement('option');opt.value=String(i);opt.textContent=r.id.replace(zone+'-'+posture+'-','Position ')+' · '+r.heading_offset_deg+'°';sel.append(opt);const s=D.eye.reduce((sum,a)=>sum+a[i],0);if(s>best){best=s;worst=i;}});
   sel.value=String(worst);updateEye();}
  const palette=[0xa33e3e,0xd27932,0xd4b749,0x5aab8b,0x248fbc,0x6652ac].map(c=>new THREE.Color(c));
  let lastValues=null;
  let cutawayRestore=[];
  function setMountCutaway(active){
   for(const [o,visible] of cutawayRestore)o.visible=visible;cutawayRestore=[];
   if(!active)return;
   const appearance=window.courtyardAppearance;
   const hostNames=new Set(D.schedule.fixtures.filter(f=>f.surface_id).map(f=>f.mount_slab)); const keep=name=>hostNames.has(name)||name==='sill head'||name==='sill tiled_retaining_edge'||name.includes('mullion');
   for(const e of appearance.entries){cutawayRestore.push([e.mesh,e.mesh.visible]);e.mesh.visible=keep(e.b.name);}
   for(const o of [appearance.pebbleGroup,appearance.fabricLayer,appearance.recessBackdrop,T.solidLayer,cloud])if(o){cutawayRestore.push([o,o.visible]);o.visible=false;}
   $('r05-caption').textContent='Mounting cutaway: tree and other structure hidden. Gray direct-mount plates and links use assumed dimensions; real bracket and fixings remain unqualified.';
  }
  function update(){
   setMountCutaway(false);
   const mode=$('r05-mode').value,sel=selected(),set=new Set(sel);cloud.visible=mode!=='layout';leafMeshes.forEach(([m,visible])=>m.visible=mode==='layout'&&visible);
   groups.forEach((g,i)=>{g.body.material.transparent=!set.has(i);g.body.material.opacity=set.has(i)?1:.25;g.beams.visible=$('r05-beams').checked&&set.has(i);});
   const single=sel.length===1?D.schedule.fixtures[sel[0]]:null;
   $('r05-detail').textContent=single?D.names[sel[0]]+'. Aim '+single.pan_deg.toFixed(1)+'° yaw, '+Math.abs(single.tilt_deg).toFixed(1)+'° down. Source '+single.source_m.map(n=>n.toFixed(3)).join(', ')+' m (deck frame).':sel.length+' selected luminaires. Orange: Philips · teal: pole Medium · blue: wall Medium · purple: Maxi.';
   let sum=0,above=0;const values=new Float64Array(D.point_count),isPPFD=mode==='electric',day=days[mode==='typical'?'typical':'dull'];
   for(let p=0;p<D.point_count;p++){let e=0;for(const i of sel)e+=electric[i][p];values[p]=isPPFD?e:day[p]+e*.0414;sum+=values[p];above+=values[p]>=4;}
   lastValues=values;
   $('r05-filter-score').textContent=isPPFD?'Selected sources · mean electric PPFD '+(sum/D.point_count).toFixed(1)+' µmol/m²/s.':(mode==='typical'?'Typical':'Dull')+' daylight + selected sources: mean '+(sum/D.point_count).toFixed(3)+' DLI; '+(above/D.point_count*100).toFixed(1)+'% ≥4.';
   if(cloud.visible){const a=geom.attributes.color,thresholds=isPPFD?[25,50,100,150,250]:[1,2,3,4,6];for(let p=0;p<values.length;p++){let k=0;while(k<thresholds.length&&values[p]>=thresholds[k])k++;const c=palette[k];a.setXYZ(p,c.r,c.g,c.b);}a.needsUpdate=true;}
   $('r05-legend').hidden=!cloud.visible;$('r05-legend-title').textContent=isPPFD?'Electric PPFD · µmol/m²/s':'DLI · mol/m²/day';
   $('r05-legend-scale').textContent=isPPFD?'0 · 25 · 50 · 100 · 150 · 250+':'0 · 1 · 2 · 3 · 4 · 6+';
   $('r05-caption').textContent=cloud.visible?'Calculated dose on 62,246 retained foliage samples. Colours are not photographic brightness.':'Saved positions and aims. Beam outlines are schematic; mounting remains provisional.';
   updateEye();if(window.R05?.lastView==='mounts')setMountCutaway(true);
    document.dispatchEvent(new Event('bonsai:lighting-update'));
  }
  function cameraView(name){
   const views={foyer:{eye:[-.5,4.5,3.2],target:[0,-.05,1.35],fov:52},courtyard:{eye:[-3,-5,3.1],target:[0,-.15,1.25],fov:50},aerial:{eye:[0,-.001,8.5],target:[0,-.1,0],fov:44},mounts:{eye:[-.5,4.5,3.2],target:[0,-.05,1.35],fov:52}};
   setMountCutaway(false);A.setCamera(views[name]);window.R05.lastView=name;update();
  }
  function resize(){const canvas=renderer.domElement;renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;const base=camera.userData.baseFov||52;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base/2))*Math.max(1,1.25/camera.aspect)));camera.updateProjectionMatrix();}
  $('r05-toggle').onclick=()=>{const collapsed=$('r05-panel').dataset.collapsed!=='true';$('r05-panel').dataset.collapsed=String(collapsed);$('r05-toggle').setAttribute('aria-expanded',String(!collapsed));$('r05-toggle').textContent=collapsed?'Show model controls ↑':'Hide model controls ↓';};
  $('r05-panel').dataset.collapsed=String(innerWidth<721);
  for(const name of ['foyer','courtyard','aerial','mounts'])$('r05-'+name).onclick=()=>{cameraView(name);resize();};
  for(const id of ['r05-mode','r05-source','r05-beams','r05-labels'])$(id).onchange=update;
  $('r05-zone').onchange=fillEyes;$('r05-posture').onchange=fillEyes;$('r05-receiver').onchange=updateEye;
  $('r05-eye').onclick=()=>{setMountCutaway(false);window.R05.lastView='eye';update();const e=D.receivers[Number($('r05-receiver').value)],target=e.xyz_m.map((n,k)=>n+e.normal[k]);A.setCamera({eye:[-e.xyz_m[0],e.xyz_m[1],e.xyz_m[2]],target:[-target[0],target[1],target[2]],fov:65});resize();window.R05.lastView='eye';};
  let down=null;const ray=new THREE.Raycaster();renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(bodyMeshes)[0];if(hit){$('r05-source').value=String(hit.object.userData.fixtureIndex);update();}});
  function labels(){requestAnimationFrame(labels);const rect=renderer.domElement.getBoundingClientRect(),set=new Set(selected()),placed=[];for(const {tag,source,i} of tags){const p=source.clone().project(camera),visible=$('r05-labels').checked&&set.has(i)&&p.z>-1&&p.z<1&&Math.abs(p.x)<.98&&Math.abs(p.y)<.98;tag.hidden=!visible;if(visible){const x=rect.left+(p.x*.5+.5)*rect.width;let y=rect.top+(-p.y*.5+.5)*rect.height;while(placed.some(t=>Math.abs(t.x-x)<88&&Math.abs(t.y-y)<24))y+=24;placed.push({x,y});tag.style.left=x+'px';tag.style.top=y+'px';}}}
  window.R05={ready:false,data:D,layer,groups,poleGroup,supports,cloud,selected,update,fillEyes,cameraView,resize,get values(){return lastValues;},get eyeIndex(){return Number($('r05-receiver').value);}};
  fillEyes();update();cameraView('foyer');window.addEventListener('resize',resize);resize();labels();
  window.R05.ready=true;
 }catch(error){$('r05-error').hidden=false;$('r05-error').textContent='C04 could not finish loading: '+error.message;console.error(error);}
})();
// Independent pad labels, drawn directly on their saved scored-pad anchors.
(function () {
  'use strict';
  const pads = [{"number":1,"label":"B6","center":[-0.4009944878028203,-0.25390309291830454,0.6240295384023853]},{"number":2,"label":"B4","center":[1.0856794643303456,0.08568236521918994,0.7862956173226096]},{"number":3,"label":"B5","center":[0.11089585606470057,-0.734740108100273,0.765599304993572]},{"number":4,"label":"B3","center":[0.844040179071971,-0.5085114544617934,0.8685533385954466]},{"number":5,"label":"B2","center":[0.430325045965665,0.24881818454697693,0.8931598054701775]},{"number":6,"label":"B1","center":[-0.16744927774170362,0.24508507548068892,0.9619622283102037]},{"number":7,"label":"M3","center":[0.6492528079447465,-0.07376248409660528,1.201564834374861]},{"number":8,"label":"M2","center":[-0.5270471247668428,0.11058525401292493,1.2583719436786491]},{"number":9,"label":"M1","center":[-0.10461116523622235,-0.837828144337514,1.3395159417510631]},{"number":10,"label":"T5","center":[0.017217167173396504,0.23501351281131644,1.5749454824229194]},{"number":11,"label":"T4","center":[0.49295143922447326,-0.341176728103477,1.5868486169803653]},{"number":12,"label":"T3","center":[-0.5892113492764097,-0.24008568546200912,1.6032870122160332]},{"number":13,"label":"T2","center":[-0.12638327416575482,-0.6185168895925393,1.7785393946290369]},{"number":14,"label":"T1","center":[-0.06051048209673958,-0.09808869353077661,2.0802376322093035]}];
  function initialize() {
    if (!window.R05?.ready) {
      if (!document.getElementById('r05-error')?.hidden) return;
      requestAnimationFrame(initialize);return;
    }
    const fixtureToggle=document.getElementById('r05-labels');
    const label=document.createElement('label');label.className=fixtureToggle.closest('label').className;
    const toggle=document.createElement('input');toggle.type='checkbox';toggle.id='r05-pad-numbers';
    label.append(toggle,document.createTextNode(' Pad numbers (B / M / T)'));fixtureToggle.closest('label').after(label);
    const style=document.createElement('style');
    style.textContent='.r06-pad-overlay{position:fixed;inset:0;pointer-events:none;z-index:6}.r06-pad-number{position:fixed;box-sizing:border-box;transform:translate(-50%,-50%);width:32px;height:23px;display:grid;place-items:center;border:1px solid #31583e;border-radius:5px;background:#fffef5;color:#173628;font:800 14px/1 system-ui;box-shadow:0 1px 4px #102d2940;white-space:nowrap}.r06-pad-number[hidden],.r06-pad-overlay[hidden]{display:none}';
    document.head.append(style);
    const overlay=document.createElement('div');overlay.className='r06-pad-overlay';overlay.dataset.layout='on-pad-v4';overlay.setAttribute('aria-label','Tree pad numbers');
    const nodes=pads.map(pad=>{const tag=document.createElement('span');tag.className='r06-pad-number';tag.textContent=pad.label;tag.dataset.originalPad='P'+pad.number;overlay.append(tag);return {tag,point:new THREE.Vector3(...pad.center)};});
    overlay.hidden=true;document.body.append(overlay);
    if(new URLSearchParams(location.search).get('pads')==='1'){
      toggle.checked=true;fixtureToggle.checked=false;document.getElementById('r05-beams').checked=false;window.R05.update();
    }
    const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    const box=(x,y)=>({left:x-18,right:x+18,top:y-13,bottom:y+13});
    let lastState='',phoneFocus=false;
    toggle.addEventListener('change',()=>{overlay.hidden=!toggle.checked||window.R05.lastView==='mounts';lastState='';});
    function draw(){
      requestAnimationFrame(draw);
      const hidden=!toggle.checked||window.R05.lastView==='mounts';overlay.hidden=hidden;
      const {renderer,camera}=window.courtyard,rect=renderer.domElement.getBoundingClientRect();
      const focus=!hidden&&rect.width<600;
      // Bring the tree closer in the phone's pad view; restore the normal view when off.
      if(focus||phoneFocus){
        const base=camera.userData.baseFov||52;
        const tangent=Math.tan(THREE.MathUtils.degToRad(base/2))*Math.max(1,1.25/camera.aspect);
        const fov=THREE.MathUtils.radToDeg(2*Math.atan(tangent*(focus ? (window.R05.lastView==='aerial' ? .42 : .62) : 1)));
        if(Math.abs(camera.fov-fov)>.001){camera.fov=fov;camera.updateProjectionMatrix();}
      }
      phoneFocus=focus;
      if(hidden){lastState='';return;}
      const state=[...camera.matrixWorld.elements,...camera.projectionMatrix.elements,rect.left,rect.top,rect.width,rect.height].join(',');
      if(state===lastState)return;lastState=state;
      const projected=[];
      for(const node of nodes){
        const p=node.point.clone().project(camera),visible=p.z>-1&&p.z<1&&Math.abs(p.x)<.97&&Math.abs(p.y)<.97;
        node.tag.hidden=!visible;if(!visible)continue;
        projected.push({node,x:rect.left+(p.x*.5+.5)*rect.width,y:rect.top+(-p.y*.5+.5)*rect.height});
      }
      const placed=[];
      projected.sort((a,b)=>a.y-b.y||a.x-b.x);
      for(const p of projected){
        let best=null;
        // Stay over the pad: only a small local nudge is allowed when labels overlap.
        for(const radius of [0,8,14,20])for(const angle of [-90,-45,-135,0,180,45,135,90]){
          const theta=angle*Math.PI/180,x=p.x+Math.cos(theta)*radius,y=p.y+Math.sin(theta)*radius,bounds=box(x,y);
          const clipped=x<rect.left+18||x>rect.right-18||y<rect.top+13||y>rect.bottom-13;
          const score=placed.reduce((sum,q)=>sum+area(bounds,q),0)*1000+radius+(clipped?100000:0);
          if(!best||score<best.score)best={x,y,bounds,score,radius};
        }
        p.node.tag.style.left=best.x+'px';p.node.tag.style.top=best.y+'px';
        p.node.tag.dataset.anchorX=p.x;p.node.tag.dataset.anchorY=p.y;
        placed.push(best.bounds);
      }
    }
    draw();
  }
  initialize();
})();
// Independent light-map control: display only, using the saved per-point values.
(function () {
  'use strict';
  function initialize() {
    if (!window.R05?.ready) {
      if (!document.getElementById('r05-error')?.hidden) return;
      requestAnimationFrame(initialize);return;
    }
    if (document.getElementById('r06-light-map')) return;
    const $=id=>document.getElementById(id),api=window.R05,mode=$('r05-mode');
    const button=document.createElement('button');button.id='r06-light-map';button.type='button';
    button.setAttribute('aria-controls','r05-legend');button.setAttribute('aria-pressed','false');
    button.title='Colour the foliage by calculated light intensity';document.body.append(button);
    const style=document.createElement('style');style.textContent=`
      #r06-light-map{position:fixed;right:16px;top:90px;z-index:24;min-height:44px;padding:10px 15px;border:1px solid #5d786d;border-radius:9px;background:#fffef9;color:#203d33;font:700 14px system-ui;box-shadow:0 2px 9px #193b2920;cursor:pointer}
      #r06-light-map[aria-pressed=true]{background:#214b3d;color:white;border-color:#214b3d}
      #r06-light-map:focus-visible,#r06-map-metric:focus-visible{outline:3px solid #e89725;outline-offset:3px}
      body[data-light-map=on] #r05-note{justify-content:flex-end}
      body[data-light-map=on] #r05-caption{display:none}
      body[data-light-map=on] #r05-legend{pointer-events:auto;width:320px;max-width:calc(100vw - 24px);min-width:0;font-size:12px;padding:10px 12px;background:#fffef9f5}
      #r06-map-metric{display:block;width:100%;font:600 12px system-ui;min-height:34px;margin:0 0 7px;color:#234235;background:white;border:1px solid #a8b9af;border-radius:5px;padding:4px}
      #r05-legend-scale{display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}
      #r06-map-stats{margin-top:7px;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums}
      #r06-map-explainer{margin-top:4px;font-size:10px;line-height:1.4;color:#56675f}
      @media(max-width:720px){#r06-light-map{top:100px;right:12px}body[data-light-map=on] #r05-legend{width:270px}}
    `;document.head.append(style);
    const legend=$('r05-legend'),metric=document.createElement('select');metric.id='r06-map-metric';
    metric.setAttribute('aria-label','Light map measurement');
    for(const [value,label] of [['electric','Electric intensity · PPFD'],['dull','Total DLI · dull day'],['typical','Total DLI · typical day']]){
      const option=document.createElement('option');option.value=value;option.textContent=label;metric.append(option);
    }
    legend.prepend(metric);
    const stats=document.createElement('div');stats.id='r06-map-stats';legend.append(stats);
    const explainer=document.createElement('div');explainer.id='r06-map-explainer';
    explainer.textContent='Blue = less light · red = more. Model estimate, not a burn-risk scale.';legend.append(explainer);
    const colors=['#183b65','#2b83b6','#45b79a','#c9df67','#fee08b','#f46d43','#a50026'];
    const rgb=colors.map(c=>new THREE.Color(c));
    let lastMode='electric',savedGuides=null;
    function sync() {
      const active=mode.value!=='layout',visible=active&&api.lastView!=='mounts';
      document.body.dataset.lightMap=active?'on':'off';
      button.setAttribute('aria-pressed',String(active));button.textContent='Light map: '+(active?'on':'off');
      legend.hidden=!visible;
      if(!active)return;
      lastMode=mode.value;metric.value=mode.value;
      const ppfd=mode.value==='electric',stops=ppfd?[0,50,100,150,200,300,400]:[0,2,4,6,8,12,16];
      const maximum=stops[stops.length-1],values=api.values,attribute=api.cloud.geometry.attributes.color;
      let sum=0,peak=0;
      for(let p=0;p<values.length;p++){
        const value=values[p];sum+=value;peak=Math.max(peak,value);
        const x=Math.max(0,Math.min(maximum,value));let k=0;
        while(k<stops.length-2&&x>stops[k+1])k++;
        const t=(x-stops[k])/(stops[k+1]-stops[k]),a=rgb[k],b=rgb[k+1];
        attribute.setXYZ(p,a.r+(b.r-a.r)*t,a.g+(b.g-a.g)*t,a.b+(b.b-a.b)*t);
      }
      attribute.needsUpdate=true;
      $('r05-legend-title').textContent=ppfd?'Electric light · µmol/m²/s':'Daylight + electric light · mol/m²/day';
      legend.querySelector('.r05-gradient').style.background='linear-gradient(90deg,'+colors.map((c,i)=>c+' '+stops[i]/maximum*100+'%').join(',')+')';
      $('r05-legend-scale').replaceChildren(...(ppfd?[0,100,200,300,'400+']:[0,4,8,12,'16+']).map(x=>{
        const label=document.createElement('span');label.textContent=x;return label;
      }));
      const all=api.selected().length===api.data.schedule.fixtures.length;
      stats.textContent=(all?'All lights':'Selected lights')+' · mean '+(sum/values.length).toFixed(ppfd?1:2)+' · peak '+peak.toFixed(ppfd?0:2);
      button.dataset.peak=peak;button.dataset.metric=mode.value;
    }
    function change(active) {
      if(active){
        savedGuides=[$('r05-beams').checked,$('r05-labels').checked];
        $('r05-beams').checked=false;$('r05-labels').checked=false;
        mode.value=lastMode;
        if(api.lastView==='mounts')api.cameraView('foyer');
      }else{
        mode.value='layout';
        if(savedGuides){[$('r05-beams').checked,$('r05-labels').checked]=savedGuides;savedGuides=null;}
      }
      api.update();sync();
    }
    button.addEventListener('click',()=>change(mode.value==='layout'));
    metric.addEventListener('change',()=>{mode.value=metric.value;api.update();sync();});
    document.addEventListener('bonsai:lighting-update',sync);
    // Both the existing View menu and the quick button control the same visible map.
    sync();
    const requested=new URLSearchParams(location.search).get('lightmap');
    if(['1','electric','dull','typical'].includes(requested)){
      lastMode=requested==='1'?'electric':requested;change(true);
    }
    button.dataset.ready='true';
  }
  initialize();
})();
