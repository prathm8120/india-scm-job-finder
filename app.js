
const $ = id => document.getElementById(id);
let allJobs = [];
let filteredJobs = [];
let resumeText = "";
let resumeTerms = new Set();

const ids = ["dateFilter","companyFilter","industryFilter","categoryFilter","roleFilter","experienceFilter","levelFilter","stateFilter","cityFilter","talukaFilter","industrialFilter","employmentFilter","workModeFilter","sourceFilter","cvFilter"];

const INDIA_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
const MAHARASHTRA_CITIES = ["Pune","Pimpri-Chinchwad","Mumbai","Navi Mumbai","Thane","Nashik","Nagpur","Chhatrapati Sambhajinagar","Kolhapur","Satara","Sangli","Solapur","Raigad","Ahmednagar"];

function populateLocations(){
  INDIA_STATES.forEach(x=>{const o=document.createElement("option");o.value=o.textContent=x;$("stateFilter").appendChild(o)});
}
populateLocations();

$("stateFilter").addEventListener("change",()=>{
  $("cityFilter").innerHTML='<option value="">All districts/cities</option>';
  if($("stateFilter").value==="Maharashtra"){
    MAHARASHTRA_CITIES.forEach(x=>{const o=document.createElement("option");o.value=o.textContent=x;$("cityFilter").appendChild(o)});
  }
  updateActive();
});

