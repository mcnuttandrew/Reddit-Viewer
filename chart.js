this.chart = (function(address){
  //d3 preamble
  var margin           = {top: 0, right: 0, bottom: 0, left: 0},
      height           = $(".textDiv").width(),
      width            = $(".textDiv").width(),//set to arb later
      duration         = 500;
  $(".picDiv").empty();
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
  this.counter = 0;
  this.rootNode;
  this.loadIn = function(elements){
    var layerNodes = [];
    for(var i = 0; i < elements.length; i++){
      if(elements[i].kind !== "more"){
        layerNodes.push(that.makeNode(elements[i]));
        that.counter += 1;
      } else {
        var subchildren = elements[i].data.children
        // $.ajax({
        //   url: "http://www.reddit.com/api/morechildren.json",
        //   type: "GET",
        //   dataType: 'json',
        //   data: { link_id: that.threadId, children: subchildren.join(",") },          
        //   async: true,
        //   success: function(data){
        //     var childrenData = data.jquery[data.jquery.length - 1][3]
        //     if(childrenData.length > 0){
        //       childrenData = childrenData[0];
        //       for(var k = 0; k < childrenData.length; k++){
        //         layerNodes.push(that.makeNode(childrenData[k]));
        //         that.counter += 1;
        //       }
        //     }
        //   }
        // })          
      }
    }  
    return layerNodes;
  }
  this.comment_id = 0; 
  this.maxScore = 0;
  this.makeNode = function(element){
    var text = element.data.body;
    var score = element.data.score;
    var author = element.data.author;
    var children;
    if(element.data.replies){
      children = this.loadIn(element.data.replies.data.children);    
    }
    if(score > that.maxScore){that.maxScore = score}
    that.comment_id += 1
    return {"text": text, "children": children, "score": score, "author": author, "id": comment_id};
  }
  
  this.loadPageElements = function(body){
    $(".picDiv").empty();
    var postInfo = body[0].data.children[0].data;
    $(".picDiv").append(
      "<div class='row'><div class='col-xs-3'>" 
      +  "<a href=" + postInfo.url + "><img src=" + postInfo.thumbnail + "></a>"
      + "</div><div class='col-xs-8'>" 
      + "<h4><a href='" + postInfo.url + "'>" 
      + postInfo.title + '</a></h4>'
      + "<h5>" + postInfo.author + " on " + new Date(postInfo.created_utc) +"</h5>"
      + "</div></div>")
    $(".titleArea").empty();     
    $(".titleArea").append("<h1>/" + postInfo.subreddit + "/</h1>")
  }
  
  this.getScoreRadius = function(node, scaler){
    var rad = 10 * scaler * Math.log(1.05 + node.score/that.maxScore);
    if(rad){
      return (rad <= 1 ?  1 : rad);
    } else{
      return 5;
    }
  }
  
  $.ajax({
    url: address,
    type: "GET",
    dataType: 'json',
    async: false,
    success: function(body){
      that.totalComments = body[0].data.children[0].data.num_comments;
      that.threadId = body[0].data.children[0].data.name;
      that.loadPageElements(body);
      that.rootNode = {"text": "root", "children": that.loadIn(body[1].data.children)};
    }
  })
  
  this.massingTreeTraversal = function(node){
    if(!node.children || node.children.length < 1){
      node["mass"] = 2;
      return 2;
    }
    var total = 0;
    for(var i = 0; i < node.children.length; i++){
      total += that.massingTreeTraversal(node.children[i]);
    }
    return node["mass"] = total;
  }
  
  //map the data, via a simple b tree traversal
  that.d3DataMap = [];
  this.treeTraversal = function(parentLocation, parent, parentRadius, parentAngle){
    if(!parent || !parent.children){return;}
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
      var newR = parent.children[i].mass/4 + parentRadius + sizeR/3;
      var theta = 2 * Math.PI * (childrenCounts[i] / childrenSum  + sumAngle);
      sumAngle += childrenCounts[i] / childrenSum;

      var newX = parentLocation["x"] + (newR + sizeR) * Math.cos(theta + parentAngle);
      var newY = parentLocation["y"] + (newR + sizeR) * Math.sin(theta + parentAngle);
      // adjust for visual clarity
      while((newX + sizeR) >= width || (newX - sizeR) <= 0 || (newY + sizeR) >= height || (newY - sizeR) <= 0){
        newR = newR * .8;
        newX = parentLocation["x"] + newR * Math.cos(theta);
        newY = parentLocation["y"] + newR * Math.sin(theta);
      }
      // wiggler
      // for(var i = 0; i < that.d3DataMap.length; i++){
      //   if(!that.d3DataMap[i].data){break;}
      //   var olSize = that.getScoreRadius(that.d3DataMap[i].data, 5);
      //   while(newX < (that.d3DataMap[i].location.x + olSize)  && newX > (that.d3DataMap[i].location.x - olSize) && newY < (that.d3DataMap[i].location.y + olSize)  && newY > (that.d3DataMap[i].location.y - olSize)){
      //     theta += .4;
      //     newX = parentLocation["x"] + newR * Math.cos(theta);
      //     newY = parentLocation["y"] + newR * Math.sin(theta);
      //   }
      // }
      var kidLocation = {"x": newX, "y": newY};
      that.d3DataMap.push({"parentLocation": parentLocation, 
            "location": kidLocation, "parent": parent,
            "data": parent.children[i]});
      var omega = 0;
      if(parent.children[i].children && (parent.children[i].children.length % 2 === 0) ){
        omega += 2 * Math.PI /16/// parent.children[i].children.length; 
      }
      that.treeTraversal(kidLocation, parent.children[i], parent.mass, omega + theta + parentAngle);
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
  this.treeTraversal({"x": width/2, "y": height/2}, this.rootNode, width/10, 0);
  
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
  
  //god i wish i had a templating engine
  this.renderComment = function(comment, bump){
    //comment has full amount od data required for bind, can we do less?
    var commentString = "<div class='comment row' id=" + comment.id + ">"
    if(bump === 0){
      commentString += "<div class='col-xs-12 commentHold'>"
    } else {
      commentString += "<div class='col-xs-1 commentPush'></div>" 
      commentString += "<div class='col-xs-11 commentHold'>"
      // var commentRow = $($($(".textDiv").last()[0]).children()[0]).children();  
      // $(commentRow[0]).height($(commentRow[1]).height());
    }
    
    commentString += "<p class='commentBlock'>" + comment.text + "</p>"
    commentString += "<h5>" + comment.author + "</h5></div></div>"
    $(".textDiv").append(commentString);
    //binding to graphic
    $("div#" + comment.id).on('click', function(event){
        var id = event.currentTarget.getAttribute('id');
        var targetNode = that.d3DataMap[id - 1];
        that.clickNode(targetNode);
    })
    
    $("div#" + comment.id).on('mouseover', function(event){
        var id = event.currentTarget.getAttribute('id');
        var targetNode = that.d3DataMap[id - 1];
        that.hoverNode(targetNode);
    })
  }
  
  this.selectedCommentIncluded = function(comment){
    for(var i = 0; i < that.commentRoute.length; i++){
      if(that.commentRoute[i] === comment){return true;}
    }
    return false;
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
  
  this.clickNode = function(node){
    that.treeDFScaller(node.data);
    that.renderComments();
    that.transitionProperty(that.circleNodes, 'fill', '#CEE3F8', 'white');
    that.transitionPropertyWithChildren(that.circleNodes,'fill', '#CEE3F8', 'white', 'orangered');
    that.transitionPropertyWithChildren(that.lines, 'stroke-width', 2, 1, 1.5);
  }
  
  this.hoverNode = function(node){
    that.circleNodes.transition().attr('stroke', function(d){
      return ( (node.data.id == d.data.id) ? 'blue' : 'black');
    }).attr('stroke-width', function(d){
      return ( (node.data.id == d.data.id) ? '5' : '1');
    })
  }
  
  this.postStatistics = function(){
    $(".statArea h1").empty();
    $(".statArea h1").append("displaying ("+this.counter +"/"+ this.totalComments + ")")
  }
    
  //draw shit & data bind
  that.d3DataMap =  that.d3DataMap.sort(function(a, b){
    return (a.data.id - b.data.id);
  }) 
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
      .on("click", function(d){that.clickNode(d)} )
      .on("mouseover", function(d){that.hoverNode(d)});
  this.rootCircleNode = svg.append("circle").attr("cx", width/2).attr("cy", height/2)
      .attr("r", 40).attr('fill', "blue").attr('stroke', "#000000")
      .on("click", function(d){
        that.treeDFScaller(that.rootNode);
        that.renderComments();
        that.transitionPropertyWithChildren(that.circleNodes,'fill', 'blue', 'white', 'orangered');
      } );
      //two stage mission, click on comment to render that comment and children
      //linked hovering. 
      
      //heres the comment binding plan
      //set up a jquery listener listens for click on rendered comments
      //on click we hit a transition property on that and 
      

  //click root node on default
  that.treeDFScaller(that.rootNode);
  that.renderComments();
  that.transitionPropertyWithChildren(that.circleNodes,'fill', 'blue', 'white', 'orangered');
  that.postStatistics();
})
