---
layout: example
title: Reorderable Matrix Example
permalink: /examples/reorderable-matrix/index.html
spec: reorderable-matrix
---

Matrix diagrams visualize a network by treating nodes as rows and columns of a table; cells are colored in if an edge exists between two nodes. This example depicts character co-occurrences in Victor Hugo’s [Les Misérables](http://en.wikipedia.org/wiki/Les_Mis%C3%A9rables). The underlying data is an [undirected graph](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)#Undirected_graph), and so the matrix is symmetric around the diagonal. The matrix is also _reorderable_: grab a node label to rearrange rows and columns!

{% include example spec=page.spec %}
