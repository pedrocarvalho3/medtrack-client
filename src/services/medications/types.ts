enum PeriodicityType {
  "INTERVAL",
  "FIXED_TIMES",
}

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  periodicityType: PeriodicityType;
  periodicity: string;
  validity: string;
  quantityAvailable: number;
};
