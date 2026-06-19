"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Shield, Bell, Trash2, Loader2, Check, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications" | "danger">("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    age: "",
    city: "",
    country: "",
    occupation: "",
    familySize: 1,
    dietType: "vegetarian",
    transportMode: "car",
    electricityUsage: "medium",
  });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications Form State
  const [notifications, setNotifications] = useState({
    emailReports: true,
    streakReminders: true,
    badgeAlerts: true,
  });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Load user profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfileData({
              age: data.profile.age || "",
              city: data.profile.city || "",
              country: data.profile.country || "",
              occupation: data.profile.occupation || "",
              familySize: data.profile.familySize || 1,
              dietType: data.profile.dietType || "vegetarian",
              transportMode: data.profile.transportMode || "car",
              electricityUsage: data.profile.electricityUsage || "medium",
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("Please type DELETE to confirm account removal.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users", { method: "DELETE" });
      if (res.ok) {
        toast.success("Your account has been deleted.");
        router.push("/signup");
        router.refresh();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: name === "dietType" || name === "transportMode" || name === "electricityUsage" || name === "city" || name === "country" || name === "occupation"
        ? value
        : Math.max(1, parseInt(value) || 1),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      <div className="bg-white border border-[#dcecf3] p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#08171e]">Account settings</h1>
        <p className="text-sm text-[#4d6673] mt-1">
          Configure profile details, modify credentials, adjust alerts, or manage your data.
        </p>
      </div>

      {isPageLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#096b90]" />
          <span className="text-sm text-[#4d6673] font-semibold">Loading your preferences...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Tabs Navigation Sidebar */}
          <div className="md:col-span-1 bg-white border border-[#dcecf3] rounded-2xl p-4 shadow-sm space-y-1">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "password", label: "Password", icon: Shield },
              { id: "notifications", label: "Alerts", icon: Bell },
              { id: "danger", label: "Danger zone", icon: Trash2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#096b90]/10 border-transparent text-[#096b90]"
                      : "bg-transparent border-transparent text-[#4d6673] hover:text-[#08171e] hover:bg-[#f7fbfd]"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <div className="md:col-span-3 bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm min-h-[400px]">
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-bold text-[#08171e] pb-2 border-b border-[#dcecf3] uppercase tracking-wider">
                  Update Lifestyle Profile
                </h3>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={profileData.age}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Occupation
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={profileData.occupation}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={profileData.country}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Family Members
                    </label>
                    <input
                      type="number"
                      name="familySize"
                      value={profileData.familySize}
                      onChange={handleProfileInputChange}
                      min={1}
                      className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Diet
                      </label>
                      <select
                        name="dietType"
                        value={profileData.dietType}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-2 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      >
                        <option value="vegan">Vegan</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="pescatarian">Pescatarian</option>
                        <option value="meat-heavy">Meat-Heavy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Transit
                      </label>
                      <select
                        name="transportMode"
                        value={profileData.transportMode}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-2 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      >
                        <option value="walking">Walking</option>
                        <option value="cycling">Cycling</option>
                        <option value="bike">Motorcycle</option>
                        <option value="car">Car</option>
                        <option value="bus">Bus</option>
                        <option value="train">Train</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                        Electricity Load
                      </label>
                      <select
                        name="electricityUsage"
                        value={profileData.electricityUsage}
                        onChange={handleProfileInputChange}
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-2 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                      >
                        <option value="low">Low Impact</option>
                        <option value="medium">Medium</option>
                        <option value="high">High Demand</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#096b90] hover:bg-[#042b44] text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer border-none text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              </motion.div>
            )}

            {activeTab === "password" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-bold text-[#08171e] pb-2 border-b border-[#dcecf3] uppercase tracking-wider">
                  Modify Credentials
                </h3>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      New Password (min 8 chars)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#096b90] hover:bg-[#042b44] text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer border-none text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Update Password"}
                  </Button>
                </form>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-bold text-[#08171e] pb-2 border-b border-[#dcecf3] uppercase tracking-wider">
                  Configure Alerts & Toggles
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      id: "emailReports",
                      title: "Email Audit Reports",
                      desc: "Receive weekly PDF summaries summarizing footprint shifts.",
                    },
                    {
                      id: "streakReminders",
                      title: "Streak reminder alerts",
                      desc: "Alert when active logging streak runs risk of expiring.",
                    },
                    {
                      id: "badgeAlerts",
                      title: "Milestone badges unlocks",
                      desc: "Notify instantly when user activity unlocks custom badges.",
                    },
                  ].map((pref) => (
                    <label
                      key={pref.id}
                      className="flex items-start gap-3 p-3 bg-[#f7fbfd] hover:bg-[#f0f7fa] border border-[#dcecf3] rounded-xl cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={notifications[pref.id as keyof typeof notifications]}
                        onChange={(e) =>
                          setNotifications((prev) => ({ ...prev, [pref.id]: e.target.checked }))
                        }
                        className="accent-[#096b90] rounded mt-0.5"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#08171e]">{pref.title}</h4>
                        <p className="text-[10.5px] text-[#4d6673] mt-0.5 leading-normal">{pref.desc}</p>
                      </div>
                    </label>
                  ))}
                  
                  <Button
                    onClick={() => toast.success("Notification preferences updated successfully!")}
                    className="w-full bg-[#096b90] hover:bg-[#042b44] text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer border-none text-xs"
                  >
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === "danger" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-bold text-red-500 pb-2 border-b border-red-500/20 uppercase tracking-wider">
                  Danger Zone
                </h3>

                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Permanent Deletion</h4>
                      <p className="text-xs text-[#4d6673] mt-1 leading-normal font-medium">
                        This action will immediately delete your account and remove all logged datasets, profiles, 
                        emissions curves, and earned eco badges. This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      Type <span className="font-extrabold text-red-600">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="Type DELETE..."
                      className="w-full bg-white border border-red-500/20 focus:border-red-500 rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none"
                    />

                    <Button
                      onClick={handleDeleteAccount}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer border-none text-xs"
                      disabled={deleteConfirm !== "DELETE" || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="size-3.5" /> Delete My Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
