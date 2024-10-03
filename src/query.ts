import { google, hiku } from '../protostub/proto';

import IStruct = google.protobuf.IStruct;
import IItem = hiku.protobuf.query.IItem;
import INode = hiku.protobuf.query.INode;

import Struct = google.protobuf.Struct;
import Item = hiku.protobuf.query.Item;
import Node = hiku.protobuf.query.Node;

export class G {
  static node(items: IItem[]): Node {
    return Node.create({ items });
  }
  static field(name: string): IItem {
    return Item.create({ field: { name } });
  }
  static link(name: string, node: INode, options?: IStruct): IItem {
    return Item.create({ link: { name, node, options } });
  }
}

export function getFalgsQuery(project: string): Node {
  return G.node([
    G.link(
      'flags',
      G.node([
        G.field('id'),
        G.field('name'),
        G.field('enabled'),
        G.link(
          'conditions',
          G.node([
            G.field('id'),
            G.link(
              'checks',
              G.node([
                G.field('id'),
                G.link('variable', G.node([G.field('id'), G.field('name'), G.field('type')])),
                G.field('operator'),
                G.field('value_string'),
                G.field('value_number'),
                G.field('value_timestamp'),
                G.field('value_set'),
              ]),
            ),
          ]),
        ),
        G.field('overridden'),
      ]),
      Struct.create({ fields: { project_name: { stringValue: project } } }),
    ),
  ]);
}
