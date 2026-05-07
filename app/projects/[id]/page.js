"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, UserPlus, Trash2, X, CheckCircle2, Clock, Circle, AlertTriangle, ChevronDown, Users, ListTodo, BarChart3, CheckSquare, Plus, AlertCircle } from "lucide-react";

const COLORS = ["#4f46e5","#059669","#d97706","#dc2626","#0284c7","#7c3aed"];

const STATUS_CFG = {
  ACTIVE:    { label: "🟢 Active",    badge: { bg: "var(--green-bg)", color: "var(--green)" } },
  ON_HOLD:   { label: "🟡 On Hold",   badge: { bg: "#fff7ed",         color: "var(--orange)" } },
  COMPLETED: { label: "✅ Completed", badge: { bg: "var(--blue-bg)",  color: "var(--blue)"  } },
};

export default function ProjectDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();

  const [project, setProject]   = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("overview");
  const [projStatus, setProjStatus] = useState("ACTIVE"); // separate state for status

  // Add-member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [selUser, setSelUser]             = useState("");
  const [memberErr, setMemberErr]         = useState("");
  const [memberBusy, setMemberBusy]       = useState(false);

  // Create-task modal
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title:"", description:"", assigneeId:"", priority:"MEDIUM", dueDate:"" });
  const [taskErr, setTaskErr]   = useState("");
  const [taskBusy, setTaskBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadAll();
  }, [status, id]);

  const loadAll = async () => {
    const [pRes, uRes] = await Promise.all([
      fetch(`/api/projects/${id}`, { cache: "no-store" }),
      fetch("/api/team",           { cache: "no-store" }),
    ]);
    if (pRes.ok) {
      const p = await pRes.json();
      setProject(p);
      setProjStatus(p.status || "ACTIVE");
    } else { router.push("/projects"); }
    const u = await uRes.json();
    setAllUsers(Array.isArray(u) ? u : []);
    setLoading(false);
  };

  const handleStatusChange = async (val) => {
    setProjStatus(val); // optimistic
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: val }),
    });
    if (!res.ok) {
      setProjStatus(projStatus); // revert on failure
      alert("Failed to update status");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberErr("");
    if (!selUser) { setMemberErr("Please select a user"); return; }
    setMemberBusy(true);
    const res = await fetch("/api/projects/members", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ projectId:id, userId:selUser }) });
    const data = await res.json();
    setMemberBusy(false);
    if (!res.ok) { setMemberErr(data.error); return; }
    setSelUser(""); setShowAddMember(false);
    loadAll();
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    await fetch("/api/projects/members", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ projectId:id, userId }) });
    loadAll();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskErr("");
    if (!taskForm.title.trim()) { setTaskErr("Title is required"); return; }
    setTaskBusy(true);
    const res = await fetch("/api/tasks", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...taskForm, projectId: id }),
    });
    const data = await res.json();
    setTaskBusy(false);
    if (!res.ok) { setTaskErr(data.error); return; }
    setTaskForm({ title:"", description:"", assigneeId:"", priority:"MEDIUM", dueDate:"" });
    setShowTask(false);
    loadAll();
  };

  const handleTaskStatus = async (taskId, newStatus) => {
    await fetch("/api/tasks", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id:taskId, status:newStatus }) });
    loadAll();
  };

  if (loading) return <div style={{padding:40}}><p className="text-muted">Loading project...</p></div>;
  if (!project) return null;

  const isOwnerOrAdmin = project.ownerId === session?.user?.id || session?.user?.role === "ADMIN";
  const memberIds = project.members.map(m => m.userId);
  const availableUsers = allUsers.filter(u => u.id !== project.ownerId && !memberIds.includes(u.id));
  const projectMembers = [{ id: project.ownerId, name: project.owner?.name }, ...project.members.map(m => ({ id: m.userId, name: m.user?.name }))];

  const total = project.tasks.length;
  const done  = project.tasks.filter(t => t.status==="COMPLETED").length;
  const inProg = project.tasks.filter(t => t.status==="IN_PROGRESS").length;
  const todo  = project.tasks.filter(t => t.status==="TODO").length;
  const overdue = project.tasks.filter(t => t.dueDate && new Date(t.dueDate)<new Date() && t.status!=="COMPLETED").length;
  const progress = total > 0 ? Math.round((done/total)*100) : 0;

  const statusBadge = STATUS_CFG[projStatus]?.badge || STATUS_CFG.ACTIVE.badge;

  const pColor = p => p==="HIGH" ? "var(--red)" : p==="MEDIUM" ? "var(--orange)" : "var(--green)";
  const tIcon  = s => s==="COMPLETED" ? <CheckCircle2 size={15} style={{color:"var(--green)",flexShrink:0}}/> :
                      s==="IN_PROGRESS" ? <Clock size={15} style={{color:"var(--blue)",flexShrink:0}}/> :
                      <Circle size={15} style={{color:"var(--text-light)",flexShrink:0}}/>;

  return (
    <div>
      <button onClick={()=>router.push("/projects")} className="btn btn-secondary" style={{marginBottom:20,gap:6}}>
        <ArrowLeft size={16}/> Back to Projects
      </button>

      {/* Header */}
      <div className="page-header" style={{alignItems:"flex-start",marginBottom:28}}>
        <div style={{flex:1}}>
          <div className="flex items-center gap-3" style={{marginBottom:6}}>
            <h1 className="page-title" style={{margin:0}}>{project.name}</h1>
            <span style={{background:statusBadge.bg, color:statusBadge.color, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20}}>
              {STATUS_CFG[projStatus]?.label.replace(/^[^ ]+ /,"")}
            </span>
          </div>
          {project.description && <p className="text-sm text-muted">{project.description}</p>}
          <p className="text-xs text-muted" style={{marginTop:4}}>
            Owned by <strong>{project.owner?.name}</strong> · Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <div className="flex gap-3">
            <div style={{position:"relative"}}>
              <select
                value={projStatus}
                onChange={e => handleStatusChange(e.target.value)}
                style={{appearance:"none", padding:"8px 32px 8px 14px", borderRadius:8, border:"1px solid var(--border)", fontSize:13, fontWeight:500, cursor:"pointer", background:"white", color:"var(--text-dark)"}}
              >
                <option value="ACTIVE">🟢 Active</option>
                <option value="ON_HOLD">🟡 On Hold</option>
                <option value="COMPLETED">✅ Completed</option>
              </select>
              <ChevronDown size={13} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--text-muted)"}}/>
            </div>
            <button className="btn btn-primary" onClick={()=>setShowAddMember(true)}><UserPlus size={16}/> Add Member</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex" style={{marginBottom:24,borderBottom:"2px solid var(--border-light)"}}>
        {[{id:"overview",label:"Overview",Icon:BarChart3},{id:"tasks",label:`Tasks (${total})`,Icon:ListTodo},{id:"members",label:`Members (${project.members.length+1})`,Icon:Users}].map(({id:tid,label,Icon})=>(
          <button key={tid} onClick={()=>setTab(tid)} style={{padding:"10px 18px",border:"none",background:"transparent",fontWeight:tab===tid?600:500,color:tab===tid?"var(--primary)":"var(--text-muted)",borderBottom:tab===tid?"2px solid var(--primary)":"2px solid transparent",marginBottom:-2,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:14}}>
            <Icon size={16}/>{label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        <div>
          <div className="stats-grid" style={{marginBottom:24}}>
            {[{label:"Total Tasks",v:total,Icon:CheckSquare,bg:"var(--primary-light)",c:"var(--primary)"},
              {label:"In Progress",v:inProg,Icon:Clock,bg:"var(--blue-bg)",c:"var(--blue)"},
              {label:"Completed",v:done,Icon:CheckCircle2,bg:"var(--green-bg)",c:"var(--green)"},
              {label:"Overdue",v:overdue,Icon:AlertTriangle,bg:"var(--red-bg)",c:"var(--red)"}
            ].map(({label,v,Icon,bg,c},i)=>(
              <div key={i} className="card stat-card">
                <div className="stat-icon" style={{background:bg,color:c}}><Icon size={20}/></div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{v}</div>
              </div>
            ))}
          </div>
          <div className="grid-2-1">
            <div className="card" style={{padding:28}}>
              <h3 style={{fontSize:15,fontWeight:600,color:"var(--text-dark)",marginBottom:20}}>Task Completion Progress</h3>
              <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:16}}>
                <div style={{width:80,height:80,borderRadius:"50%",background:`conic-gradient(var(--primary) ${progress*3.6}deg,#f1f5f9 0deg)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"var(--text-dark)"}}>{progress}%</div>
                </div>
                <div style={{flex:1}}>
                  {[{label:"Todo",count:todo,color:"#9ca3af"},{label:"In Progress",count:inProg,color:"var(--blue)"},{label:"Completed",count:done,color:"var(--green)"}].map(it=>(
                    <div key={it.label} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div className="flex items-center gap-2"><span style={{width:10,height:10,borderRadius:"50%",background:it.color,display:"inline-block"}}/><span style={{fontSize:13,color:"var(--text-muted)"}}>{it.label}</span></div>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--text-dark)"}}>{it.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`,background:"var(--primary)"}}/></div>
              <p className="text-xs text-muted" style={{marginTop:8}}>{done} of {total} tasks completed</p>
            </div>
            <div className="card" style={{padding:24}}>
              <div className="flex justify-between items-center" style={{marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,color:"var(--text-dark)"}}>Team</h3>
                <span className="text-xs text-muted">{project.members.length+1} members</span>
              </div>
              <div className="flex items-center gap-3" style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid var(--border-light)"}}>
                <div className="avatar-sm" style={{background:"#4f46e5",marginLeft:0,width:36,height:36,fontSize:13,flexShrink:0}}>{project.owner?.name?.split(" ").map(n=>n[0]).join("")||"?"}</div>
                <div><div style={{fontSize:13,fontWeight:500,color:"var(--text-dark)"}}>{project.owner?.name}</div><div className="text-xs text-muted">Owner</div></div>
              </div>
              {project.members.slice(0,4).map((m,i)=>(
                <div key={m.id} className="flex items-center gap-3" style={{marginBottom:10}}>
                  <div className="avatar-sm" style={{background:COLORS[(i+1)%COLORS.length],marginLeft:0,width:32,height:32,fontSize:12,flexShrink:0}}>{m.user?.name?.split(" ").map(n=>n[0]).join("")||"?"}</div>
                  <span style={{fontSize:13,color:"var(--text-muted)"}}>{m.user?.name}</span>
                </div>
              ))}
              {isOwnerOrAdmin && <button className="btn btn-secondary w-full" style={{justifyContent:"center",marginTop:12}} onClick={()=>setShowAddMember(true)}><UserPlus size={14}/> Add Member</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── TASKS ── */}
      {tab==="tasks" && (
        <div className="card" style={{padding:0}}>
          <div className="card-header">
            <span className="card-title">All Tasks</span>
            <button className="btn btn-primary" onClick={()=>setShowTask(true)}><Plus size={14}/> New Task</button>
          </div>
          {project.tasks.length===0 ? (
            <div style={{padding:48,textAlign:"center"}}>
              <ListTodo size={40} style={{color:"var(--text-light)",margin:"0 auto 12px",display:"block"}}/>
              <p className="text-muted">No tasks yet.</p>
              <button className="btn btn-primary" style={{marginTop:12}} onClick={()=>setShowTask(true)}><Plus size={14}/> Create First Task</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th style={{width:32}}></th><th>Task</th><th>Assignee</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  {project.tasks.map(task=>{
                    const init = task.assignee?.name?.split(" ").map(n=>n[0]).join("")||"?";
                    const od = task.dueDate && new Date(task.dueDate)<new Date() && task.status!=="COMPLETED";
                    return (
                      <tr key={task.id}>
                        <td>{tIcon(task.status)}</td>
                        <td style={{fontWeight:500,color:"var(--text-dark)"}}>{task.title}</td>
                        <td>{task.assignee ? <div className="flex items-center gap-2"><div className="avatar-sm" style={{background:"var(--primary)",marginLeft:0}}>{init}</div><span>{task.assignee.name}</span></div> : <span className="text-muted">Unassigned</span>}</td>
                        <td><span className="flex items-center gap-1"><span className="priority-dot" style={{background:pColor(task.priority)}}/>{task.priority}</span></td>
                        <td style={{color:od?"var(--red)":"var(--text-muted)",fontSize:13}}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td>
                        <td>
                          <select className="input-field" value={task.status} onChange={e=>handleTaskStatus(task.id,e.target.value)} style={{padding:"4px 8px",fontSize:12,width:"auto",minWidth:110}}>
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS ── */}
      {tab==="members" && (
        <div className="card" style={{padding:0}}>
          <div className="card-header">
            <span className="card-title">Project Members</span>
            {isOwnerOrAdmin && <button className="btn btn-primary" onClick={()=>setShowAddMember(true)}><UserPlus size={14}/> Add Member</button>}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>System Role</th><th>Project Role</th><th>Added On</th>{isOwnerOrAdmin&&<th></th>}</tr></thead>
              <tbody>
                <tr>
                  <td><div className="flex items-center gap-3"><div className="avatar-sm" style={{background:"#4f46e5",marginLeft:0,width:36,height:36,fontSize:13}}>{project.owner?.name?.split(" ").map(n=>n[0]).join("")||"?"}</div><div><div style={{fontWeight:500,color:"var(--text-dark)"}}>{project.owner?.name}{project.ownerId===session?.user?.id&&<span className="text-xs text-muted" style={{marginLeft:6}}>(You)</span>}</div><div className="text-xs text-muted">{project.owner?.email}</div></div></div></td>
                  <td><span className="badge badge-blue">ADMIN</span></td>
                  <td><span className="badge badge-green">Owner</span></td>
                  <td style={{color:"var(--text-muted)",fontSize:13}}>{new Date(project.createdAt).toLocaleDateString()}</td>
                  {isOwnerOrAdmin&&<td></td>}
                </tr>
                {project.members.map((m,i)=>(
                  <tr key={m.id}>
                    <td><div className="flex items-center gap-3"><div className="avatar-sm" style={{background:COLORS[(i+1)%COLORS.length],marginLeft:0,width:36,height:36,fontSize:13}}>{m.user?.name?.split(" ").map(n=>n[0]).join("")||"?"}</div><div><div style={{fontWeight:500,color:"var(--text-dark)"}}>{m.user?.name}{m.userId===session?.user?.id&&<span className="text-xs text-muted" style={{marginLeft:6}}>(You)</span>}</div><div className="text-xs text-muted">{m.user?.email}</div></div></div></td>
                    <td><span className={`badge ${m.user?.role==="ADMIN"?"badge-blue":"badge-gray"}`}>{m.user?.role}</span></td>
                    <td><span className="badge badge-gray">Member</span></td>
                    <td style={{color:"var(--text-muted)",fontSize:13}}>{new Date(m.createdAt).toLocaleDateString()}</td>
                    {isOwnerOrAdmin&&<td><button onClick={()=>handleRemoveMember(m.userId)} style={{color:"var(--text-light)"}} title="Remove"><Trash2 size={15}/></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD MEMBER MODAL ── */}
      {showAddMember && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div className="card" style={{width:"100%",maxWidth:440,padding:32}}>
            <div className="flex justify-between items-center" style={{marginBottom:24}}>
              <h2 style={{fontSize:18,fontWeight:600,color:"var(--text-dark)"}}>Add Member</h2>
              <button onClick={()=>{setShowAddMember(false);setMemberErr("");setSelUser("");}} style={{color:"var(--text-light)"}}><X size={20}/></button>
            </div>
            {memberErr && <div style={{background:"var(--red-bg)",color:"var(--red)",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><AlertCircle size={15}/>{memberErr}</div>}
            {availableUsers.length===0 ? (
              <div style={{textAlign:"center",padding:"20px 0"}}><Users size={36} style={{color:"var(--text-light)",margin:"0 auto 12px",display:"block"}}/><p className="text-muted">All users are already members.</p></div>
            ) : (
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label">Select User</label>
                  <select className="input-field" value={selUser} onChange={e=>setSelUser(e.target.value)}>
                    <option value="">Choose a team member...</option>
                    {availableUsers.map(u=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="flex gap-3" style={{justifyContent:"flex-end"}}>
                  <button type="button" className="btn btn-secondary" onClick={()=>{setShowAddMember(false);setMemberErr("");setSelUser("");}}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={memberBusy}><UserPlus size={15}/>{memberBusy?"Adding...":"Add Member"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE TASK MODAL ── */}
      {showTask && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div className="card" style={{width:"100%",maxWidth:520,padding:32}}>
            <div className="flex justify-between items-center" style={{marginBottom:24}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:600,color:"var(--text-dark)"}}>Create Task</h2>
                <p className="text-xs text-muted" style={{marginTop:2}}>in <strong>{project.name}</strong></p>
              </div>
              <button onClick={()=>{setShowTask(false);setTaskErr("");}} style={{color:"var(--text-light)"}}><X size={20}/></button>
            </div>
            {taskErr && <div style={{background:"var(--red-bg)",color:"var(--red)",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><AlertCircle size={15}/>{taskErr}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="input-field" placeholder="e.g. Design the landing page" value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows={2} placeholder="Optional details..." value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})} style={{resize:"vertical"}}/>
              </div>
              <div className="grid-2" style={{gap:16}}>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="input-field" value={taskForm.assigneeId} onChange={e=>setTaskForm({...taskForm,assigneeId:e.target.value})}>
                    <option value="">Unassigned</option>
                    {projectMembers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="input-field" value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="input-field" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})}/>
              </div>
              <div className="flex gap-3" style={{justifyContent:"flex-end",paddingTop:8}}>
                <button type="button" className="btn btn-secondary" onClick={()=>{setShowTask(false);setTaskErr("");}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskBusy}><Plus size={15}/>{taskBusy?"Creating...":"Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
