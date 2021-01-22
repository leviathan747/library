/*
 * Copyright 2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import DecodedBitStreamParser from './DecodedBitStreamParser';

import IllegalStateException from '../../IllegalStateException';
import FormatException from '../../FormatException';
import BitMatrixParser from './BitMatrixParser';
import StringUtils from '../../common/StringUtils';
import Integer from '../../util/Integer';
import { int, byte } from '../../../customTypings';


export default class Decoder {

  private ALL = 0;
  private EVEN = 1;
  private ODD = 2;

  private rsDecoder: ReedSolomonDecoder;

  constructor() {
    this.rsDecoder = new ReedSolomonDecoder(GenericGF.MAXICODE_FIELD_64);
  }

  public decode(bits: BitMatrix): DecoderResult {
    const parser: BitMatrixParser = new BitMatrixParser(bits);
    let codewords = parser.readCodewords();
    const mode: number = codewords[0] & 0x0F;
    let datawords: Uint8Array;

    for(let i = 0; i < 10; i++) {
        datawords[i] = codewords[i];
    }

    for(let x = 20; x < 30; x++) {
        datawords[x - 10] = codewords[x];
    }

    return DecodedBitStreamParser.decode(datawords, mode);
  }

}