import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldDesign = {
    id : Nat;
    designCode : Text;
    category : Text;
    workType : Text;
    imageUrl : Text;
    isBridal : Bool;
    isTrending : Bool;
    isNew : Bool;
    createdAt : Time.Time;
  };

  type OldMeasurement = {
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

  type OldActor = {
    nextDesignId : Nat;
    nextMeasurementId : Nat;
    designs : Map.Map<Nat, OldDesign>;
    measurements : Map.Map<Nat, OldMeasurement>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type NewDesign = {
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

  type NewMeasurement = {
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

  type NewActor = {
    nextDesignId : Nat;
    nextMeasurementId : Nat;
    designs : Map.Map<Nat, NewDesign>;
    measurements : Map.Map<Nat, NewMeasurement>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    let migratedDesigns = old.designs.map<Nat, OldDesign, NewDesign>(
      func(_id, oldDesign) { { oldDesign with imageUrls = [oldDesign.imageUrl] } }
    );

    let migratedMeasurements = old.measurements.map<Nat, OldMeasurement, NewMeasurement>(
      func(_id, oldMeasurement) { oldMeasurement }
    );

    {
      old with
      designs = migratedDesigns;
      measurements = migratedMeasurements;
    };
  };
};
