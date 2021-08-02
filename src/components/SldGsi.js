import React, {Component} from 'react';
import * as L from 'leaflet/src/Leaflet';
import './ui/leaflet-control-topcenter';
import NumberFormat from 'react-number-format';
import SideBar from './ui/L.Control.Sidebar';
import MenuBar from './ui/L.Control.Menubar';
import WarningIcon from "./icons/WarningIcon";
import CheckIcon from './icons/CheckIcon';
import Panel from "./ui/panel.component";
import buildBaseLayer from './layers/baseLayer';
import buildBusLayer from './layers/busLayer';
import buildBranchLayer from './layers/branchLayer';
import angleChart from './ui/angleChart';
import busVoltageChart from './ui/busVoltageChart';
import LogoControl from './ui/logoControl';
import './ui/L.Control.Timeline';
import './assets/styles/index.scss';

class SldGsi extends Component {
    constructor(props) {
        super(props);
        // Props
        this.busData = props.busData || {};
        this.branchData = props.branchData || {};
        this.mapUrl = props.mapUrl || 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
        this.initialZoomLevel = props.initialZoomLevel || 8;
        this.initialCoordinates = props.initialCoordinates || [37.468319, -122.143936];
        this.timescale = (this.busData.timescale && this.busData.timescale.length) ?
            this.busData.timescale : null;

        this.mapRef = React.createRef();

        this.map = null;
        this.PI = Math.PI

        this.state = {
            selectedData: null,
            associatedBuses: null,
            associatedBranches: null,
            timescaleIndex: 0,
        }


    }

    componentDidMount() {
        this.map = buildBaseLayer(
            this.mapUrl,
            this.initialCoordinates,
            this.initialZoomLevel,
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        );

        this.map.attributionControl.setPrefix(
            '&copy; <a href="https://www.epri.com/">EPRI</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://leafletjs.com/">Leaflet</a>&nbsp;'
        );


        SideBar.initSideBar();
        const sidebar = L.control.sidebar('sidebar', {
            position: 'left'
        });
        this.map.addControl(sidebar);

        MenuBar.initMenuBar();
        const menubar = L.control.menubar({
            container: 'menubar',
            position: 'right'
        });
        this.map.addControl(menubar);

        this.map.addControl(new LogoControl());

        window.addEventListener('BUS_CLICK_EVENT', (e) => {
                console.log('marker clicked', e);
                this.setState({
                    selectedData: e.detail,
                });

                sidebar.show();

                // iterate through the branchData and get associated branches
                const busID = this.state.selectedData.properties.number;
                const d = [];
                this.branchData.features.map(feature => {
                    if (
                        feature.properties.bus_k_number === busID ||
                        feature.properties.bus_m_number === busID
                    ) {
                        d.push(feature.properties);
                    }
                });


                this.setState({
                    associatedBranches: d,
                });

                setTimeout(() => {
                    angleChart.renderAngleChart(this.state.selectedData.properties.v_ang, 'divBusAngCanvas');
                    busVoltageChart.renderVoltageChart(this.state.selectedData.properties.v_mag);
                }, 1);
            }, false
        );

        window.addEventListener('BRANCH_CLICK_EVENT', (e) => {
                console.log('branch clicked', e);
                this.setState({
                    selectedData: e.detail,
                });

                // iterate through the busData and get associated buses
                const fromBusID = this.state.selectedData.properties.bus_k_number;
                const toBusID = this.state.selectedData.properties.bus_m_number;
                const d = [];
                this.busData.features.map(feature => {
                    if (
                        feature.properties.number === fromBusID ||
                        feature.properties.number === toBusID
                    ) {
                        d.push(feature.properties);
                    }
                });
                this.setState({
                    associatedBuses: d,
                });
                console.log('this.associatedBuses: ', this.state.associatedBuses);

                sidebar.show();

            }, false
        );


        this.branchLayer = buildBranchLayer(this.map, this.branchData, this.state.timescaleIndex);
        this.busLayer = buildBusLayer(this.map, this.busData, this.state.timescaleIndex);

        this.map.fitBounds(this.busLayer.getBounds());

        if (this.timescale) {
            const handleTimelineChange = (cur, index) => {
                this.setState({
                    timescaleIndex: index,
                });
                // console.log("Moving to next slot", cur, this.state.timescaleIndex);
                this.map.removeLayer(this.branchLayer);
                this.map.removeLayer(this.busLayer);
                this.branchLayer = buildBranchLayer(this.map, this.branchData, this.state.timescaleIndex);
                this.busLayer = buildBusLayer(this.map, this.busData, this.state.timescaleIndex);
            };

            const timelineControl = L.control.timeline({
                autoplay: false,
                position: "bottomleft",
                onNextStep: (cur, index) => handleTimelineChange(cur, index),
                interval: 1000,
                button: {
                    pausedText: "Play",
                    playingText: "Pause"
                    //render: () => document.createElement("strong")
                },
                timeline: {
                    dateFormat: "MM-dd-yyyy hh:mm a",
                    range: this.timescale.map((date) => new Date(date)),
                    step: {
                        day: 1
                    }
                }
            });

            this.map.addControl(timelineControl);
        }

    }

