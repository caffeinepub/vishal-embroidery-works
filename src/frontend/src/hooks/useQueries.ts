import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Design, Measurement } from "../backend.d";
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

// ─── Design Mutations ─────────────────────────────────────────────────────────

export function useCreateDesign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      designCode: string;
      category: string;
      workType: string;
      imageUrls: string[];
      isBridal: boolean;
      isTrending: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.createDesign(
        args.designCode,
        args.category,
        args.workType,
        args.imageUrls,
        args.isBridal,
        args.isTrending,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useCreateDesignBulk() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      entries: Array<{ designCode: string; imageUrl: string }>,
    ) => {
      if (!actor) throw new Error("Not connected");
      await actor.createDesignBulk(entries);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useClearAllDesigns() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.clearAllDesigns();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useUpdateDesign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      designCode: string;
      category: string;
      workType: string;
      imageUrls: string[];
    }) => {
      if (!actor) throw new Error("Not connected");
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteDesign(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useSetTrending() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, flag }: { id: bigint; flag: boolean }) => {
      if (!actor) throw new Error("Not connected");
      await actor.setTrending(id, flag);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useSetBridal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, flag }: { id: bigint; flag: boolean }) => {
      if (!actor) throw new Error("Not connected");
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
      if (!actor) throw new Error("Not connected");
      await actor.createMeasurement(
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
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not connected");
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteMeasurement(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["measurements"] });
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
