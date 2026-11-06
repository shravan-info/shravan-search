const $ = s => document.querySelector(s);
const searchInput = $("#searchInput");
const resultsGrid = $("#resultsGrid");
const emptyState = $("#emptyState");
const suggestionPanel = $("#suggestionPanel");
let sources = [];
const suggestions = ["Software developer jobs","Work from home jobs","Government jobs in Maharashtra","Freshers jobs in Pune","Internships for students"];
function normalize(value){return String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function matchesSource(source,query,location,field,experience){
 const haystack=normalize([source.name,source.subtitle,source.description,source.kind,...source.tags,...source.keywords,...source.locations].join(" "));
 const terms=normalize(query).split(" ").filter(Boolean);
 const queryMatch=!terms.length||terms.every(term=>haystack.includes(term)||(term==="it"&&source.field==="technology"));
 const locationMatch=location==="any"||source.locations.includes(location)||(location==="maharashtra"&&["pune","mumbai"].some(c=>source.locations.includes(c)));
 const fieldMatch=field==="any"||source.field===field;
 const experienceMatch=experience==="any"||source.experience.includes(experience);
 return queryMatch&&locationMatch&&fieldMatch&&experienceMatch;
}
function renderCards(list){
 resultsGrid.innerHTML=list.map(s=>'<article class="source-card"><div class="card-top"><div class="source-logo" style="--logo-bg:'+escapeHTML(s.color)+';--logo-color:'+escapeHTML(s.ink)+'">'+escapeHTML(s.initials)+'</div><div class="card-heading"><h3>'+escapeHTML(s.name)+'</h3><div class="card-subtitle">'+escapeHTML(s.subtitle)+'</div></div><span class="source-badge">Source link</span></div><p class="card-description">'+escapeHTML(s.description)+'</p><div class="tag-list">'+s.tags.slice(0,4).map(t=>'<span class="tag">'+escapeHTML(t)+'</span>').join("")+'</div><div class="card-bottom"><span class="source-type">'+escapeHTML(s.kind)+'</span><a class="source-link" href="'+escapeHTML(s.url)+'" target="_blank" rel="noopener noreferrer">Visit website <span>↗</span></a></div></article>').join("");
 resultsGrid.hidden=list.length===0;emptyState.hidden=list.length!==0;
 $("#resultCount").textContent=list.length+" "+(list.length===1?"source":"career sources");
}
function runSearch(){
 const query=searchInput.value.trim(),loc=$("#locationFilter").value,field=$("#fieldFilter").value,exp=$("#experienceFilter").value;
 const list=sources.filter(s=>matchesSource(s,query,loc,field,exp));
 const filtered=!!query||loc!=="any"||field!=="any"||exp!=="any";
 $("#resultsKicker").textContent=filtered?"SEARCH RESULTS":"START EXPLORING";
 $("#resultsTitle").textContent=query?'Explore results for “'+query+'”':(filtered?"Filtered career sources":"Where would you like to work?");
 $("#resultsDescription").textContent=filtered?"These career websites match your search. Open a source to see current vacancies and requirements.":"Search trusted career destinations and explore opportunities directly at the source.";
 $("#activeSearch").hidden=!query;
 $("#activeSearch").innerHTML=query?'Showing sources related to <strong>'+escapeHTML(query)+'</strong>. This version searches its built-in directory, not the whole internet.':"";
 renderCards(list);suggestionPanel.hidden=true;
}
function showSuggestions(){
 const q=normalize(searchInput.value);
 const list=q?suggestions.filter(s=>normalize(s).includes(q)||q.split(" ").some(w=>normalize(s).includes(w))).slice(0,4):suggestions.slice(0,4);
 if(!list.length){suggestionPanel.hidden=true;return;}
 suggestionPanel.innerHTML=list.map(s=>'<button class="suggestion-option" type="button" data-value="'+escapeHTML(s)+'"><span>⌕</span><span>'+escapeHTML(s)+'</span></button>').join("");
 suggestionPanel.hidden=false;
 suggestionPanel.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{searchInput.value=b.dataset.value;runSearch();}));
}
function resetFilters(){$("#locationFilter").value="any";$("#fieldFilter").value="any";$("#experienceFilter").value="any";searchInput.value="";runSearch();}
async function init(){
 try{const response=await fetch("jobs.json",{cache:"no-cache"});if(!response.ok)throw new Error("Directory unavailable");sources=await response.json();renderCards(sources);}
 catch(e){resultsGrid.hidden=true;emptyState.hidden=false;emptyState.querySelector("h3").textContent="Career directory could not load";emptyState.querySelector("p").textContent="Refresh the page or check that jobs.json is available in the website repository.";}
 $("#year").textContent=new Date().getFullYear();
 if(localStorage.getItem("shravan-search-theme")==="dark")document.body.classList.add("dark");
}
$("#searchButton").addEventListener("click",runSearch);
searchInput.addEventListener("keydown",e=>{if(e.key==="Enter")runSearch();if(e.key==="Escape")suggestionPanel.hidden=true;});
searchInput.addEventListener("focus",showSuggestions);searchInput.addEventListener("input",showSuggestions);
document.addEventListener("click",e=>{if(!$("#searchWrap").contains(e.target))suggestionPanel.hidden=true;});
document.querySelectorAll(".suggestion-chip").forEach(b=>b.addEventListener("click",()=>{searchInput.value=b.dataset.query;runSearch();$("#resultsSection").scrollIntoView({behavior:"smooth"});}));
["locationFilter","fieldFilter","experienceFilter"].forEach(id=>$("#"+id).addEventListener("change",runSearch));
$("#resetFilters").addEventListener("click",resetFilters);$("#showAllButton").addEventListener("click",resetFilters);
$("#themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("shravan-search-theme",document.body.classList.contains("dark")?"dark":"light");});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchInput.focus();}});
init();