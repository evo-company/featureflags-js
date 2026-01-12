import { Variable } from './variables';
import { loadFlags } from './conditions';
import { IDictionary, IFlagRequest, IFlagResponse } from './types';

export class StoreController {
  private readonly project: string;
  private readonly variables: Variable[];

  private state: IDictionary<Function>;
  private version: number;


  constructor(project: string, variables: Variable[]) {
    this.project = project;
    this.variables = variables;

    this.state = {};
    this.version = 0;
  }

  public getCheck(name: string): Function | undefined {
    return this.state[name];
  }

  public getRequest(flagsUsage: string[]): IFlagRequest {
    return {
      project: this.project,
      version: this.version,
      variables: this.variables,
      flags: flagsUsage,
    };
  }

  public applyReply(reply: IFlagResponse): void {
    if (reply && this.version !== reply.version && reply.version !== undefined) {
      this.state = loadFlags(reply.flags);
      this.version = reply.version;
    }
  }
}
