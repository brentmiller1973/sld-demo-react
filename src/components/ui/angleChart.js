import trimCanvas from './trimCanvas';
const angleChart = {
  renderAngleChart(angle, divWrapperID) {
    console.log('here is the divWrapperID', divWrapperID);


    const wrapper = document.getElementById(divWrapperID);
    console.log('here is the wrapper', wrapper);
    wrapper.innerHTML = '';
    wrapper.innerHTML =
      '<canvas class="busAngCanvas" width="400" height="400" style="display:none"></canvas>';
    const degreeVal = angle[0];
    let canvas = document.querySelector('.busAngCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(0.5, 0.5);
    const x1 = 100;
    const y1 = 100;
    const r = 75;
    // const theta = (Math.PI/180)*degreeVal;  //degreeVal is right now in radians
    const theta = degreeVal;
    const text = degreeVal * (180 / Math.PI);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1976d2';
    ctx.fillStyle = '#1976d2';

    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + r, y1);
    ctx.stroke();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + r * Math.cos(theta), y1 + r * Math.sin(theta));
    ctx.stroke();

    ctx.moveTo(x1, y1);
    ctx.arc(x1, y1, 20, 0, theta, degreeVal < 0 ? true : false);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fill();

    ctx.font = '14px sans-serif';
    ctx.fillText(`${text.toFixed(2)}°`, x1 + (r + 5), y1 + 5);

    canvas = trimCanvas(canvas);
    const img = canvas.toDataURL('image/png');
    wrapper.innerHTML = '';
    const node = document.createElement('IMG');
    node.src = img;
    node.style.width = '100%';
    node.style.height = 'auto';
    node.style.marginTop = '5px';
    wrapper.appendChild(node);
  }
};
export default angleChart;
