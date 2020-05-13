class Point {
  constructor(id,x,y,z) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

document.addEventListener("DOMContentLoaded", () => { 

  // adiciona evento onclick no botão "Gerar pontos"
  document.querySelector("#gerarPontosBtn").onclick = () => {
    
    // seleciona a linha de input de pontos
    var inputRow = document.querySelector(".point-input-row");
    // resgata os atributos
    pointDict = {}
    for (col of inputRow.children) {
      input = col.firstChild;
      key = input.getAttribute("data-type");
      value = input.value;
      pointDict[key] = value;
    }
    // cria um Ponto (instância da classe Point)
    point = new Point(
      pointDict["id"],
      pointDict["x"],
      pointDict["y"],
      pointDict["z"]
    );


    // seleciona a área de desenho
    drawing = document.querySelector("#drawingArea");
    // TODO
  }
});