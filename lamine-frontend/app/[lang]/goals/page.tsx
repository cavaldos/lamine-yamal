import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GoalBrowser from "@/components/goals-page/goal-browser";
import GoalsHero from "@/components/goals-page/goals-hero";
import { hasLocale } from "@/lib/i18n/config";
import { loadDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/goals">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { meta } = await loadDictionary(lang);
  return { title: meta.goalsTitle, description: meta.goalsDescription };
}

// /<lang>/goals — every goal as a video: grid, search and filters, and two ways to watch.
export default function GoalsPage() {
  return (
    <main id="main" className="relative">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <GoalsHero />
        <GoalBrowser />
      </div>
    </main>
  );
}
