import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { setStreetView, toggleSidebar, setPanoramaCount, setPanoramaIndex, setOverlay } from './actions';
import IconButton from 'material-ui/IconButton';
import Toggle from 'material-ui/Toggle';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import AvFastForward from 'material-ui/svg-icons/av/fast-forward';
import AvFastRewind from 'material-ui/svg-icons/av/fast-rewind';
import styles from './styles';


class PanoramaBox extends Component {
    constructor(props) {
        super(props);

        this.panoramaInterval = 50;
    }
    handleOverlayChange(e, toggled) {
        this.props.setOverlay(toggled);
    }
    interpolatePoints(pt1, pt2, r) {
        return new google.maps.LatLng(r*pt2.lat() + (1-r)*pt1.lat(), r*pt2.lng() + (1-r)*pt1.lng());
    }
    getPanoramaPointsAndHeadings(highlighted_path) {
        if (!highlighted_path) return null;
        const pph = [];
        const path = highlighted_path;
        const count = path.length;
        let way = 0;
        let dsum = 0;
        let pt2, h;
        for (let i= 0; i < count-1; i++) {
            let pt1 = path[i];
            pt2 = path[i+1];
            const d = google.maps.geometry.spherical.computeDistanceBetween(pt1, pt2);
            h = google.maps.geometry.spherical.computeHeading(pt1, pt2);

            while(way < dsum+d ) {
                const pt = this.interpolatePoints(pt1, pt2, (way - dsum)/d);
                pph.push([pt, h]);
                way += this.panoramaInterval;
            }
            dsum += d;
        }
        pph.push([pt2, h]);
        return pph;

    }
    initPanorama(highlighted_path) {
        if (! highlighted_path) {
            if (this.props.panorama) {
                this.props.panorama.setVisible(false);
            }
            return;
        }
        const path = google.maps.geometry.encoding.decodePath(highlighted_path);
        this.panoramaPointsAndHeadings = this.getPanoramaPointsAndHeadings(path);
        this.props.setPanoramaCount(this.panoramaPointsAndHeadings.length);
        // setTimeout(() => {this.props.setPanoramaIndex(0);}, 0);
        this.props.setPanoramaIndex(0);
    }
    showPanorama() {
        const index = this.props.panorama_index;
        const item = this.panoramaPointsAndHeadings[index];
        const pt = item[0];
        const heading = item[1];
        this.streetViewService.getPanoramaByLocation(pt, 50, (data, status) => {
            if (status == google.maps.StreetViewStatus.OK) {
                this.props.panorama.setPano(data.location.pano);
                this.props.panorama.setPov({heading: heading, zoom: 1, pitch: 0});
                this.props.panorama.setVisible(true);
            }
            else {
                this.props.panorama.setVisible(false);
            }
        });
        google.maps.event.trigger(this.props.panorama, 'resize');
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.highlighted_path != this.props.highlighted_path) return true;
        if (nextProps.panorama_index != this.props.panorama_index) return true;
        if (nextProps.panorama_count != this.props.panorama_count) return true;
        if (nextProps.overlay != this.props.overlay) return true;
        return false;
    }
    componentDidUpdate(prevProps) {
        this.showPanorama();
        if (this.props.overlay) {
            this.props.setStreetView(null);
            if (this.props.open_sidebar) this.props.toggleSidebar();
        }
        else {
            this.props.setStreetView(this.panorama);
        }
    }
    componentDidMount() {
        this.streetViewService = new google.maps.StreetViewService();
        this.panorama = new google.maps.StreetViewPanorama(this.refs.body, {
            addressControl: true,
            navigationControl: true,
            enableCloseButton: false,
        });
        this.props.setStreetView(this.panorama);
        if (this.props.highlighted_path) this.initPanorama(this.props.highlighted_path);
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.highlighted_path != this.props.highlighted_path) {
            this.initPanorama(nextProps.highlighted_path);
        }
    }
    render() {
        return (
            <div>
                <div>
                    <h3 style={styles.panoramaBoxTitle}>street view </h3>
                    <Toggle
                        label="overlay" toggled={this.props.overlay} onToggle={this.handleOverlayChange.bind(this)} style={styles.panoramaBoxOverlayToggle}/></div>
                    <div style={styles.panoramaBoxBody} ref="body"></div>
                    <div style={styles.panoramaBoxControl}>
                        <IconButton onClick={ () => { this.props.setPanoramaIndex(this.props.panorama_index - 10); } }><AvFastRewind /></IconButton>
                        <IconButton onClick={ () => { this.props.setPanoramaIndex(this.props.panorama_index - 1); }}><NavigationArrowBack /></IconButton>
                        <span className="label label-info"><span>{ this.props.panorama_index+1 } </span> / <span>{ this.props.panorama_count } </span></span>
                        <IconButton onClick={ () => { this.props.setPanoramaIndex(this.props.panorama_index + 1); }}><NavigationArrowForward /></IconButton>
                        <IconButton onClick={ () => { this.props.setPanoramaIndex(this.props.panorama_index + 10); }}><AvFastForward /></IconButton>
                    </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        highlighted_path: state.main.highlighted_path,
        panorama: state.main.panorama,
        open_sidebar: state.main.open_sidebar,
        panorama_index: state.main.panorama_index,
        panorama_count: state.main.panorama_count,
        overlay: state.main.overlay,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ setStreetView, toggleSidebar, setPanoramaCount, setPanoramaIndex, setOverlay }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PanoramaBox);
