"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Briefcase,
  Users,
  Utensils,
  Car,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { ProfileSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      age: "",
      city: "",
      country: "",
      occupation: "",
      familySize: 1,
      dietType: "vegetarian",
      transportMode: "car",
      electricityUsage: "medium",
    },
  });

  const nextStep = async () => {
    // Validate current step fields before progressing
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ["age", "city", "country", "occupation", "familySize"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    } else {
      toast.error("Please fill all required fields correctly.");
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save profile");
      }

      toast.success("Profile setup completed successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const stepProgress = step === 1 ? 50 : 100;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f7fbfd] px-4 py-12 select-none overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#71b7d5]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#a1ccdc]/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#dcecf3] rounded-2xl p-8 shadow-lg">
        <div className="mb-8">
          <span className="text-xs font-bold text-[#096b90] tracking-widest uppercase">
            Step {step} of 2
          </span>
          <h2 className="text-2xl font-extrabold text-[#08171e] tracking-tight mt-1">
            {step === 1 ? "Personal Profile Setup" : "Lifestyle & Consumption Baseline"}
          </h2>
          <p className="text-sm text-[#4d6673] mt-1 font-medium">
            {step === 1
              ? "Tell us about yourself so we can customize your baseline calculations."
              : "Tell us about your daily consumption patterns to calibrate your EcoTrack AI engine."}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-[#dcecf3] h-2 rounded-full mt-5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stepProgress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-[#096b90]"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Age
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                        <User className="size-4" />
                      </span>
                      <input
                        {...register("age")}
                        type="number"
                        placeholder="25"
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/45 focus:outline-none focus:border-[#096b90] transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.age && (
                      <p className="text-xs text-red-500 mt-1 font-bold">{errors.age.message as string}</p>
                    )}
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Occupation
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                        <Briefcase className="size-4" />
                      </span>
                      <input
                        {...register("occupation")}
                        type="text"
                        placeholder="Software Engineer"
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/45 focus:outline-none focus:border-[#096b90] transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.occupation && (
                      <p className="text-xs text-red-500 mt-1 font-bold">{errors.occupation.message as string}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      City
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                        <MapPin className="size-4" />
                      </span>
                      <input
                        {...register("city")}
                        type="text"
                        placeholder="San Francisco"
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/45 focus:outline-none focus:border-[#096b90] transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-xs text-red-500 mt-1 font-bold">{errors.city.message as string}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                      Country
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                        <MapPin className="size-4" />
                      </span>
                      <input
                        {...register("country")}
                        type="text"
                        placeholder="United States"
                        className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/45 focus:outline-none focus:border-[#096b90] transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.country && (
                      <p className="text-xs text-red-500 mt-1 font-bold">{errors.country.message as string}</p>
                    )}
                  </div>
                </div>

                {/* Family Size */}
                <div>
                  <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
                    Number of Family Members
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                      <Users className="size-4" />
                    </span>
                    <input
                      {...register("familySize")}
                      type="number"
                      min={1}
                      placeholder="3"
                      className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/45 focus:outline-none focus:border-[#096b90] transition-all"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.familySize && (
                    <p className="text-xs text-red-500 mt-1 font-bold">{errors.familySize.message as string}</p>
                  )}
                </div>

                {/* Next Action */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#042b44] hover:bg-[#096b90] text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 text-xs cursor-pointer border-none shadow-sm transition-all"
                  >
                    Continue <ArrowRight className="size-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Dietary Preference */}
                <div>
                  <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-3">
                    Dietary Preference
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "vegan", label: "Vegan", desc: "No animal products" },
                      { id: "vegetarian", label: "Vegetarian", desc: "No meat, eats dairy/eggs" },
                      { id: "pescatarian", label: "Pescatarian", desc: "Seafood & plant products" },
                      { id: "meat-heavy", label: "Meat-Heavy", desc: "Consumes red meat frequently" },
                    ].map((diet) => (
                      <label
                        key={diet.id}
                        className="relative flex flex-col p-4 bg-[#f7fbfd] border border-[#dcecf3] hover:border-[#096b90]/40 rounded-xl cursor-pointer transition-all has-[input:checked]:border-[#096b90] has-[input:checked]:bg-[#096b90]/5"
                      >
                        <input
                          {...register("dietType")}
                          type="radio"
                          value={diet.id}
                          className="sr-only"
                        />
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#08171e]">
                          <Utensils className="size-4 text-[#096b90]" />
                          {diet.label}
                        </span>
                        <span className="text-[10.5px] text-[#4d6673] mt-1 leading-normal font-medium">{diet.desc}</span>
                      </label>
                    ))}
                  </div>
                  {errors.dietType && (
                    <p className="text-xs text-red-500 mt-1 font-bold">{errors.dietType.message as string}</p>
                  )}
                </div>

                {/* Primary Commute Method */}
                <div>
                  <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-3">
                    Preferred Commuting Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "walking", label: "Walking" },
                      { id: "cycling", label: "Cycling" },
                      { id: "bike", label: "Motorcycle" },
                      { id: "car", label: "Personal Car" },
                      { id: "bus", label: "Public Bus" },
                      { id: "train", label: "Train/Subway" },
                    ].map((mode) => (
                      <label
                        key={mode.id}
                        className="relative flex flex-col items-center justify-center p-3 bg-[#f7fbfd] border border-[#dcecf3] hover:border-[#096b90]/40 rounded-xl cursor-pointer transition-all text-center has-[input:checked]:border-[#096b90] has-[input:checked]:bg-[#096b90]/5"
                      >
                        <input
                          {...register("transportMode")}
                          type="radio"
                          value={mode.id}
                          className="sr-only"
                        />
                        <Car className="size-5 text-[#096b90] mb-1" />
                        <span className="text-xs font-bold text-[#08171e]">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.transportMode && (
                    <p className="text-xs text-red-500 mt-1 font-bold">{errors.transportMode.message as string}</p>
                  )}
                </div>

                {/* General Electricity Usage Habits */}
                <div>
                  <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-3">
                    General Electricity Habits
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "low", label: "Low Impact", desc: "Minimal standby loads, efficient bulbs" },
                      { id: "medium", label: "Moderate", desc: "Standard residential load levels" },
                      { id: "high", label: "High Demand", desc: "Frequent heavy load appliances" },
                    ].map((level) => (
                      <label
                        key={level.id}
                        className="relative flex flex-col p-3 bg-[#f7fbfd] border border-[#dcecf3] hover:border-[#096b90]/40 rounded-xl cursor-pointer transition-all text-center items-center justify-center has-[input:checked]:border-[#096b90] has-[input:checked]:bg-[#096b90]/5"
                      >
                        <input
                          {...register("electricityUsage")}
                          type="radio"
                          value={level.id}
                          className="sr-only"
                        />
                        <Zap className="size-5 text-[#096b90] mb-1.5" />
                        <span className="text-xs font-bold text-[#08171e]">{level.label}</span>
                        <span className="text-[9.5px] text-[#4d6673]/85 mt-1 leading-normal font-medium">{level.desc}</span>
                      </label>
                    ))}
                  </div>
                  {errors.electricityUsage && (
                    <p className="text-xs text-red-500 mt-1 font-bold">{errors.electricityUsage.message as string}</p>
                  )}
                </div>

                {/* Back and Submit Actions */}
                <div className="pt-4 flex justify-between gap-4">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-white border border-[#dcecf3] hover:bg-[#f7fbfd] text-[#4d6673] font-bold py-2 px-6 rounded-lg flex items-center gap-2 text-xs cursor-pointer"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#042b44] hover:bg-[#096b90] text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 text-xs cursor-pointer border-none shadow-sm transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-white" /> Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup <Check className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
