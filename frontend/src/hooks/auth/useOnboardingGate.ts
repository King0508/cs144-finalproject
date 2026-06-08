import type { UserDoc } from "../../types/domain";

export interface OnboardingGate {
  /** True when the user must complete onboarding before using the rest of the app. */
  needsOnboarding: boolean;
}

/**
 * Decides whether a signed-in user still needs to pick a campus/bible talk.
 * Ministry leaders are cross-campus by definition, so they skip the gate even
 * without scope fields — see Settings dev role switcher.
 */
export function useOnboardingGate(userDoc: UserDoc | null): OnboardingGate {
  const needsOnboarding =
    !!userDoc &&
    userDoc.role !== "ministryLeader" &&
    (!userDoc.bibleTalkId || !userDoc.campusId);
  return { needsOnboarding };
}
