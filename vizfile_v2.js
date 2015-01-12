(function(){
  //d3 preamble
  var margin           = {top: 0, right: 0, bottom: 0, left: 0},
      height           = $(".textDiv").width(),
      width            = $(".textDiv").width(),//set to arb later
      duration         = 500;

  $(".nodeDiv").empty();
  var svg =  d3.select(".nodeDiv")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);

  //get and assemble data
  var that = this;
  this.rootNode;
  this.loadIn = function(elements){
    var layerNodes = [];
    for(var i = 0; i < elements.length; i++){
      
      if(elements[i].kind !== "more"){
        layerNodes.push(that.makeNode(elements[i]));
      } else {
        // $.ajax({
        //   url: "http://www.reddit.com/api/morechildren",
        //   data: {
        //     link_id: "t3_2qk5jm",
        //     children: "cn6xf5b"
        //   },
        //   type: "GET",
        //   dataType: 'json',
        //   async: true,
        //   success: function(data){
        //     debugger;
        //   }
        // })
      }
    }  
    return layerNodes;
  }
  this.maxScore = 0;
  this.makeNode = function(element){
    var text = element.data.body;
    var score = element.data.score
    var children;
    if(element.data.replies){
      children = this.loadIn(element.data.replies.data.children);    
    }
    if(score > that.maxScore){that.maxScore = score}
    return {"text": text, "children": children, "score": score};
  }
  
  this.loadPageElements = function(body){
    $(".picDiv").append("<a href=" + body[0].data.children[0].data.url + 
                        "><img src=" + body[0].data.children[0].data.thumbnail +
                         "></a>");
    $(".titleArea").empty();
    // debugger;
    $(".titleArea").append("<h1>/" + body[0].data.children[0].data.subreddit + "/</h1>")
  }
  
  this.getScoreRadius = function(node, scaler){
    // debugger;
    var rad = 10 * scaler * Math.log(1.05 + node.score/that.maxScore);
    return (rad <= 1 ?  1 : rad);
  }
  
  $.ajax({
    url: "http://www.reddit.com/r/pics/comments/2s2pob/reeses_pieces_snake_cake_that_took_my_uncle_six.json",
    // url: "http://www.reddit.com/r/pics/comments/2qk5jm/handmade_pizza.json",
    type: "GET",
    dataType: 'json',
    async: false,
    success: function(body){
      that.loadPageElements(body);
      that.rootNode = {"text": "root", "children": that.loadIn(body[1].data.children)};
    }
  })
  
  this.massingTreeTraversal = function(node){
    if(!node.children || node.children.length < 1){
      node["mass"] = 1;
      return 1;
    }
    var total = 0;
    for(var i = 0; i < node.children.length; i++){
      total += that.massingTreeTraversal(node.children[i]);
    }
    return node["mass"] = total;
  }
  
  //map the data, via a simple b tree traversal
  that.d3DataMap = [];
  this.treeTraversal = function(parentLocation, parent, parentRadius){
    if(!parent.children){return;}
    //responsive angles
    var childrenSum = 0;
    var childrenCounts = [];
    for(var i = 0; i < parent.children.length; i++){      
      childrenCounts.push(parent.children[i].mass);
      childrenSum += parent.children[i].mass;
    }
    var sumAngle = 0;
    for(var i = 0; i < parent.children.length; i++){
      var sizeR = that.getScoreRadius(parent.children[i], 5);
      var newR = parent.children[i].mass + parentRadius + sizeR;
      var theta = 2 * Math.PI * childrenCounts[i] / childrenSum + sumAngle;
      sumAngle += theta;

      var newX = parentLocation["x"] + (newR + sizeR) * Math.cos(theta);
      var newY = parentLocation["y"] + (newR + sizeR) * Math.sin(theta);
      // adjust for visual clarity
      while((newX + sizeR) >= width || (newX - sizeR) <= 0 || (newY + sizeR) >= height || (newY - sizeR) <= 0){
        theta += .4;
        newX = parentLocation["x"] + newR * Math.cos(theta);
        newY = parentLocation["y"] + newR * Math.sin(theta);
      }
      var kidLocation = {"x": newX, "y": newY};
      that.d3DataMap.push({"parentLocation": parentLocation, 
            "location": kidLocation, "parent": parent,
            "data": parent.children[i]});
      that.treeTraversal(kidLocation, parent.children[i], parent.mass);
    }
  }
  
  that.commentRoute = [];
  this.treeDFScaller = function(target){
    that.commentRoute = [];
    this.treeDFS(this.rootNode, target);
  }
  
  this.treeDFS = function(vertex, target){
    if(vertex === target){
      that.commentRoute.push(vertex); 
      return vertex;
    }
    if(!vertex.children){return false;}
    for(var i = 0; i < vertex.children.length; i ++){
      var found = that.treeDFS(vertex.children[i], target);
      if(found){
        that.commentRoute.push(vertex)
        return found;
      }
    }
  }
  this.massingTreeTraversal(this.rootNode);
  this.treeTraversal({"x": width/2, "y": height/2}, this.rootNode, width/10);
  
  this.renderComments = function(){
    var textDiv = $(".textDiv");
    textDiv.empty();
    var comlen = that.commentRoute.length;
    for(var i = comlen - 2; i >= 0; i--){
      that.renderComment(that.commentRoute[i], 0)
    }
    if(that.commentRoute[0].children){
      for(var i = 0; i < that.commentRoute[0].children.length; i++){
        that.renderComment(that.commentRoute[0].children[i], 1);
      }
    }
  }
  
  this.renderComment = function(comment, bump){
    var left = 'col-xs-' + bump + 1;
    var right = 'col-xs-' + (11-bump);
    $(".textDiv").append("<div class='comment row'>" + 
        "<div class=" + left + "></div>" + 
        "<div class=" + right + ">" + comment.text +"</div></div>");
  }
  
  this.transitionProperty = function(data, property, positive, negative){
    data.transition().attr(property, function(d){
      for(var i = 0; i < that.commentRoute.length; i++){
        if(that.commentRoute[i] == d.data){return positive;}
      }
      return negative;
    })
  }
  
  this.transitionPropertyWithChildren = function(data, property, positive, negative, child){
    if(!that.commentRoute[0].children){return;}
    data.transition().attr(property, function(d){
      for(var i = 0; i < that.commentRoute[0].children.length; i++){
        if(that.commentRoute[0].children[i] == d.data){return child;}
      }
      for(var i = 0; i < that.commentRoute.length; i++){
        if(that.commentRoute[i] == d.data){return positive;}
      }
      return negative;
    })
  }
    
  //draw shit & data bind
  this.lines = svg.selectAll("line").data(that.d3DataMap).enter().append("line")
      .attr("x1", function(d){return d.location.x;})
      .attr("y1", function(d){return d.location.y;})
      .attr("x2", function(d){return d.parentLocation.x;})
      .attr("y2", function(d){return d.parentLocation.y;})
      .attr("stroke-width", 1).attr("stroke", "black");
  this.circleNodes = svg.selectAll("circle").data(that.d3DataMap).enter().append("circle")
      .attr("cx", function(d){return d.location.x;})
      .attr("cy", function(d){return d.location.y;})
      .attr("r",  function(d){return that.getScoreRadius(d.data, 5)})
      .attr('fill', "#FFFFFF").attr('stroke', "#000000")
      .on("click", function(d){
        console.log(d.data.mass)
        that.treeDFScaller(d.data);
        that.renderComments();
        that.transitionProperty(that.circleNodes, 'fill', 'blue', 'white');
        that.transitionPropertyWithChildren(that.circleNodes,'fill', 'blue', 'white', 'green');
        that.transitionPropertyWithChildren(that.lines, 'stroke-width', 2, 1, 1.5)
      } );
  this.rootCircleNode = svg.append("circle").attr("cx", width/2).attr("cy", height/2)
      .attr("r", 40).attr('fill', "blue").attr('stroke', "#000000")
      .on("click", function(d){
        that.treeDFScaller(that.rootNode);
        that.renderComments();
        that.transitionPropertyWithChildren(that.circleNodes,'fill', 'blue', 'white', 'green');
      } );
  
  
  //click root node on default
  that.treeDFScaller(that.rootNode);
  that.renderComments();
  that.transitionPropertyWithChildren(that.circleNodes,'fill', 'blue', 'white', 'green');
})()
