import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getMyOrganization, getOrganizations } from '@/services/api';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedFramework, setSelectedFramework] = useState('NIST CSF 2.0');

  useEffect(() => {
    let mounted = true;
    Promise.all([getMyOrganization(), getOrganizations()])
      .then(([myOrg, allOrgs]) => {
        if (mounted) {
          if (myOrg) {
            setSelectedOrg(myOrg);
            if (myOrg.primary_framework) {
              setSelectedFramework(myOrg.primary_framework);
            }
          }
          if (Array.isArray(allOrgs)) {
            setOrganizations(allOrgs);
          }
        }
      })
      .catch((err) => {
        console.warn('Error fetching organization info:', err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
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
          onSelectOrg={setSelectedOrg}
          selectedFramework={selectedFramework}
          onSelectFramework={setSelectedFramework}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ selectedOrg, selectedFramework }} />
        </main>
      </div>
    </div>
  );
}
