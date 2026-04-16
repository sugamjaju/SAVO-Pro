import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  OperationType, 
  handleFirestoreError,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from './lib/firebase';
import { 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LogOut,
  ChevronRight,
  Settings,
  Calendar as CalendarIcon,
  Tag,
  User as UserIcon,
  FolderKanban,
  Mail,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedToName: string;
  dueDate: any;
  createdAt: any;
  updatedAt: any;
  projectId: string;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'member';
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
  taskId?: string;
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
        <Button onClick={() => window.location.reload()}>Reload Application</Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync User Profile
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (!docSnap.exists()) {
          setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            role: 'member'
          });
        }
      });
    }
  }, [user]);

  // Fetch Projects
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));
    return unsubscribe;
  }, [user]);

  // Fetch Tasks
  useEffect(() => {
    if (!selectedProjectId) return;
    const q = query(collection(db, 'tasks'), where('projectId', '==', selectedProjectId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));
    return unsubscribe;
  }, [selectedProjectId]);

  // Fetch Users (for assignment)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    return unsubscribe;
  }, [user]);

  // Fetch Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
    return unsubscribe;
  }, [user]);

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
          toast.error("Firebase connection failed. Please check your configuration.");
        }
      }
    };
    if (user) testConnection();
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Toaster position="top-right" />
        
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
          <div className="p-8 flex flex-col h-full">
            <div className="text-xs font-bold uppercase tracking-[2px] text-slate-400 mb-8">
              Workflow Pro
            </div>

            <nav className="flex-1 space-y-1">
              <SidebarItem 
                icon={<LayoutDashboard size={18} />} 
                label="Project Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <SidebarItem 
                icon={<ListTodo size={18} />} 
                label="Active Tasks" 
                active={activeTab === 'tasks'} 
                onClick={() => setActiveTab('tasks')} 
              />
              <SidebarItem 
                icon={<FolderKanban size={18} />} 
                label="Team Activity" 
                active={activeTab === 'team'} 
                onClick={() => setActiveTab('team')} 
              />
              <SidebarItem 
                icon={<Users size={18} />} 
                label="Resource Allocation" 
                active={activeTab === 'projects'} 
                onClick={() => setActiveTab('projects')} 
              />
              <SidebarItem 
                icon={<Settings size={18} />} 
                label="Admin Settings" 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
              />
            </nav>

            <div className="mt-auto pt-8">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Recent Mentions
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 2).map(n => (
                    <div key={n.id} className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">@{n.message.split(' ')[0]}</span> {n.message.split(' ').slice(1).join(' ')}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-xs text-slate-500 italic">No recent mentions</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <Avatar className="w-8 h-8 border border-white/10">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback className="bg-slate-700 text-xs">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="w-6 h-6 hover:bg-transparent">
                  <LogOut size={14} className="text-slate-500 hover:text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-24 flex items-center justify-between px-8">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-800">
                {projects.find(p => p.id === selectedProjectId)?.name || 'Project Management'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-6 border-none shadow-none p-0 text-xs text-slate-500 bg-transparent hover:text-primary transition-colors w-auto gap-1">
                    <SelectValue placeholder="Switch Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start px-2 py-1.5 text-xs">
                          <Plus size={12} className="mr-2" /> New Project
                        </Button>
                      </DialogTrigger>
                      <CreateProjectDialog user={user} />
                    </Dialog>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Search tasks..." 
                  className="h-10 pl-9 bg-white border-slate-200 text-sm rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <NotificationPopover notifications={notifications} />
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm">
                    + New Task
                  </Button>
                </DialogTrigger>
                <CreateTaskDialog projectId={selectedProjectId!} users={users} user={user} />
              </Dialog>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard title="Pending Tasks" value={tasks.filter(t => t.status === 'pending').length} color="var(--pending)" />
                    <StatCard title="In Progress" value={tasks.filter(t => t.status === 'in-progress').length} color="var(--active)" />
                    <StatCard title="Completed" value={tasks.filter(t => t.status === 'completed').length} color="var(--completed)" />
                    <StatCard title="Team Velocity" value="92%" color="var(--foreground)" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Task Progress</CardTitle>
                        <CardDescription>Overview of task completion over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getTaskChartData(tasks)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Priority Distribution</CardTitle>
                        <CardDescription>Tasks by priority level</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPriorityChartData(tasks)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getPriorityChartData(tasks).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4">
                          {getPriorityChartData(tasks).map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-slate-600">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates across your projects</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">View All</Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {tasks.slice(0, 5).map(task => (
                          <div key={task.id} className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{task.title}</p>
                              <p className="text-xs text-slate-500">Assigned to {task.assignedToName} • {format(task.createdAt?.toDate() || new Date(), 'MMM d, h:mm a')}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize">{task.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div 
                  key="tasks"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Task Management</h2>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="gap-2">
                        <Filter size={16} /> Filter
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Settings size={16} /> View Options
                      </Button>
                    </div>
                  </div>

                  <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
                    <Table>
                      <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 h-12 px-6">Task Description</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 h-12">Assignee</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 h-12">Status</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 h-12">Latest Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map(task => (
                          <TableRow key={task.id} className="group hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={task.status === 'completed'} 
                                  onCheckedChange={(checked) => {
                                    updateDoc(doc(db, 'tasks', task.id), { 
                                      status: checked ? 'completed' : 'pending',
                                      updatedAt: serverTimestamp()
                                    });
                                  }}
                                  className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {task.title}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6 border border-slate-200">
                                  <AvatarFallback className="text-[10px] font-bold bg-slate-100">{task.assignedToName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-slate-600 font-medium">{task.assignedToName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={task.status} />
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-slate-500 max-w-[300px] truncate">
                                {task.description || 'No updates yet.'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div 
                  key="projects"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {projects.map(project => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <FolderKanban size={20} />
                          </div>
                          <Badge variant="outline">{project.members.length} members</Badge>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 5).map((m, i) => (
                            <Avatar key={i} className="border-2 border-white w-8 h-8">
                              <AvatarFallback className="text-[10px] bg-slate-100">U</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                              +{project.members.length - 5}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-primary hover:border-primary">
                        <Plus size={32} className="mb-2" />
                        <span className="font-medium">Create New Project</span>
                      </Card>
                    </DialogTrigger>
                    <CreateProjectDialog user={user} />
                  </Dialog>
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
                    <Button className="gap-2">
                      <Plus size={18} /> Invite Member
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {users.map(u => (
                      <Card key={u.uid} className="text-center p-6">
                        <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-slate-50 shadow-sm">
                          <AvatarImage src={u.photoURL} />
                          <AvatarFallback className="text-xl">{u.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-slate-900">{u.displayName}</h3>
                        <p className="text-sm text-slate-500 mb-4">{u.email}</p>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {u.role}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// --- Helper Components ---

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
        // Profile sync is handled by the useEffect in App
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
      <Toaster position="top-right" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl"
      >
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">TaskFlow Pro</h1>
        <p className="text-slate-600 mb-8 text-center">
          {isLogin ? 'Sign in to your account' : 'Create your workspace today'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  id="name"
                  placeholder="John Doe" 
                  className="pl-10"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                id="email"
                type="email"
                placeholder="name@company.com" 
                className="pl-10"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                id="password"
                type="password"
                placeholder="••••••••" 
                className="pl-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg gap-2" disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary font-semibold hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={signInWithGoogle} className="w-full gap-2 text-slate-500">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" className="w-4 h-4" alt="Google" />
            Or continue with Google
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
        active 
          ? 'bg-white/10 text-white font-medium' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white">
      <CardContent className="p-6">
        <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'pending': 'bg-amber-100 text-amber-800 border-transparent',
    'in-progress': 'bg-blue-100 text-blue-800 border-transparent',
    'completed': 'bg-emerald-100 text-emerald-800 border-transparent'
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800'}`}>
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    'low': 'bg-blue-50 text-blue-600 border-blue-200',
    'medium': 'bg-amber-50 text-amber-600 border-amber-200',
    'high': 'bg-red-50 text-red-600 border-red-200'
  };
  return (
    <Badge variant="outline" className={`capitalize ${styles[priority as keyof typeof styles]}`}>
      {priority}
    </Badge>
  );
}

function CreateProjectDialog({ user }: { user: any }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    try {
      await addDoc(collection(db, 'projects'), {
        name,
        description: desc,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp()
      });
      toast.success('Project created successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Project</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input placeholder="e.g. Q2 Marketing Campaign" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="What is this project about?" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate}>Create Project</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CreateTaskDialog({ projectId, users, user }: { projectId: string, users: UserProfile[], user: any }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');

  const handleCreate = async () => {
    if (!title || !projectId) return;
    const assigneeUser = users.find(u => u.uid === assignee);
    try {
      const taskRef = await addDoc(collection(db, 'tasks'), {
        title,
        description: desc,
        status: 'pending',
        priority,
        assignedTo: assignee,
        assignedToName: assigneeUser?.displayName || 'Unassigned',
        projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: []
      });

      // Create notification for assignee
      if (assignee && assignee !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: assignee,
          message: `${user.displayName} assigned you a new task: ${title}`,
          type: 'assignment',
          read: false,
          createdAt: serverTimestamp(),
          taskId: taskRef.id
        });
      }

      toast.success('Task created successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Task</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Task Title</Label>
          <Input placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="Add more details..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.uid} value={u.uid}>{u.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate}>Create Task</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NotificationPopover({ notifications }: { notifications: Notification[] }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    updateDoc(doc(db, 'notifications', id), { read: true });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} className="text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto py-4 space-y-4">
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 rounded-xl transition-colors cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50/50 border border-blue-100'}`}
                onClick={() => markAsRead(n.id)}
              >
                <p className="text-sm text-slate-900">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-1">{format(n.createdAt?.toDate() || new Date(), 'MMM d, h:mm a')}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Chart Data Helpers ---

function getTaskChartData(tasks: Task[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'EEE');
  }).reverse();

  return last7Days.map(day => ({
    name: day,
    tasks: tasks.filter(t => t.status === 'completed' && format(t.updatedAt?.toDate() || new Date(), 'EEE') === day).length
  }));
}

function getPriorityChartData(tasks: Task[]) {
  const counts = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  return [
    { name: 'High', value: counts.high, color: '#ef4444' },
    { name: 'Medium', value: counts.medium, color: '#f59e0b' },
    { name: 'Low', value: counts.low, color: '#3b82f6' },
  ];
}
