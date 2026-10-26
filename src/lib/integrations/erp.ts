/**
 * MineTrack — Enterprise Resource Planning (ERP) Integration Adapter
 * Connects approved production, fuel consumption, and equipment hours to SAP S/4HANA or Oracle ERP Cloud.
 */

export interface ErpProductionPostingPayload {
  companyCode: string;
  plantCode: string;
  postingDate: string;
  materialDocumentNumber?: string;
  commodityCode: string;
  quantityNetTon: number;
  costCenterCode: string;
  pitSource: string;
  referenceRecordNumber: string;
}

export interface IErpAdapter {
  readonly erpProvider: 'SAP_S4HANA' | 'ORACLE_ERP' | 'MICROSOFT_DYNAMICS';
  postApprovedProduction(payload: ErpProductionPostingPayload): Promise<{
    success: boolean;
    erpDocumentId?: string;
    error?: string;
  }>;
}

export class StubErpAdapter implements IErpAdapter {
  readonly erpProvider = "SAP_S4HANA";

  async postApprovedProduction(): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: "Konektor ERP belum aktif: Memerlukan SAP RFC / OData API credentials.",
    };
  }
}
