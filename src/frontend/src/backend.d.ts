import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Design {
    id: bigint;
    workType: string;
    imageUrls: Array<string>;
    createdAt: Time;
    isBridal: boolean;
    category: string;
    isNew: boolean;
    designCode: string;
    isTrending: boolean;
}
export type Time = bigint;
export interface Measurement {
    id: bigint;
    blouseLength: string;
    bust: string;
    name: string;
    neck: string;
    createdAt: Time;
    sleeveLength: string;
    shoulder: string;
    phone: string;
    waist: string;
}
export interface BulkCreateEntry {
    imageUrl: string;
    designCode: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllDesigns(): Promise<void>;
    createDesign(designCode: string, category: string, workType: string, imageUrls: Array<string>, isBridal: boolean, isTrending: boolean): Promise<void>;
    createDesignBulk(entries: Array<BulkCreateEntry>): Promise<void>;
    createMeasurement(name: string, phone: string, bust: string, waist: string, shoulder: string, sleeveLength: string, neck: string, blouseLength: string): Promise<void>;
    deleteDesign(id: bigint): Promise<void>;
    deleteMeasurement(id: bigint): Promise<void>;
    getAllDesigns(): Promise<Array<Design>>;
    getAllMeasurements(): Promise<Array<Measurement>>;
    getBridalDesigns(): Promise<Array<Design>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDesign(id: bigint): Promise<Design | null>;
    getDesignsByCategory(category: string): Promise<Array<Design>>;
    getMeasurement(id: bigint): Promise<Measurement | null>;
    getTrendingDesigns(): Promise<Array<Design>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBridal(id: bigint, flag: boolean): Promise<void>;
    setTrending(id: bigint, flag: boolean): Promise<void>;
    updateDesign(id: bigint, designCode: string, category: string, workType: string, imageUrls: Array<string>): Promise<void>;
    updateMeasurement(id: bigint, name: string, phone: string, bust: string, waist: string, shoulder: string, sleeveLength: string, neck: string, blouseLength: string): Promise<void>;
}
