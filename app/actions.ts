"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth";
import { defaultProfile } from "@/lib/defaults";
import { saveProfile, setSourceActive } from "@/lib/queries";
import { runPipeline } from "@/lib/services/pipeline";

export async function saveProfileAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const requestedDeliveryEmail = String(formData.get("deliveryEmail") ?? "").trim();

  const interests = String(formData.get("interests") ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  await saveProfile({
    id: user.userId,
    clerkUserId: user.userId,
    name: String(formData.get("name") ?? defaultProfile.name),
    title: String(formData.get("title") ?? defaultProfile.title),
    background: String(formData.get("background") ?? defaultProfile.background),
    expertiseLevel: String(formData.get("expertiseLevel") ?? defaultProfile.expertiseLevel),
    interests,
    preferences: {
      preferPractical: formData.get("preferPractical") === "on",
      preferTechnicalDepth: formData.get("preferTechnicalDepth") === "on",
      preferResearchBreakthroughs: formData.get("preferResearchBreakthroughs") === "on",
      preferProductionFocus: formData.get("preferProductionFocus") === "on",
      avoidMarketingHype: formData.get("avoidMarketingHype") === "on"
    },
    deliveryEmail: requestedDeliveryEmail || user.email,
    digestWindowHours: Number(formData.get("digestWindowHours") ?? defaultProfile.digestWindowHours),
    topN: Number(formData.get("topN") ?? defaultProfile.topN)
  }, user.userId);

  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

export async function toggleSourceAction(formData: FormData) {
  await requireAuthenticatedUser();

  const slug = String(formData.get("slug") ?? "");
  const nextState = String(formData.get("nextState") ?? "false") === "true";

  await setSourceActive(slug, nextState);
  revalidatePath("/dashboard");
  revalidatePath("/sources");
}

export async function runPipelineAction(formData: FormData) {
  const user = await requireAuthenticatedUser();

  const stage = String(formData.get("stage") ?? "full") as "ingest" | "digest" | "curate" | "email" | "full";
  await runPipeline(stage, "manual", { user });

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}
