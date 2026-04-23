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
  setDoc,
  deleteDoc,
  or,
  and
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
  Search,
  MessageSquare,
  Send
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
  orgId: string;
  members: string[];
  createdAt: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedToName: string;
  projectId: string;
  orgId: string;
  createdBy: string;
  projectOwnerId?: string;   // Denormalized for security rules
  projectMembers?: string[]; // Denormalized for security rules
  createdAt?: any;
  updatedAt?: any;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: any;
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'mine'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  
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

  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return [];
    return allUsers.filter(u => 
      u.displayName.toLowerCase().includes(assigneeSearch.toLowerCase())
    ).slice(0, 5);
  }, [assigneeSearch, allUsers]);

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(p => 
      p.ownerId === user.uid || (p.members && p.members.includes(user.uid)) || userProfile?.role === 'admin'
    );
  }, [projects, user, userProfile]);

  const visibleTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => {
      // Direct involvement
      if (t.assignedTo === user.uid || t.createdBy === user.uid) return true;
      
      // Project involvement
      const project = projects.find(p => p.id === t.projectId);
      if (project) {
        if (project.ownerId === user.uid || (project.members && project.members.includes(user.uid))) return true;
      }
      
      return false;
    });
  }, [tasks, projects, user]);

  const taskStats = useMemo(() => {
    const stats = {
      pending: visibleTasks.filter(t => t.status === 'pending').length,
      inProgress: visibleTasks.filter(t => t.status === 'in-progress').length,
      completed: visibleTasks.filter(t => t.status === 'completed').length,
    };
    return [
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
      { name: 'Completed', value: stats.completed, color: '#10b981' },
    ];
  }, [visibleTasks]);

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
        const invQ = query(collection(db, 'invitations'), where('email', '==', user.email?.toLowerCase()));
        const invSnap = await getDocs(invQ);
        
        let targetOrgId = `org_${user.uid}`;
        let isJoining = false;

        if (!invSnap.empty) {
          targetOrgId = invSnap.docs[0].data().orgId;
          isJoining = true;
          // In a real app, you might want to show a "Join" button instead of auto-joining,
          // but for this MVP, auto-joining invitations is smoother.
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
    }, (error) => {
      console.error("Error fetching users:", error);
    });
    return unsubscribe;
  }, [userProfile?.orgId]);

  // Fetch Projects (Filtered by Org & Involvement)
  useEffect(() => {
    if (!userProfile?.orgId || !user) return;
    
    // For admins, show all in org. For members, show where involved.
    let q;
    if (userProfile.role === 'admin') {
      q = query(
        collection(db, 'projects'), 
        where('orgId', '==', userProfile.orgId)
      );
    } else {
      q = query(
        collection(db, 'projects'), 
        and(
          where('orgId', '==', userProfile.orgId),
          or(
            where('ownerId', '==', user.uid),
            where('members', 'array-contains', user.uid)
          )
        )
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(fetchedProjects[0].id);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });
    return unsubscribe;
  }, [userProfile?.orgId, userProfile?.role, user]);

  // Fetch All Tasks for Workspace
  useEffect(() => {
    if (!userProfile?.orgId || !user || projects.length === 0) {
      if (userProfile?.role !== 'admin') {
        setTasks([]);
        return;
      }
    }
    
    let q;
    if (userProfile?.role === 'admin') {
      q = query(
        collection(db, 'tasks'), 
        where('orgId', '==', userProfile.orgId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // For members, we query tasks belonging to projects they can see.
      // Firestore 'in' query supports up to 30 values.
      const visibleProjectIds = visibleProjects.map(p => p.id);
      
      if (visibleProjectIds.length === 0) {
        setTasks([]);
        return;
      }

      // Firestore limits 'in' queries to 30 values.
      const queryProjectIds = visibleProjectIds.slice(0, 30);

      q = query(
        collection(db, 'tasks'), 
        where('orgId', '==', userProfile.orgId),
        where('projectId', 'in', queryProjectIds)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });
    
    return unsubscribe;
  }, [userProfile?.orgId, userProfile?.role, user, visibleProjects]);

  // Fetch Comments for Selected Task
  useEffect(() => {
    if (!selectedTaskId) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, 'tasks', selectedTaskId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });

    return unsubscribe;
  }, [selectedTaskId]);

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
      const project = projects.find(p => p.id === newTaskProjectId);
      if (!project) throw new Error("Project not found");

      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        description: newTaskDesc,
        status: 'pending',
        priority: newTaskPriority,
        projectId: newTaskProjectId,
        orgId: userProfile.orgId,
        assignedTo: selectedAssignee?.uid || '',
        assignedToName: selectedAssignee?.name || '',
        createdBy: user?.uid,
        projectOwnerId: project.ownerId,
        projectMembers: project.members || [],
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
    if (!inviteEmail.trim() || !userProfile?.orgId) {
      toast.error('Workspace data not loaded. Please wait a moment.');
      return;
    }

    try {
      await addDoc(collection(db, 'invitations'), {
        email: inviteEmail.toLowerCase(),
        name: inviteName,
        orgId: userProfile.orgId,
        invitedBy: user?.uid,
        invitedByName: user?.displayName,
        createdAt: serverTimestamp()
      });
      setInviteEmail('');
      setInviteName('');
      setIsInvitingMember(false);
      toast.success('Invitation sent to ' + inviteEmail);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send invitation');
    }
  };

  const [invitations, setInvitations] = useState<any[]>([]);

  // Fetch Invitations for current user email
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, 'invitations'), where('email', '==', user.email.toLowerCase()));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user?.email]);

  const handleJoinOrganization = async (invitation: any) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        orgId: invitation.orgId,
        role: 'member'
      });
      // Delete invitation after joining
      await deleteDoc(doc(db, 'invitations', invitation.id));
      toast.success('Successfully joined the workspace!');
      // State will update via the onSnapshot listener for user profile
    } catch (error) {
      console.error(error);
      toast.error('Failed to join workspace');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !newCommentText.trim() || !user) {
      toast.error('Missing task or comment text.');
      return;
    }

    setIsPostingComment(true);
    try {
      const commentData = {
        text: newCommentText.trim(),
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Anonymous',
        orgId: userProfile?.orgId || '', // Now optional in rules for maximum compatibility
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tasks', selectedTaskId, 'comments'), commentData);
      setNewCommentText('');
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error("DEBUG: Comment Post Failure", {
        error: error,
        taskId: selectedTaskId,
        userId: user.uid,
        orgId: userProfile?.orgId
      });
      
      if (error.code === 'permission-denied') {
        toast.error('Security alert: You do not have permission to comment here.');
      } else {
        toast.error('System error: ' + (error.message || 'Unknown failure'));
      }
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success('Task status updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update task');
    }
  };

  const toggleProjectMembership = async (projectId: string, memberId: string, isMember: boolean) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      let newMembers = project.members || [];
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

  const loadingView = (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (loading) {
    return loadingView;
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
                label="Tasks" 
                active={currentView === 'tasks'} 
                onClick={() => {
                  setCurrentView('tasks');
                  setSelectedProjectId(null);
                }}
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
          {invitations.length > 0 && userProfile?.orgId !== invitations[0].orgId && (
            <div className="bg-blue-600 text-white px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <Users size={20} />
                <span className="text-sm font-bold">You've been invited to join a different workspace!</span>
              </div>
              <button 
                onClick={() => handleJoinOrganization(invitations[0])}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
              >
                Join Now
              </button>
            </div>
          )}
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
                      value={visibleProjects.length} 
                      icon={<FolderKanban className="text-blue-600" />} 
                      trend="+2 this week"
                    />
                    <StatCard 
                      title="Visible Tasks" 
                      value={visibleTasks.length} 
                      icon={<ListTodo className="text-orange-600" />} 
                      trend={`${visibleTasks.filter(t => t.status === 'completed').length} completed`}
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
                    {visibleProjects.map(project => (
                      <motion.div 
                        key={project.id}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setCurrentView('tasks');
                        }}
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
                        {visibleTasks.slice(0, 5).map(task => (
                          <tr 
                            key={task.id} 
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{task.title}</span>
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
                        {visibleTasks.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                              No tasks that you're involved in were found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {currentView === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Projects</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleProjects.map(project => (
                    <div 
                      key={project.id}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                    >
                      <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                        <FolderKanban size={24} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{project.name}</h4>
                      <p className="text-sm text-slate-500 mb-6">{project.description || 'No description provided.'}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-xs font-bold text-slate-400 capitalize">Owner: {project.ownerId === user.uid ? 'You' : 'Team'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-blue-600">{visibleTasks.filter(t => t.projectId === project.id).length} Tasks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {visibleProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <FolderKanban className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500">No projects where you are a member found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'tasks' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedProjectId 
                        ? `${projects.find(p => p.id === selectedProjectId)?.name} Tasks` 
                        : (taskFilter === 'mine' ? 'My Tasks' : 'All My Relevant Tasks')}
                    </h3>
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                      <button 
                        onClick={() => {
                          setTaskFilter('all');
                          setSelectedProjectId(null);
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${taskFilter === 'all' && !selectedProjectId ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => {
                          setTaskFilter('mine');
                          setSelectedProjectId(null);
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${taskFilter === 'mine' && !selectedProjectId ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                      >
                        Mine
                      </button>
                    </div>
                  </div>
                  {selectedProjectId && (
                    <button 
                      onClick={() => setSelectedProjectId(null)}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      Clear Project Filter
                    </button>
                  )}
                </div>
                <div className="space-y-8">
                  {/* If filter active or empty, show flat list, otherwise group by project */}
                  {(selectedProjectId || visibleTasks.length === 0) ? (
                    <div className="grid gap-4">
                      {visibleTasks
                        .filter(t => {
                          if (selectedProjectId) return t.projectId === selectedProjectId;
                          if (taskFilter === 'mine') return t.assignedTo === user.uid;
                          return true;
                        })
                        .map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            project={projects.find(p => p.id === task.projectId)}
                            onOpen={() => setSelectedTaskId(task.id)}
                            onStatusChange={handleUpdateTaskStatus}
                          />
                        ))}
                      {visibleTasks.filter(t => {
                        if (selectedProjectId) return t.projectId === selectedProjectId;
                        if (taskFilter === 'mine') return t.assignedTo === user.uid;
                        return true;
                      }).length === 0 && (
                        <div className="py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                          <ListTodo className="mx-auto text-slate-300 mb-4" size={48} />
                          <p className="text-slate-500">No tasks found.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    visibleProjects.map(project => {
                      const projectTasks = visibleTasks.filter(t => {
                        const matchesProject = t.projectId === project.id;
                        const matchesFilter = taskFilter === 'mine' ? t.assignedTo === user.uid : true;
                        return matchesProject && matchesFilter;
                      });

                      if (projectTasks.length === 0 && taskFilter === 'mine') return null;

                      return (
                        <div key={project.id} className="space-y-4 pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                              <FolderKanban size={16} className="text-blue-600" />
                              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{project.name}</h4>
                              <span className="text-xs text-slate-400 font-medium ml-2">{projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}</span>
                            </div>
                            <button 
                              onClick={() => setSelectedProjectId(project.id)}
                              className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                            >
                              Focus Project
                            </button>
                          </div>
                          <div className="grid gap-4">
                            {projectTasks.map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                project={project}
                                onOpen={() => setSelectedTaskId(task.id)}
                                onStatusChange={handleUpdateTaskStatus}
                              />
                            ))}
                            {projectTasks.length === 0 && (
                              <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-xs italic">No tasks in this project yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Tasks without projects (edge case) */}
                  {!selectedProjectId && visibleTasks.some(t => !projects.find(p => p.id === t.projectId)) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-2">
                        <ListTodo size={16} className="text-slate-400" />
                        <h4 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Uncategorized Tasks</h4>
                      </div>
                      <div className="grid gap-4">
                         {visibleTasks
                           .filter(t => !projects.find(p => p.id === t.projectId))
                           .map(task => (
                            <TaskCard 
                              key={task.id} 
                              task={task} 
                              onOpen={() => setSelectedTaskId(task.id)}
                              onStatusChange={handleUpdateTaskStatus}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

        {/* Task Detail Modal */}
        <AnimatePresence>
          {selectedTaskId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTaskId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="relative bg-white w-full max-w-lg p-0 rounded-3xl shadow-2xl overflow-hidden"
              >
                {tasks.find(t => t.id === selectedTaskId) && (() => {
                  const task = tasks.find(t => t.id === selectedTaskId)!;
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <>
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <button 
                            onClick={() => setSelectedTaskId(null)}
                            className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all"
                          >
                            <LayoutDashboard size={20} className="rotate-45" />
                          </button>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{task.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium">
                            <FolderKanban size={14} className="text-blue-600" />
                            {project?.name || 'Private Project'}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                          </div>
                        </div>
                      </div>

                      <div className="p-8 space-y-8 h-[400px] overflow-y-auto">
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Description</h4>
                          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                            {task.description || 'No detailed description provided for this task.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assignee</h4>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {task.assignedToName?.charAt(0) || '?'}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{task.assignedToName || 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status</h4>
                            <select 
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={16} />
                            Discussion ({comments.length})
                          </h4>
                          
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {comment.userName.charAt(0)}
                                </div>
                                <div className="flex-1 bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-900">{comment.userName}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                            {comments.length === 0 && (
                              <p className="text-center text-xs text-slate-400 italic py-4">No comments yet. Start the conversation!</p>
                            )}
                          </div>

                          {/* Post Comment Input */}
                          <form onSubmit={handlePostComment} className="relative mt-4">
                            <input 
                              type="text"
                              placeholder="Write a comment..."
                              className="w-full h-12 pl-4 pr-12 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              disabled={isPostingComment}
                            />
                            <button 
                              type="submit"
                              disabled={!newCommentText.trim() || isPostingComment}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Send size={18} />
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={() => setSelectedTaskId(null)}
                          className="px-6 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          Close Detail
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

// --- Helper Components ---

function TaskCard({ task, project, onOpen, onStatusChange }: { task: Task, project?: Project, onOpen: () => void, onStatusChange: (id: string, status: string) => any, key?: any }) {
  return (
    <div 
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex gap-4">
        <div className={`w-1 h-12 rounded-full ${
          task.priority === 'high' ? 'bg-red-500' : 
          task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
        }`} />
        <div>
          <h4 className="font-bold text-slate-900">{task.title}</h4>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            {project && <><FolderKanban size={10} /> {project.name} <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" /></>}
            Assigned to: {task.assignedToName || 'Unassigned'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
          task.status === 'completed' ? 'bg-green-100 text-green-700' : 
          task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>
    </div>
  );
}

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
