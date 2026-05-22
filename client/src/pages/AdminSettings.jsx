import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Settings2, ShieldCheck } from "lucide-react";

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage application preferences and security settings.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-4 py-3 font-medium">
          <Settings2 size={18} /> Admin tools
        </div>
      </header>

      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
        <section className="rounded-3xl border border-border p-6 bg-background/80">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">Security & Access</h2>
          </div>
          <p className="text-muted-foreground">
            Admin settings are coming soon. Use this space to configure user
            roles, authentication policies, and platform controls.
          </p>
        </section>

        <section className="rounded-3xl border border-border p-6 bg-background/80">
          <div className="flex items-center gap-3 mb-4">
            <Settings2 size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">App Controls</h2>
          </div>
          <p className="text-muted-foreground">
            You can extend this page with release notes, environment
            configuration, or maintenance mode settings for a polished admin
            experience.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
