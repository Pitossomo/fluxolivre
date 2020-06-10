/* Este script gera projetos de esgoto em planta, conforme padrão SANEAGO. */

const DRAW_AREA_OFFSET = 0.10;
const DRAW_AREA_MINIMAL_DIMENSION = 100;
const DEC_PLACES = 2;
const VERT_EXAG = 10;

class Point {
  constructor(dict) {
    this.id = Number(dict["id"]);
    this.type = dict["type"];
    this.x = Number(dict["x"]);
    this.y = Number(dict["y"]);
    this.z = Number(dict["z"]);
    this.prof = 0;
    this.inputs = [];
    this.output = null;
  }

  toDict() {
    dict = {};
    dict["id"] = this.id;
    dict["type"] = this.type;
    dict["x"] = this.x;
    dict["y"] = this.y;
    dict["z"] = this.z;
    dict["prof"] = this.prof;
    if (this.inputs.length > 0) {
      dict["inputs"] = this.inputs;
    } else {
      dict["inputs"] = null;
    }
    if (this.outputs) {
      dict["output"] = this.output;
    } else {
      dict["output"] = null;
    }
    return dict;
  }

  horDistanceTo(point) {
    return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2));
  }
}

class Line {
  constructor(dict, points) {
    this.p1 = points[dict["p1-id"]];
    this.prof1 = Number(dict["prof1"]);
    this.zf1 = Number(this.p1.z - this.prof1);
    this.p2 = points[dict["p2-id"]];
    this.prof2 = Number(dict["prof2"]);
    this.zf2 = Number(this.p2.z - this.prof2);
    this.id = dict["id"];
    this.dxy = this.p1.horDistanceTo(this.p2);
    this.slope = (this.zf1 - this.zf2)/this.dxy;
    this.diam = Number(dict["diam"]);
    this.material = dict["material"];
    this.flow = Number(dict["flow"]);
    this.yD = waterBlade(this.slope, this.diam, this.flow);
    this.tt = tractiveTension(this.yD);
  }

  // Checa o ponto de montante de um trecho
  checkOutput(messages) {
    // Informa se já existe um tubo de saída no ponto
    if (this.p1.output) {
      messages.push(`Já existe uma tubulação de saída no ponto (trecho ${this.p1.output.id})\n`);
    }

    // Informa se já existe uma tubulação de chegada mais baixa que o nível do pv    
    if (this.zf1 > (this.p1.z - this.p1.prof)) {
      messages.push(`Nível da chegada mais baixo que o nível de saída no ponto ${this.p1.id}\n`); 
    }
  }

  // Checa o ponto de justante em um trecho
  checkInput(messages) {
  // Informa se a chegada pretendida está mais baixa em um pv com saída
    if (this.zf2 < (this.p2.z - this.p2.prof) && this.p2.output) {  
      messages.push(`Nível da chegada mais baixo que o nível de saída no ponto ${this.p2.id}\n`);
    } 
    return messages;
  }

  // Altera o ponto de montante, ie. a saída do trecho
  updateOutput() {
    this.p1.output = this;
    this.p1.prof = this.prof1;
  }

  // Altera o ponto de jusante, ie. a saída do p
  updateInputs() {
    // Caso não haja saídas no tubo, aumenta a profundidade para ficar no nível da chegada existente
    if (!this.p2.output) {
      this.p2.prof = Math.max(this.p2.prof, this.prof2);
    }
    // Insere a linha na lista de chegadas do ponto a jusante
    this.p2.inputs.push(this);
  }

