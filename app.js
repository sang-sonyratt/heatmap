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