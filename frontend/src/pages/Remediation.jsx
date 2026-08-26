import React, { useState, useEffect, useCallback } from 'react';
import { getRemediations, updateRemediation, createRemediation } from '@/services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { ListTodo, Plus, Search, CheckCircle2, Edit2, Sliders } from 'lucide-react';

export function Remediation() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form states
  const [newTask, setNewTask] = useState({
    task_name: '',
    priority: 'High',
    owner: '',
    progress: 0,
    status: 'In Progress',
    due_date: '2026-10-15',
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await getRemediations(params);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch remediation tasks.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTasks();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadTasks]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.task_name || !newTask.owner) {
      toast.error('Validation Error', 'Task Name and Owner are required.');
      return;
    }

    try {
      await createRemediation(newTask);
      toast.success('Task Created', `Created task "${newTask.task_name}"`);
      setIsCreateOpen(false);
      setNewTask({
        task_name: '',
        priority: 'High',
        owner: '',
        progress: 0,
        status: 'In Progress',
        due_date: '2026-10-15',
      });
      loadTasks();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    }
  };

  const handleUpdateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await updateRemediation(editingTask.id, {
        task_name: editingTask.task_name,
        priority: editingTask.priority,
        owner: editingTask.owner,
        progress: Number(editingTask.progress),
        status: editingTask.status,
        due_date: editingTask.due_date,
      });
      toast.success('Task Updated', 'Remediation task progress recorded.');
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Remediation Action Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor progress and assign accountability for resolving security findings and gap mitigations.
          </p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setIsCreateOpen(true)}>
          New Remediation Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-border shadow-card flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search task title, owner..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Not Started">Not Started</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Remediation Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadTasks} />
      ) : loading ? (
        <div className="bg-white rounded-lg border border-border shadow-card">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No Remediation Tasks Found"
          description="There are no active remediation actions matching your filter criteria."
          actionLabel="Create Remediation"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-48">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-semibold text-slate-900 max-w-sm truncate">
                    {task.task_name}
                  </TableCell>
                  <TableCell>
                    <Badge severity={task.priority}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium truncate max-w-[140px]">
                    {task.owner}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            task.progress === 100
                              ? 'bg-emerald-600'
                              : task.progress >= 50
                              ? 'bg-primary-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge status={task.status}>{task.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {task.due_date}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Edit2}
                      onClick={() => setEditingTask(task)}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          title={`Update Remediation: ${editingTask.task_name}`}
          description="Adjust completion percentage, ownership, and target resolution date"
        >
          <form onSubmit={handleUpdateTaskSubmit} className="space-y-4 text-xs">
            <Input
              label="Task Name *"
              value={editingTask.task_name}
              onChange={(e) => setEditingTask({ ...editingTask, task_name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner *"
                value={editingTask.owner}
                onChange={(e) => setEditingTask({ ...editingTask, owner: e.target.value })}
                required
              />
              <Input
                label="Target Due Date"
                type="date"
                value={editingTask.due_date}
                onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Priority
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Task Status
                </label>
                <select
                  value={editingTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    const newProg = newStatus === 'Completed' ? 100 : editingTask.progress;
                    setEditingTask({ ...editingTask, status: newStatus, progress: newProg });
                  }}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Progress Percentage: {editingTask.progress}%
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editingTask.progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditingTask({
                    ...editingTask,
                    progress: val,
                    status: val === 100 ? 'Completed' : editingTask.status === 'Completed' ? 'In Progress' : editingTask.status,
                  });
                }}
                className="w-full accent-primary-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Progress
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Remediation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Remediation Action"
        description="Establish actionable tasks with ownership and tracking metrics"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Task Name *"
            placeholder="e.g. Enforce Hardware Token MFA on AWS Console Root Accounts"
            value={newTask.task_name}
            onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assigned Lead Owner *"
              placeholder="e.g. Sarah Jenkins"
              value={newTask.owner}
              onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
              required
            />
            <Input
              label="Target Due Date"
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Initial Status
              </label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="In Progress">In Progress</option>
                <option value="Not Started">Not Started</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