  toDict() {
    dict = {};
    dict["id"] = this.id;
    dict["p1-id"] = this.p1.id;
    dict["prof1"] = this.prof1.toFixed(3);
    dict["zf1"] = this.zf1.toFixed(3);
    dict["p2-id"] = this.p2.id;
    dict["prof2"] = this.prof2.toFixed(3);
    dict["zf2"] = this.zf2.toFixed(3);
    dict["id"] = this.id;
    dict["dxy"] = this.dxy.toFixed(2);
    dict["slope"] = (this.slope*100).toFixed(2);
    dict["diam"] = this.diam.toFixed(0);
    dict["material"] = this.material;
    dict["flow"] = this.flow.toFixed(1);
    dict["yD"] = (this.yD*100).toFixed(1);
    dict["TT"] = this.tt.toFixed(2);
    return dict;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // cria a variável para armazenar os pontos
  points = {};    // Object com pares key = point.id, value = point
  lines = {};     // Object com pares key = line.id, value = line 
  paths = [];     // Array em 2 dimensões, onde cada array filha é um trecho/caminho (path) a ser desenhado no perfil
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
    inputRow = document.querySelector("#line-input-row")
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
    if (!p1 || !p2 || p1 == p2) {
      alert("Pontos inválidos");
      return;
    }

    // cria uma Linha (instância da classe Line)
    line = new Line(lineDict, points);    

    // Atualiza os pontos
    let messages = [];
    line.checkOutput(messages);
    line.checkInput(messages); 
    if (messages.length == 0) {
      line.updateOutput();
      line.updateInputs();
    } else {
      return alert(messages);
    }

    // armezena o ponto na variável lines
    lines[line.id] = line;
    
    // seleciona a área de desenho em planta
    planviewArea = document.querySelector("#planview-area");
    linesContainer = planviewArea.querySelector("#lines-container");

    // Desenha o trecho atual em planta
    //    em caso de sobrescrever, seleciona o trecho existente para atualizá-lo
    //    caso contrário, cria um novo trecho do zero
    drawLine(p1.x, p1.y, p2.x, p2.y, line.id, linesContainer, overwrite);

    // Insere ou sobrescreve a linha na tabela
    tbody = document.getElementById("lines-tbody");
    if (!overwrite) {
      temp = document.querySelector("#line-row-template").content.querySelector("tr");
      row = document.importNode(temp, true);
    } else {
      row = tbody.querySelector("[data-id='"+ line.id +"']");
    }
    dataToTableRow(line.toDict(), row);
    if (!overwrite) {
      tbody.appendChild(row);
    }
    
    // Incrementa o id do trecho no input da tabela de trechos
    // TODO
  }

