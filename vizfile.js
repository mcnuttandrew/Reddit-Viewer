(function(){
  //d3 preamble
  var margin           = {top: 0, right: 0, bottom: 0, left: 0},
      height           = $(".textDiv").width(),
      width            = $(".textDiv").width(),//set to arb later
      duration         = 500;
  this.selectedAddress = [];
  this.addressHash     = {};      

  $(".nodeDiv").empty();
  var svg =  d3.select(".nodeDiv")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);

  //utilities
  //b tree in order traversal?
  var placeCircle = function(circleObject, coords){
    if(circleObject.data){ 
      var children = [];
      if(circleObject.data.replies){
        children = circleObject.data.replies.data.children;
      } else if(circleObject.data.children){
        children = circleObject.data.children;
      }
         
      if(children.length > 0){
        for(var i = 0; i < children.length; i++){
          this.child = children[i];
          var newAddress = coords.dataAddress.concat([i]);
          var newCoords = this.pickCoordinates(coords, children, i, newAddress);
          placeCircle(children[i], newCoords);
          this.drawCircleAndLine(coords, newCoords);
        }
      }
    }
  }
  
  this.drawCircleAndLine = function(coords, newCoords){
    svg.append("line").attr("x1", coords.x).attr("y1", coords.y)
       .attr("x2", newCoords.x). attr("y2", newCoords.y)
       .attr("stroke-width", 2).attr("stroke", "black");
    svg.append("circle").attr("cx", newCoords.x).attr("cy", newCoords.y)
       .attr("dataAddress", newCoords.dataAddress).attr("r", newCoords.r)
       .attr("fill", function(d){ return that.selectColor(this, "white", "blue")})
       .attr("stroke", function(d){ return that.selectColor(this, "black", "blue")})
       .on("click", function(d){that.selectComment(this)});
  }
  
  this.pickCoordinates = function(coords, children, index, newAddress){
    var newR = coords.r / 2;
    if(this.addressHash[newAddress.join(",")]){
      return this.addressHash[newAddress.join(",")];
    } else {
      var tempR = 4 * coords.r *  (Math.random() + .5);
      var newX =  tempR * Math.cos(index / children.length * 2 * Math.PI) + coords.x;
      var newY =  tempR * Math.sin(index / children.length * 2 * Math.PI) + coords.y;
      if(newX > width || newY > height || newX < 0 || newY < 0){
        return newCoords;
        // temp bug fix
        // return this.pickCoordinates(coords, children, index, newAddress);
      } else {
        newCoords = {x: newX, y: newY, r: newR, dataAddress: newAddress}
        this.addressHash[newAddress.join(",")] = newCoords;
        return newCoords;
      }
    }
  }
  
  this.selectColor = function(circle, negativeColor, positiveColor){
      var index = 0;
      var dataAddress = circle.getAttribute("dataAddress").split(",");
      while(index < dataAddress.length){
        if(that.selectedAddress[index] != dataAddress[index]){return negativeColor} 
        index = index + 1;
      }
      return positiveColor; 
  }
  
  this.selectComment = function(commentCircle){
    this.selectedAddress = commentCircle.getAttribute("dataAddress").split(",");
    svg.selectAll("line").remove();
    svg.selectAll("circle").remove();
    // this.getContent(this.selectedAddress, [])
    this.rightPanel();
    placeCircle(this.bodyContent[1], {r: 40, x: width / 2, y: height / 2, dataAddress: [] })    
    svg.append("circle").attr("cy", height / 2).attr("cx", width /2).attr("r", 40)
       .attr("fill", "blue" ).attr("stroke", "black") 
  }
  //big content
  //reddit.com/r/OldSchoolCool/comments/2q6u8z/this_1969_german_swimming_pool.json
  
  //get data & manipulate into the tree structure
  var that = this;
  // this.commentTree = [];
  //production mode:
  //http://www.reddit.com/r/pics/comments/2qk5jm/handmade_pizza.json
  $.ajax({
    url: "http://www.reddit.com/r/pics/comments/2qk5jm/handmade_pizza.json",
    type: "GET",
    dataType: 'json',
    async: false, //change later
    success: function(body){
      that.bodyContent = body;
      that.firstLayer = body[1].data.children;
      // body[1].data.children[0].data.body;
    }
  })
  
  var loadIn = function(layer){
    var layerAssemble = [];
    for(var k = 0; k < layer.length; k++){
      var tempAssemble = [];
      if(layer[k].data && layer[k].kind === 't1'){
        if(layer[k].data.body){
          var content = layer[k].data.body;
          var children;
          if(layer[k].data.replies){
            tempAssemble.push(loadIn(layer[k].data.replies.data.children))
          }
          tempAssemble.push()
        }
      }
      //filter out "nonresults"
      tempTemp = []
      for(var i = 0; i < tempAssemble.length; i++){
        if(typeof tempAssemble === "string" || tempAssemble.length > 0){
          tempTemp.push(tempAssemble);
        }
      }
      layerAssemble.push(tempTemp);
    }
    return layerAssemble;
  }
  
  this.getComment = function(container, partial, address){
    if(!container){return;}
    if((partial + "") === (address + "")){
      console.log(container[0])
      return container[0];
    } else {
      var newAddress = []
      for(var k = 0; k <= partial.length; k++){
        newAddress.push(address[k])
      }
      return getComment(container[newAddress[newAddress.length - 1]], newAddress, address);
    }
  }
  //local development mode: 
  // this.bodyContent = this.fixtureData;
  // this.firstLayer = this.bodyContent[1].data.children;
  this.commentTree = loadIn(this.firstLayer);
  // var test = this.getComment(this.commentTree, [], [0, 1, 0]);
  
  //display data
    //left panel
    placeCircle(this.bodyContent[1], {r: 40, x: width / 2, y: height / 2, dataAddress: [] })   
    svg.append("circle").attr("cy", height / 2).attr("cx", width /2).attr("r", 40)
       .attr("fill", "blue" ).attr("stroke", "black") 
       
    //right panel
  this.rightPanel = function(){
    var commentsList = [];
    for(var k = 0; k < this.selectedAddress.length; k++){
        var commentAddress = [];
        for(var j = 0; j <= k; j++){
          commentAddress.push(that.selectedAddress[j]);
        }
        commentsList.push(this.getComment(this.commentTree, [], commentAddress));
    }
  }
    
})()
