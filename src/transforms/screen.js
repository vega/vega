module.exports = {
  size:   [{signal: 'width'}, {signal: 'height'}],
  mid:    [{expr: 'width/2'}, {expr: 'height/2'}],
  extent: [
    {expr: '[-padding.left, -padding.top]'},
    {expr: '[width+padding.right, height+padding.bottom]'}
  ]
};