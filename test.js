'use strict';

const { expect } = require('chai');
const lib = require('./index.js');

describe('something', () => {
  it('should do something', () => {
    expect(lib).to.be.a('function');
  });
});
