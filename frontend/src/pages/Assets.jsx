import React, { useState, useEffect, useCallback } from 'react';
import { getAssets, createAsset, deleteAsset } from '@/services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { Server, Plus, Search, Trash2, Database, Cloud, Key, Monitor } from 'lucide-react';

export function Assets() {
  const toast = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Cloud Infrastructure',
    criticality: 'Medium',
    owner: '',
    description: '',
    status: 'Active',
  });

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (criticalityFilter) params.criticality = criticalityFilter;
      if (typeFilter) params.asset_type = typeFilter;

      const data = await getAssets(params);
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch asset inventory.');
    } finally {
      setLoading(false);
    }
  }, [search, criticalityFilter, typeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAssets();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadAssets]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.owner) {
      toast.error('Validation Error', 'Asset Name and Owner are required.');
      return;
    }

    try {
      await createAsset(newAsset);
      toast.success('Asset Registered', `Added "${newAsset.name}" to inventory.`);
      setIsCreateOpen(false);
      setNewAsset({
        name: '',
        type: 'Cloud Infrastructure',
        criticality: 'Medium',
        owner: '',
        description: '',
        status: 'Active',
      });
      loadAssets();
    } catch (err) {
      toast.error('Registration Failed', err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove asset "${name}" from inventory?`)) return;
    try {
      await deleteAsset(id);
      toast.success('Asset Removed', `Deleted "${name}"`);
      loadAssets();
    } catch (err) {
      toast.error('Deletion Failed', err.message);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Database':
        return <Database className="w-3.5 h-3.5 text-blue-600" />;
      case 'Identity':
        return <Key className="w-3.5 h-3.5 text-amber-600" />;
      case 'Endpoint':
        return <Monitor className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Cloud className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Asset Inventory & Scope
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain dynamic inventory of critical cloud, database, identity, and SaaS systems in audit scope.
          </p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setIsCreateOpen(true)}>
          Register Asset
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-border shadow-card grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search asset, owner, description..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div>
          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Criticalities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Asset Types</option>
            <option value="Cloud Infrastructure">Cloud Infrastructure</option>
            <option value="Database">Database</option>
            <option value="Identity">Identity</option>
            <option value="Compute">Compute</option>
            <option value="Endpoint">Endpoint</option>
            <option value="SaaS">SaaS Platform</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadAssets} />
      ) : loading ? (
        <div className="bg-white rounded-lg border border-border shadow-card">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No Assets Found"
          description="There are no assets matching your criteria or no assets registered."
          actionLabel="Register First Asset"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Scope Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-semibold text-slate-900 max-w-xs truncate">
                    {asset.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      {getTypeIcon(asset.type)}
                      <span>{asset.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge severity={asset.criticality}>{asset.criticality}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium truncate max-w-[130px]">
                    {asset.owner}
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-xs text-xs truncate">
                    {asset.description}
                  </TableCell>
                  <TableCell>
                    <Badge status={asset.status}>{asset.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Asset Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Enterprise Asset in Scope"
        description="Add compute nodes, databases, or cloud environments for continuous compliance auditing"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Asset Name *"
            placeholder="e.g. AWS Production Aurora PostgreSQL Cluster"
            value={newAsset.name}
            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Asset Type
              </label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Database">Database</option>
                <option value="Compute">Compute</option>
                <option value="Identity">Identity</option>
                <option value="Endpoint">Endpoint</option>
                <option value="SaaS">SaaS Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Criticality Tier
              </label>
              <select
                value={newAsset.criticality}
                onChange={(e) => setNewAsset({ ...newAsset, criticality: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Asset Owner / Team *"
              placeholder="e.g. DevOps & Infrastructure"
              value={newAsset.owner}
              onChange={(e) => setNewAsset({ ...newAsset, owner: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={newAsset.status}
                onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Deprecated">Deprecated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description & Audit Context
            </label>
            <textarea
              rows={2}
              placeholder="Detail data sensitivity, environment regions, or hosted workloads..."
              value={newAsset.description}
              onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
