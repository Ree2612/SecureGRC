import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getMyOrganization, getOrganizations, switchOrganization } from '@/services/api';
import { useToast } from '@/lib/ToastContext';

export function AppLayout() {
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedFramework, setSelectedFramework] = useState('NIST CSF 2.0');

  const loadOrganizations = async () => {
    try {
      const [myOrg, allOrgs] = await Promise.all([getMyOrganization(), getOrganizations()]);
      if (myOrg) {
        setSelectedOrg(myOrg);
        if (myOrg.primary_framework) {
          setSelectedFramework(myOrg.primary_framework);
        }
      }
      if (Array.isArray(allOrgs)) {
        setOrganizations(allOrgs);
      }
    } catch (err) {
      console.warn('Error fetching organization info:', err.message);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleSelectOrg = async (org) => {
    if (!org || org.id === selectedOrg?.id) return;
    try {
      const switched = await switchOrganization(org.id);
      setSelectedOrg(switched);
      if (switched.primary_framework) {
        setSelectedFramework(switched.primary_framework);
      }
      toast.info('Switched Workspace', `Active entity: ${switched.name}`);
    } catch (err) {
      toast.error('Switch Failed', err.message);
    }
  };

  const handleOrganizationCreated = (newOrg) => {
    setOrganizations((prev) => [newOrg, ...prev.filter((o) => o.id !== newOrg.id)]);
    setSelectedOrg(newOrg);
    if (newOrg.primary_framework) {
      setSelectedFramework(newOrg.primary_framework);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col md:flex-row font-sans transition-colors">
      {/* Fixed Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        organizationName={selectedOrg?.name}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Topbar
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          organizations={organizations}
          selectedOrg={selectedOrg}
          onSelectOrg={handleSelectOrg}
          selectedFramework={selectedFramework}
          onSelectFramework={setSelectedFramework}
          onOrganizationCreated={handleOrganizationCreated}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ selectedOrg, selectedFramework, reloadOrganizations: loadOrganizations }} />
        </main>
      </div>
    </div>
  );
}
