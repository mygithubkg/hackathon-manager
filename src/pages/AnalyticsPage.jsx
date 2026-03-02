import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  BookOpen,
  Calendar,
  Clipboard,
  Users,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import DashboardLayout from '../components/DashboardLayout';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { db } from '../firebase';
import { getRelativeTime } from '../utils/relativeTime';

const STATUS_COLORS = {
  Planning: '#6b7280',
  Ongoing: '#6366f1',
  Completed: '#10b981',
  'On Hold': '#f59e0b'
};

const actionLabelMap = {
  task_completed: 'Tasks Completed',
  task_added: 'Tasks Added',
  task_uncompleted: 'Tasks Reopened',
  task_deleted: 'Tasks Deleted',
  project_created: 'Projects Created',
  project_updated: 'Projects Updated',
  project_deleted: 'Projects Deleted',
  project_status_changed: 'Status Changes',
  resource_added: 'Resources Added',
  resource_deleted: 'Resources Removed',
  checklist_item_checked: 'Checklist Checked',
  checklist_item_unchecked: 'Checklist Unchecked',
  todo_created: 'Todos Created',
  todo_completed: 'Todos Completed',
  todo_deleted: 'Todos Deleted',
  snippet_created: 'Snippets Created',
  snippet_edited: 'Snippets Edited',
  snippet_deleted: 'Snippets Deleted'
};

const StatCard = ({ icon: Icon, title, value, sub, iconClass = 'text-indigo-300', ringPercent = null, ringColor = '#6366f1' }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const stroke = ringPercent === null ? circumference : circumference - (Math.min(Math.max(ringPercent, 0), 100) / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-2xl font-heading font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{sub}</p>
        </div>
        <div className="relative h-14 w-14 flex items-center justify-center">
          {ringPercent !== null && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="4" fill="none" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke={ringColor}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={stroke}
                strokeLinecap="round"
              />
            </svg>
          )}
          <Icon size={20} className={iconClass} />
        </div>
      </div>
    </motion.div>
  );
};

