import { Variable } from './client';
import { loadFlags } from './conditions';
import { IDictionary } from './types';

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

  public getCheck(name: string): Function {
    return this.state[name];
  }

  public getRequest(flagsUsage: any): any {
    const request: any = {
      project: this.project,
      version: this.version,
      variables: this.variables,
      flags: flagsUsage,
    };

    return request;
  }

  public applyReply(reply: any) {
    console.log(reply);

    if (reply && this.version !== reply.version && reply.version !== undefined) {
      this.state = loadFlags(reply.flags);
      this.version = reply.version;
    }
  }
}
