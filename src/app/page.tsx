"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  Sparkles,
  BarChart3,
  ShieldCheck,
  TrendingDown,
  Compass,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7fbfd] text-[#08171e] antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#dcecf3] bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-[#042b44]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#096b90] text-white">
              <Leaf className="size-5" />
            </span>
            EcoTrack AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-[#4d6673] hover:text-[#08171e] transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <Button className="rounded-lg bg-[#042b44] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#096b90] transition-colors shadow-sm">
                Start Tracking Free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center md:px-8 md:py-24 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#dcecf3] bg-white px-3 py-1 text-xs font-bold text-[#096b90] shadow-sm">
          <Sparkles className="size-3.5" />
          Empowering your sustainable lifestyle journey
        </div>

        <h1 className="text-4xl font-black tracking-tight text-[#042b44] sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight">
          Understand your daily impact. <br />
          <span className="text-[#096b90]">Take simple, guided action.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base font-semibold leading-relaxed text-[#4d6673] md:text-lg">
          EcoTrack AI makes monitoring your personal carbon footprint effortless. Turn your commuting, energy use, and daily habits into actionable steps toward a greener future.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full rounded-lg bg-[#042b44] text-sm font-extrabold text-white hover:bg-[#096b90] shadow-md px-8 py-6">
              Get Started  <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full rounded-lg border-[#dcecf3] bg-white text-sm font-extrabold text-[#4d6673] hover:text-[#08171e] px-8 py-6">
              See How It Works
            </Button>
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-xs font-bold text-[#4d6673]">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-600" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" /> AI-powered personalized insights</span>
          <span className="flex items-center gap-1.5"><TrendingDown className="size-4 text-emerald-600" /> Free snapshot dashboard</span>
        </div>
      </section>

      <hr className="mx-auto max-w-7xl border-[#dcecf3]" />

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-[#042b44] md:text-3xl">How EcoTrack AI Works</h2>
          <p className="max-w-xl mx-auto text-sm font-semibold text-[#4d6673]">
            Our simple 3-step pipeline translates your everyday routines into meaningful climate milestones.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {[
            {
              step: "01",
              title: "Log Daily Snapshot",
              text: "Quickly enter everyday activities—like your commute distance, diet choice, or AC runtime. No complex configurations needed.",
              icon: Compass,
            },
            {
              step: "02",
              title: "Analyze via Smart AI",
              text: "EcoTrack dynamically breaks your footprint down into 5 key metrics: Transport, Energy, Food, Waste, and Shopping.",
              icon: BarChart3,
            },
            {
              step: "03",
              title: "Reduce effortlessly",
              text: "Receive high-impact micro-challenges built around your profile. Save carbon and watch your projected total drop in real-time.",
              icon: Leaf,
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="relative rounded-xl border border-[#dcecf3] bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-[#dcecf3]">{item.step}</span>
                    <div className="rounded-lg bg-[#f7fbfd] p-2.5 text-[#096b90] border border-[#edf5f8]">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#042b44]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#4d6673]">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES & VALUE PROPS SECTION */}
      <section className="bg-white border-y border-[#dcecf3] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-[#042b44] sm:text-4xl">
              Turn eco-awareness into repeatable, low-carbon routines.
            </h2>
            <p className="text-sm font-semibold leading-relaxed text-[#4d6673]">
              Living sustainably shouldn't feel like an overhaul. EcoTrack AI highlights minimal, low-friction habits unique to your lifestyle that stack up to create massive systemic changes.
            </p>

            <div className="space-y-4 pt-2">
              {[
                "Personalized dashboards adjusted to your local energy grid context",
                "Action recommendations structured by effort levels (Easy, Medium, Hard)",
                "Historical carbon trend reporting and streak gamification metrics",
              ].map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 text-sm font-semibold text-[#08171e]">
                  <CheckCircle2 className="size-5 shrink-0 text-[#096b90] mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#dcecf3] bg-[#f7fbfd] p-6 space-y-4 shadow-inner">
            <p className="text-xs font-bold uppercase tracking-wider text-[#4d6673]">Core Focus Categories</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["Transport", "Energy", "Food Habits", "Waste Patterns", "Shopping", "Offsetting"].map((cat) => (
                <div key={cat} className="rounded-lg bg-white border border-[#dcecf3] px-4 py-3 text-center text-xs font-black text-[#042b44] shadow-sm">
                  {cat}
                </div>
              ))}
            </div>
            <div className="mt-2 p-4 rounded-lg bg-[#edf5f8] border border-[#dcecf3] flex items-center gap-3">
              <Sparkles className="size-5 shrink-0 text-[#efb036]" />
              <p className="text-xs font-semibold text-[#4d6673]">
                <strong>AI recommendation engine:</strong> Prioritizes the biggest reduction opportunities instantly based on regional calculations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-[#042b44] md:text-3xl">Frequently Asked Questions</h2>
          <p className="text-sm font-semibold text-[#4d6673]">Everything you need to know about starting your tracking journey</p>
        </div>

        <div className="grid gap-4">
          {[
            {
              q: "How are my carbon footprint calculations generated?",
              a: "EcoTrack AI estimates your carbon footprint with a Random Forest model trained on the personal carbon footprint behavior dataset. The platform instantly recalculates predictions whenever you update your activity, energy, waste, food, and lifestyle inputs."
            },
            {
              q: "Do I need to manually enter all my activities every day?",
              a: "No. EcoTrack AI supports a semi-automatic tracking approach. You can save frequent routes and typical lifestyle preferences, while location and route distances can be estimated using map services. You only need to update activities that change from your usual routine."
            },
            {
              q: "How does EcoTrack AI protect my personal information?",
              a: "Your privacy is important to us. EcoTrack AI securely stores your account information and activity data, uses it only to generate insights and recommendations, and never sells or shares your personal information with third-party advertisers."
            }

          ].map((faq) => (
            <div key={faq.q} className="rounded-xl border border-[#dcecf3] bg-white p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 font-black text-sm text-[#042b44]">
                <HelpCircle className="size-4 text-[#096b90]" />
                <h4>{faq.q}</h4>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-[#4d6673] pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="bg-[#042b44] text-white px-4 py-16 text-center md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to reduce your snapshot?</h2>
          <p className="mx-auto max-w-lg text-sm font-medium text-[#dcecf3] leading-relaxed">
            Join thousands of users tracking carbon, forming sustainable habits, and compounding daily positive micro-impacts into sustainable lifestyles.
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button size="lg" className="rounded-lg bg-[#096b90] px-8 py-6 text-sm font-extrabold text-white hover:bg-[#2f9e75] shadow-lg transition-all">
                Create Your Profile Now <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
