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


import DecoderResult from '../../common/DecoderResult';
import { byte, char } from 'src/customTypings';
import StringBuilder from '../../util/StringBuilder';


export default class DecodedBitStreamParser {

    private static SHIFTA: char = new String('\uFFF0').charCodeAt(0);
    private static SHIFTB: char = new String('\uFFF1').charCodeAt(0);
    private static SHIFTC: char = new String('\uFFF2').charCodeAt(0);
    private static SHIFTD: char = new String('\uFFF3').charCodeAt(0);
    private static SHIFTE: char = new String('\uFFF4').charCodeAt(0);
    private static TWOSHIFTA: char = new String('\uFFF5').charCodeAt(0);
    private static THREESHIFTA: char = new String('\uFFF6').charCodeAt(0);
    private static LATCHA: char = new String('\uFFF7').charCodeAt(0);
    private static LATCHB: char = new String('\uFFF8').charCodeAt(0);
    private static LOCK: char = new String('\uFFF9').charCodeAt(0);
    private static ECI: char = new String('\uFFFA').charCodeAt(0);
    private static NS: char = new String('\uFFFB').charCodeAt(0);
    private static PAD: char = new String('\uFFFC').charCodeAt(0);
    private static FS: char = new String('\u001C').charCodeAt(0);
    private static GS: char = new String('\u001D').charCodeAt(0);
    private static RS: char = new String('\u001E').charCodeAt(0);


