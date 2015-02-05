$("#newAddressSubmit").on('click', function(event){
  var prefix = new RegExp("http://www.reddit.com/r/");
  var targ = $("#addressInput")[0].value.split("");
  targ[targ.length - 1] = ".json";
  targ = targ.join("");
  if(prefix.test(targ) && targ.split("")[0] === "h"){
    chart(targ);
    $(".commentsDiv").height( $(window).height() - $(".header").height())
    $('#selectReddit').modal('hide');
  }
})

$("#selectReddit").on('shown.bs.modal', function(event){
    $.ajax({
      url: "http://www.reddit.com/.json",
      type: "GET",
      dataType: "json",
      async: 'true',
      success: function(data){
        var _that = this;
        _that.frontCollection = [];
        var threads = data.data.children.map(function(el){
          var thumbnail = el.data.thumbnail;
          var title = el.data.title;
          var url = el.data.permalink;
          threadData = {"thumbnail": thumbnail, "title": title, "url": url}
          _that.frontCollection.push(threadData);
        })
        //templating here
        _that.frontCollection.map(function(el){
          commentString = "<li><a>"
          commentString += "<div class='threadHeader row' id='" + el.url +"'><div class='col-xs-3'>";
          commentString += "<img src=" + el.thumbnail + "></div>";
          commentString += "<div class='col-xs-8'><h4>" + el.title + "</h4></div></div></a></li>";
          $("#topRedditThreads").append(commentString);
        })
        
        $(".threadHeader").on("click", function(event){
          var targ = event.currentTarget.getAttribute("id");
          targ = targ.split("")
          targ[targ.length - 1] = ".json"
          targ = "http://www.reddit.com" + targ.join("")
          window.chart(targ);
          $(".commentsDiv").height( $(".textDiv").width())
          $('#selectReddit').modal('hide');
        })
      }
    })
})

$(".picDiv").on("click", function(event){
  event.preventDefault();
  $("#showpic").modal('show');
  var targetImage = "url(" + event.target.parentElement.getAttribute("href") + ")"
  // var size = 
  $("#showpic > .fade").css("background-image", targetImage).css("opacity", 1);
      // css("background-size", );
})
