/**
 * MineTrack — Mining Fleet Dispatch Integration Adapter
 * Connects with Fleet Management Systems (FMS) like Modular Mining DISPATCH, Hexagon Jigsaw, or Wenco.
 */

export interface DispatchHaulAssignment {
  assignmentId: string;
  haulerUnitCode: string;
  loaderUnitCode: string;
  pitSourceCode: string;
  dumpDestinationCode: string;
  materialCode: string;
  dispatchedAt: string;
  estimatedCycleMinutes: number;
}

export interface IDispatchAdapter {
  readonly systemName: string;
  getActiveAssignments(siteCode: string): Promise<DispatchHaulAssignment[]>;
  postCycleCompletion(cycleData: {
    haulerUnitCode: string;
    ticketNumber: string;
    netWeightTon: number;
    completionTimestamp: string;
  }): Promise<boolean>;
}

export class StubDispatchAdapter implements IDispatchAdapter {
  readonly systemName = "STUB_FMS_DISPATCH";

  async getActiveAssignments(): Promise<DispatchHaulAssignment[]> {
    return [];
  }

  async postCycleCompletion(): Promise<boolean> {
    return false;
  }
}
