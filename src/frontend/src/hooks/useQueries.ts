import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Design, Measurement } from "../backend.d";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useActor } from "./useActor";

// ─── Design Queries ───────────────────────────────────────────────────────────

export function useAllDesigns() {
  const { actor, isFetching } = useActor();
  return useQuery<Design[]>({
    queryKey: ["designs", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDesigns();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrendingDesigns() {
  const { actor, isFetching } = useActor();
  return useQuery<Design[]>({
    queryKey: ["designs", "trending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingDesigns();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBridalDesigns() {
  const { actor, isFetching } = useActor();
  return useQuery<Design[]>({
    queryKey: ["designs", "bridal"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBridalDesigns();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDesignsByCategory(category: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<Design[]>({
    queryKey: ["designs", "category", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDesignsByCategory(category);
    },
    enabled: !!actor && !isFetching && enabled && !!category,
  });
}

export function useDesign(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Design | null>({
    queryKey: ["design", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getDesign(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

// ─── Measurement Queries ──────────────────────────────────────────────────────

export function useAllMeasurements() {
  const { actor, isFetching } = useActor();
  return useQuery<Measurement[]>({
    queryKey: ["measurements", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMeasurements();
    },
    enabled: !!actor && !isFetching,
  });
}

// Helper: create an admin-authenticated actor using the Caffeine admin token
async function createAdminActor() {
  const actor = await createActorWithConfig();
  const adminToken = getSecretParameter("caffeineAdminToken") || "";
  if (adminToken) {
    await actor._initializeAccessControlWithSecret(adminToken);
  }
  return actor;
}

// ─── Design Code Preview ──────────────────────────────────────────────────────

export function useGetNextDesignCode(category: string) {
  return useQuery<string>({
    queryKey: ["design", "nextCode", category],
    queryFn: async () => {
      const actor = await createAdminActor();
      return actor.getNextDesignCode(category);
    },
    enabled: !!category,
    staleTime: 30_000,
  });
}

// ─── Design Mutations ─────────────────────────────────────────────────────────

export function useCreateDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      category: string;
      workType: string;
      imageUrls: string[];
      isBridal: boolean;
      isTrending: boolean;
    }): Promise<string> => {
      const actor = await createAdminActor();
      return actor.createDesignWithAutoCode(
        args.category,
        args.workType,
        args.imageUrls,
        args.isBridal,
        args.isTrending,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
      void qc.refetchQueries({ queryKey: ["designs"], type: "active" });
    },
  });
}

export function useCreateDesignBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      entries: Array<{ imageUrl: string; category: string }>,
    ): Promise<{ savedCount: number; skippedCount: number }> => {
      // Always create a fresh actor and initialize it with the admin token
      // so that createDesignBulk (which requires admin permission) succeeds
      // regardless of whether the user is authenticated via Internet Identity.
      const actor = await createActorWithConfig();
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      if (adminToken) {
        await actor._initializeAccessControlWithSecret(adminToken);
      }

      // Split into chunks of 20 to stay well within ICP message size limits
      const CHUNK_SIZE = 20;
      let totalSaved = 0;

      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE);
        try {
          const saved = await actor.createDesignBulk(chunk);
          totalSaved += Number(saved);
        } catch (err) {
          // Log chunk error but continue processing remaining chunks
          console.error(
            `Bulk save chunk ${Math.floor(i / CHUNK_SIZE) + 1} failed:`,
            err,
          );
        }
        // Small delay between chunks to avoid rate limiting
        if (i + CHUNK_SIZE < entries.length) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      const skippedCount = entries.length - totalSaved;
      return { savedCount: totalSaved, skippedCount };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
      void qc.refetchQueries({ queryKey: ["designs"], type: "active" });
    },
  });
}

export function useClearAllDesigns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const actor = await createAdminActor();
      await actor.clearAllDesigns();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useUpdateDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      designCode: string;
      category: string;
      workType: string;
      imageUrls: string[];
    }) => {
      const actor = await createAdminActor();
      await actor.updateDesign(
        args.id,
        args.designCode,
        args.category,
        args.workType,
        args.imageUrls,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useDeleteDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const actor = await createAdminActor();
      await actor.deleteDesign(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useSetTrending() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, flag }: { id: bigint; flag: boolean }) => {
      const actor = await createAdminActor();
      await actor.setTrending(id, flag);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useSetBridal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, flag }: { id: bigint; flag: boolean }) => {
      const actor = await createAdminActor();
      await actor.setBridal(id, flag);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

// ─── Measurement Mutations ───────────────────────────────────────────────────

export function useCreateMeasurement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      phone: string;
      bust: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      neck: string;
      blouseLength: string;
    }) => {
      // Use the regular actor if available, otherwise fall back to admin actor
      const targetActor = actor ?? (await createAdminActor());
      await targetActor.createMeasurement(
        args.name,
        args.phone,
        args.bust,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.neck,
        args.blouseLength,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["measurements"] });
    },
  });
}

