import * as L from 'leaflet/src/Leaflet';
import {
    DateTime,
    Duration,
    Interval
} from 'luxon';

const CSS_CONTROL_CLASS = 'leaflet-timeline-control';

const template = `
<div class="controlPanel">
   <button id="cp-play">
      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="play" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-play fa-w-14 fa-3x">
         <path fill="#CCCCCC" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" class=""></path>
      </svg>
   </button>
   <button id="cp-pause">
      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="pause" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-pause fa-w-14 fa-3x">
         <path fill="#CCCCCC" d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z" class=""></path>
      </svg>
   </button>
   <button id="cp-next">
      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="step-forward" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-step-forward fa-w-14 fa-3x">
         <path fill="#CCCCCC" d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z" class=""></path>
      </svg>
   </button>
   <button id="cp-previous">
      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="step-backward" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-step-backward fa-w-14 fa-3x">
         <path fill="#CCCCCC" d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z" class=""></path>
      </svg>
   </button>
   <div class="lcdPanel">
      <div>
         <p id="lcdTrack">Track: </p>
         <p id="lcdStatus">Status: Manual</p>
         <p id="lcdDetail"></p>
      </div>
   </div>
</div>
`

class TimelineControl extends L.Control {
    constructor(options) {
        super(options);
        this.steps = this.createSteps();
        this.currentStep = this.steps[0];
    }
    onAdd(map) {
        this.map = map;
        const { autoplay } = this.options;
        const { dateFormat } = this.options.timeline;
        this.container = this.renderDefault(map);
        this.container.innerHTML = template;
        document.getElementById('cp-play').addEventListener("click",
            (e) => this.handlePlayButton(e));
        document.getElementById('cp-pause').addEventListener("click",
            (e) => this.handlePauseButton(e));
        document.getElementById('cp-next').addEventListener("click",
            (e) => this.handleNextButton(e));
        document.getElementById('cp-previous').addEventListener("click",
            (e) => this.handlePreviousButton(e));

        if (autoplay) {
            this.createTimer();
        } else {
            document.getElementById('lcdTrack').innerText = `Track: 1 / ${this.steps.length}`;
            document.getElementById('lcdDetail').innerText = this.currentStep.toFormat(dateFormat);
        }
        L.DomEvent.disableClickPropagation(this.container);
        return this.container;
    }
    onRemove() {
        this.destroyTimer();
    }
    renderDefault(map) {
        return L.DomUtil.create('div', CSS_CONTROL_CLASS, map.getContainer());
    }
    handlePlayButton(e) {
        this.timer ? this.destroyTimer() : this.createTimer();
    }
    handlePauseButton(e) {
        this.timer ? this.destroyTimer() : this.createTimer();
    }
    handleNextButton(e) {
        if (this.timer){
            this.destroyTimer();
        }
        const { dateFormat } = this.options.timeline;
        const { onNextStep } = this.options;

        const currentIndex = this.steps.findIndex(step => step === this.currentStep);
        const nextIndex = currentIndex < this.steps.length - 1 ? currentIndex + 1 : 0;
        this.currentStep = this.steps[nextIndex];
        document.getElementById('lcdTrack').innerText = `Track: ${nextIndex + 1} / ${this.steps.length}`;
        document.getElementById('lcdStatus').innerText = 'Status: Manual';
        document.getElementById('lcdDetail').innerText = this.currentStep.toFormat(dateFormat);
        onNextStep(this.currentStep.toJSDate(), nextIndex);
    }
    handlePreviousButton(e) {
        if (this.timer){
            this.destroyTimer();
        }
        const { dateFormat } = this.options.timeline;
        const { onNextStep } = this.options;

        const currentIndex = this.steps.findIndex(step => step === this.currentStep);
        // const nextIndex = currentIndex < this.steps.length - 1 ? currentIndex + 1 : 0;
        const nextIndex = currentIndex === 0 ? this.steps.length - 1 : currentIndex - 1;
        this.currentStep = this.steps[nextIndex];
        document.getElementById('lcdTrack').innerText = `Track: ${nextIndex + 1} / ${this.steps.length}`;
        document.getElementById('lcdStatus').innerText = 'Status: Manual';
        document.getElementById('lcdDetail').innerText = this.currentStep.toFormat(dateFormat);
        onNextStep(this.currentStep.toJSDate(), nextIndex);
    }
    createTimer() {
        const { dateFormat } = this.options.timeline;
        const { interval, onNextStep } = this.options;
        this.timer = setInterval(() => {
            const currentIndex = this.steps.findIndex(step => step === this.currentStep);
            const nextIndex = currentIndex < this.steps.length - 1 ? currentIndex + 1 : 0;
            this.currentStep = this.steps[nextIndex];
            document.getElementById('lcdTrack').innerText = `Track: ${nextIndex + 1} / ${this.steps.length}`;
            document.getElementById('lcdStatus').innerText = 'Status: Playing';
            document.getElementById('lcdDetail').innerText = this.currentStep.toFormat(dateFormat);
            onNextStep(this.currentStep.toJSDate(), nextIndex);
        }, interval);
    }
    destroyTimer() {
        clearTimeout(this.timer);
        this.timer = null;
        document.getElementById('lcdStatus').innerText = 'Status: Manual';
    }
    createSteps() {
        const { range } = this.options.timeline;
        if (range.length > 2) {
            return range.map(date =>DateTime.fromJSDate(date));
        }
        const { step } = this.options.timeline;
        const [start, end] = range;
        const interval =Interval.fromDateTimes(start, end);
        const equalIntervals = interval.splitBy(Duration.fromObject(step));
        const steps = equalIntervals
            .reduce((accum, value) => {
                accum.add(value.start);
                accum.add(value.end);
                return accum;
            }, new Set());
        return Array.from(steps);
    }
}

L.Control.Timeline = TimelineControl;

L.control.timeline = (opts) => new L.Control.Timeline(opts);

export default L.control.timeline;
