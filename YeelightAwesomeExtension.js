function extendYeelight(YeelightAwesome) {
	YeelightAwesome.Yeelight.prototype.oldOnMessage = YeelightAwesome.Yeelight.prototype.onMessage;
	// Emit a changed event whenever the light's state changes
	YeelightAwesome.Yeelight.prototype.onMessage = function (message) {
		if (message.method == 'props') {
			this.emit('changed', message.params);
		}
		
		// Run the usual handler
		this.oldOnMessage(message);
	}
}

module.exports = extendYeelight;