  // adiciona evento onclick no botão "Gerar pontos"
  // Valida os dados (TODO) e desenha o ponto
  document.querySelector("#gerarPontosBtn").onclick = () => {
    
    // seleciona a linha de input de pontos
    pointInputs = document.querySelectorAll("#point-input-row input");
    // resgata os atributos
    pointDict = dataFromInputRow(pointInputs, true);

    // cria um Ponto (instância da classe Point) 
    point = new Point(pointDict)

    // se já houver um ponto com o mesmo id, solicita confirmação
    overwrite = false;
    if (points[point.id]) {
      if (confirm("O ponto já existe. Deseja sobrescrever?")) {
        overwrite = true;
      } else {
        alert("Comando abortado");
        return;
      }
    }
    
    // armazena o ponto na variavel point
    points[point.id] = point;    

    // Desenha o ponto em planta
    // seleciona a área de desenho em planta
    planviewArea = document.querySelector("#planview-area");
    pointsContainer = planviewArea.querySelector("#points-container");
    // desenha o ponto do zero ou o substitui, se for existente 
    drawPoint(point.x, point.y, point.id, pointsContainer, overwrite);
    // altera o zoom do desenho para conter todos os pontos
    zoomExtents(pointsContainer, planviewArea);

    // Insere ou sobrescreve a linha referente ao ponto na tabela
    tbody = document.getElementById("points-tbody");
    if (!overwrite) {
      temp = document.querySelector("#point-row-template").content.querySelector("tr");
      row = document.importNode(temp, true);
    } else {
      row = tbody.querySelector("[data-id='"+ pointDict["id"] +"']");
    }
    dataToTableRow(point.toDict(), row);
    if (!overwrite) {
      tbody.appendChild(row);
    }

    // Incrementa o ponto na tabela de pontos e reseta os valores dos demais inputs
    document.querySelector("#point-id").value = Object.keys(points).length + 1;
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
//   *OBS: o segundo parâmetro é um boolean que informa se os inputs serão resetados ou não
function dataFromInputRow(inputElements, reset) {
  dict = {}
  for (input of inputElements) {
    key = input.getAttribute("data-type");
    value = input.value;
    if (reset) input.value = "";
    dict[key] = value;
  }
  return dict;
}

// Insert data from a dictionary to a table row <tr> NodeList
function dataToTableRow(dict, row) {
  cols = row.querySelectorAll("td");
  for (td of cols) {
    datatype = td.getAttribute("data-type");
    if (datatype) td.textContent = dict[datatype];
  }
  row.setAttribute("data-id", dict["id"]);
}

// Calcula a lâmina dágua em relação ao diâmetro do tubo (y/D)
function waterBlade(slope, D, flow) {
  // TODO
  return 0.5;
}  

// Calcula a tensão trativa que a lâmina d'água exerce no tubo
function tractiveTension(yD) {
  // TODO
  return 1.2;
}

// Desenha um ponto em planta
function drawPoint(x, y, id, pointsContainer, overwrite) {
  if (!overwrite) {
    p = document.createElementNS("http://www.w3.org/2000/svg" , "circle");
  } else {
    p = pointsContainer.querySelector("[data-point-id='"+ id +"']");
  }
  // atribui os valores dos atributos do ponto (novo ou atualizado)
  p.setAttributeNS(null,"cx", x);
  p.setAttributeNS(null,"cy", -y);
  p.setAttributeNS(null,"stroke-width", "1%");
  p.setAttributeNS(null,"stroke", "black");
  p.setAttributeNS(null,"fill", "white");
  p.setAttributeNS(null,"r", "2%");
  p.setAttributeNS(null, "onhover", "showPointInfo()");
  p.setAttributeNS(null,"data-point-id", id);
  p.setAttributeNS(null,"onclick", "greetings()");
  if (!overwrite) pointsContainer.appendChild(p);  
}

// Desenha pv em perfil
function drawLongPoint(x, z, prof, id, pointsContainer, overwrite) {
  if (!overwrite) {
    p = document.createElementNS("http://www.w3.org/2000/svg" , "rect");
  } else {
    p = pointsContainer.querySelector("[data-point-id='"+ id +"']");
  }
  // atribui os valores dos atributos do ponto (novo ou atualizado)
  p.setAttributeNS(null,"x", x);
  p.setAttributeNS(null,"y", -VERT_EXAG*z);
  p.setAttributeNS(null,"width", "2%");
  p.setAttributeNS(null,"height", VERT_EXAG*prof);
  p.setAttributeNS(null,"stroke-width", "1%");
  p.setAttributeNS(null,"stroke", "black");
  p.setAttributeNS(null,"fill", "white");
  p.setAttributeNS(null, "onhover", "showPointInfo()");
  p.setAttributeNS(null,"data-point-id", id);
  p.setAttributeNS(null,"onclick", "greetings()");
  if (!overwrite) pointsContainer.Child(p);  
}

// desenha linha
function drawLine(x1, y1, x2, y2, id, linesCont, overwrite) {
  if (!overwrite) {
    li = document.createElementNS("http://www.w3.org/2000/svg" , "line");
  } else {
    li = linesCont.querySelector("[data-line-id='"+ id +"']");
  }
  // atribui valores dos atributos do trecho
  li.setAttributeNS(null, "x1", x1);
  li.setAttributeNS(null, "y1", -y1);
  li.setAttributeNS(null, "x2", x2);
  li.setAttributeNS(null, "y2", -y2);
  li.setAttributeNS(null, "stroke-width", "1%");
  li.setAttributeNS(null, "stroke", "black");
  li.setAttributeNS(null, "onhover", "showLineInfo()")
  li.setAttributeNS(null, "data-line-id", id);
  li.setAttributeNS(null, "onclick", "greetings()");
  if (!overwrite) linesCont.appendChild(li);
}

// Altera a escala e o enquadramento do svg para mostrar todos os pontos
function zoomExtents(container, drawArea) {
  let bbox = container.getBBox();
  let bboxCenterX = bbox.x + bbox.width/2
  let bboxCenterY = bbox.y + bbox.height/2
  drawArea.setAttributeNS(null, "viewBox", 
      `${bboxCenterX - (1+DRAW_AREA_OFFSET)*bbox.width/2} ` +
      `${bboxCenterY - (1+DRAW_AREA_OFFSET)*bbox.height/2} ` +
      `${bbox.width*(1+DRAW_AREA_OFFSET)} ` +
      `${bbox.height*(1+DRAW_AREA_OFFSET)}`
    );
}

/* NOT USED - TODO
function drawPath() {
  // seleciona a área de desenho em perfil
  longviewArea = document.querySelector("#longview-area");
  linesLongContainer = longviewArea.querySelector("#lines-long-container");
  // Desenha o trecho atual em perfil
  drawLine(p1.x, VERT_EXAG*(p1.z-line.prof1), p2.x, VERT_EXAG*(p2.z-line.prof2), line.id, linesContainer, overwrite);

  // Desenha os pontos em vista longitudinal
  // seleciona a área de desenho longitudinal
  longviewArea = document.querySelector("#longview-area");
  pointsLongContainer = longviewArea.querySelector("#points-long-container");
  // desenho ou altera o ponto no desenho, se existente
  drawLongPoint(point.x, point.z, point.prof, point.id, pointsLongContainer, overwrite);
  // altera o zoom do desenho para conter todos os pontos
  zoomExtents(pointsLongContainer, longviewArea);
} 
*/