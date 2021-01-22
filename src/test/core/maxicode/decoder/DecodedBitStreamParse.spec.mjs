import { MaxicodeDecodedBitStreamParser } from '@zxing/library';

describe('TestParser', () => {

    it('basicTest', () => {
        const decodedString = MaxicodeDecodedBitStreamParser.decode([2]).getText();
    });

});