function AnalyticsPage() {
  const { currentUser, logout } = useAuth();
  const { currentTeam } = useTeam();

  const [hackathons, setHackathons] = useState([]);
  const [todos, setTodos] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setHackathons([]);
      setTodos([]);
      setSnippets([]);
      setActivityLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const hackathonsRef = collection(db, 'hackathons');
    const todosRef = collection(db, 'todos');
    const snippetsRef = collection(db, 'snippets');
    const logsRef = collection(db, 'activityLogs');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const hackathonsQuery = currentTeam
      ? query(hackathonsRef, where('teamId', '==', currentTeam.id))
      : query(hackathonsRef, where('ownerId', '==', currentUser.uid));

    const todosQuery = currentTeam
      ? query(todosRef, where('teamId', '==', currentTeam.id))
      : query(todosRef, where('ownerId', '==', currentUser.uid));

    const snippetsQuery = currentTeam
      ? query(snippetsRef, where('teamId', '==', currentTeam.id))
      : query(snippetsRef, where('ownerId', '==', currentUser.uid));

    const ownerSnippetsQuery = query(snippetsRef, where('ownerId', '==', currentUser.uid));

    const logsQuery = currentTeam
      ? query(logsRef, where('teamId', '==', currentTeam.id), where('createdAt', '>=', thirtyDaysAgo), orderBy('createdAt', 'desc'), limit(200))
      : query(logsRef, where('ownerId', '==', currentUser.uid), where('createdAt', '>=', thirtyDaysAgo), orderBy('createdAt', 'desc'), limit(200));

    const unsubscribers = [];
    let snippetsFallbackUnsubscribe = null;

    unsubscribers.push(onSnapshot(
      hackathonsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((item) => currentTeam ? item.teamId === currentTeam.id : !item.teamId);
        setHackathons(items);
      },
      (error) => {
        console.error('Analytics hackathons listener failed:', error);
        setHackathons([]);
      }
    ));

    unsubscribers.push(onSnapshot(
      todosQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((item) => currentTeam ? item.teamId === currentTeam.id : !item.teamId);
        setTodos(items);
      },
      (error) => {
        console.error('Analytics todos listener failed:', error);
        setTodos([]);
      }
    ));

    unsubscribers.push(onSnapshot(
      snippetsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((item) => currentTeam ? item.teamId === currentTeam.id : !item.teamId);
        setSnippets(items);
      },
      (error) => {
        console.error('Analytics snippets listener failed:', error);
        if (currentTeam && error?.code === 'permission-denied') {
          console.warn('Analytics falling back to owner snippets in team mode due permission-denied.');
          if (!snippetsFallbackUnsubscribe) {
            snippetsFallbackUnsubscribe = onSnapshot(
              ownerSnippetsQuery,
              (ownerSnapshot) => {
                const ownerItems = ownerSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
                  .filter((item) => !item.teamId || item.ownerId === currentUser.uid);
                setSnippets(ownerItems);
              },
              (fallbackError) => {
                console.error('Analytics owner snippets fallback failed:', fallbackError);
                setSnippets([]);
              }
            );
          }
        } else {
          setSnippets([]);
        }
      }
    ));

    unsubscribers.push(onSnapshot(
      logsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((item) => currentTeam ? item.teamId === currentTeam.id : !item.teamId);
        setActivityLogs(items);
        setLoading(false);
      },
      (error) => {
        console.error('Analytics activity logs listener failed:', error);
        setActivityLogs([]);
        setLoading(false);
      }
    ));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (snippetsFallbackUnsubscribe) snippetsFallbackUnsubscribe();
    };
  }, [currentUser, currentTeam]);

  const metrics = useMemo(() => {
    const totalProjects = hackathons.length;
    const completedProjects = hackathons.filter((project) => project.status === 'Completed').length;
    const activeProjects = hackathons.filter((project) => project.status === 'Ongoing').length;

    const allTasks = hackathons.flatMap((project) => [
      ...(project.tasks || []).map((task) => ({ done: !!task.done })),
      ...(project.checklist || []).map((item) => ({ done: !!item.completed }))
    ]);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.done).length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const now = new Date();
    const nextSevenDays = new Date();
    nextSevenDays.setDate(now.getDate() + 7);

    const upcomingDeadlines = hackathons.filter((project) => {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      return deadline >= now && deadline <= nextSevenDays;
    });

    const criticalDeadlines = upcomingDeadlines.filter((project) => {
      const deadline = new Date(project.deadline);
      return deadline.getTime() - now.getTime() <= 48 * 60 * 60 * 1000;
    }).length;

    const totalResources = hackathons.reduce((sum, project) => sum + (project.resources?.length || 0), 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const todosThisWeek = todos.filter((todo) => {
      if (!todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= weekStart && dueDate < weekEnd;
    });

    const completedTodosWeek = todosThisWeek.filter((todo) => !!todo.completed).length;

    const latestSnippet = [...snippets].sort((first, second) => {
      const firstTime = first?.createdAt?.toDate?.()?.getTime?.() || 0;
      const secondTime = second?.createdAt?.toDate?.()?.getTime?.() || 0;
      return secondTime - firstTime;
    })[0];

    const members = currentTeam?.memberProfiles || [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyActivityCount = activityLogs.filter((log) => {
      const date = log?.createdAt?.toDate?.();
      return date ? date >= sevenDaysAgo : false;
    }).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      completionRate,
      upcomingDeadlines,
      criticalDeadlines,
      totalResources,
      todosThisWeekCount: todosThisWeek.length,
      completedTodosWeek,
      pendingTodosWeek: todosThisWeek.length - completedTodosWeek,
      snippetsCount: snippets.length,
      latestSnippet,
      members,
      weeklyActivityCount
    };
  }, [hackathons, todos, snippets, activityLogs, currentTeam]);

  const statusBreakdown = useMemo(() => {
    const counts = { Planning: 0, Ongoing: 0, Completed: 0, 'On Hold': 0 };
    hackathons.forEach((project) => {
      const key = counts[project.status] !== undefined ? project.status : 'Planning';
      counts[key] += 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((entry) => entry.value > 0);
  }, [hackathons]);

  const taskProgressByProject = useMemo(() => {
    return hackathons
      .map((project) => {
        const taskCount = (project.tasks?.length || 0) + (project.checklist?.length || 0);
        const doneCount = (project.tasks?.filter((task) => task.done).length || 0)
          + (project.checklist?.filter((item) => item.completed).length || 0);
        const percent = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
        return {
          name: (project.title || 'Untitled').slice(0, 20),
          percent,
          taskCount
        };
      })
      .sort((first, second) => second.taskCount - first.taskCount)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        fill: item.percent === 100 ? '#10b981' : item.percent > 50 ? '#6366f1' : item.percent > 0 ? '#f59e0b' : '#ef4444'
      }));
  }, [hackathons]);

  const activityLast14Days = useMemo(() => {
    const labels = [];
    const counts = new Map();

    for (let index = 13; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      labels.push({ key, label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
      counts.set(key, 0);
    }

    activityLogs.forEach((log) => {
      const date = log?.createdAt?.toDate?.();
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      if (counts.has(key)) counts.set(key, counts.get(key) + 1);
    });

    return labels.map((entry) => ({ day: entry.label, value: counts.get(entry.key) || 0 }));
  }, [activityLogs]);

  const todoPriorityBreakdown = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    todos.forEach((todo) => {
      const key = String(todo.priority || 'medium').toLowerCase();
      if (counts[key] !== undefined) counts[key] += 1;
    });

    return [
      { name: 'High', value: counts.high, color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low', value: counts.low, color: '#6b7280' }
    ].filter((entry) => entry.value > 0);
  }, [todos]);

  const topActions = useMemo(() => {
    const map = new Map();
    activityLogs.forEach((log) => {
      const key = log.type || 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return [...map.entries()]
      .map(([type, count]) => ({
        type,
        label: actionLabelMap[type] || type,
        count
      }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 5);
  }, [activityLogs]);

  const maxActionCount = topActions[0]?.count || 1;

  const noData = !loading
    && hackathons.length === 0
    && todos.length === 0
    && snippets.length === 0
    && activityLogs.length === 0;

  return (
    <DashboardLayout
      user={currentUser}
      currentTeam={currentTeam}
      onLogout={logout}
      onAddClick={() => {}}
      onTeamClick={() => {}}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Track performance, activity, and project momentum.</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((entry) => (
              <div key={entry} className="h-24 rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative">
                <div className="absolute inset-0 shimmer" />
              </div>
            ))}
          </div>
        ) : noData ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
            <Zap size={36} className="mx-auto text-indigo-300 mb-3" />
            <p className="text-gray-300">No activity yet. Start adding projects and completing tasks to see your progress here! ✦</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                icon={FolderOpen}
                iconClass="text-indigo-300"
                title="Total Projects"
                value={metrics.totalProjects}
                sub={`${metrics.activeProjects} active, ${metrics.completedProjects} completed`}
              />
              <StatCard
                icon={CheckCircle}
                iconClass={metrics.completionRate > 70 ? 'text-emerald-300' : metrics.completionRate >= 40 ? 'text-amber-300' : 'text-red-300'}
                title="Tasks Completion"
                value={`${metrics.completionRate}%`}
                sub={`${metrics.completedTasks} of ${metrics.totalTasks} tasks done`}
                ringPercent={metrics.completionRate}
                ringColor={metrics.completionRate > 70 ? '#10b981' : metrics.completionRate >= 40 ? '#f59e0b' : '#ef4444'}
              />
              <StatCard
                icon={Clock}
                iconClass={metrics.criticalDeadlines > 0 ? 'text-red-300' : 'text-amber-300'}
                title="Upcoming Deadlines"
                value={metrics.upcomingDeadlines.length}
                sub={metrics.upcomingDeadlines.slice(0, 2).map((entry) => entry.title).join(' · ') || 'No upcoming deadlines'}
              />
              <StatCard
                icon={BookOpen}
                iconClass="text-purple-300"
                title="Resources Saved"
                value={metrics.totalResources}
                sub={`across ${metrics.totalProjects} projects`}
              />
              <StatCard
                icon={Calendar}
                iconClass="text-indigo-300"
                title="Todos This Week"
                value={metrics.todosThisWeekCount}
                sub={`${metrics.completedTodosWeek} completed, ${metrics.pendingTodosWeek} pending`}
              />
              <StatCard
                icon={Clipboard}
                iconClass="text-indigo-300"
                title="Snippets Saved"
                value={metrics.snippetsCount}
                sub={`last added ${metrics.latestSnippet ? getRelativeTime(metrics.latestSnippet.createdAt) : 'N/A'}`}
              />
              {currentTeam && (
                <StatCard
                  icon={Users}
                  iconClass="text-purple-300"
                  title="Team Members"
                  value={metrics.members.length}
                  sub={metrics.members.slice(0, 3).map((member) => member.displayName || member.email).join(' · ') || 'No members'}
                />
              )}
              <StatCard
                icon={Zap}
                iconClass="text-amber-300"
                title="Activity This Week"
                value={metrics.weeklyActivityCount}
                sub="actions logged"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-3">Projects by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        isAnimationActive
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {statusBreakdown.map((entry) => (
                    <div key={entry.name} className="text-xs text-gray-300 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#6366f1' }} />{entry.name}</span>
                      <span>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-3">Task Progress by Project</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskProgressByProject} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#d1d5db', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="percent" radius={[0, 8, 8, 0]}>
                        {taskProgressByProject.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Activity — Last 14 Days</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityLast14Days} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#activityFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-3">Todo Priorities</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={todoPriorityBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={76}
                        isAnimationActive
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {todoPriorityBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-3">Most Frequent Actions</h3>
                <div className="space-y-3">
                  {topActions.map((action) => (
                    <div key={action.type}>
                      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                        <span>{action.label}</span>
                        <span>{action.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${(action.count / maxActionCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                <a href="#" className="text-xs text-indigo-300">View all activity →</a>
              </div>
              <ActivityFeed logs={activityLogs.slice(0, 10)} showProject emptyMessage="No activity yet." />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AnalyticsPage;
