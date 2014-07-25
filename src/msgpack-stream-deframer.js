/*
 Copyright (c) 2012 Ajax.org B.V

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

var through = require('through');
var bops    = require('bops');

// A simple state machine that consumes raw bytes and emits frame events.
// Returns a parser function that consumes buffers.  It emits message buffers
// via onMessage callback passed in.
module.exports = function(onFrame) {
    var buffer;
    var state = 0;
    var length = 0;
    var offset;
    return function parse(chunk) {
        for (var i = 0, l = chunk.length; i < l; i++) {
            switch (state) {
                case 0: length |= chunk[i] << 24; state = 1; break;
                case 1: length |= chunk[i] << 16; state = 2; break;
                case 2: length |= chunk[i] << 8; state = 3; break;
                case 3: length |= chunk[i]; state = 4;
                    buffer = bops.create(length);
                    offset = 0;
                    break;
                case 4:
                    var len = l - i;
                    var emit = false;
                    if (len + offset >= length) {
                        emit = true;
                        len = length - offset;
                    }
                    // TODO: optimize for case where a copy isn't needed can a slice can
                    // be used instead?
                    bops.copy(chunk, buffer, offset, i, i + len);
                    offset += len;
                    i += len - 1;
                    if (emit) {
                        state = 0;
                        length = 0;
                        var _buffer = buffer;
                        buffer = undefined;
                        offset = undefined;
                        onFrame(_buffer);
                    }
                    break;
            }
        }
    };
};