    private static SETS: String[] = [
        "\nABCDEFGHIJKLMNOPQRSTUVWXYZ" + String.fromCharCode(DecodedBitStreamParser.ECI) + String.fromCharCode(DecodedBitStreamParser.FS) + String.fromCharCode(DecodedBitStreamParser.GS) + String.fromCharCode(DecodedBitStreamParser.RS) + String.fromCharCode(DecodedBitStreamParser.NS) + ' ' + String.fromCharCode(DecodedBitStreamParser.PAD) +
        "\"#$%&'()*+,-./0123456789:" + String.fromCharCode(DecodedBitStreamParser.SHIFTB) + String.fromCharCode(DecodedBitStreamParser.SHIFTC) + String.fromCharCode(DecodedBitStreamParser.SHIFTD) + String.fromCharCode(DecodedBitStreamParser.SHIFTE) + String.fromCharCode(DecodedBitStreamParser.LATCHB),
        "`abcdefghijklmnopqrstuvwxyz" + String.fromCharCode(DecodedBitStreamParser.ECI) + String.fromCharCode(DecodedBitStreamParser.FS) + String.fromCharCode(DecodedBitStreamParser.GS) + String.fromCharCode(DecodedBitStreamParser.RS) + String.fromCharCode(DecodedBitStreamParser.NS) + '{' + String.fromCharCode(DecodedBitStreamParser.PAD) +
        "}~\u007F;<=>?[\\]^_ ,./:@!|" + String.fromCharCode(DecodedBitStreamParser.PAD) + String.fromCharCode(DecodedBitStreamParser.TWOSHIFTA) + String.fromCharCode(DecodedBitStreamParser.THREESHIFTA) + String.fromCharCode(DecodedBitStreamParser.PAD) +
        String.fromCharCode(DecodedBitStreamParser.SHIFTA) + String.fromCharCode(DecodedBitStreamParser.SHIFTC) + String.fromCharCode(DecodedBitStreamParser.SHIFTD) + String.fromCharCode(DecodedBitStreamParser.SHIFTE) + String.fromCharCode(DecodedBitStreamParser.LATCHA),
        "\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u00C6\u00C7\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u00D0\u00D1\u00D2\u00D3\u00D4\u00D5\u00D6\u00D7\u00D8\u00D9\u00DA" +
        String.fromCharCode(DecodedBitStreamParser.ECI) + String.fromCharCode(DecodedBitStreamParser.FS) + String.fromCharCode(DecodedBitStreamParser.GS) + String.fromCharCode(DecodedBitStreamParser.RS) +
        "\u00DB\u00DC\u00DD\u00DE\u00DF\u00AA\u00AC\u00B1\u00B2\u00B3\u00B5\u00B9\u00BA\u00BC\u00BD\u00BE\u0080\u0081\u0082\u0083\u0084\u0085\u0086\u0087\u0088\u0089" +
        String.fromCharCode(DecodedBitStreamParser.LATCHA) + ' ' + String.fromCharCode(DecodedBitStreamParser.LOCK) + String.fromCharCode(DecodedBitStreamParser.SHIFTD) + String.fromCharCode(DecodedBitStreamParser.SHIFTE) + String.fromCharCode(DecodedBitStreamParser.LATCHB),
        "\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EA\u00EB\u00EC\u00ED\u00EE\u00EF\u00F0\u00F1\u00F2\u00F3\u00F4\u00F5\u00F6\u00F7\u00F8\u00F9\u00FA" +
        String.fromCharCode(DecodedBitStreamParser.ECI) + String.fromCharCode(DecodedBitStreamParser.FS) + String.fromCharCode(DecodedBitStreamParser.GS) + String.fromCharCode(DecodedBitStreamParser.RS) + String.fromCharCode(DecodedBitStreamParser.NS) +
        "\u00FB\u00FC\u00FD\u00FE\u00FF\u00A1\u00A8\u00AB\u00AF\u00B0\u00B4\u00B7\u00B8\u00BB\u00BF\u008A\u008B\u008C\u008D\u008E\u008F\u0090\u0091\u0092\u0093\u0094" +
        String.fromCharCode(DecodedBitStreamParser.LATCHA) + ' ' + String.fromCharCode(DecodedBitStreamParser.SHIFTC) + String.fromCharCode(DecodedBitStreamParser.LOCK) + String.fromCharCode(DecodedBitStreamParser.SHIFTE) + String.fromCharCode(DecodedBitStreamParser.LATCHB),
        "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\n\u000B\u000C\r\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A" +
        String.fromCharCode(DecodedBitStreamParser.ECI) + String.fromCharCode(DecodedBitStreamParser.PAD) + String.fromCharCode(DecodedBitStreamParser.PAD) + '\u001B' + String.fromCharCode(DecodedBitStreamParser.NS) + String.fromCharCode(DecodedBitStreamParser.FS) + String.fromCharCode(DecodedBitStreamParser.GS) + String.fromCharCode(DecodedBitStreamParser.RS) +
        "\u001F\u009F\u00A0\u00A2\u00A3\u00A4\u00A5\u00A6\u00A7\u00A9\u00AD\u00AE\u00B6\u0095\u0096\u0097\u0098\u0099\u009A\u009B\u009C\u009D\u009E" +
        String.fromCharCode(DecodedBitStreamParser.LATCHA) + ' ' + String.fromCharCode(DecodedBitStreamParser.SHIFTC) + String.fromCharCode(DecodedBitStreamParser.SHIFTD) + String.fromCharCode(DecodedBitStreamParser.LOCK) + String.fromCharCode(DecodedBitStreamParser.LATCHB),
        "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\n\u000B\u000C\r\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F\u0020\u0021\"\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002A\u002B\u002C\u002D\u002E\u002F\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003A\u003B\u003C\u003D\u003E\u003F"
    ];

    public static decode(bytes: Uint8Array, mode: number): DecoderResult {
        const result = new StringBuilder();
        switch (mode) {
            case 2:
            case 3:
                let postcode: String;
                if (mode == 2) {
                    postcode = DecodedBitStreamParser.getPostCode2(bytes).toString();
                } else {
                    postcode = DecodedBitStreamParser.getPostCode3(bytes);
                }
                const country = DecodedBitStreamParser.getCountry(bytes);
                const service = DecodedBitStreamParser.getServiceClass(bytes);
                result.append(DecodedBitStreamParser.getMessage(bytes, 10, 84));
                if (result.toString().startsWith("[)>" + String.fromCharCode(DecodedBitStreamParser.RS) + "01" + String.fromCharCode(DecodedBitStreamParser.GS))) {
                    result.insert(9, postcode + String.fromCharCode(DecodedBitStreamParser.GS) + country + String.fromCharCode(DecodedBitStreamParser.GS) + service + String.fromCharCode(DecodedBitStreamParser.GS));
                } else {
                    result.insert(0, postcode + String.fromCharCode(DecodedBitStreamParser.GS) + country + String.fromCharCode(DecodedBitStreamParser.GS) + service + String.fromCharCode(DecodedBitStreamParser.GS));
                }
                break;
            case 4:
                result.append(DecodedBitStreamParser.getMessage(bytes, 1, 93));
                break;
            case 5:
                result.append(DecodedBitStreamParser.getMessage(bytes, 1, 77));
                break;
        }
        return new DecoderResult(bytes, result.toString(), null, mode.toString());
    }

