import { FeatureClient } from '../src';

import { featureflags, google } from '../protostub/proto';
import ExchangeReply = featureflags.service.ExchangeReply;
import Ref = featureflags.graph.Ref;
import Flag = featureflags.graph.Flag;
import BoolValue = google.protobuf.BoolValue;

describe('Test of flags without conditions.', () => {
  const Defaults = {
    TRUE_DEFAULT: true,
    FALSE_DEFAULT: false,
  };

  const featureClient = new FeatureClient('test', '', Defaults, []);

  it('Check case when flags initialized only on client.', () => {
    expect(featureClient.flags().TRUE_DEFAULT).toBe(Defaults.TRUE_DEFAULT);
    expect(featureClient.flags({}).FALSE_DEFAULT).toBe(Defaults.FALSE_DEFAULT);
  });

  let version = 1;
  const generateMockFlag = (flag) => {
    featureClient['mockedExchange'] = function() {
      this.store.applyReply(
        new ExchangeReply({
          result: {
            Root: {
              flags: [new Ref({ Flag: flag.flag })],
            },
            Variable: {},
            Flag: {
              [flag.flag]: new Flag({
                id: flag.flag,
                name: flag.name,
                conditions: [],
                enabled: flag.enabled ? new BoolValue({ value: true }) : {},
                overridden: flag.overridden ? new BoolValue({ value: true }) : {},
              }),
            },
            Condition: {},
            Check: {},
          },
          version: version++,
        }),
      );
    };

    featureClient['mockedExchange']();
  };

  it('Check case when flags initialized as `ON` on server.', () => {
    generateMockFlag({
      flag: '88f851df635e46058b760',
      name: 'TRUE_DEFAULT',
      enabled: true,
      overridden: true,
    });

    expect(featureClient.flags().TRUE_DEFAULT).toBe(true);

    generateMockFlag({
      flag: '88f851df635e46058b760',
      name: 'FALSE_DEFAULT',
      enabled: true,
      overridden: true,
    });
    expect(featureClient.flags({}).FALSE_DEFAULT).toBe(true);
  });

  it('Check case when flags initialized as `OFF` on server.', () => {
    generateMockFlag({
      flag: '88f851df635e46058b760',
      name: 'TRUE_DEFAULT',
      enabled: false,
      overridden: true,
    });

    expect(featureClient.flags().TRUE_DEFAULT).toBe(false);

    generateMockFlag({
      flag: '88f851df635e46058b760',
      name: 'FALSE_DEFAULT',
      enabled: false,
      overridden: true,
    });
    expect(featureClient.flags({}).FALSE_DEFAULT).toBe(false);
  });
});
