function addIngredient() {
  var container = document.getElementById("ingredient_parent");
  var input = document.createElement("input");
  input.type = "text";
  input.name = "member";
  container.appendChild(input);
  // Append a line break
  container.appendChild(document.createElement("br"));
}
