var tape = require('tape'),
    {markup} = require('../');

tape('markup should generate empty tag', t => {
  t.equal(
    markup().open('g').close() + '',
    '<g/>'
  );
  t.end();
});

tape('markup should generate tag with text content', t => {
  t.equal(
    markup().open('text').text('hello').close() + '',
    '<text>hello</text>'
  );
  t.end();
});

tape('markup should generate tag with sanitized text content', t => {
  t.equal(
    markup().open('text').text('1 < 5 & 4 > 3').close() + '',
    '<text>1 &lt; 5 &amp; 4 &gt; 3</text>'
  );
  t.end();
});

tape('markup should generate nested tags', t => {
  t.equal(
    markup().open('g').open('rect').close().close() + '',
    '<g><rect/></g>'
  );
  t.end();
});

tape('markup should generate tag with attributes', t => {
  const attr = {
    fill: 'none',
    transform: 'translate(0,0)',
    ignore: null
  };
  t.equal(
    markup().open('g', attr).close() + '',
    '<g fill="none" transform="translate(0,0)"/>'
  );
  t.end();
});

tape('markup should append attributes', t => {
  t.equal(
    markup().open('g')
      .attr('fill', 'none')
      .attr('transform', 'translate(0,0)')
      .attr('ignore', null)
      .close() + '',
    '<g fill="none" transform="translate(0,0)"/>'
  );
  t.end();
});

tape('markup should generate sanitized attributes', t => {
  const attr = {
    'aria-description': 'A \'single\' "double" & < or > \t\n\r'
  };
  t.equal(
    markup().open('g', attr).close() + '',
    '<g aria-description="A \'single\' &quot;double&quot; &amp; &lt; or &gt; &#x9;&#xA;&#xD;"/>'
  );
  t.end();
});
