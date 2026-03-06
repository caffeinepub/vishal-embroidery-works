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
export interface Customer {
    id: bigint;
    backNeck: string;
    blouseLength: string;
    bust: string;
    name: string;
    createdAt: Time;
    frontNeck: string;
    sleeveLength: string;
    address: string;
    shoulder: string;
    phone: string;
    waist: string;
}
export type Time = bigint;
export interface BulkCreateEntry {
    imageUrl: string;
    category: string;
}
export interface Measurement {
    id: bigint;
    blouseLength: string;
    bust: string;
    chest: string;
    name: string;
    neck: string;
    createdAt: Time;
    sleeveLength: string;
    shoulder: string;
    notes: string;
    phone: string;
    waist: string;
}
export interface Order {
    id: bigint;
    status: OrderStatus;
    workType: string;
    createdAt: Time;
    deliveryDate: string;
    orderDate: string;
    stitchingType: string;
    customerId: bigint;
    designCode: string;
}
export interface UserProfile {
    name: string;
}
export enum OrderStatus {
    pending = "pending",
    inStitching = "inStitching",
    delivered = "delivered",
    ready = "ready"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllDesigns(): Promise<void>;
    createCustomer(name: string, phone: string, address: string, bust: string, waist: string, shoulder: string, sleeveLength: string, blouseLength: string, frontNeck: string, backNeck: string): Promise<void>;
    createDesign(designCode: string, category: string, workType: string, imageUrls: Array<string>, isBridal: boolean, isTrending: boolean): Promise<void>;
    createDesignBulk(entries: Array<BulkCreateEntry>): Promise<bigint>;
    createDesignWithAutoCode(category: string, workType: string, imageUrls: Array<string>, isBridal: boolean, isTrending: boolean): Promise<string>;
    createMeasurement(name: string, phone: string, bust: string, chest: string, waist: string, shoulder: string, sleeveLength: string, neck: string, blouseLength: string, notes: string): Promise<void>;
    createOrder(customerId: bigint, workType: string, designCode: string, stitchingType: string, deliveryDate: string, orderDate: string, status: OrderStatus): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDesign(id: bigint): Promise<void>;
    deleteMeasurement(id: bigint): Promise<void>;
    deleteOrder(id: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllDesigns(): Promise<Array<Design>>;
    getAllMeasurements(): Promise<Array<Measurement>>;
    getAllOrders(): Promise<Array<Order>>;
    getAnalytics(): Promise<{
        pendingOrders: bigint;
        completedOrders: bigint;
        inProgressOrders: bigint;
        totalDesigns: bigint;
        totalCustomers: bigint;
    }>;
    getBridalDesigns(): Promise<Array<Design>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerOrders(customerId: bigint): Promise<Array<Order>>;
    getDesign(id: bigint): Promise<Design | null>;
    getDesignsByCategory(category: string): Promise<Array<Design>>;
    getMeasurement(id: bigint): Promise<Measurement | null>;
    getNextDesignCode(category: string): Promise<string>;
    getTrendingDesigns(): Promise<Array<Design>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBridal(id: bigint, flag: boolean): Promise<void>;
    setTrending(id: bigint, flag: boolean): Promise<void>;
    updateCustomer(id: bigint, name: string, phone: string, address: string, bust: string, waist: string, shoulder: string, sleeveLength: string, blouseLength: string, frontNeck: string, backNeck: string): Promise<void>;
    updateDesign(id: bigint, designCode: string, category: string, workType: string, imageUrls: Array<string>): Promise<void>;
    updateMeasurement(id: bigint, name: string, phone: string, bust: string, chest: string, waist: string, shoulder: string, sleeveLength: string, neck: string, blouseLength: string, notes: string): Promise<void>;
    updateOrder(id: bigint, workType: string, designCode: string, stitchingType: string, deliveryDate: string, orderDate: string): Promise<void>;
    updateOrderStatus(id: bigint, status: OrderStatus): Promise<void>;
}
