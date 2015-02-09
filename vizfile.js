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
        _that.frontCollection.forEach(function(el){
          var threadData = {threadAddress: el.url, thumbnail: el.thumbnail, title: el.title}
          var threadTemplate = Handlebars.compile($("#threadTemplate").html());
          $("#topRedditThreads").append(threadTemplate(threadData));
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

Handlebars.registerHelper('redditMarkdown', function(markdown){
  debugger;
  return new Handlebars.SafeString(SnuOwnd.getParser().render(markdown));
})
