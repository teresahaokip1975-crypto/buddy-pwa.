(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const DB_KEY = "buddy_pwa_v1";
  const MEMORY_KEY = "buddy_memory_v1";
  const DEFAULTS = {theme:"system",accent:"violet",compact:false,memoryEnabled:false};
  let state = loadState();
  let currentChatId = state.chats[0]?.id || null;
  let installPrompt = null;
  const root = document.documentElement;

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(DB_KEY) || "null");
      if (saved && Array.isArray(saved.chats) && Array.isArray(saved.projects)) return {...{settings:{...DEFAULTS}},...saved,settings:{...DEFAULTS,...(saved.settings||{})}};
    } catch(e) { console.warn("Buddy data could not be loaded",e); }
    return {settings:{...DEFAULTS},chats:[],projects:[]};
  }
  function saveState(){ try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch(e){ toast("Could not save. Export data and free browser storage."); } }
  function toast(msg){ const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function applySettings(){
    const theme=state.settings.theme;
    const resolved=theme==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):theme;
    root.dataset.theme=resolved; root.dataset.accent=state.settings.accent||"violet";
    $("#themeSelect").value=theme; $("#accentSelect").value=state.settings.accent||"violet";
    $("#compactMode").checked=!!state.settings.compact;
    $("#memoryToggle").checked=!!state.settings.memoryEnabled;
    $("#memoryEditorWrap").classList.toggle("hidden",!state.settings.memoryEnabled);
    $("#memoryText").value=state.settings.memoryEnabled?(localStorage.getItem(MEMORY_KEY)||""):"";
    $("#messages").classList.toggle("compact",!!state.settings.compact);
  }
  function createChat(){
    const chat={id:uid(),title:"New chat",createdAt:Date.now(),updatedAt:Date.now(),messages:[],projectId:null};
    state.chats.unshift(chat);currentChatId=chat.id;saveState();renderAll();closeDrawer();showView("chat");
  }
  function activeChat(){return state.chats.find(c=>c.id===currentChatId)||null;}
  function addMessage(role,content){
    let chat=activeChat();if(!chat){createChat();chat=activeChat();}
    chat.messages.push({id:uid(),role,content:String(content),createdAt:Date.now()});
    chat.updatedAt=Date.now();
    if(chat.title==="New chat" && role==="user") chat.title=String(content).trim().slice(0,36)||"New chat";
    saveState();renderChat();renderRecentChats();
  }
  function sendMessage(text){
    text=String(text||"").trim();if(!text)return;
    if(!activeChat()) createChat();
    addMessage("user",text);
    addMessage("assistant","I’ve saved your message on this device. Real AI replies are not connected in this starter build yet. Next, connect an AI provider through a secure backend—never place a private API key in this browser app.");
    $("#messageInput").value="";$("#messageInput").style.height="auto";$("#messageInput").focus();
  }
  function renderChat(){
    const chat=activeChat();const box=$("#messages");
    box.innerHTML="";
    $("#headerTitle").textContent=chat?chat.title:"Buddy";
    if(chat && chat.messages.length){
      $(".welcome").classList.add("has-messages");
      $(".welcome").style.display="none";
      chat.messages.forEach(m=>{
        const row=document.createElement("div");row.className="message "+(m.role==="user"?"user":"assistant");
        const avatar=m.role==="user"?"B":"✦";
        row.innerHTML=`<div class="message-avatar">${avatar}</div><div class="bubble">${escapeHTML(m.content)}</div>`;
        box.appendChild(row);
      });
      box.scrollTop=box.scrollHeight;
    }else{
      $(".welcome").style.display="block";
      $(".welcome").classList.remove("has-messages");
    }
  }
  function renderRecentChats(){
    const host=$("#recentChats");host.innerHTML="";
    $("#chatCount").textContent=state.chats.length;
    state.chats.slice(0,30).forEach(chat=>{
      const b=document.createElement("button");b.className="recent-chat"+(chat.id===currentChatId?" active":"");
      b.innerHTML=`<span>◌</span><span>${escapeHTML(chat.title||"New chat")}</span>`;
      b.addEventListener("click",()=>{currentChatId=chat.id;renderChat();renderRecentChats();showView("chat");closeDrawer();});
      b.addEventListener("contextmenu",e=>{e.preventDefault();chatMenu(chat.id);});
      host.appendChild(b);
    });
    if(!state.chats.length)host.innerHTML='<div class="tiny muted" style="padding:8px">Your chats will appear here.</div>';
  }
  function chatMenu(id){
    const chat=state.chats.find(c=>c.id===id);if(!chat)return;
    const action=prompt(`Chat: ${chat.title}\nType: rename, pin, archive, delete, cancel`);
    if(!action)return;
    if(action==="rename"){const n=prompt("New chat name",chat.title);if(n&&n.trim())chat.title=n.trim().slice(0,80);}
    else if(action==="pin"){chat.pinned=!chat.pinned;toast(chat.pinned?"Chat pinned (in this prototype, marked in data).":"Chat unpinned.");}
    else if(action==="archive"){chat.archived=!chat.archived;toast(chat.archived?"Chat archived.":"Chat restored.");}
    else if(action==="delete"){if(confirm("Delete this chat?")){state.chats=state.chats.filter(c=>c.id!==id);if(currentChatId===id)currentChatId=state.chats[0]?.id||null;}}
    saveState();renderAll();
  }
  function renderProjects(){
    const host=$("#projectsList");host.innerHTML="";
    if(!state.projects.length){host.innerHTML='<div class="empty-state">No projects yet. Add one above to organize your work.</div>';return;}
    state.projects.forEach(p=>{
      const count=state.chats.filter(c=>c.projectId===p.id).length;
      const el=document.createElement("article");el.className="project-card";
      el.innerHTML=`<h3>${escapeHTML(p.name)}</h3><p>${count} linked chat${count===1?"":"s"} · Created ${new Date(p.createdAt).toLocaleDateString()}</p><div class="project-actions"><button data-act="chat">＋ New chat here</button><button data-act="rename">Rename</button><button data-act="delete">Delete</button></div>`;
      el.querySelector('[data-act="chat"]').onclick=()=>{createChat();const c=activeChat();c.projectId=p.id;saveState();renderAll();};
      el.querySelector('[data-act="rename"]').onclick=()=>{const n=prompt("Project name",p.name);if(n&&n.trim()){p.name=n.trim().slice(0,80);saveState();renderProjects();}};
      el.querySelector('[data-act="delete"]').onclick=()=>{if(confirm("Delete this project? Chats will be kept but unlinked.")){state.projects=state.projects.filter(x=>x.id!==p.id);state.chats.forEach(c=>{if(c.projectId===p.id)c.projectId=null;});saveState();renderProjects();}};
      host.appendChild(el);
    });
  }
  function renderAll(){renderRecentChats();renderChat();renderProjects();applySettings();}
  function showView(name){
    $$(".view").forEach(v=>v.classList.remove("active"));
    const el=$("#"+name+"View");if(el)el.classList.add("active");
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    const titles={chat:"Buddy",projects:"Projects",library:"Local library",settings:"Settings"};
    $("#headerTitle").textContent=titles[name]||"Buddy";
  }
  function openDrawer(){$("#drawer").classList.add("open");$("#scrim").classList.add("show");}
  function closeDrawer(){$("#drawer").classList.remove("open");$("#scrim").classList.remove("show");}
  function exportData(){
    const bundle={app:"Buddy PWA",version:1,exportedAt:new Date().toISOString(),state,memory:state.settings.memoryEnabled?(localStorage.getItem(MEMORY_KEY)||""):null};
    const blob=new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="buddy-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);toast("Backup exported.");
  }
  function importData(file){
    const reader=new FileReader();reader.onload=()=>{
      try{const data=JSON.parse(reader.result);const s=data.state||data;if(!Array.isArray(s.chats)||!Array.isArray(s.projects)||!s.settings)throw Error("This does not look like a Buddy backup.");
        if(!confirm("Importing will replace current local chats, projects and settings. Continue?"))return;
        state={settings:{...DEFAULTS,...s.settings},chats:s.chats,projects:s.projects};if(data.memory!==null&&data.memory!==undefined)localStorage.setItem(MEMORY_KEY,String(data.memory));saveState();currentChatId=state.chats[0]?.id||null;renderAll();toast("Backup imported.");
      }catch(e){alert("Import failed: "+e.message);}
    };reader.readAsText(file);
  }
  $("#menuBtn").onclick=openDrawer;$("#closeDrawer").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
  $("#newChatBtn").onclick=createChat;
  $$(".nav-item").forEach(b=>b.onclick=()=>{showView(b.dataset.view);closeDrawer();});
  $("#composer").addEventListener("submit",e=>{e.preventDefault();sendMessage($("#messageInput").value);});
  $("#messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#composer").requestSubmit();}});
  $("#messageInput").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";});
  $$(".suggestion").forEach(b=>b.onclick=()=>{showView("chat");sendMessage(b.dataset.prompt);});
  $("#projectForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#projectName").value.trim();if(!name)return;state.projects.unshift({id:uid(),name,createdAt:Date.now()});saveState();$("#projectName").value="";renderProjects();toast("Project added.");});
  $("#themeSelect").onchange=e=>{state.settings.theme=e.target.value;saveState();applySettings();};
  $("#accentSelect").onchange=e=>{state.settings.accent=e.target.value;saveState();applySettings();};
  $("#themeQuickBtn").onclick=()=>{state.settings.theme=root.dataset.theme==="dark"?"light":"dark";saveState();applySettings();};
  $("#compactMode").onchange=e=>{state.settings.compact=e.target.checked;saveState();applySettings();};
  $("#memoryToggle").onchange=e=>{state.settings.memoryEnabled=e.target.checked;saveState();applySettings();toast(e.target.checked?"Optional memory enabled on this device.":"Optional memory disabled.");};
  $("#saveMemory").onclick=()=>{if(!state.settings.memoryEnabled){toast("Enable memory first.");return;}localStorage.setItem(MEMORY_KEY,$("#memoryText").value);toast("Memory saved on this device.");};
  $("#clearMemory").onclick=()=>{if(confirm("Delete saved memory from this device?")){localStorage.removeItem(MEMORY_KEY);$("#memoryText").value="";toast("Memory deleted.");}};
  $("#exportBtn").onclick=exportData;$("#libraryExport").onclick=exportData;
  $("#importBtn").onclick=()=>$("#importFile").click();$("#importFile").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";};
  $("#clearAllBtn").onclick=()=>{if(confirm("Delete all Buddy chats, projects, settings and saved memory from this browser? This cannot be undone unless you exported a backup.")){localStorage.removeItem(DB_KEY);localStorage.removeItem(MEMORY_KEY);state={settings:{...DEFAULTS},chats:[],projects:[]};currentChatId=null;renderAll();toast("Local Buddy data deleted.");}};
  $$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.toggle("active",x===b));$("#simpleSettings").classList.toggle("active",b.dataset.tab==="simple");$("#advancedSettings").classList.toggle("active",b.dataset.tab==="advanced");});
  $("#installBtn").onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").disabled=true;}else toast("Open your browser menu and choose Add to Home screen.");};
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#installBtn").disabled=false;});
  window.addEventListener("appinstalled",()=>toast("Buddy installed."));
  window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change",()=>{if(state.settings.theme==="system")applySettings();});
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  renderAll();
})();