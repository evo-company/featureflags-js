import { Variable } from './client';
import { loadFlags } from './conditions';
import { getFalgsQuery } from './query';
import { IDictionary } from './types';

import { featureflags, hiku } from '../protostub/proto';

import Node = hiku.protobuf.query.Node;
import IExchangeRequest = featureflags.service.IExchangeRequest;
import IExchangeReply = featureflags.service.IExchangeReply;
import IFlagUsage = featureflags.service.IFlagUsage;

export class StoreController {
  private readonly project: string;
  private readonly variables: Variable[];

  private state: IDictionary<Function>;
  private version: number;

  private readonly exchangeQuery: Node;
  private variablesSent: boolean;
  private flagsUsageSent: boolean;

  constructor(project: string, variables: Variable[]) {
    this.project = project;
    this.variables = variables;

    this.state = {};
    this.version = 0;

    this.exchangeQuery = getFalgsQuery(project);
    this.variablesSent = false;
  }

  public getCheck(name: string): Function {
    return this.state[name];
  }

  public getRequest(flagsUsage: IFlagUsage[]): IExchangeRequest {
    const request: IExchangeRequest = {
      project: this.project,
      version: this.version,
      query: this.exchangeQuery,
      variables: [],
    };

    if (!this.variablesSent) request.variables = this.variables;
    if (!this.flagsUsageSent) request.flagsUsage = flagsUsage;

    return request;
  }

  public applyReply(reply: IExchangeReply) {
    this.variablesSent = true;
    this.flagsUsageSent = true;

    if (this.version !== reply.version) {
      this.state = loadFlags(reply.result);
      this.version = reply.version;
    }
  }
}