    public static getBit(bit: number, bytes: Uint8Array): number {
        bit--;
        return (bytes[Math.floor(bit / 6)] & (1 << (5 - (bit % 6)))) == 0 ? 0 : 1;
    }

    public static getInt(bytes: Uint8Array, x: byte[]): number {
        let val = 0;
        for (let i = 0; i < x.length; i++) {
            val += DecodedBitStreamParser.getBit(x[i], bytes) << (x.length - i - 1);
        }
        return val;
    }

    public static getCountry(bytes: Uint8Array): number {
        const byteArray: byte[] = [53, 54, 43, 44, 45, 46, 47, 48, 37, 38];
        return DecodedBitStreamParser.getInt(bytes, byteArray);
    }

    public static getServiceClass(bytes: Uint8Array): number {
        const byteArray: byte[] = [55, 56, 57, 58, 59, 60, 49, 50, 51, 52];
        return DecodedBitStreamParser.getInt(bytes, byteArray);
    }

    public static getPostCode2Length(bytes: Uint8Array): number {
        const byteArray: byte[] = [39, 40, 41, 42, 31, 32];
        return DecodedBitStreamParser.getInt(bytes, byteArray);
    }

    public static getPostCode2(bytes: Uint8Array): number {
        const byteArray: byte[] = [33, 34, 35, 36, 25, 26, 27, 28, 29, 30, 19,
            20, 21, 22, 23, 24, 13, 14, 15, 16, 17, 18, 7, 8, 9, 10, 11, 12, 1, 2]
        return DecodedBitStreamParser.getInt(bytes, byteArray);
    }

    public static getPostCode3(bytes: Uint8Array): String {
        return DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, <byte[]>([39, 40, 41, 42, 31, 32]))) +
            DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, <byte[]>([27, 28, 29, 30, 19, 20]))) +
            DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, <byte[]>([21, 22, 23, 24, 13, 14]))) +
            DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, <byte[]>([15, 16, 17, 18, 7, 8]))) +
            DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, <byte[]>([9, 10, 11, 12, 1, 2])));
    }

    public static getMessage(bytes: Uint8Array, start: number, len: number) {
        const sb = new StringBuilder();
        let shift = -1;
        let set = 0;
        let lastset = 0;
        for (let i = start; i < start + len; i++) {
            const c: char = DecodedBitStreamParser.SETS[set].charCodeAt(bytes[i]);
            switch (c) {
                case DecodedBitStreamParser.LATCHA:
                    set = 0;
                    shift = -1;
                    break;
                case DecodedBitStreamParser.LATCHB:
                    set = 1;
                    shift = -1;
                    break;
                case DecodedBitStreamParser.SHIFTA:
                case DecodedBitStreamParser.SHIFTB:
                case DecodedBitStreamParser.SHIFTC:
                case DecodedBitStreamParser.SHIFTD:
                case DecodedBitStreamParser.SHIFTE:
                    lastset = set;
                    set = c - DecodedBitStreamParser.SHIFTA;
                    shift = 1;
                    break;
                case DecodedBitStreamParser.TWOSHIFTA:
                    lastset = set;
                    set = 0;
                    shift = 2;
                    break;
                case DecodedBitStreamParser.THREESHIFTA:
                    lastset = set;
                    set = 0;
                    shift = 3;
                    break;
                case DecodedBitStreamParser.NS:
                    const nsval = (bytes[i + 1] << 24) + (bytes[i + 1] << 18) + (bytes[i + 1] << 12) + (bytes[i + 1] << 6) + bytes[i + 1];
                    sb.append(nsval);
                    break;
                case DecodedBitStreamParser.LOCK:
                    shift = -1;
                    break;
                default:
                    sb.append(c);
            }
            if (shift-- == 0) {
                set = lastset;
            }
        }
        while (sb.length() > 0 && sb.charAt(sb.length() - 1).charCodeAt(0) === DecodedBitStreamParser.PAD) {
            sb.deleteCharAt(sb.length() - 1);
        }
        return sb.toString();
    }

}
