import { itauParser } from './itau';
import { bradescoParser } from './bradesco';
import { santanderParser } from './santander';
import { interParser } from './inter';
import { c6Parser } from './c6';
import { btgParser } from './btg';

import { BankParser } from './types';
export * from './types';

// Registry will be populated as we add parsers
export const bankParsers: BankParser[] = [
  itauParser,
  bradescoParser,
  santanderParser,
  interParser,
  c6Parser,
  btgParser
];

export function registerParser(parser: BankParser) {
  bankParsers.push(parser);
}
