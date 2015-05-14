describe('Zip', function() {

  describe('Key Join', function() {
    var medalsVals = [
      {"country":"US", "gold":12, "silver":13, "bronze":15},
      {"country":"Canada", "gold": 5, "silver": 4, "bronze": 3}
    ], statsVals = [
      {"country": "US", "gdp": 15680, "pop": 360, "athletes": 241},
      {"country": "Canada", "gdp": 1821, "pop": 34, "athletes": 90}
    ];

    var spec = {
      "data": [{ 
        "name": "stats", 
        "values": statsVals
      }, {
        "name": "medals",
        "values": medalsVals,
        "transform": [
          {
            "type": "zip", 
            "with": "stats", 
            "key": "country", 
            "withKey": "country", 
            "as": "country_stats"
          }
        ]
      }] 
    };

    function expectUSA(medals) {
      expect(medals).to.have.deep.property('[0].country_stats.gdp', 15680);
      expect(medals).to.have.deep.property('[0].country_stats.pop', 360);
      expect(medals).to.have.deep.property('[0].country_stats.athletes', 241);
    }

    function expectCanada(medals) {
      expect(medals).to.have.deep.property('[1].country_stats.gdp', 1821);
      expect(medals).to.have.deep.property('[1].country_stats.pop', 34);
      expect(medals).to.have.deep.property('[1].country_stats.athletes', 90);
    }

    it('should handle initial datasources', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);      

        done();
      }, modelFactory);
    });

    it('should handle streaming adds w/o default', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);

        medalsDS.insert({"country":"Mexico", "gold": 3, "silver": 3, "bronze": 2}).fire();
        stats  = statsDS.values();
        medals = medalsDS.values();
        expect(stats).to.have.length(2);
        expect(medals).to.have.length(3);
        expectUSA(medals);
        expectCanada(medals);

        expect(medals[2].country_stats).to.be.undefined;

        statsDS.insert({"country": "Mexico", "gdp": 1177, "pop": 120, "athletes": 78}).fire();
        stats  = statsDS.values();
        medals = medalsDS.values();
        expect(stats).to.have.length(3);
        expect(medals).to.have.length(3);
        expectUSA(medals);
        expectCanada(medals);  

        expect(medals[2].country_stats).to.not.be.undefined;
        expect(medals).to.have.deep.property('[2].country_stats.gdp', 1177);
        expect(medals).to.have.deep.property('[2].country_stats.pop', 120);
        expect(medals).to.have.deep.property('[2].country_stats.athletes', 78);

        done();
      }, modelFactory);
    });

    it('should handle streaming adds w/default', function(done) {
      var s = util.duplicate(spec);
      s.data[1].transform[0].default = {"foo": "bar"};

      parseSpec(s, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);

        medalsDS.insert({"country":"Mexico", "gold": 3, "silver": 3, "bronze": 2}).fire();
        stats  = statsDS.values();
        medals = medalsDS.values();
        expect(stats).to.have.length(2);
        expect(medals).to.have.length(3);
        expectUSA(medals);
        expectCanada(medals);

        expect(medals[2].country_stats).to.not.be.undefined;
        expect(medals).to.have.deep.property('[2].country_stats.foo', 'bar');

        statsDS.insert({"country": "Mexico", "gdp": 1177, "pop": 120, "athletes": 78}).fire();
        stats  = statsDS.values();
        medals = medalsDS.values();
        expect(stats).to.have.length(3);
        expect(medals).to.have.length(3);
        expectUSA(medals);
        expectCanada(medals);  

        expect(medals[2].country_stats).to.not.be.undefined;
        expect(medals).to.have.deep.property('[2].country_stats.gdp', 1177);
        expect(medals).to.have.deep.property('[2].country_stats.pop', 120);
        expect(medals).to.have.deep.property('[2].country_stats.athletes', 78);

        done();
      }, modelFactory);
    });

    it('should handle streaming rems w/o default', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);

        statsDS.remove(function(x) { return x.country == "Canada" }).fire();
        stats  = statsDS.values(); 
        medals = medalsDS.values();
        expect(stats).to.have.length(1);
        expect(medals).to.have.length(2);
        expectUSA(medals);

        expect(medals[1].country_stats).to.be.undefined;

        done();
      }, modelFactory);
    });

    it('should handle streaming rems w/default', function(done) {
      var s = util.duplicate(spec);
      s.data[1].transform[0].default = {"foo": "bar"};

      parseSpec(s, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);

        statsDS.remove(function(x) { return x.country == "Canada" }).fire();
        stats  = statsDS.values(); 
        medals = medalsDS.values();
        expect(stats).to.have.length(1);
        expect(medals).to.have.length(2);
        expectUSA(medals);

        expect(medals[1].country_stats).to.not.be.undefined;
        expect(medals).to.have.deep.property('[1].country_stats.foo', 'bar');

        done();
      }, modelFactory);
    });

    it('should propagate streaming mods', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            statsDS  = model.data('stats'),
            medals = medalsDS.values(), 
            stats  = statsDS.values(), 
            i, len, d;

        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expectCanada(medals);

        // Inner mod
        statsDS.update(function(x) { return x.country == "Canada" },
          'athletes', function(x) { return 100; }).fire();
        stats  = statsDS.values(); 
        medals = medalsDS.values();
        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);

        expect(medals).to.have.deep.property('[1].country_stats.gdp', 1821);
        expect(medals).to.have.deep.property('[1].country_stats.pop', 34);
        expect(medals).to.have.deep.property('[1].country_stats.athletes', 100);

        // Key mod on joined datasource
        statsDS.update(function(x) { return x.country == "Canada" },
          'country', function(x) { return 'Mexico'; }).fire();
        stats  = statsDS.values(); 
        medals = medalsDS.values();
        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expect(medals[1].country_stats).to.be.undefined;

        // Key mod on primary datasource
        medalsDS.update(function(x) { return x.country == "Canada" },
          'country', function(x) { return 'Mexico'; }).fire();
        stats  = statsDS.values(); 
        medals = medalsDS.values();
        expect(stats).to.have.length(2);
        expect(medals).to.have.length(2);
        expectUSA(medals);
        expect(medals[1].country_stats).to.not.be.undefined;

        done();
      }, modelFactory);
    });

  });

  describe('Index Join', function() {
    var medalsVals = [
      {"country":"US", "gold":12, "silver":13, "bronze":15},
      {"country":"Canada", "gold": 5, "silver": 4, "bronze": 3}
    ], zipVals = [{"zip2": "A"}, {"zip2": "B"}, {"zip2": "C"}];

    var spec = {
      "data": [{ 
        "name": "zip", 
        "values": zipVals
      }, {
        "name": "medals",
        "values": medalsVals,
        "transform": [
          {
            "type": "zip", 
            "with": "zip", 
            "as": "zip"
          }
        ]
      }] 
    };

    it('should handle initial datasources', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            zipDS  = model.data('zip'),
            medals = medalsDS.values(),
            zip = zipDS.values(), 
            i, len, d;

        model.fire();
        zip  = zipDS.values(); 
        medals = medalsDS.values();
        expect(zip).to.have.length(3);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');

        done();
      }, modelFactory);
    });

    it('should handle streaming adds', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            zipDS  = model.data('zip'),
            medals = medalsDS.values(),
            zip = zipDS.values(), 
            i, len, d;

        expect(zip).to.have.length(3);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');

        medalsDS.insert({"country":"Mexico", "gold": 3, "silver": 3, "bronze": 2}).fire();
        zip  = zipDS.values();
        medals = medalsDS.values();
        expect(zip).to.have.length(3);
        expect(medals).to.have.length(3);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');
        expect(medals).to.have.deep.property('[2].zip.zip2', 'C');

        zipDS.insert({"zip2": "D"}).fire();
        zip  = zipDS.values();
        medals = medalsDS.values();
        expect(zip).to.have.length(4);
        expect(medals).to.have.length(3);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');
        expect(medals).to.have.deep.property('[2].zip.zip2', 'C');

        done();
      }, modelFactory);
    });

    it('should handle streaming rems', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            zipDS  = model.data('zip'),
            medals = medalsDS.values(),
            zip = zipDS.values(), 
            i, len, d;

        expect(zip).to.have.length(3);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');

        zipDS.remove(function(x) { return x.zip2 == "B" }).fire();
        zip  = zipDS.values(); 
        medals = medalsDS.values();
        expect(zip).to.have.length(2);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'C');

        done();
      }, modelFactory);
    });

    it('should propagate streaming mods', function(done) {
      parseSpec(spec, function(model) {
        var medalsDS = model.data('medals'),
            zipDS  = model.data('zip'),
            medals = medalsDS.values(),
            zip = zipDS.values(), 
            i, len, d;

        expect(zip).to.have.length(3);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'B');

        zipDS.update(function(x) { return x.zip2 == "B" },
          'zip2', function(x) { return "F"; }).fire();
        zip  = zipDS.values(); 
        medals = medalsDS.values();
        expect(zip).to.have.length(3);
        expect(medals).to.have.length(2);
        expect(medals).to.have.deep.property('[0].zip.zip2', 'A');
        expect(medals).to.have.deep.property('[1].zip.zip2', 'F');

        done();
      }, modelFactory);
    });

  });

});