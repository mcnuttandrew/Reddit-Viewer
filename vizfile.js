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
      var marking = "c";
      if(circleObject.data.replies){
        marking = "r";
        children = circleObject.data.replies.data.children;
      } else if(circleObject.data.children){
        children = circleObject.data.children;
      }
         
      if(children.length > 0){
        for(var i = 0; i < children.length; i++){
          this.child = children[i];
          var newAddress = coords.dataAddress.concat([marking, i]);
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
  
  this.retrieveComment = function(container, partial, address){
    if((partial + "") === (address + "")){
      // debugger;
      // return container.data.children[partial.reverse()[0]]    
      if(partial[partial.length - 2] === "c"){
        var test = container.data.children[partial.reverse()[0]]
        return test;
      } else if(partial[partial.length - 2] === "r") {
        // debugger;
        return container.data.replies.data.children[partial.reverse()[0]]
      }
    } else {
      // debugger;
      var nextAddress = [];
      for(var k = 0;  k < (partial.length + 2); k++){
        nextAddress.push(address[k])
      }
      var nextContainer;
      if(partial[partial.length - 2] === "c"){
        nextContainer = container.data.children[partial[partial.length - 1]]
      } else {
        nextContainer = container.data.replies.data.children[partial[partial.length - 1]]
      }
      this.retrieveComment(nextContainer, nextAddress, address)
    }
  }

  this.selectComment = function(commentCircle){
    this.selectedAddress = commentCircle.getAttribute("dataAddress").split(",");
    svg.selectAll("line").remove();
    svg.selectAll("circle").remove();
    this.getContent(this.selectedAddress, [])
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
  // $.ajax({
  //   url: "http://www.reddit.com/r/OldSchoolCool/comments/2q6u8z/this_1969_german_swimming_pool.json",
  //   type: "GET",
  //   dataType: 'json',
  //   async: false, //change later
  //   success: function(body){
  //     that.bodyContent = body;
  //     that.firstLayer = body[1].data.children;
  //     // body[1].data.children[0].data.body;
  //   }
  // })
  
  //local development mode: 
  this.bodyContent = this.fixtureData;
  this.firstLayer = this.bodyContent[1].data.children;
  
  //display data
    //left panel
    placeCircle(this.bodyContent[1], {r: 40, x: width / 2, y: height / 2, dataAddress: [] })   
    svg.append("circle").attr("cy", height / 2).attr("cx", width /2).attr("r", 40)
       .attr("fill", "blue" ).attr("stroke", "black") 
       
    //right panel
    this.getContent = function(fullAddress, currentAddress){
      if(currentAddress.length === 0){
        $(".textDiv").empty();
        this.selectedComments = [];
      }
      if((fullAddress + "") === (currentAddress + "")){
        // var tr = d3.select("tbody").selectAll("tr").data(this.selectedComments)
        //            .enter().append("tr");
        var td = d3.select(".textDiv").selectAll("div")
                   .data(that.selectedComments)
                   .enter().append("div")
                   .text(function(d) {
                    //  debugger;
                      var partialAddress = [d.dataAddress[0], d.dataAddress[1]];
                      var selectedCom = that.retrieveComment(that.bodyContent[1], partialAddress, d.dataAddress);
                      
                      if(selectedCom){console.log(selectedCom.data.body); return selectedCom.data.body;}
                    })          
      } else {
        var nextAddress = [];
        for(var k = 0;  k < (currentAddress.length + 2); k++){
          nextAddress.push(fullAddress[k])
        }
        
        this.selectedComments.push(this.addressHash[nextAddress.join(",")])
        this.getContent(fullAddress, nextAddress);
      }
      //if this is the terminating node then display all of the children      
    }
    this.selectedComments = [];
    this.getContent(this.selectedAddress, [])
})()
