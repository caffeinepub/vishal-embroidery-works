import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";


import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


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
    imageUrl : Text;
    category : Text;
  };

  type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    address : Text;
    bust : Text;
    waist : Text;
    shoulder : Text;
    sleeveLength : Text;
    blouseLength : Text;
    frontNeck : Text;
    backNeck : Text;
    createdAt : Time.Time;
  };

  type OrderStatus = {
    #pending;
    #inStitching;
    #ready;
    #delivered;
  };

  type Order = {
    id : Nat;
    customerId : Nat;
    workType : Text;
    designCode : Text;
    deliveryDate : Text;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  var nextDesignId = 0;
  var nextMeasurementId = 0;

  let designs = Map.empty<Nat, Design>();
  let measurements = Map.empty<Nat, Measurement>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextCustomerId = 0;
  var nextOrderId = 0;

  let customers = Map.empty<Nat, Customer>();
  let orders = Map.empty<Nat, Order>();

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

  // === Design Code Logic ===
  func getPrefix(category : Text) : Text {
    switch (category) {
      case ("All Embroidery Works" or "All Embroidery") { "VEW-AE" };
      case ("Ready Blouse Embroidery") { "VEW-RB" };
      case ("Simple Blouse") { "VEW-BS" };
      case ("Princess Cut Blouse") { "VEW-BP" };
      case ("Boat Neck Blouse") { "VEW-BN" };
      case ("Collar Blouse") { "VEW-BC" };
      case ("Fashion Blouse") { "VEW-BF" };
      case (_other) { "VEW-AE" };
    };
  };

  func getNextDesignNumber(prefix : Text) : Nat {
    var maxNum = 0;
    for (d in designs.values()) {
      if (d.designCode.startsWith(#text(prefix))) {
        let parts = d.designCode.split(#char('-'));
        var count = 0;
        for (p in parts) {
          count += 1;
          if (count == 3) {
            switch (Nat.fromText(p)) {
              case (?num) { if (num > maxNum) { maxNum := num } };
              case (null) {};
            };
          };
        };
      };
    };
    maxNum + 1;
  };

  func formatNumber(num : Nat) : Text {
    if (num < 10) { return "00" # num.toText() };
    if (num < 100) { return "0" # num.toText() };
    num.toText();
  };

  func getWorkType(category : Text) : Text {
    switch (category) {
      case ("All Embroidery Works" or "All Embroidery" or "Ready Blouse Embroidery") {
        "Embroidery";
      };
      case (
        "Simple Blouse" or "Princess Cut Blouse" or "Boat Neck Blouse" or "Collar Blouse" or "Fashion Blouse"
      ) { "Blouse Stitching" };
      case (_other) { "Embroidery" };
    };
  };

  // === Public Design (Catalog) Management ===
  public shared ({ caller }) func createDesign(
    designCode : Text,
    category : Text,
    workType : Text,
    imageUrls : [Text],
    isBridal : Bool,
    isTrending : Bool,
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

  public query ({ caller }) func getNextDesignCode(category : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can preview design codes");
    };
    let prefix = getPrefix(category);
    let nextNum = getNextDesignNumber(prefix);
    let numStr = formatNumber(nextNum);
    prefix # "-" # numStr;
  };

  public shared ({ caller }) func createDesignWithAutoCode(
    category : Text,
    workType : Text,
    imageUrls : [Text],
    isBridal : Bool,
    isTrending : Bool,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create designs");
    };
    let prefix = getPrefix(category);
    let nextNum = getNextDesignNumber(prefix);
    let code = prefix # "-" # formatNumber(nextNum);

    let design : Design = {
      id = nextDesignId;
      designCode = code;
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
    code;
  };

  public shared ({ caller }) func createDesignBulk(entries : [BulkCreateEntry]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk create designs");
    };
    var countCreated = 0;

    for (entry in entries.values()) {
      let prefix = getPrefix(entry.category);
      let nextNum = getNextDesignNumber(prefix);
      let code = prefix # "-" # formatNumber(nextNum);

      let design : Design = {
        id = nextDesignId;
        designCode = code;
        category = entry.category;
        workType = getWorkType(entry.category);
        imageUrls = [entry.imageUrl];
        isBridal = false;
        isTrending = false;
        isNew = true;
        createdAt = Time.now();
      };

      designs.add(nextDesignId, design);
      nextDesignId += 1;
      countCreated += 1;
    };
    countCreated;
  };

  public shared ({ caller }) func updateDesign(
    id : Nat,
    designCode : Text,
    category : Text,
    workType : Text,
    imageUrls : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update designs");
    };
    switch (designs.get(id)) {
      case (null) { Runtime.trap("Design does not exist") };
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

  // === Customer Management ===

  // (admin only for all except createCustomer which needs user role)
  public shared ({ caller }) func createCustomer(
    name : Text,
    phone : Text,
    address : Text,
    bust : Text,
    waist : Text,
    shoulder : Text,
    sleeveLength : Text,
    blouseLength : Text,
    frontNeck : Text,
    backNeck : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create customers");
    };

    let newCustomer : Customer = {
      id = nextCustomerId;
      name;
      phone;
      address;
      bust;
      waist;
      shoulder;
      sleeveLength;
      blouseLength;
      frontNeck;
      backNeck;
      createdAt = Time.now();
    };

    customers.add(nextCustomerId, newCustomer);
    nextCustomerId += 1;
  };

  public shared ({ caller }) func updateCustomer(
    id : Nat,
    name : Text,
    phone : Text,
    address : Text,
    bust : Text,
    waist : Text,
    shoulder : Text,
    sleeveLength : Text,
    blouseLength : Text,
    frontNeck : Text,
    backNeck : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?existing) {
        let updated : Customer = {
          id = existing.id;
          name;
          phone;
          address;
          bust;
          waist;
          shoulder;
          sleeveLength;
          blouseLength;
          frontNeck;
          backNeck;
          createdAt = existing.createdAt;
        };
        customers.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };

    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_existing) { customers.remove(id) };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all customers");
    };
    customers.values().toArray();
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get customers");
    };
    customers.get(id);
  };

  // === Order Management ===

  public shared ({ caller }) func createOrder(
    customerId : Nat,
    workType : Text,
    designCode : Text,
    deliveryDate : Text,
    status : OrderStatus,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create orders");
    };

    let order : Order = {
      id = nextOrderId;
      customerId;
      workType;
      designCode;
      deliveryDate;
      status;
      createdAt = Time.now();
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;
  };

  public shared ({ caller }) func updateOrder(
    id : Nat,
    workType : Text,
    designCode : Text,
    deliveryDate : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update orders");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existing) {
        let updated : Order = {
          id = existing.id;
          customerId = existing.customerId;
          workType;
          designCode;
          deliveryDate;
          status = existing.status;
          createdAt = existing.createdAt;
        };
        orders.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existing) {
        let updated : Order = {
          id = existing.id;
          customerId = existing.customerId;
          workType = existing.workType;
          designCode = existing.designCode;
          deliveryDate = existing.deliveryDate;
          status;
          createdAt = existing.createdAt;
        };
        orders.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };

    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?_existing) { orders.remove(id) };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getCustomerOrders(customerId : Nat) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get customer orders");
    };
    orders.values().toArray().filter(func(o) { o.customerId == customerId });
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
    blouseLength : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit measurements");
    };
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
    blouseLength : Text,
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
