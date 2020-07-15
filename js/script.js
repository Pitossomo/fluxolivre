/* Este script gera projetos de esgoto em planta, conforme padrão SANEAGO. */

const DRAW_AREA_OFFSET = 0.06;
const DRAW_AREA_MINIMAL_DIMENSION = 100;
const DEC_PLACES = 2;
const VERT_EXAG = 10;

document.addEventListener("DOMContentLoaded", () => {
  // cria a variável para armazenar os pontos
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

  // adiciona evento onblur nos inputs do tipo number
  document.querySelectorAll('input[type="number"]').forEach(item => {
    item.addEventListener("blur", event => {
      if (!isEmptyText(item.value)) {
        // formata o número da forma adequada ao step de cada input
        enterFormatedNumber(item.value, item);
        
        // calcula a declividade (se possível)
        let dist = document.querySelector("#dist").value;
        let ntMont = document.querySelector("#nt-mont").value;
        let profMont = document.querySelector("#prof-mont").value;
        let ntJus = document.querySelector("#nt-jus").value;
        let profJus = document.querySelector("#prof-jus").value;
        if (isEmptyText(dist) || isEmptyText(ntMont) || isEmptyText(profMont) || isEmptyText(ntJus) || isEmptyText(profJus)) {
          return;
        } else {
          let slope = ((ntMont - profMont) - (ntJus - profJus))/dist*100;
          slopeInput = document.querySelector("#slope");
          enterFormatedNumber(slope, slopeInput);
        }

        // calcula a tensão trativa e a lâmina (se possível)
        // TODO
      }
    })
  })

  // adiciona evento onclick no botão "Gerar trechos" - Insere linha na tabela
  document.querySelector("#addRow").onclick = () => {
    // seleciona a linha de input de linhas
    inputRow = document.querySelector("#line-input-row");
    // resgata os atributos
    rowDict = dataFromInputRow(inputRow);
    // solicita confirmação para sobrescrever, em caso de linhas com mesmo id
    overwrite = false;
    if (isIdOnTable(rowDict["id"])) {
      overwrite = confirm("Já existe um trecho com o nome indicado. Deseje sobrescrevê-lo?");
      if (!overwrite) {
        alert("Comando abortado");
        return;
      }
    }

    // Validação e mensagens de validação
    // TODO

    // Insere ou sobrescreve a linha na tabela
    tbody = document.getElementById("lines-tbody");
    if (!overwrite) {
      temp = document.querySelector("#line-row-template").content.querySelector("tr");
      row = document.importNode(temp, true);
    } else {
      row = tbody.querySelector("[data-id='"+ rowDict["id"] +"']");
    }
    dataToTableRow(rowDict, row);
    if (!overwrite) {
      tbody.appendChild(row);
    }
    
    // Altera os valores dos inputs e prepara para a próxima inclusão
    enterFormatedNumber(Number(rowDict["id"]) + 1, inputRow.querySelector('[data-type="id"]'));
    enterFormatedNumber(rowDict["nt-jus"],inputRow.querySelector('[data-type="nt-mont"]'));
    enterFormatedNumber(rowDict["prof-jus"],inputRow.querySelector('[data-type="prof-mont"'));
    inputRow.querySelector('[data-type="nt-jus"]').value = "";
    inputRow.querySelector('[data-type="prof-jus"]').value = "";
    inputRow.querySelector('[data-type="dist"]').value = "";
    inputRow.querySelector('[data-type="slope"]').value = "";
    inputRow.querySelector('[data-type="yD"]').value = "";
    inputRow.querySelector('[data-type="TT"]').value = "";
  }

  // adiciona evento onclick no botão "Desenhar" - Desenha as linhas inseridas na tabela
  document.querySelector("#desenhar").onclick = () => {
    linesCont = document.querySelector("#lines-container");
    xAcum = 0;
    rows = document.querySelectorAll("tbody tr");
    rows.forEach(row => {
      cells = row.querySelectorAll(":scope > td");
      rowDict = dataFromTableRow(cells);
      xMont = xAcum;
      xAcum += rowDict["dist"];
      ntMont = rowDict["nt-mont"];
      nfMont = ntMont - rowDict["prof-mont"];
      ntJus = rowDict["nt-jus"];
      nfJus = ntJus - rowDict["prof-jus"];
      // desenha a linha do terreno
      drawLine(xMont, VERT_EXAG*ntMont, xAcum, VERT_EXAG*ntJus, rowDict["id"], linesCont, overwrite);
      // desenha a geratriz inferior da tubulação
      drawLine(xMont, VERT_EXAG*nfMont, xAcum, VERT_EXAG*nfJus, rowDict["id"], linesCont, overwrite);            
      // desenha a geratriz superior da tubulação
      drawLine(xMont, VERT_EXAG*(nfMont - rowDict["diam"]/1000), xAcum, VERT_EXAG*(nfJus - rowDict["diam"]/1000), rowDict["id"], linesCont, overwrite);
    });
    zoomExtents(linesCont, document.querySelector("#view-area"));
  }

  // adiciona evento on click no botão "Salvar" - Salva em arquivo
  document.querySelector("#salvar").onclick = () => {
    // cria texto a ser inserido no arquivo
    data = "";
    // varre a tabela
    rows = document.querySelectorAll("tbody tr");
    rows.forEach(row => {
      cells = row.querySelectorAll(":scope > td");
      rowDict = dataFromTableRow(cells, true);
      // insere os dados no arquivo na sequencia determinada para cada linha da tabela 
      data += rowDict["id"] + " " + rowDict["nt-mont"] + " " + rowDict["prof-mont"] + " " + 
        rowDict["nt-jus"] + " " + rowDict["prof-jus"] + " " + rowDict["diam"] + " " +
        rowDict["material"] + " " + rowDict["dist"] + " " + rowDict["flow"] + "\n";
    });
    console.log(data);
    // cria data uri para baixar o arquivo  
    var el = document.createElement('a');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    el.setAttribute('download', 'perfil.esg');
    // simula um click em um link para realizar o download
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  }
});

function greetings() {
  console.log("Hi, i'm a circle") 
}

// Resgata os valores em uma linha de inputs e retorna um dicionario
//   *OBS: o segundo parâmetro é um boolean que informa se os valores da linha serão resetados ou não
function dataFromInputRow(row, reset=false) {
  dict = {}
  row = row.querySelectorAll("input, select")
  for (cell of row) {
    key = cell.getAttribute("data-type");
    value = cell.value;
    if (reset) cell.value = "";
    dict[key] = value;
  }
  return dict;
}

// Resgata os valores em uma linha de tabela e retorna um dicionário
function dataFromTableRow(row, asString=false) {
  dict = {}
  // define o par key, value para cada célula da linha
  for (cell of row) {
    key = cell.getAttribute("data-type");
    val = cell.innerText;
    // se o value for um número e o parâmetro asString não exiga a saída como string, 
    // então converte para o tipo Number, caso contrário mantém a string
    if (!asString && !isNaN(val)) { val = Number(val) }
    // insere o par key, value no dicionário
    dict[key] = val;
  }
  return dict;
}

// Check if a row with a specific id is already on the table
function isIdOnTable(id) {
  // TODO
  return false;
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
  //li.setAttributeNS(null, "stroke-width", "1%");
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

// Checa se um texto tem comprimento nulo (ie text == "" ou com whitespaces)
function isEmptyText(text) {
  return (!text.trim().length);
}

// Insere um valor formatado em um campo input number
function enterFormatedNumber(val, field) {
  let precisao = Math.max(-Math.log10(field.getAttribute("step")),0);
  field.value = Number(val).toFixed(precisao);      
  return;
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