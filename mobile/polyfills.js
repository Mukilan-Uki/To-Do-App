// Polyfills — loaded synchronously before any other module
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
    }
  };
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      const buf = [];
      for (let i = 0; i < str.length; i++) buf.push(str.charCodeAt(i) & 0xff);
      return new Uint8Array(buf);
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buf) {
      return String.fromCharCode(...new Uint8Array(buf));
    }
  };
}
