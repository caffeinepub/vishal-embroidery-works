import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Design, Measurement } from "../backend.d";
import { getAdminActor } from "../utils/adminActor";
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

// Use the module-level singleton admin actor so that
// _initializeAccessControlWithSecret is only called ONCE per page load.
const createAdminActor = getAdminActor;

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
    ): Promise<{
      savedCount: number;
      failedCount: number;
      errors: string[];
    }> => {
      // Reuse the singleton admin actor -- no re-initialization needed
      const actor = await getAdminActor();

      // Chunk size of 10 keeps each canister call well within ICP message limits
      // and reduces the blast radius of a single chunk failure.
      const CHUNK_SIZE = 10;
      let totalSaved = 0;
      const errors: string[] = [];

      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE);
        const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
        try {
          const saved = await actor.createDesignBulk(chunk);
          totalSaved += Number(saved);
          console.info(
            `[BulkSave] Chunk ${chunkNum}: saved ${Number(saved)} of ${chunk.length}`,
          );
        } catch (err) {
          // Preserve the full error message so admins can diagnose the failure
          const reason = err instanceof Error ? err.message : String(err);
          console.error(`[BulkSave] Chunk ${chunkNum} failed:`, reason);
          errors.push(`Chunk ${chunkNum} (${chunk.length} items): ${reason}`);
        }
        // Small delay between chunks to avoid rate limiting
        if (i + CHUNK_SIZE < entries.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      const failedCount = entries.length - totalSaved;
      return { savedCount: totalSaved, failedCount, errors };
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      phone: string;
      bust: string;
      chest: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      neck: string;
      blouseLength: string;
      notes: string;
    }) => {
      // Always use the admin actor so createMeasurement has correct permissions
      const actor = await getAdminActor();
      await actor.createMeasurement(
        args.name,
        args.phone,
        args.bust,
        args.chest,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.neck,
        args.blouseLength,
        args.notes,
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
      chest: string;
      waist: string;
      shoulder: string;
      sleeveLength: string;
      neck: string;
      blouseLength: string;
      notes: string;
    }) => {
      const actor = await createAdminActor();
      await actor.updateMeasurement(
        args.id,
        args.name,
        args.phone,
        args.bust,
        args.chest,
        args.waist,
        args.shoulder,
        args.sleeveLength,
        args.neck,
        args.blouseLength,
        args.notes,
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
      stitchingType: string;
      deliveryDate: string;
      orderDate: string;
      status: import("../backend.d").OrderStatus;
    }) => {
      const actor = await createAdminActor();
      await actor.createOrder(
        args.customerId,
        args.workType,
        args.designCode,
        args.stitchingType,
        args.deliveryDate,
        args.orderDate,
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
      stitchingType: string;
      deliveryDate: string;
      orderDate: string;
    }) => {
      const actor = await createAdminActor();
      await actor.updateOrder(
        args.id,
        args.workType,
        args.designCode,
        args.stitchingType,
        args.deliveryDate,
        args.orderDate,
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

export function useGetAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const actor = await createAdminActor();
      return actor.getAnalytics();
    },
    staleTime: 30_000,
  });
}
