import {Deck} from '@deck.gl/core';
import mapboxgl from 'mapbox-gl';
import {HeatmapLayer} from '@deck.gl/aggregation-layers';

const Data = './data.json';

const INITIAL_VIEW_STATE = {
    latitude: 40.52,
    longitude: -74.75,
    zoom: 9,
    bearing: 0,
    pitch: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const map = new mapboxgl.Map({
    container: 'map',
    style: MAP_STYLE,
    interactive: false,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    bearing: INITIAL_VIEW_STATE.bearing,
    pitch: INITIAL_VIEW_STATE.pitch
});

export const deck = new Deck({
    canvas: 'deck-canvas',
    width: '100%',
    height: '100%',
    initialViewState: INITIAL_VIEW_STATE,
    controller: true,
    onViewStateChange: ({viewState}) => {
        map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch
        });
    },
    layers: [
        new HeatmapLayer({
            id: 'heatmapLayer',
            data: Data,
            getPosition: d => [d.lng, d.lat],
            getWeight: d => d.count,
        }),
    ]
});

// creating a class to wrap the heatmap cycling logic
function AnimationPlayer(options) {
    this.data = options.data;
    this.interval = null;
    this.animationSpeed = options.animationSpeed;
    this.wrapperEl = options.wrapperEl;
    this.isPlaying = false;
    this.init();
}

// define the prototype functions
AnimationPlayer.prototype = {
    init: function() {
        //add button play
        this.wrapperEl.innerHTML = '';
        const playButton = this.playButton = document.createElement('button');
        playButton.onclick = function() {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.play();
            }
            this.isPlaying = !this.isPlaying;
        }.bind(this);
        playButton.innerText = 'play';

        this.wrapperEl.appendChild(playButton);

        const events = document.createElement('div');
        events.className = 'heatmap-timeline';
        events.innerHTML = '';

        //add element check data for men, women and all data
        const xOffset = [10, 30, 50];
        const text = ['Men', 'Women', 'All'];
        for (let i = 0; i < 3; i++) {
            const ev = document.createElement('label');
            ev.className = 'container';
            const ev1 = document.createElement('div');
            ev1.className = 'time-point';
            ev1.style.left = xOffset[i]+'%';
            const ev2 = document.createElement('span');
            ev2.innerText = text[i];
            ev2.className = 'checkmark';
            ev2.style.left = xOffset[i]+'%';
            ev.appendChild(ev1);
            ev.appendChild(ev2);
            ev.onclick = (function(i) {
                return function() {
                    this.isPlaying = false;
                    this.stop();
                    this.setFrame(i, this.data);
                }.bind(this);
            }.bind(this))(i);
            events.appendChild(ev);
        }
        this.wrapperEl.appendChild(events);

        //add container for button speed and input search
        const events1 = document.createElement('div');
        events1.className = 'frame-button';
        events1.innerHTML = '';

        //add button set speed
        const speed = [1000, 250];
        const speed_text = ['1', '4'];
        for (let i = 0; i<2; i++) {
            const bu = this.speedButton = document.createElement('button');
            bu.onclick = function () {
                this.setAnimationSpeed(speed[i]);
                const a = document.querySelectorAll('.frame-button button');
                for (let i=0; i<a.length; i++) {
                    a[i].classList.remove('clicked');
                }
                bu.classList.add('clicked');
            }.bind(this);
            bu.innerText = speed_text[i]+"frame-second";
            bu.className = 'button' + speed_text[i];
            if(i===0) {
                bu.classList.add('clicked');
            }
            events1.appendChild(bu);
        }
        this.wrapperEl.appendChild(events1);
        //default first frame
        this.setFrame(0, this.data);
    },
    play: function() {
        this.playButton.innerText = 'pause';
        this.interval = setInterval(function() {
            this.setFrame(++this.currentFrame%3, this.data);
        }.bind(this), this.animationSpeed)
    },
    stop: function() {
        clearInterval(this.interval);
        this.playButton.innerText = 'play';
    },
    setFrame: function(frame, data) {
        this.currentFrame = frame;
        let snapshot = [];
        // filter the data for men, women and all data
        if(frame === 0) {
            snapshot =  data.filter(function (a) {
                if (a.gender === 'M') return a;
            })
        } else if (frame === 1) {
            snapshot = data.filter(function (a) {
                if (a.gender === 'F') return a;
            })
        } else {
            snapshot = data;
        }
        // set new data
        deck.setProps({
            layers: [
                new HeatmapLayer({
                    id: 'heatmapLayer',
                    data: snapshot,
                    getPosition: d => [d.lng, d.lat],
                    getWeight: d => d.count,
                }),
            ]
        })
        const timePoints = document.querySelectorAll('.time-point');
        if(timePoints) {
            for (let i = 0; i < timePoints.length; i++) {
                if (timePoints[i].classList.value === 'time-point active') {
                    timePoints[i].classList.remove('active');
                }
            }
        }
        timePoints[frame].classList.add('active');
    },
    setAnimationSpeed: function(speed) {
        this.isPlaying = false;
        this.stop();
        this.animationSpeed = speed;
    }
};

fetch('data.json')
    .then(response => {
        return response.json();
    })
    .then(data => {
        const player = new AnimationPlayer({
            wrapperEl: document.querySelector('.timeline-wrapper'),
            data: data,
            animationSpeed: 1000
        });
    })