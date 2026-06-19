"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2, X } from "lucide-react";
import { z } from "zod";
import { LoginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Login failed");
      }

      toast.success("Welcome back!");
      
      // Check if user has completed profile
      if (json.user.profileCompleted) {
        router.push(callbackUrl);
      } else {
        router.push("/profile");
      }
      
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during login");
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
          <h2 className="text-2xl font-bold text-[#08171e] tracking-tight">Welcome Back</h2>
          <p className="text-sm text-[#4d6673] mt-2 font-medium">
            Log in to continue tracking your carbon footprint.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-[#4d6673] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset placeholder")}
                className="text-xs font-bold text-[#096b90] hover:text-[#042b44] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
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
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              {...register("rememberMe")}
              type="checkbox"
              id="rememberMe"
              className="accent-[#096b90] rounded border-[#dcecf3] size-4 cursor-pointer focus:ring-0"
              disabled={isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2.5 text-xs text-[#4d6673] hover:text-[#08171e] select-none cursor-pointer font-bold"
            >
              Remember me on this device
            </label>
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
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs font-bold text-[#4d6673]">
          New to EcoTrack AI?{" "}
          <Link href="/signup" className="text-[#096b90] hover:text-[#042b44] hover:underline transition-colors">
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
