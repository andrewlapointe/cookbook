function toggleStylesheet(href, onoff) {
  var existingNode = 0; //get existing stylesheet node if it already exists:
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (
      document.styleSheets[i].href &&
      document.styleSheets[i].href.indexOf(href) > -1
    )
      existingNode = document.styleSheets[i].ownerNode;
  }
  if (onoff == undefined) onoff = !existingNode; //toggle on or off if undefined
  if (onoff) {
    //TURN ON:
    if (existingNode) return onoff; //already exists so cancel now
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;
    document.getElementsByTagName("head")[0].appendChild(link);
  } else {
    //TURN OFF:
    if (existingNode) existingNode.parentNode.removeChild(existingNode);
  }
  return onoff;
}
toggleStylesheet("./css/site-plan.css", 1); //add myStyle.css