function normalize(s){return (s||"").toString().toLowerCase().trim()}
function tokenize(text){
  const stop = new Set(["and","the","for","with","from","that","this","years","year","job","role","work","team","india","skills","skill","required","preferred","experience","responsibilities","responsibility"]);
  return new Set(normalize(text).replace(/[^a-z0-9+#./ -]/g," ").split(/\s+/).filter(x=>x.length>2&&!stop.has(x)));
}
function calcCvMatch(job){
  if(!resumeText.trim()) return {score:null,label:"Pending CV",matched:[],missing:[]};
  const corpus = [job.role,job.job_title,job.category,job.subcategory,job.key_skills,job.qualification,job.description,job.tools].flat().join(" ");
  const terms=[...tokenize(corpus)];
  if(!terms.length) return {score:0,label:"Lower",matched:[],missing:[]};
  const matched=terms.filter(t=>resumeTerms.has(t));
  const score=Math.min(100,Math.round((matched.length/Math.max(terms.length,12))*100*2.2));
  const label=score>=90?"Excellent":score>=75?"High":score>=60?"Medium":"Lower";
  return {score,label,matched:matched.slice(0,12),missing:terms.filter(t=>!resumeTerms.has(t)).slice(0,12)};
}
function enrichJobs(){allJobs=allJobs.map(j=>({...j,_cv:calcCvMatch(j)}))}
function daysOld(date){
  if(!date||date==="Not specified") return null;
  const d=new Date(date); if(isNaN(d)) return null;
  return Math.floor((Date.now()-d.getTime())/86400000);
}
function expMatches(job, val){
  if(!val) return true;
  const min=Number(job.experience_min), max=Number(job.experience_max);
  if(val==="fresher") return normalize(job.experience).includes("fresher") || (!isNaN(min)&&min===0);
  if(val==="10+") return !isNaN(max)?max>=10:(!isNaN(min)&&min>=10);
  const [a,b]=val.split("-").map(Number);
  if(isNaN(min)&&isNaN(max)) return normalize(job.experience).includes(val);
  const lo=isNaN(min)?0:min, hi=isNaN(max)?99:max;
  return hi>=a && lo<=b;
}
function contains(field,q){return !q || normalize(field).includes(normalize(q))}
function applyFilters(){
  const dateVal=$("dateFilter").value;
  filteredJobs=allJobs.filter(j=>{
    const age=daysOld(j.posting_date);
    const dateOk=!dateVal || (dateVal==="today" ? age===0 : age!==null && age<=Number(dateVal));
    return dateOk
      && contains(j.company,$("companyFilter").value)
      && contains(j.industry,$("industryFilter").value)
      && contains(j.category,$("categoryFilter").value)
      && contains([j.role,j.job_title,j.subcategory].join(" "),$("roleFilter").value)
      && expMatches(j,$("experienceFilter").value)
      && contains(j.job_level,$("levelFilter").value)
      && contains(j.state,$("stateFilter").value)
      && contains([j.district_city,j.city,j.exact_location].join(" "),$("cityFilter").value)
      && contains(j.taluka_tehsil,$("talukaFilter").value)
      && contains([j.industrial_area,j.midc_sez,j.exact_location].join(" "),$("industrialFilter").value)
      && contains(j.employment_type,$("employmentFilter").value)
      && contains(j.work_mode,$("workModeFilter").value)
      && contains(j.source_type,$("sourceFilter").value)
      && (!$("cvFilter").value || j._cv.label===$("cvFilter").value);
  });
  sortJobs(); render(); updateActive();
}
function sortJobs(){
  const s=$("sortFilter").value;
  filteredJobs.sort((a,b)=>{
    if(s==="cv") return (b._cv.score??-1)-(a._cv.score??-1);
    if(s==="company") return normalize(a.company).localeCompare(normalize(b.company));
    return (new Date(b.posting_date||0))-(new Date(a.posting_date||0));
  });
}
function esc(s){return (s??"Not specified").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function render(){
  $("resultTitle").textContent=`${filteredJobs.length} verified role${filteredJobs.length===1?"":"s"}`;
  $("jobsBody").innerHTML="";
  $("emptyState").classList.toggle("hidden",filteredJobs.length>0);
  filteredJobs.forEach((j,i)=>{
    const tr=document.createElement("tr");
    const match=j._cv.score===null?"Pending CV":`${j._cv.score}% ${j._cv.label}`;
    const loc=[j.city||j.district_city,j.state].filter(Boolean).join(", ") || "Not specified";
    tr.innerHTML=`<td>${i+1}</td>
      <td><div class="company">${esc(j.company)}</div><div class="muted2">${esc(j.industry)}</div></td>
      <td><a href="#" class="detail-link" data-i="${i}">${esc(j.role||j.job_title)}</a></td>
      <td>${esc(j.category)}</td><td>${esc(loc)}</td><td>${esc(j.experience)}</td>
      <td>${esc(j.posting_date)}</td><td><span class="match ${normalize(j._cv.label)}">${esc(match)}</span></td>
      <td>${esc(j.source_type)}</td>
      <td>${j.official_apply_url && j.official_apply_url!=="Not specified" ? `<a class="apply-link" target="_blank" rel="noopener" href="${esc(j.official_apply_url)}">Apply</a>`:"Not specified"}</td>`;
    $("jobsBody").appendChild(tr);
  });
  document.querySelectorAll(".detail-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showDetail(filteredJobs[Number(a.dataset.i)])}));
}
function showDetail(j){
  const d=$("jobDetail"); d.classList.remove("hidden");
  const match=j._cv.score===null?"Pending CV":`${j._cv.score}% — ${j._cv.label}`;
  const fields=[
    ["Company",j.company],["Company Type/Industry",j.industry],["Role",j.role||j.job_title],["SCM Category",j.category],
    ["SCM Subcategory",j.subcategory],["Job Level",j.job_level],["Experience",j.experience],["Qualification",j.qualification],
    ["Country",j.country],["State",j.state],["District/City",j.district_city||j.city],["Taluka/Tehsil",j.taluka_tehsil],
    ["Industrial Area/MIDC/SEZ",j.industrial_area||j.midc_sez],["Exact Location",j.exact_location],["Work Mode",j.work_mode],
    ["Employment Type",j.employment_type],["Posting Date",j.posting_date],["Days Old",daysOld(j.posting_date)??"Not specified"],
    ["Closing Date",j.closing_date],["CV Match",match],["Application Priority",j.application_priority||"Not specified"],
    ["Source Type",j.source_type],["Current Status",j.current_status]
  ];
  d.innerHTML=`<h2>${esc(j.role||j.job_title)}</h2><p class="muted">${esc(j.company)}</p>
    <div class="detail-grid">${fields.map(([k,v])=>`<div><strong>${esc(k)}</strong>${esc(v||"Not specified")}</div>`).join("")}</div>
    <h3>Key Skills</h3><div>${(Array.isArray(j.key_skills)?j.key_skills:String(j.key_skills||"").split(",")).filter(Boolean).map(x=>`<span class="skill-chip">${esc(x.trim())}</span>`).join("")||"Not specified"}</div>
    <h3>CV comparison</h3><p><strong>Matched:</strong> ${j._cv.matched.join(", ")||"Pending/none detected"}</p><p><strong>Missing JD keywords:</strong> ${j._cv.missing.join(", ")||"Pending/none detected"}</p>
    <h3>Source</h3><p>${esc(j.source_url||"Not specified")}</p>`;
  d.scrollIntoView({behavior:"smooth",block:"start"});
}
function updateActive(){
  const vals=ids.map(id=>$(id).value).filter(Boolean);
  $("activeCount").textContent=`${vals.length} active`;
  $("activeFiltersText").textContent=vals.length?vals.join(" · "):"All India · All SCM · All companies";
  const saved={}; ids.forEach(id=>saved[id]=$(id).value); localStorage.setItem("scmFilters",JSON.stringify(saved));
}
ids.forEach(id=>$(id).addEventListener("change",updateActive));
$("companyFilter").addEventListener("input",updateActive); $("roleFilter").addEventListener("input",updateActive);
$("talukaFilter").addEventListener("input",updateActive); $("industrialFilter").addEventListener("input",updateActive);
$("applyBtn").addEventListener("click",applyFilters);
$("sortFilter").addEventListener("change",()=>{sortJobs();render()});
$("resetBtn").addEventListener("click",()=>{
  ids.forEach(id=>$(id).value=""); $("cityFilter").innerHTML='<option value="">All districts/cities</option>'; updateActive(); applyFilters();
});
$("importBtn").addEventListener("click",()=>$("jobImportInput").click());
$("jobImportInput").addEventListener("change",async e=>{
  const f=e.target.files[0]; if(!f)return;
  try{const data=JSON.parse(await f.text()); allJobs=Array.isArray(data)?data:(data.jobs||[]); enrichJobs(); applyFilters();}
  catch(err){alert("Could not read jobs JSON: "+err.message)}
});

$("resumeInput").addEventListener("change", async e=>{
  const f=e.target.files[0]; if(!f)return;
  $("resumeStatus").textContent=`Reading ${f.name}...`;
  try{
    const ext=f.name.split(".").pop().toLowerCase();
    if(ext==="txt") resumeText=await f.text();
    else if(ext==="docx"){
      const buf=await f.arrayBuffer();
      if(!window.mammoth) throw new Error("DOCX parser unavailable. Paste CV text instead.");
      const out=await window.mammoth.extractRawText({arrayBuffer:buf}); resumeText=out.value;
    } else if(ext==="pdf"){
      const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs";
      const pdf=await pdfjs.getDocument({data:await f.arrayBuffer()}).promise; let parts=[];
      for(let p=1;p<=pdf.numPages;p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();parts.push(tc.items.map(x=>x.str).join(" "))}
      resumeText=parts.join("\n");
    }
    $("resumeText").value=resumeText;
    $("resumeStatus").textContent=`Loaded: ${f.name}`;
    analyzeCv();
  }catch(err){$("resumeStatus").textContent=`Could not parse automatically: ${err.message}`;}
});
function analyzeCv(){
  resumeText=$("resumeText").value.trim();
  if(!resumeText){$("cvSummary").classList.add("hidden");$("resumeStatus").textContent="No CV text available";return}
  resumeTerms=tokenize(resumeText); enrichJobs();
  const scmKeys=["logistics","supply","chain","warehouse","inventory","procurement","purchase","planning","transport","freight","exim","customs","sap","wms","tms","distribution","dispatch","vendor","sourcing","material","shipping"];
  const found=scmKeys.filter(k=>resumeTerms.has(k));
  $("cvSummary").classList.remove("hidden");
  $("cvSummary").innerHTML=`<strong>CV ready for matching</strong><br>${resumeTerms.size} searchable terms detected.<br>SCM signals: ${found.join(", ")||"No common SCM keywords detected."}`;
  $("resumeStatus").textContent="CV analyzed";
  applyFilters();
}
$("analyzeCvBtn").addEventListener("click",analyzeCv);

try{
 const saved=JSON.parse(localStorage.getItem("scmFilters")||"{}");
 Object.entries(saved).forEach(([id,v])=>{if($(id))$(id).value=v});
}catch{}
updateActive(); render();
