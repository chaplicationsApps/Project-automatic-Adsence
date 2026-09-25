import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
}));

import { getSupabaseConfig } from "./env";
import { getAdminAccess, requireAdmin } from "@/lib/auth";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_fixture");
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
});

describe("admin authorization", () => {
  it("closes access without configuration before contacting Auth", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await getAdminAccess()).toEqual({ status: "setup" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?status=setup");
  });

  it("rejects secret keys and non-HTTPS remote project URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_never_public");
    expect(getSupabaseConfig()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_fixture");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://example.supabase.co");
    expect(getSupabaseConfig()).toBeNull();
  });

  it("does not trust a user-editable admin role", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: {
      id: "test-user", app_metadata: {}, user_metadata: { role: "admin" },
    } }, error: null });
    expect(await getAdminAccess()).toEqual({ status: "forbidden" });
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?status=forbidden");
  });

  it("requires a successfully verified Auth user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Invalid token" } });
    expect(await getAdminAccess()).toEqual({ status: "anonymous" });
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("allows trusted admin metadata after getUser verification", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: {
      id: "test-admin", app_metadata: { role: "admin" }, user_metadata: {},
    } }, error: null });
    const result = await requireAdmin();
    expect(result.user.id).toBe("test-admin");
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });

  it("keeps admin closed during an authentication service outage", async () => {
    mocks.getUser.mockRejectedValue(new Error("Offline"));
    expect(await getAdminAccess()).toEqual({ status: "unavailable" });
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?status=unavailable");
  });
});
