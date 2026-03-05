import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type Design = {
    id : Nat;
    designCode : Text;
    category : Text;
    workType : Text;
    imageUrls : [Text];
    isBridal : Bool;
    isTrending : Bool;
    isNew : Bool;
    createdAt : Time.Time;
  };

  type Measurement = {
    id : Nat;
    name : Text;
    phone : Text;
    bust : Text;
    waist : Text;
    shoulder : Text;
    sleeveLength : Text;
    neck : Text;
    blouseLength : Text;
    createdAt : Time.Time;
  };

  type UserProfile = {
    name : Text;
  };

  type BulkCreateEntry = {
    designCode : Text;
    imageUrl : Text;
  };

  var nextDesignId = 0;
  var nextMeasurementId = 0;

  let designs = Map.empty<Nat, Design>();
  let measurements = Map.empty<Nat, Measurement>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module ByCreatedAt {
    public func compare(a : Design, b : Design) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  // === User Profile Management ===
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // === Public Design (Catalog) Management ===
  public shared ({ caller }) func createDesign(
    designCode : Text,
    category : Text,
    workType : Text,
    imageUrls : [Text],
    isBridal : Bool,
    isTrending : Bool
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create designs");
    };
    let design : Design = {
      id = nextDesignId;
      designCode;
      category;
      workType;
      imageUrls;
      isBridal;
      isTrending;
      isNew = true;
      createdAt = Time.now();
    };

    designs.add(nextDesignId, design);
    nextDesignId += 1;
  };

  public shared ({ caller }) func createDesignBulk(entries : [BulkCreateEntry]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create designs in bulk");
    };
    for (entry in entries.values()) {
      let design : Design = {
        id = nextDesignId;
        designCode = entry.designCode;
        category = "All Embroidery Works";
        workType = "Embroidery";
        imageUrls = [entry.imageUrl];
        isBridal = false;
        isTrending = false;
        isNew = true;
        createdAt = Time.now();
      };
      designs.add(nextDesignId, design);
      nextDesignId += 1;
    };
  };

  public shared ({ caller }) func updateDesign(
    id : Nat,
    designCode : Text,
    category : Text,
    workType : Text,
    imageUrls : [Text]
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update designs");
    };
    switch (designs.get(id)) {
      case (null) {
        Runtime.trap("Design does not exist");
      };
      case (?existing) {
        let updated : Design = {
          designCode;
          category;
          workType;
          imageUrls;
          id = existing.id;
          isBridal = existing.isBridal;
          isTrending = existing.isTrending;
          isNew = existing.isNew;
          createdAt = existing.createdAt;
        };
        designs.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteDesign(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete designs");
    };
    if (not designs.containsKey(id)) { Runtime.trap("Design not found") };
    designs.remove(id);
  };

  public shared ({ caller }) func setBridal(id : Nat, flag : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set bridal flag");
    };
    switch (designs.get(id)) {
      case (null) { Runtime.trap("Design does not exist") };
      case (?existing) {
        let updated = {
          isBridal = flag;
          id = existing.id;
          designCode = existing.designCode;
          category = existing.category;
          workType = existing.workType;
          imageUrls = existing.imageUrls;
          isTrending = existing.isTrending;
          isNew = existing.isNew;
          createdAt = existing.createdAt;
        };
        designs.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func setTrending(id : Nat, flag : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set trending flag");
    };
    switch (designs.get(id)) {
      case (null) { Runtime.trap("Design does not exist") };
      case (?existing) {
        let updated = {
          isTrending = flag;
          id = existing.id;
          designCode = existing.designCode;
          category = existing.category;
          workType = existing.workType;
          imageUrls = existing.imageUrls;
          isBridal = existing.isBridal;
          isNew = existing.isNew;
          createdAt = existing.createdAt;
        };
        designs.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func clearAllDesigns() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear all designs");
    };
    designs.clear();
    nextDesignId := 0;
  };

  // === Public Design Queries ===
  public query ({ caller }) func getAllDesigns() : async [Design] {
    designs.values().toArray().sort();
  };

  public query ({ caller }) func getDesign(id : Nat) : async ?Design {
    designs.get(id);
  };

  public query ({ caller }) func getDesignsByCategory(category : Text) : async [Design] {
    designs.values().toArray().filter(func(d) { Text.equal(d.category, category) });
  };

  public query ({ caller }) func getBridalDesigns() : async [Design] {
    designs.values().toArray().filter(func(d) { d.isBridal });
  };

  public query ({ caller }) func getTrendingDesigns() : async [Design] {
    designs.values().toArray().filter(func(d) { d.isTrending });
  };

  // === Customer Measurements (for Booking Stitching) ===
  public shared ({ caller }) func createMeasurement(
    name : Text,
    phone : Text,
    bust : Text,
    waist : Text,
    shoulder : Text,
    sleeveLength : Text,
    neck : Text,
    blouseLength : Text
  ) : async () {
    let measurement : Measurement = {
      id = nextMeasurementId;
      name;
      phone;
      bust;
      waist;
      shoulder;
      sleeveLength;
      neck;
      blouseLength;
      createdAt = Time.now();
    };
    measurements.add(nextMeasurementId, measurement);
    nextMeasurementId += 1;
  };

  public shared ({ caller }) func updateMeasurement(
    id : Nat,
    name : Text,
    phone : Text,
    bust : Text,
    waist : Text,
    shoulder : Text,
    sleeveLength : Text,
    neck : Text,
    blouseLength : Text
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update measurements");
    };
    switch (measurements.get(id)) {
      case (null) { Runtime.trap("Measurement does not exist") };
      case (?existing) {
        let updated : Measurement = {
          id = existing.id;
          name;
          phone;
          bust;
          waist;
          shoulder;
          sleeveLength;
          neck;
          blouseLength;
          createdAt = existing.createdAt;
        };
        measurements.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMeasurement(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete measurements");
    };
    if (not measurements.containsKey(id)) { Runtime.trap("Measurement not found") };
    measurements.remove(id);
  };

  public query ({ caller }) func getAllMeasurements() : async [Measurement] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view measurements");
    };
    measurements.values().toArray();
  };

  public query ({ caller }) func getMeasurement(id : Nat) : async ?Measurement {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view measurements");
    };
    measurements.get(id);
  };
};
