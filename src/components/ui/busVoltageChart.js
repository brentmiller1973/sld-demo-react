const busVoltageChart = {
  renderVoltageChart(vValue) {
    const value = vValue[0];
    const bar = document.querySelector('.value-bar');
    let scaleValue = 0;
    bar.innerHTML = value.toFixed(2);

    if (value >= 1.0 && value < 1.02) {
      bar.style.width = `50px`;
      bar.style.left = 'calc(50% - 25px)';
      bar.style.backgroundColor = 'green';
    } else if (value > 1.1) {
      scaleValue = 1.1;
      let t = Math.round((scaleValue - 1.0) * 100);
      t = 50 + t * 5;
      t = t - 50;
      bar.style.width = `${t}%`;
      bar.style.left = `50%`;

      if (value <= 1.05) {
        bar.style.backgroundColor = 'green';
      } else {
        bar.style.backgroundColor = 'red';
      }
    } else if (value > 1.0) {
      let t = Math.round((value - 1.0) * 100);
      t = 50 + t * 5;
      t = t - 50;
      // console.log(t);
      bar.style.width = `${t}%`;
      bar.style.left = `50%`;

      if (value <= 1.05) {
        bar.style.backgroundColor = 'green';
      } else {
        bar.style.backgroundColor = 'red';
      }
    } else if (value < 0.91) {
      bar.style.width = `50%`;
      bar.style.left = `0%`;

      if (value <= -1.05) {
        bar.style.backgroundColor = 'green';
      } else {
        bar.style.backgroundColor = 'red';
      }
    } else if (value < 1.0) {
      let t = Math.round((value - 1.0) * 100);
      t = 50 + t * 5;
      t = t - 50;
      t = Math.abs(t);
      // console.log(t);

      const start = 50 - t;
      bar.style.width = `${t}%`;
      bar.style.left = `${start}%`;

      if (value <= -1.05) {
        bar.style.backgroundColor = 'green';
      } else {
        bar.style.backgroundColor = 'red';
      }
    }
  }
};
export default busVoltageChart;
