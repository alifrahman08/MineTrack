/**
 * MineTrack — Fleet Telemetry & GPS Tracking Architecture Contract
 * Interface adapter for Caterpillar ProductLink, Komatsu KOMTRAX, or custom GPS IoT gateways.
 */

export interface TelemetryReading {
  equipmentId: string;
  equipmentCode: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  speedKmh?: number;
  headingDegrees?: number;
  engineOperatingHours: number;
  fuelLevelPercent?: number;
  engineRpm?: number;
  coolantTemperatureCelsius?: number;
  hydraulicOilPressureKpa?: number;
  odometerKm?: number;
  faultCodes?: {
    code: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}

export interface ITelemetryAdapter {
  readonly providerName: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  fetchLatestReading(equipmentCode: string): Promise<TelemetryReading | null>;
  streamReadings?(onReading: (reading: TelemetryReading) => void): () => void;
}

/**
 * Production Readiness Requirements for Telemetry Activation:
 * 1. Active satellite / cellular IoT data gateway (e.g., Orbcomm, Quectel 4G/LTE rugged modem).
 * 2. CAN Bus / J1939 telemetry interface cable connected to ECM (Electronic Control Module).
 * 3. Provider credentials (API Key, OAuth2 client ID, Webhook secret) configured in environment variables:
 *    - TELEMETRY_PROVIDER_URL
 *    - TELEMETRY_API_KEY
 *    - TELEMETRY_WEBHOOK_SECRET
 */
export class StubTelemetryAdapter implements ITelemetryAdapter {
  readonly providerName = "STUB_OFFLINE_TELEMETRY";

  async connect(): Promise<boolean> {
    // Hardware bridge not configured
    return false;
  }

  async disconnect(): Promise<void> {}

  async fetchLatestReading(equipmentCode: string): Promise<TelemetryReading | null> {
    return null;
  }
}
