const $ = s => document.querySelector(s);
const fileInput=$("#fileInput"), dropZone=$("#dropZone"), chooseBtn=$("#chooseBtn");
const settings=$("#settings"), results=$("#results"), resultList=$("#resultList");
const quality=$("#quality"), qualityValue=$("#qualityValue"), format=$("#format");
const compressBtn=$("#compressBtn"), clearBtn=$("#clearBtn"), downloadAll=$("#downloadAll");
const themeBtn=$("#themeBtn"), toast=$("#toast");
let files=[], compressed=[];

function showToast(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2600)}
chooseBtn.onclick=()=>fileInput.click();
dropZone.addEventListener("click",e=>{if(e.target===dropZone)fileInput.click()});
fileInput.onchange=e=>addFiles([...e.target.files]);
["dragenter","dragover"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove("drag")}));
dropZone.addEventListener("drop",e=>addFiles([...e.dataTransfer.files]));

function addFiles(list){
 const valid=list.filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type)).slice(0,20-files.length);
 if(!valid.length){showToast("Please choose JPG, PNG or WebP images.");return}
 files.push(...valid); settings.classList.remove("hidden"); renderQueue();
 showToast(`${valid.length} image${valid.length>1?"s":""} added`);
}
function renderQueue(){
 resultList.innerHTML=files.map((f,i)=>`<div class="result-item"><div class="thumb"></div><div><div class="file-name">${escapeHtml(f.name)}</div><div class="sizes">${formatBytes(f.size)} · Waiting for compression</div></div><button class="item-download" disabled>—</button></div>`).join("");
 results.classList.remove("hidden"); $("#resultSummary").textContent=`${files.length} image${files.length>1?"s":""} selected`;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
quality.oninput=()=>qualityValue.textContent=quality.value+"%";
clearBtn.onclick=()=>{files=[];compressed=[];fileInput.value="";settings.classList.add("hidden");results.classList.add("hidden");resultList.innerHTML=""};
compressBtn.onclick=async()=>{
 if(!files.length)return;
 compressBtn.disabled=true;compressBtn.textContent="Compressing…";
 compressed=[];
 for(const file of files){try{compressed.push(await compressImage(file,+quality.value,format.value))}catch(e){showToast("Could not compress one image.")}}
 renderResults();compressBtn.disabled=false;compressBtn.innerHTML='Compress Images <span>→</span>';
};
function compressImage(file,q,out){
 return new Promise((resolve,reject)=>{
  const img=new Image(), url=URL.createObjectURL(file);
  img.onload=()=>{
   const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);
   let mime=out==="original"?file.type:out;
   if(mime==="image/png" && q<100)mime="image/webp";
   canvas.toBlob(blob=>{URL.revokeObjectURL(url);if(!blob)return reject();resolve({file,blob,mime})},mime,q/100);
  };img.onerror=reject;img.src=url;
 });
}
function renderResults(){
 resultList.innerHTML="";let totalBefore=0,totalAfter=0;
 compressed.forEach((r,i)=>{
  totalBefore+=r.file.size;totalAfter+=r.blob.size;
  const row=document.createElement("div");row.className="result-item";
  const url=URL.createObjectURL(r.blob), imgUrl=URL.createObjectURL(r.file);
  const ext=r.mime==="image/webp"?"webp":r.mime==="image/png"?"png":"jpg";
  const name=r.file.name.replace(/\.[^.]+$/,"")+"."+ext;
  const saved=Math.max(0,Math.round((1-r.blob.size/r.file.size)*100));
  row.innerHTML=`<img class="thumb" src="${imgUrl}" alt=""><div><div class="file-name">${escapeHtml(name)}</div><div class="sizes">${formatBytes(r.file.size)} → <b>${formatBytes(r.blob.size)}</b> · <span class="saved">${saved>0?saved+"% smaller":"no reduction"}</span></div></div><button class="item-download">Download</button>`;
  row.querySelector("button").onclick=()=>downloadBlob(r.blob,name);
  resultList.appendChild(row);
  row.dataset.url=url;row.dataset.name=name;
 });
 const saved=Math.max(0,Math.round((1-totalAfter/totalBefore)*100));
 $("#resultSummary").textContent=`${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} · ${saved}% smaller`;
 showToast("Compression complete");
}
downloadAll.onclick=()=>compressed.forEach((r,i)=>{const ext=r.mime==="image/webp"?"webp":r.mime==="image/png"?"png":"jpg";downloadBlob(r.blob,r.file.name.replace(/\.[^.]+$/,"")+"."+ext,i*250)});
function downloadBlob(blob,name,delay=0){setTimeout(()=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove()},delay)}
function formatBytes(n){if(!n)return"0 B";const u=["B","KB","MB","GB"],i=Math.floor(Math.log(n)/Math.log(1024));return (n/Math.pow(1024,i)).toFixed(i?2:0)+" "+u[i]}
themeBtn.onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("px-theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("px-theme")==="light")document.body.classList.add("light");
