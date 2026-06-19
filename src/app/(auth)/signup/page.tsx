"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { SignupSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password", "");

  // Real-time password criteria verification
  const criteria = [
    { label: "At least 8 characters", test: passwordVal.length >= 8 },
    { label: "Uppercase letter", test: /[A-Z]/.test(passwordVal) },
    { label: "Lowercase letter", test: /[a-z]/.test(passwordVal) },
    { label: "Number", test: /[0-9]/.test(passwordVal) },
    { label: "Special character", test: /[^A-Za-z0-9]/.test(passwordVal) },
  ];

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Signup failed");
      }

      toast.success("Account created successfully!");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f7fbfd] px-4 py-12 select-none overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#71b7d5]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#a1ccdc]/15 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white border border-[#dcecf3] rounded-2xl p-8 shadow-lg"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#096b90] to-[#042b44] bg-clip-text text-transparent tracking-wider">
              ECOTRACK AI
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-[#08171e] tracking-tight">Create your account</h2>
          <p className="text-sm text-[#4d6673] mt-2 font-medium">
            Join thousands of users tracking and reducing their footprints.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                <User className="size-4" />
              </span>
              <input
                {...register("name")}
                type="text"
                placeholder="John Doe"
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/40 focus:outline-none focus:border-[#096b90] transition-all"
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <X className="size-3" /> {errors.name.message as string}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                <Mail className="size-4" />
              </span>
              <input
                {...register("email")}
                type="email"
                placeholder="john@example.com"
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-4 text-sm text-[#08171e] placeholder-[#4d6673]/40 focus:outline-none focus:border-[#096b90] transition-all"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <X className="size-3" /> {errors.email.message as string}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                <Lock className="size-4" />
              </span>
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-10 text-sm text-[#08171e] placeholder-[#4d6673]/40 focus:outline-none focus:border-[#096b90] transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4d6673]/60 hover:text-[#08171e]"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <X className="size-3" /> {errors.password.message as string}
              </p>
            )}

            {/* Password strength checklist */}
            {passwordVal && (
              <div className="mt-3 bg-[#f7fbfd] rounded-lg p-3 border border-[#dcecf3] space-y-1.5">
                <p className="text-xs font-bold text-[#4d6673] mb-1">Password requirements:</p>
                {criteria.map((c, idx) => (
                  <div key={idx} className="flex items-center text-[10.5px] font-medium transition-colors">
                    {c.test ? (
                      <span className="text-emerald-500 mr-1.5 flex items-center">
                        <Check className="size-3 stroke-[3px]" />
                      </span>
                    ) : (
                      <span className="text-[#4d6673]/30 mr-1.5 flex items-center">
                        <X className="size-3 stroke-[3px]" />
                      </span>
                    )}
                    <span className={c.test ? "text-emerald-600/90 font-bold" : "text-[#4d6673]/50"}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4d6673]/60">
                <Lock className="size-4" />
              </span>
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-2 pl-10 pr-10 text-sm text-[#08171e] placeholder-[#4d6673]/40 focus:outline-none focus:border-[#096b90] transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4d6673]/60 hover:text-[#08171e]"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <X className="size-3" /> {errors.confirmPassword.message as string}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#042b44] hover:bg-[#096b90] text-white font-bold py-2.5 rounded-lg shadow-sm hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm border-none cursor-pointer mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs font-bold text-[#4d6673]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#096b90] hover:text-[#042b44] hover:underline transition-colors">
            Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
