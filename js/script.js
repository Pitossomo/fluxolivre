class Point {
  constructor(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

document.addEventListener("DOMContentLoaded", () => { 
 
  // adiciona evento onclick no botão "Gerar pontos"
  document.getElementById("gerarPontosBtn").onclick = () => {
    
    // seleciona as linhas de  
    var pointRows = document.querySelectorAll(".point-row");
    for (let pointRow of pointRows) {
      console.log(pointRow);
    }

  }
});