    render() {
        return (
            <>
                <div ref={this.mapRef}
                     className="map"
                     id="map"
                     style={{width: '100%', height: '100vh'}}>
                </div>

                <div id="menubar" className="leaflet-menubar collapsed">
                    <div className="leaflet-menubar-tabs">
                        <ul role="tablist">
                            <li><a href="#home" role="tab" title="About">
                                <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-info-circle"
                                     fill="currentColor"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd"
                                          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path
                                        d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588z"/>
                                    <circle cx="8" cy="4.5" r="1"/>
                                </svg>
                            </a>
                            </li>
                            <li>
                                <a href="#legend" role="tab" title="legend">
                                    <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-map"
                                         fill="currentColor"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd"
                                              d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98l4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z"/>
                                    </svg>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="leaflet-menubar-content">
                        <div className="leaflet-menubar-pane" id="home">
                            <h1 className="leaflet-menubar-header">
                                Network Single-Line Diagram (SLD)
                                <span className="leaflet-menubar-close">
                                    <svg style={{display: 'inline-block', verticalAlign: 'text-bottom'}}
                                         width="1em" height="1em" viewBox="0 0 16 16"
                                        className="bi bi-caret-left-fill" fill="currentColor"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.86 8.753l5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
                                    </svg>
                                </span>
                            </h1>

                            <p className="lorem">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
                                nonumy eirmod tempor
                                invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
                                accusam et justo duo
                                dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
                                dolor sit amet.
                                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
                                invidunt ut
                                labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo
                                duo dolores et
                                ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
                                amet.</p>
                            <p className="lorem">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
                                nonumy eirmod tempor
                                invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
                                accusam et justo duo
                                dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
                                dolor sit amet.
                                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
                                invidunt ut
                                labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo
                                duo dolores et
                                ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
                                amet.</p>
                            <p className="lorem">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
                                nonumy eirmod tempor
                                invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
                                accusam et justo duo
                                dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
                                dolor sit amet.
                                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
                                invidunt ut
                                labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo
                                duo dolores et
                                ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
                                amet.</p>
                            <p className="lorem">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
                                nonumy eirmod tempor
                                invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
                                accusam et justo duo
                                dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
                                dolor sit amet.
                                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
                                invidunt ut
                                labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo
                                duo dolores et
                                ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
                                amet.</p>
                        </div>

                        <div className="leaflet-menubar-pane" id="legend">
                            <h1 className="leaflet-menubar-header">
                                Legends
                                <span className="leaflet-menubar-close">
                                  <svg style={{display: 'inline-block', verticalAlign: 'text-bottom'}}  width="1em" height="1em" viewBox="0 0 16 16"
                                       className="bi bi-caret-left-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M3.86 8.753l5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
                                  </svg>
                                </span>
                            </h1>
                            <h2>Inner Bus Legend</h2>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10"/>
                                    </svg>
                                </div>
                                <div>
                                    (Transparent) Out of Service
                                </div>
                            </div>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="#D3D3D3" r="10"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | De-energized
                                </div>
                            </div>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="#90EE90" r="10"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Engergized | vMag > vMaxNorm
                                </div>
                            </div>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="none" r="8" stroke="#FF0000" strokeWidth="4">
                                            <animate attributeName="r" from="8" to="25" dur="1.5s" begin="0s"
                                                     repeatCount="indefinite"/>
                                            <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s"
                                                     repeatCount="indefinite"/>
                                        </circle>
                                        <circle cx="20" cy="20" fill="#FF0000" r="10"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | vMag High Violation
                                </div>
                            </div>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="none" r="8" stroke="#FF0000" strokeWidth="4">
                                            <animate attributeName="r" from="8" to="25" dur="1.5s" begin="0s"
                                                     repeatCount="indefinite"/>
                                            <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s"
                                                     repeatCount="indefinite"/>
                                        </circle>
                                        <circle cx="20" cy="20" fill="#FFFF00" r="10"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | vMag Low Violation
                                </div>
                            </div>


                            <h2>Outer Bus Legend</h2>
                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#00008B"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &lt; 13.9
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#4B0082"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt;= 13.9 and baseKV &lt;= 69
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#4169E1"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt; 70 and baseKV &lt;= 115
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#FF8C00"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt; 115 and baseKV &lt;= 230
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#FFA500"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt; 230 and baseKV &lt;= 345
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#ADD8E6"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt; 345 and baseKV &lt;= 500
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center'}}>
                                <div style={{height:'40px',width:'45px'}}>
                                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" fill="rgba(0,0,0, 0.0)" r="10" stroke="#B0C4DE"
                                                strokeWidth="4"/>
                                    </svg>
                                </div>
                                <div>
                                    baseKV &gt; 500
                                </div>
                            </div>

                            <h2>Branch Legend</h2>
                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'48px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#D3D3D3" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    Out of Service
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'48px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#D3D3D3" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service / De-energized
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'80px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#90EE90" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | max(P_mk, P_km) &lt; ratingA and (ratingA - max(P_mk,
                                    P_km)) / ratingA &gt;
                                    0.05
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'80px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#FFFF00" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | max(P_mk, P_km) &lt; ratingA and (ratingA - max(P_mk,
                                    P_km)) / ratingA
                                    &lt;= 0.05
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'80px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#FFA500" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | max(P_mk, P_km) &gt;= ratingA and (max(P_mk, P_km) -
                                    ratingA) / ratingA
                                    &lt;= 0.05
                                </div>
                            </div>

                            <div style={{display:'flex', alignItems: 'center', marginBottom: '10px'}}>
                                <div style={{height:'10px',width:'80px'}}>
                                    <svg viewBox="0 0 40 10" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="3" x2="28" y2="3" stroke="#FF0000" strokeOpacity="1"
                                              strokeWidth="2"
                                              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"
                                              fill="none"/>
                                    </svg>
                                </div>
                                <div>
                                    In Service | Energized | max(P_mk, P_km) &gt;= ratingA and (max(P_mk, P_km) -
                                    ratingA) / ratingA
                                    &gt; 0.05
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                <div id="sidebar">
                    {this.state.selectedData && (
                        <div>
                            {this.state.selectedData.model === 'bus' && (
                                <section>
                                    <h1>
                                        Bus: {this.state.selectedData.properties['name']}
                                        ({this.state.selectedData.properties['number']})
                                        [{this.state.selectedData.properties['v_base']}Kv]
                                    </h1>
                                    <h2>Type: {this.state.selectedData.properties['type']}</h2>
                                    <img
                                        src="https://via.placeholder.com/600x400.png?text=Placeholder+for+bus+layout+SVG"
                                        alt="SVG placeholder"/>
                                    <div className="side-bar-flex-row">
                                        <div className="h2">Status:
                                            <span style={{display: 'inline-block', 'marginLeft': '5px'}}>
                                                {this.state.selectedData.properties['in_service'] === true ?
                                                    <CheckIcon/> : <WarningIcon/>}

                                        </span>
                                        </div>
                                        <div className="side-bar-flex-row">
                                            <div className="h2" style={{'marginRight': '15px'}}>Angle</div>
                                            <div id="divBusAngCanvas"/>
                                        </div>
                                    </div>
                                    <div className="">
                                        <div className="h2">Voltage</div>
                                        <div id="divBusVoltageChart">
                                            <div className="chart-wrapper">
                                                <div className="axis-label-low">0.95</div>
                                                <div className="axis-label-center">1.0</div>
                                                <div className="axis-label-high">1.05</div>
                                                <div className="axis-line"/>
                                                <div className="axis-vert-line-low"/>
                                                <div className="axis-vert-line-center"/>
                                                <div className="axis-vert-line-high"/>
                                                <div className="value-bar">1.0</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="side-bar-flex-row">
                                        <div className="h2">Bus Load:
                                            <NumberFormat value={this.state.selectedData.properties['load_P'][this.state.timescaleIndex]}
                                                          decimalScale={2}
                                                          fixedDecimalScale={true}
                                                          displayType="text"
                                            />MW,
                                            {' '}
                                            <NumberFormat value={this.state.selectedData.properties['load_Q'][this.state.timescaleIndex]}
                                                          decimalScale={2}
                                                          fixedDecimalScale={true}
                                                          displayType="text"
                                            />MVa
                                        </div>
                                    </div>
                                    <Panel title="Generators">
                                        {this.state.selectedData.properties['generators'] !== null
                                        && this.state.selectedData.properties['generators'].length > 0
                                        && (
                                            <table>
                                                <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>MW</th>
                                                    <th>Mvar</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.state.selectedData.properties['generators'].map((item, index) => (
                                                    <tr key={item["index"]}>
                                                        <td>{item["name"]}</td>
                                                        <td>
                                                            {item['in_service'] === true ?
                                                                <CheckIcon/> : <WarningIcon/>}

                                                        </td>
                                                        <td>
                                                            <NumberFormat value={item["P"][this.state.timescaleIndex]}
                                                                          decimalScale={2}
                                                                          fixedDecimalScale={true}
                                                                          displayType="text"
                                                            />
                                                        </td>
                                                        <td>
                                                            <NumberFormat value={item["Q"][this.state.timescaleIndex]}
                                                                          decimalScale={2}
                                                                          fixedDecimalScale={true}
                                                                          displayType="text"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        )

                                        }
                                    </Panel>

                                    {this.state.associatedBranches && (
                                        <Panel title="Branches">
                                            <table>
                                                <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>To Bus</th>
                                                    <th>MW</th>
                                                    <th>Mvar</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.state.associatedBranches.map((item, index) => (
                                                    <tr key={item["index"]}>
                                                        <td>{item["name"]}</td>
                                                        <td>
                                                            {item['in_service'] === true ?
                                                                <CheckIcon/> : <WarningIcon/>}

                                                        </td>
                                                        <td>{item["bus_m_number"]}</td>
                                                        <td>
                                                            <NumberFormat value={item["P_km"][this.state.timescaleIndex]}
                                                                          decimalScale={2}
                                                                          fixedDecimalScale={true}
                                                                          displayType="text"
                                                            />
                                                        </td>
                                                        <td>
                                                            <NumberFormat value={item["Q_km"][this.state.timescaleIndex]}
                                                                          decimalScale={2}
                                                                          fixedDecimalScale={true}
                                                                          displayType="text"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </Panel>
                                    )}

                                </section>
                            )}

                            {this.state.selectedData.model === 'branch' && (
                                <section>
                                    <h1>Branch: {this.state.selectedData.properties['UID']}</h1>
                                    {this.state.selectedData.properties['Tr Ratio'] === 0 ?
                                        <h2>Type: Transmission Line</h2> : <h2>Type: Transformer</h2>
                                    }
                                    <img
                                        src="https://via.placeholder.com/600x400.png?text=Placeholder+for+branch+layout+SVG"
                                        alt="SVG placeholder"/>

                                    <div className="h2">Status:
                                        <span style={{display: 'inline-block', 'marginLeft': '5px'}}>
                                                {this.state.selectedData.properties['in_service'] === true ?
                                                    <CheckIcon/> : <WarningIcon/>}
                                        </span>
                                    </div>

                                    <div className="side-bar-flex-row">
                                        <div className="h2">Flow:
                                            {this.state.selectedData.properties['P_km'][this.state.timescaleIndex] >
                                                    this.state.selectedData.properties['P_mk'][this.state.timescaleIndex] ?
                                                <NumberFormat value={this.state.selectedData.properties['P_km'][this.state.timescaleIndex]}
                                                              decimalScale={2}
                                                              fixedDecimalScale={true}
                                                              displayType="text"
                                                /> :
                                                <NumberFormat value={this.state.selectedData.properties['P_mk'][this.state.timescaleIndex]}
                                                              decimalScale={2}
                                                              fixedDecimalScale={true}
                                                              displayType="text"
                                                />
                                            }
                                        </div>
                                    </div>
                                    <div className="side-bar-flex-row">
                                        <div className="h2">
                                            Rating (A): {this.state.selectedData.properties['ratingA']}
                                        </div>
                                    </div>

                                    {this.state.associatedBuses && (
                                        <Panel title="Buses">
                                            <table>
                                                <thead>
                                                <tr>
                                                    <th>Bus</th>
                                                    <th>Status</th>
                                                    <th>MW</th>
                                                    <th>Mvar</th>
                                                    <th>Angle</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.state.associatedBuses.map((item, index) => {
                                                    return (
                                                        <tr key={item["index"]}>
                                                            <td>{item["name"]}</td>
                                                            <td>
                                                                {item['in_service'] === true ?
                                                                    <CheckIcon/> : <WarningIcon/>}
                                                            </td>
                                                            <td>
                                                                <NumberFormat value={item["load_P"][this.state.timescaleIndex]}
                                                                              decimalScale={2}
                                                                              fixedDecimalScale={true}
                                                                              displayType="text"
                                                                />
                                                            </td>
                                                            <td>
                                                                <NumberFormat value={item["load_Q"][this.state.timescaleIndex]}
                                                                              decimalScale={2}
                                                                              fixedDecimalScale={true}
                                                                              displayType="text"
                                                                />
                                                            </td>
                                                            <td>
                                                                <NumberFormat
                                                                    value={(item["v_ang"][this.state.timescaleIndex] * (180.0 / this.PI))}
                                                                    decimalScale={2}
                                                                    fixedDecimalScale={true}
                                                                    displayType="text"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>
                                        </Panel>
                                    )}

                                    <Panel title="Parameters">
                                        <table>
                                            <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Value</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr>
                                                <td>R</td>
                                                <td>
                                                    <NumberFormat value={this.state.selectedData.properties['r']}
                                                                  decimalScale={3}
                                                                  fixedDecimalScale={true}
                                                                  displayType="text"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>X</td>
                                                <td>
                                                    <NumberFormat value={this.state.selectedData.properties['x']}
                                                                  decimalScale={3}
                                                                  fixedDecimalScale={true}
                                                                  displayType="text"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>B</td>
                                                <td>
                                                    <NumberFormat value={this.state.selectedData.properties['b']}
                                                                  decimalScale={3}
                                                                  fixedDecimalScale={true}
                                                                  displayType="text"
                                                    />
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </Panel>

                                </section>
                            )}


                        </div>
                    )}

                </div>
            </>
        )
    }
}

export default SldGsi;
