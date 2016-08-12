import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { setComponentProcs } from './actions';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import styles from './styles';

class IOModal extends Component {
    constructor(props) {
	super(props);
	this.state = {path_json: '', open: false};
    }
    componentDidMount() {   	
	let openIOModal = () => {
	    let state = {path_json: this.props.path_manager.selectionAsGeoJSON(), open: true};
	    this.setState(state);	    
	};
	this.props.setComponentProcs({openIOModal});	
    }
    handleImport(e) {
        var obj = JSON.parse(this.state.path_json);
        var coordinates = obj.coordinates;
        var pts = coordinates.map(function (item) {
            return new google.maps.LatLng(item[1], item[0]);
        });
        var path = new google.maps.MVCArray(pts);
        this.props.path_manager.showPath(path, true);
	this.handleClose();
    }
    handleClose() {
	this.setState({ open: false });
    }
    initTextField(ref) {
	if (!ref || this.reader) return;
	let textarea = ref.getInputNode();
	if (!textarea) return;
	this.reader = new FileReader();
	this.reader.addEventListener('loadend', e => {
	    this.setState({path_json:  e.target.result});
	});
	
	document.addEventListener("drop", (e) =>  {
	    if (e.target === textarea) {
		e.stopPropagation();
		e.preventDefault();
		var files = e.dataTransfer.files;
		this.reader.readAsText(files[0]);
	    }
	});
	document.addEventListener("dragenter", (e) =>  {
	    if (e.target === textarea) {	    
		e.stopPropagation();
		e.preventDefault();
	    }
	});
	document.addEventListener("dragover", (e) => {
	    if (e.target === textarea) {
		e.stopPropagation();
		e.preventDefault();
	    }
	});
    }
    render() {
	let actions = [
	    <FlatButton onTouchTap={this.handleImport.bind(this)}  label="import" primary={true} />
	];
	// due to https://github.com/callemall/material-ui/issues/3394 we use onBlur.	
	return (
	    <Dialog
                title="Export/Import"
		ref="root"
		actions={actions}
		modal={false}
                open={this.state.open}
                onRequestClose={this.handleClose.bind(this)}
	    >
		<TextField defaultValue={this.state.path_json} onBlur={ (e) => this.setState({path_json: e.target.value})} fullWidth={true}  multiLine={true} rows={6} rowsMax={6} ref={this.initTextField.bind(this)} onFocus={function(e) {e.target.select();}} hintText="input text or drag geojson file" />
	    <IconButton style={styles.dialogCloseButton} onTouchTap={this.handleClose.bind(this)}><NavigationClose /></IconButton>
            </Dialog>
	);
    }
}

function mapStateToProps(state) {
    return { path_manager: state.main.path_manager };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ setComponentProcs }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(IOModal);
