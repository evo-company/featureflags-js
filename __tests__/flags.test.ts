import { FeatureClient, Types, Variable } from '../src';

import { featureflags, google } from '../protostub/proto';
import ExchangeReply = featureflags.service.ExchangeReply;
import Ref = featureflags.graph.Ref;
import Flag = featureflags.graph.Flag;
import _Variable = featureflags.graph.Variable;
import BoolValue = google.protobuf.BoolValue;
import Condition = featureflags.graph.Condition;
import Check = featureflags.graph.Check;

describe('Init FeatureClient properly', () => {
  it('Apply procs from grpc result', () => {
    const resultMockedIds = {
      flag: '88f851df635e46058b760',
      variable: '32423jh52h3j4k2',
      condition: '24hghh24jgj9402gh21j',
      check: '2384h23nf3j2nfklhew9',
    };

    const Flags = {
      TEST: false,
    };

    const featureClient = new FeatureClient(
      'myProject',
      'grpc:50051',
      Flags, // default flags
      [new Variable('username', Types.STRING)],
      true,
    );

    featureClient['mockedExchange'] = function() {
      this.store.applyReply(
        new ExchangeReply({
          result: {
            Root: {
              flags: [new Ref({ Flag: resultMockedIds.flag })],
            },
            Variable: {
              [resultMockedIds.variable]: new _Variable({
                id: resultMockedIds.variable,
                name: 'username',
                type: Types.STRING,
              }),
            },
            Flag: {
              [resultMockedIds.flag]: new Flag({
                id: resultMockedIds.flag,
                name: 'TEST',
                enabled: new BoolValue({ value: true }),
                conditions: [new Ref({ Condition: resultMockedIds.condition })],
              }),
            },
            Condition: {
              [resultMockedIds.condition]: new Condition({
                id: resultMockedIds.condition,
                checks: [new Ref({ Check: resultMockedIds.check })],
              }),
            },
            Check: {
              [resultMockedIds.check]: new Check({
                id: resultMockedIds.check,
                variable: new Ref({ Variable: resultMockedIds.variable }),
                operator: Check.Operator.EQUAL,
                valueString: 'Petro',
              }),
            },
          },
          version: 15,
        }),
      );
    };

    featureClient['mockedExchange']();

    expect(featureClient.flags().TEST).toBe(false);
    expect(featureClient.flags({ username: 'Petro' }).TEST).toBe(true);
  });
});
