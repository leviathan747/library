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

import ChecksumException from '../../ChecksumException';
import FormatException from '../../FormatException';
import BitMatrixParser from './BitMatrixParser';
import { int, byte } from '../../../customTypings';


export default class Decoder {

  private static ALL = 0;
  private static EVEN = 1;
  private static ODD = 2;

  private rsDecoder: ReedSolomonDecoder;

  constructor() {
    this.rsDecoder = new ReedSolomonDecoder(GenericGF.MAXICODE_FIELD_64);
  }

  public decode(bits: BitMatrix): DecoderResult {
    const parser: BitMatrixParser = new BitMatrixParser(bits);
    let codewords = parser.readCodewords();

    this.correctErrors(codewords, 0, 10, 10, Decoder.ALL);
    const mode: number = codewords[0] & 0x0F;
    let datawords: Uint8Array;
    switch (mode) {
      case 2:
      case 3:
      case 4:
        this.correctErrors(codewords, 20, 84, 40, Decoder.EVEN);
        this.correctErrors(codewords, 20, 84, 40, Decoder.ODD);
        datawords = new Uint8Array(94);
        break;
      case 5:
        this.correctErrors(codewords, 20, 68, 56, Decoder.EVEN);
        this.correctErrors(codewords, 20, 68, 56, Decoder.ODD);
        datawords = new Uint8Array(78);
        break;
      default:
        throw new FormatException();
    }

    for (let i = 0, s = 0, d = 0; i < 10; i++) {  // arraycopy
      datawords[d+i] = codewords[s+i];
    }
    for (let i = 0, s = 20, d = 10; i < datawords.length - 10; i++) {  // arraycopy
      datawords[d+i] = codewords[s+i];
    }

    return DecodedBitStreamParser.decode(datawords, mode);
  }

  private correctErrors(codewordBytes: Uint8Array,
                 start: number,
                 dataCodewords: number,
                 ecCodewords: number,
                 mode: number): void {

    const codewords = dataCodewords + ecCodewords;

    // in EVEN or ODD mode only half the codewords
    const divisor = mode === Decoder.ALL ? 1 : 2;

    // First read into an array of ints
    const codewordsInts: Int32Array = new Int32Array(codewords / divisor);
    for (let i = 0; i < codewords; i++) {
      if ((mode === Decoder.ALL) || (i % 2 === (mode - 1))) {
        codewordsInts[i / divisor] = codewordBytes[i + start] & 0xFF;
      }
    }
    try {
      this.rsDecoder.decode(codewordsInts, ecCodewords / divisor);
    } catch (ignored) {
      throw new ChecksumException();
    }
    // Copy back into array of bytes -- only need to worry about the bytes that were data
    // We don't care about errors in the error-correction codewords
    for (let i = 0; i < dataCodewords; i++) {
      if ((mode === Decoder.ALL) || (i % 2 === (mode - 1))) {
        codewordBytes[i + start] = <byte>codewordsInts[i / divisor];
      }
    }
  }

}
