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

import BarcodeFormat from '../BarcodeFormat';
import BinaryBitmap from '../BinaryBitmap';
import BitMatrix from '../common/BitMatrix';
import DecoderResult from '../common/DecoderResult';
import DecodeHintType from '../DecodeHintType';
import NotFoundException from '../NotFoundException';
import Reader from '../Reader';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import System from '../util/System';
import Decoder from './decoder/Decoder';
import Detector from './detector/Detector';


/**
 * This implementation can detect and decode a MaxiCode in an image.
 */
export default class MaxiCodeReader implements Reader {

  private static NO_POINTS: ResultPoint[] = [];
  private static MATRIX_WIDTH: number = 30;
  private static MATRIX_HEIGHT: number = 33;

  private decoder: Decoder = new Decoder();

  public decode(image: BinaryBitmap, hints: Map<DecodeHintType, any> | null = null): Result {
    const bits: BitMatrix = this.extractPureBits(image.getBlackMatrix());
    const decoderResult = this.decoder.decode(bits, hints);
    const result: Result = new Result(
      decoderResult.getText(),
      decoderResult.getRawBytes(),
      decoderResult.getNumBits(),
      MaxiCodeReader.NO_POINTS,
      BarcodeFormat.MAXICODE,
      System.currentTimeMillis()
    );

    String ecLevel = decoderResult.getECLevel();
    if (ecLevel != null) {
      result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
    }
    return result;
  }


  public reset() {
    // do nothing
  }

  /**
   * This method detects a code in a "pure" image -- that is, pure monochrome image
   * which contains only an unrotated, unskewed, image of a code, with some white border
   * around it. This is a specialized method that works exceptionally fast in this special
   * case.
   */
  private static BitMatrix extractPureBits(image: BitMatrix): BitMatrix {

    enclosingRectangle: Int32Array[] = image.getEnclosingRectangle();
    if (enclosingRectangle == null) {
      throw NotFoundException.getNotFoundInstance();
    }

    int left = enclosingRectangle[0];
    int top = enclosingRectangle[1];
    int width = enclosingRectangle[2];
    int height = enclosingRectangle[3];

    // Now just read off the bits
    BitMatrix bits = new BitMatrix(MATRIX_WIDTH, MATRIX_HEIGHT);
    for (int y = 0; y < MATRIX_HEIGHT; y++) {
      int iy = top + (y * height + height / 2) / MATRIX_HEIGHT;
      for (int x = 0; x < MATRIX_WIDTH; x++) {
        // srowen: I don't quite understand why the formula below is necessary, but it
        // can walk off the image if left + width = the right boundary. So cap it.
        int ix = left + Math.min(
          (x * width + width / 2 + (y & 0x01) * width / 2) / MATRIX_WIDTH,
          width);
        if (image.get(ix, iy)) {
          bits.set(x, y);
        }
      }
    }
    return bits;
  }

}
