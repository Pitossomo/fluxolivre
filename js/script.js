const DRAW_AREA_OFFSET = 5;
const DRAW_AREA_MINIMAL_DIMENSION = 100;

class Point {
  constructor(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Line {
  constructor(p1, prof1, p2, prof2) {
    this.p1 = p1;
    this.p2 = p2;
    this.prof1 = prof1;
    this.prof2 = prof2;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  // cria a variável para armazenar os pontos
  points = {};
  lines = {};
  drawProperties = {
    "xMax": DRAW_AREA_MINIMAL_DIMENSION/2,
    "xMin": DRAW_AREA_MINIMAL_DIMENSION/2,
    "yMax": DRAW_AREA_MINIMAL_DIMENSION/2,
    "yMin": DRAW_AREA_MINIMAL_DIMENSION/2,
    "zMax": DRAW_AREA_MINIMAL_DIMENSION/2,
    "zMin": DRAW_AREA_MINIMAL_DIMENSION/2,
    "XYscale": DRAW_AREA_MINIMAL_DIMENSION/2,
    "Zscale": 10
  }

  // adiciona evento onclick no botão "Gerar trechos"
  document.querySelector("#gerarTrechosBtn").onclick = () => {
    
    // seleciona a linha de input de linhas
    inputRow = document.querySelector(".line-input-row")
    // resgata os atributos
    lineDict = dataFromInputRow(inputRow);
    // solicita confirmação para sobrescrever, em caso de linhas com mesmo id
    overwrite = false;
    if (lines[lineDict["id"]]) {
      overwrite = confirm("Já existe um trecho com o nome indicado. Deseje sobrescrevê-lo?");
      if (!overwrite) {
        alert("Comando abortado");
        return;
      }
    }
    // Verificar se os pontos indicados existem
    p1 = points[lineDict["p1-id"]];
    p2 = points[lineDict["p2-id"]];
    if (!p1 || !p2) {
      // TODO return error
    }
    
    // cria uma Linha (instância da classe Line)
    line = new Line(
      lineDict["p1-id"], Number(lineDict["prof1"]),
      lineDict["p2-id"], Number(lineDict["prof2"])
    )

    // armezena o ponto na variável lines
    lines[lineDict["id"]] = line;
    
    // seleciona a área de desenho
    drawingArea = document.querySelector("#drawing-area");
    linesContainer = drawingArea.querySelector("#lines-container");

    // Desenha o trecho atual
    //    em caso de sobrescrever, seleciona o trecho existente para atualizá-lo
    //    caso contrário, cria um novo trecho do zero
    if (!overwrite) {
      drawLine = document.createElementNS("http://www.w3.org/2000/svg" , "line");
    } else {
      drawLine = linesContainer.querySelector("[data-line-id='"+ lineDict["id"] +"']");
    }
    // atribui valores dos atributos do trecho
    drawLine.setAttributeNS(null, "x1", p1.x);
    drawLine.setAttributeNS(null, "y1", -p1.y);
    drawLine.setAttributeNS(null, "x2", p2.x);
    drawLine.setAttributeNS(null, "y2", -p2.y);
    drawLine.setAttributeNS(null, "stroke-width", "1%");
    drawLine.setAttributeNS(null, "stroke", "black");
    drawLine.setAttributeNS(null, "onhover", "showLineInfo()")
    drawLine.setAttributeNS(null, "data-line-id", lineDict["id"]);
    drawLine.setAttributeNS(null, "onclick", "greetings()");
    if (!overwrite) linesContainer.appendChild(drawLine);

    // Insere ou sobrescreve a linha na tabela
    tbody = document.getElementById("lines-tbody");
    if (!overwrite) {
      temp = document.querySelector("#line-row-template").content.querySelector("tr");
      row = document.importNode(temp, true);
    } else {
      row = tbody.querySelector("[data-id='"+ lineDict["id"] +"']");
    }
    cols = row.querySelectorAll("td");
    cols[0].textContent = lineDict["id"];
    cols[1].textContent = lineDict["p1-id"];
    cols[2].textContent = lineDict["prof1"];
    cols[3].textContent = lineDict["p2-id"];
    cols[4].textContent = lineDict["prof2"];
    row.setAttribute("data-id", lineDict["id"]);
    if (!overwrite) {
      tbody.appendChild(row);
    }
  }

  // adiciona evento onclick no botão "Gerar pontos"
  // Valida os dados (TODO) e desenha o ponto
  document.querySelector("#gerarPontosBtn").onclick = () => {
    
    // seleciona a linha de input de pontos
    inputRow = document.querySelector(".point-input-row");
    // resgata os atributos
    pointDict = dataFromInputRow(inputRow);
    // se já houver um ponto com o mesmo id, solicita confirmação
    overwrite = false;
    if (points[pointDict["id"]]) {
      if (confirm("O ponto já existe. Deseja sobrescrever?")) {
        overwrite = true;
      } else {
        alert("Comando abortado");
        return;
      }
    }

    // cria um Ponto (instância da classe Point) 
    point = new Point(
      Number(pointDict["x"]),
      Number(pointDict["y"]),
      Number(pointDict["z"]));
    
    // armazena o ponto na variavel points
    points[pointDict["id"]] = point;
    
    // seleciona a área de desenho
    drawingArea = document.querySelector("#drawing-area");
    pointsContainer = drawingArea.querySelector("#points-container");
    
    // Desenha o ponto
    //    em caso de sobrescrição, altera o ponto existente,
    //    caso contrário, cria um novo ponto do zero
    if (!overwrite) {
      drawPoint = document.createElementNS("http://www.w3.org/2000/svg" , "circle");
    } else {
      drawPoint = pointsContainer.querySelector("[data-point-id='"+ pointDict["id"] +"']");
    }
    // atribui os valores dos atributos do ponto (novo ou atualizado)
    drawPoint.setAttributeNS(null,"cx", point.x);
    drawPoint.setAttributeNS(null,"cy", -point.y);
    drawPoint.setAttributeNS(null,"cz", point.z);
    drawPoint.setAttributeNS(null,"stroke-width", "1%");
    drawPoint.setAttributeNS(null,"stroke", "black");
    drawPoint.setAttributeNS(null,"fill", "white");
    drawPoint.setAttributeNS(null,"r", "2%");
    drawPoint.setAttributeNS(null, "onhover", "showPointInfo()")
    drawPoint.setAttributeNS(null,"data-point-id", pointDict["id"]);
    drawPoint.setAttributeNS(null,"onclick", "greetings()")
    if (!overwrite) pointsContainer.appendChild(drawPoint);

    // altera as propriedades do desenho
    bbox = pointsContainer.getBBox();
    drawingArea.setAttributeNS(null, "viewBox", 
      `${bbox.x - DRAW_AREA_OFFSET} ` +
      `${bbox.y - DRAW_AREA_OFFSET} ` +
      `${bbox.width + 2*DRAW_AREA_OFFSET} ` +
      `${bbox.height + 2*DRAW_AREA_OFFSET}`
    )

    // Insere ou sobrescreve a linha referente ao ponto na tabela
    tbody = document.getElementById("points-tbody");
    if (!overwrite) {
      temp = document.querySelector("#point-row-template").content.querySelector("tr");
      row = document.importNode(temp, true);
    } else {
      row = tbody.querySelector("[data-id='"+ pointDict["id"] +"']");
    }
    cols = row.querySelectorAll("td");
    cols[0].textContent = pointDict["id"];
    cols[1].textContent = pointDict["x"];
    cols[2].textContent = pointDict["y"];
    cols[3].textContent = pointDict["z"];
    
    row.setAttribute("data-id", pointDict["id"]);
    if (!overwrite) {
      tbody.appendChild(row);
    }
  }

  // adiciona evento onfocus nos select inputs
  loadListOnFocus(document.querySelector("select[data-type='p1-id']"));
  loadListOnFocus(document.querySelector("select[data-type='p2-id']"));
});

function greetings() {
  console.log("Hi, i'm a circle") 
}

// carrega dinamicamente a lista do input select com os pontos existentes
function loadListOnFocus(selectEl) {
  selectEl.addEventListener("focus", function(e) {
    options = document.createElement("optgroup");
    for (id in points) {
      option = document.createElement("option");
      option.textContent = id;
      option.setAttribute("value", id);
      options.appendChild(option);
    }
    e.target.innerHTML = "";
    e.target.appendChild(options);
  });
}

// Resgata os valores em uma linha de inputs e retorna um dicionario
function dataFromInputRow(inputRow) {
  dict = {}
  for (col of inputRow.children) {
    input = col.firstChild;
    key = input.getAttribute("data-type");
    value = input.value;
    dict[key] = value;
  }
  return dict;
}