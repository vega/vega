var vega = require('../');

test('scheme registers a single color scheme', function() {
    var name = 'rgb',
        colors = ['#f00', '#0f0', '#00f'];

    expect(vega.scheme(name)).toBe(undefined);
    vega.scheme(name, colors);
    expect(vega.scheme(name)).toEqual(colors);
});
