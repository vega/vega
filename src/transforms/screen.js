module.exports = {
  size:  [{signal: 'width'}, {signal: 'height'}],
  mid:   [{expr: 'width/2'}, {expr: 'height/2'}],
  extent: [[0,0], {expr: '[width,height]'}]
};