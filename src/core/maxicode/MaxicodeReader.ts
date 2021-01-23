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
  private static MATRIX_HEIGHT: number = 33;
  private static MATRIX_WIDTH: number = 30;

  private decoder: Decoder = new Decoder();

  public decode(image: BinaryBitmap, hints: Map<DecodeHintType, any> | null = null): Result {
    let decoderResult: DecoderResult;
    let points: ResultPoint[];

    if (hints != null && hints.has(DecodeHintType.PURE_BARCODE)) {
      const bits: BitMatrix = MaxiCodeReader.extractPureBits(image.getBlackMatrix());
      decoderResult = this.decoder.decode(bits);
      points = MaxiCodeReader.NO_POINTS;
    } else {
      const detectorResult = new Detector(image.getBlackMatrix()).detect();
      decoderResult = this.decoder.decode(detectorResult.getBits());
      points = detectorResult.getPoints();
    }
    const result: Result = new Result(
      decoderResult.getText(),
      decoderResult.getRawBytes(),
      decoderResult.getNumBits(),
      points,
      BarcodeFormat.MAXICODE,
      System.currentTimeMillis()
    );

    const ecLevel: String = decoderResult.getECLevel();
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
  private static extractPureBits(image: BitMatrix): BitMatrix {

    const enclosingRectangle: Int32Array = image.getEnclosingRectangle();
    if (enclosingRectangle === null) {
      throw new NotFoundException();
    }

    const left = enclosingRectangle[0];
    const top = enclosingRectangle[1];
    const width = enclosingRectangle[2];
    const height = enclosingRectangle[3];

    // Now just read off the bits
    const bits: BitMatrix = new BitMatrix(MaxiCodeReader.MATRIX_WIDTH, MaxiCodeReader.MATRIX_HEIGHT);
    for (let y = 0; y < MaxiCodeReader.MATRIX_HEIGHT; y++) {
      const iy = top + Math.floor((y * height + Math.floor(height / 2)) / MaxiCodeReader.MATRIX_HEIGHT);
      for (let x = 0; x < MaxiCodeReader.MATRIX_WIDTH; x++) {
        // srowen: I don't quite understand why the formula below is necessary, but it
        // can walk off the image if left + width = the right boundary. So cap it.
        const ix = left + Math.min(
          Math.floor((x * width + Math.floor(width / 2) + (y & 0x01) * Math.floor(width / 2)) / MaxiCodeReader.MATRIX_WIDTH),
          width);
        if (image.get(ix, iy)) {
          bits.set(x, y);
        }
      }
    }
    return bits;

  }
}