export function useUpdateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      name: string;
      phone: string;
      bust: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      neck: string;
      blouseLength: string;
    }) => {
      const actor = await createAdminActor();
      await actor.updateMeasurement(
        args.id,
        args.name,
        args.phone,
        args.bust,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.neck,
        args.blouseLength,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["measurements"] });
    },
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const actor = await createAdminActor();
      await actor.deleteMeasurement(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["measurements"] });
    },
  });
}

// ─── Customer Queries ─────────────────────────────────────────────────────────

export function useAllCustomers() {
  return useQuery<import("../backend.d").Customer[]>({
    queryKey: ["customers", "all"],
    queryFn: async () => {
      const actor = await createAdminActor();
      return actor.getAllCustomers();
    },
  });
}

export function useCustomerOrders(customerId: bigint | null) {
  return useQuery<import("../backend.d").Order[]>({
    queryKey: ["orders", "customer", customerId?.toString()],
    queryFn: async () => {
      if (customerId === null) return [];
      const actor = await createAdminActor();
      return actor.getCustomerOrders(customerId);
    },
    enabled: customerId !== null,
  });
}

export function useAllOrders() {
  return useQuery<import("../backend.d").Order[]>({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const actor = await createAdminActor();
      return actor.getAllOrders();
    },
  });
}

// ─── Customer Mutations ───────────────────────────────────────────────────────

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      phone: string;
      address: string;
      bust: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      blouseLength: string;
      frontNeck: string;
      backNeck: string;
    }) => {
      const actor = await createAdminActor();
      await actor.createCustomer(
        args.name,
        args.phone,
        args.address,
        args.bust,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.blouseLength,
        args.frontNeck,
        args.backNeck,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      name: string;
      phone: string;
      address: string;
      bust: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      blouseLength: string;
      frontNeck: string;
      backNeck: string;
    }) => {
      const actor = await createAdminActor();
      await actor.updateCustomer(
        args.id,
        args.name,
        args.phone,
        args.address,
        args.bust,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.blouseLength,
        args.frontNeck,
        args.backNeck,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const actor = await createAdminActor();
      await actor.deleteCustomer(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ─── Order Mutations ──────────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      customerId: bigint;
      workType: string;
      designCode: string;
      deliveryDate: string;
      status: import("../backend.d").OrderStatus;
    }) => {
      const actor = await createAdminActor();
      await actor.createOrder(
        args.customerId,
        args.workType,
        args.designCode,
        args.deliveryDate,
        args.status,
      );
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["orders", "customer", vars.customerId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      customerId: bigint;
      workType: string;
      designCode: string;
      deliveryDate: string;
    }) => {
      const actor = await createAdminActor();
      await actor.updateOrder(
        args.id,
        args.workType,
        args.designCode,
        args.deliveryDate,
      );
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["orders", "customer", vars.customerId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      customerId: bigint;
      status: import("../backend.d").OrderStatus;
    }) => {
      const actor = await createAdminActor();
      await actor.updateOrderStatus(args.id, args.status);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["orders", "customer", vars.customerId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: bigint; customerId: bigint }) => {
      const actor = await createAdminActor();
      await actor.deleteOrder(args.id);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["orders", "customer", vars.customerId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["admin", "isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
