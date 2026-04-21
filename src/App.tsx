import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithGoogle,
  logout 
} from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  getDocs,
  serverTimestamp, 
  orderBy,
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus,
  AlertCircle,
  Plus,
  FolderKanban,
  ListTodo,
  Users,
  LogOut,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronRight,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// --- Types ---

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: any;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedToName: string;
  projectId: string;
}

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const info = JSON.parse(event.error.message);
        setErrorInfo(info);
        setHasError(true);
      } catch (e) {
        // Not a firestore error we formatted
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-900 mb-2">Something went wrong</h1>
        <p className="text-red-700 mb-4 text-center max-w-md">
          {errorInfo?.error || "An unexpected error occurred."}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reload Application
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="bg-blue-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">SAVO Pro</h1>
        <p className="text-slate-500 mb-8 text-center text-sm">
          {isLogin ? 'Sign in to manage your projects' : 'Start your journey with SAVO Pro'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="John Doe" 
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                placeholder="name@company.com" 
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                placeholder="••••••••" 
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-4">
          <button 
            onClick={signInWithGoogle}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'tasks' | 'team'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  // Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<{uid: string, name: string} | null>(null);
  const [allUsers, setAllUsers] = useState<{uid: string, displayName: string, email: string, role: string, createdAt: any}[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  // Invite Member State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Sync User Profile on Login
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Migration: If user exists but has no orgId (from older version), assign one
        if (!data.orgId) {
          const defaultOrgId = `org_${user.uid}`;
          await setDoc(doc(db, 'organizations', defaultOrgId), {
            name: `${data.displayName || 'My'}'s Workspace`,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
          await updateDoc(userRef, { orgId: defaultOrgId });
        } else {
          setUserProfile(data);
        }
      } else {
        // Check for invitations
        const invQ = query(collection(db, 'invitations'), where('email', '==', user.email));
        const invSnap = await getDocs(invQ);
        
        let targetOrgId = `org_${user.uid}`;
        let isJoining = false;

        if (!invSnap.empty) {
          targetOrgId = invSnap.docs[0].data().orgId;
          isJoining = true;
        }

        const profileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          photoURL: user.photoURL || '',
          role: isJoining ? 'member' : 'admin',
          orgId: targetOrgId,
          createdAt: serverTimestamp()
        };

        if (!isJoining) {
          // Create default organization
          await setDoc(doc(db, 'organizations', targetOrgId), {
            name: `${profileData.displayName}'s Workspace`,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          });
        }

        await setDoc(userRef, profileData);
        
        // Delete invitation if joined
        if (isJoining) {
          // In a real app, you'd delete or mark it as used
          // await deleteDoc(invSnap.docs[0].ref);
        }
      }
    });

    return unsubscribe;
  }, [user]);

  // Fetch All Users for Directory (Filtered by Org)
  useEffect(() => {
    if (!userProfile?.orgId) return;
    const q = query(collection(db, 'users'), where('orgId', '==', userProfile.orgId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ 
        uid: doc.data().uid, 
        displayName: doc.data().displayName,
        email: doc.data().email,
        role: doc.data().role,
        createdAt: doc.data().createdAt
      })));
    });
    return unsubscribe;
  }, [userProfile?.orgId]);

  // Fetch Projects (Filtered by Org)
  useEffect(() => {
    if (!userProfile?.orgId) return;
    const q = query(
      collection(db, 'projects'), 
      where('orgId', '==', userProfile.orgId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(fetchedProjects[0].id);
      }
    });
    return unsubscribe;
  }, [userProfile?.orgId]);

  // Fetch All Tasks for Dashboard Summary
  useEffect(() => {
    if (!user || projects.length === 0) {
      setTasks([]);
      return;
    }
    
    const projectIds = projects.map(p => p.id);
    // Firestore 'in' query limit is 10
    const q = query(collection(db, 'tasks'), where('projectId', 'in', projectIds.slice(0, 10)));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return unsubscribe;
  }, [projects, user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !userProfile?.orgId) {
      toast.error('Workspace data not loaded. Please wait a moment.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        description: newProjectDesc,
        ownerId: user?.uid,
        orgId: userProfile.orgId,
        members: [user?.uid],
        createdAt: serverTimestamp()
      });
      setNewProjectName('');
      setNewProjectDesc('');
      setIsCreatingProject(false);
      toast.success('Project created successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId || !userProfile?.orgId) {
      toast.error('Workspace data not loaded. Please wait a moment.');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        description: newTaskDesc,
        status: 'pending',
        priority: newTaskPriority,
        projectId: newTaskProjectId,
        orgId: userProfile.orgId,
        assignedTo: selectedAssignee?.uid || '',
        assignedToName: selectedAssignee?.name || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDesc('');
      setSelectedAssignee(null);
      setAssigneeSearch('');
      setIsCreatingTask(false);
      toast.success('Task created and assigned!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create task');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !userProfile?.orgId) return;
    
    try {
      await addDoc(collection(db, 'invitations'), {
        email: inviteEmail.toLowerCase(),
        orgId: userProfile.orgId,
        invitedBy: user?.uid,
        createdAt: serverTimestamp()
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteName('');
      setIsInvitingMember(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send invitation');
    }
  };

  const toggleProjectMembership = async (projectId: string, memberId: string, isMember: boolean) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      let newMembers = [...project.members];
      if (isMember) {
        newMembers = newMembers.filter(id => id !== memberId);
      } else {
        newMembers.push(memberId);
      }

      await updateDoc(projectRef, { members: newMembers });
      toast.success(isMember ? 'Member removed from project' : 'Member added to project');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update project membership');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return [];
    return allUsers.filter(u => 
      u.displayName.toLowerCase().includes(assigneeSearch.toLowerCase())
    ).slice(0, 5);
  }, [assigneeSearch, allUsers]);

  const taskStats = useMemo(() => {
    const stats = {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
    return [
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
      { name: 'Completed', value: stats.completed, color: '#10b981' },
    ];
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthView />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">SAVO Pro</span>
            </div>

            <nav className="space-y-1">
              <SidebarItem 
                icon={<BarChart3 size={18} />} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')}
              />
              <SidebarItem 
                icon={<FolderKanban size={18} />} 
                label="Projects" 
                active={currentView === 'projects'} 
                onClick={() => setCurrentView('projects')}
              />
              <SidebarItem 
                icon={<ListTodo size={18} />} 
                label="My Tasks" 
                active={currentView === 'tasks'} 
                onClick={() => setCurrentView('tasks')}
              />
              <SidebarItem 
                icon={<Users size={18} />} 
                label="Team" 
                active={currentView === 'team'} 
                onClick={() => setCurrentView('team')}
              />
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="text-lg font-bold text-slate-800 capitalize">{currentView}</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
              {currentView === 'team' ? (
                <button 
                  onClick={() => setIsInvitingMember(true)}
                  className="h-9 px-4 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <UserPlus size={16} /> Invite Member
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setIsCreatingTask(true)}
                    className="h-9 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> New Task
                  </button>
                  <button 
                    onClick={() => setIsCreatingProject(true)}
                    className="h-9 px-4 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> New Project
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Task Summary Card */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ListTodo className="text-blue-600" size={20} />
                        Task Distribution
                      </h3>
                      <div className="flex gap-4">
                        {taskStats.map(stat => (
                          <div key={stat.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                            <span className="text-xs text-slate-500 font-medium">{stat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={taskStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                            {taskStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <StatCard 
                      title="Active Projects" 
                      value={projects.length} 
                      icon={<FolderKanban className="text-blue-600" />} 
                      trend="+2 this week"
                    />
                    <StatCard 
                      title="Total Tasks" 
                      value={tasks.length} 
                      icon={<ListTodo className="text-orange-600" />} 
                      trend={`${tasks.filter(t => t.status === 'completed').length} completed`}
                    />
                    <StatCard 
                      title="Team Members" 
                      value={allUsers.length} 
                      icon={<Users className="text-green-600" />} 
                      trend="Invite more"
                    />
                  </div>
                </div>

                {/* Projects List */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Your Projects</h3>
                    <button onClick={() => setCurrentView('projects')} className="text-sm font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <motion.div 
                        key={project.id}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                            <FolderKanban size={20} />
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{project.name}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{project.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                              {user.displayName?.charAt(0)}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {tasks.filter(t => t.projectId === project.id).length} Tasks
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {projects.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <FolderKanban className="mx-auto text-slate-300 mb-4" size={48} />
                        <h4 className="font-bold text-slate-800 mb-1">No projects yet</h4>
                        <p className="text-sm text-slate-500 mb-6">Create your first project to start tracking tasks with your team.</p>
                        <button 
                          onClick={() => setIsCreatingProject(true)}
                          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                        >
                          Create Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Tasks Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <ListTodo className="text-blue-600" size={20} />
                      Recent Tasks
                    </h3>
                    <button onClick={() => setCurrentView('tasks')} className="text-sm font-bold text-blue-600 hover:underline">View All Tasks</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Task Name</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Project</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tasks.slice(0, 5).map(task => (
                          <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-700">{task.title}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-slate-500">
                                {projects.find(p => p.id === task.projectId)?.name || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                  {task.assignedToName?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs text-slate-600">{task.assignedToName || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {task.status.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold ${
                                task.priority === 'high' ? 'text-red-500' :
                                task.priority === 'medium' ? 'text-amber-500' :
                                'text-slate-400'
                              }`}>
                                {task.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {tasks.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                              No tasks found. Create your first task to see it here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {currentView === 'team' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Team Directory</h3>
                    <p className="text-slate-500 text-sm">Manage your team members and their project access.</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Member</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Role</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Joined</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Project Access</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allUsers.map(member => (
                          <tr key={member.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                  {member.displayName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{member.displayName}</p>
                                  <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {projects.filter(p => p.members.includes(member.uid)).map(p => (
                                  <span key={p.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">
                                    {p.name}
                                  </span>
                                ))}
                                {projects.filter(p => p.members.includes(member.uid)).length === 0 && (
                                  <span className="text-xs text-slate-400 italic">No access</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    // Open a dropdown or modal to manage project access
                                    toast.info(`Managing access for ${member.displayName}`);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <FolderKanban size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Create Project Modal */}
        <AnimatePresence>
          {isCreatingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreatingProject(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Create New Project</h3>
                <p className="text-slate-500 mb-6 text-sm">Define your project scope and start collaborating.</p>
                
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Website Redesign"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
                    <textarea 
                      placeholder="What is this project about?"
                      rows={3}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingProject(false)}
                      className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Create Task Modal */}
        <AnimatePresence>
          {isCreatingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreatingTask(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Create New Task</h3>
                <p className="text-slate-500 mb-6 text-sm">Assign tasks to team members and set priorities.</p>
                
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Task Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Design Landing Page"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Project</label>
                    <select 
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      value={newTaskProjectId}
                      onChange={e => setNewTaskProjectId(e.target.value)}
                      required
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Assign To</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Type name to search..."
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={selectedAssignee ? selectedAssignee.name : assigneeSearch}
                        onChange={e => {
                          setAssigneeSearch(e.target.value);
                          setSelectedAssignee(null);
                          setShowUserSuggestions(true);
                        }}
                        onFocus={() => setShowUserSuggestions(true)}
                      />
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                      {showUserSuggestions && filteredUsers.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                        >
                          {filteredUsers.map(u => (
                            <button
                              key={u.uid}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              onClick={() => {
                                setSelectedAssignee({ uid: u.uid, name: u.displayName });
                                setAssigneeSearch(u.displayName);
                                setShowUserSuggestions(false);
                              }}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {u.displayName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{u.displayName}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Priority</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTaskPriority(p)}
                          className={`flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                            newTaskPriority === p 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingTask(false)}
                      className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Invite Member Modal */}
        <AnimatePresence>
          {isInvitingMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsInvitingMember(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Invite Team Member</h3>
                <p className="text-slate-500 mb-6 text-sm">Send an invitation to join your SAVO Pro workspace.</p>
                
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Jane Smith"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="jane@company.com"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsInvitingMember(false)}
                      className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

// --- Helper Components ---

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-slate-50 rounded-xl">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
    </div>
  );
}
