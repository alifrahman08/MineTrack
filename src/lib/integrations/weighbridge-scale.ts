/**
 * MineTrack — Digital Weighbridge Scale Indicator Integration Adapter
 * Supports continuous string protocols from digital indicators (e.g., Avery Weigh-Tronix, Mettler Toledo, Rinstrum).
 */

export interface WeighbridgeIndicatorReading {
  rawString: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  grossWeightTon: number;
  netWeightTon: number;
  isStable: boolean;
  isZero: boolean;
  unit: 'KG' | 'TON';
  indicatorTimestamp: string;
}

export interface IWeighbridgeScaleAdapter {
  readonly model: string;
  readonly connectionType: 'SERIAL_RS232' | 'TCP_IP' | 'MODBUS_TCP';
  connect(hostOrPort: string, baudOrPortNumber?: number): Promise<boolean>;
  disconnect(): Promise<void>;
  readStableWeight(): Promise<WeighbridgeIndicatorReading | null>;
}

/**
 * Production Readiness Requirements for Physical Scale Integration:
 * 1. RS-232 / RS-485 serial-to-ethernet converter (e.g. MOXA NPort 5110) or direct TCP/IP scale indicator.
 * 2. Calibration certificate and legal metrology seal (Tera Metrologi Legal).
 * 3. Configuration in .env:
 *    - WEIGHBRIDGE_INDICATOR_IP
 *    - WEIGHBRIDGE_INDICATOR_PORT
 *    - WEIGHBRIDGE_PROTOCOL_FORMAT
 */
export class StubWeighbridgeScaleAdapter implements IWeighbridgeScaleAdapter {
  readonly model = "STUB_DIGITAL_INDICATOR";
  readonly connectionType = "TCP_IP";

  async connect(): Promise<boolean> {
    return false;
  }

  async disconnect(): Promise<void> {}

  async readStableWeight(): Promise<WeighbridgeIndicatorReading | null> {
    return null;
  }
}
