/** The first milestone intentionally provides no executable external integrations. */
export const featureFlagNames = [
  "AUTO_FACTORY_ENABLED", "ADS_ENABLED", "DUPLICHECKER_ENABLED", "VIDEO_AUTOGEN_ENABLED",
  "TIKTOK_ENABLED", "AUTO_SOCIAL_PUBLISH_ENABLED", "AUTO_WEB_PUBLISH_ENABLED", "HIGH_RISK_TOOLS_ENABLED",
] as const;
export type FeatureFlag = (typeof featureFlagNames)[number];
export const defaultFeatureFlags: Record<FeatureFlag, boolean> = Object.fromEntries(
  featureFlagNames.map((name) => [name, false]),
) as Record<FeatureFlag, boolean>;

export interface IntegrationAvailability {
  enabled: boolean;
  configured: boolean;
  reason?: string;
}

export const integrationAvailability: Record<"ai" | "adsense" | "originality" | "video" | "tiktok", IntegrationAvailability> = {
  ai: { enabled: false, configured: false, reason: "Previsto para la fase 3" },
  originality: { enabled: false, configured: false, reason: "Previsto para la fase 4" },
  adsense: { enabled: false, configured: false, reason: "Pendiente de aprobación y consentimiento" },
  video: { enabled: false, configured: false, reason: "Previsto para la fase 6" },
  tiktok: { enabled: false, configured: false, reason: "Pendiente de validar canal y permisos" },
};
