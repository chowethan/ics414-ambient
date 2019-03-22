class List extends HTMLElement {
	constructor() {
		// Always call super first in constructor
		super();

		// Create a shadow root
		let shadow = this.attachShadow({mode: "open"});

		let style = document.createElement("style");
		style.textContent = `
:host {
	display: flex;
	flex-direction: column;
}
`;

		// Attach the created elements to the shadow dom
		shadow.appendChild(style);
		
		let observer = new MutationObserver((records, observer) => this.observed(records, observer));
		let observationConfig = {childList: true};
		observer.observe(this, observationConfig);
		
		this.update();
	}

	connectedCallback() {
		this.update();
	}
	
	update() {
		while (this._shadowElement.children.length > 1) {
			this._shadowElement.removeChild(this._shadowElement.lastChild);
		}
		
		for (let i = 0; i < this.children.length; i++) {
			this._shadowElement.appendChild(this.children[i].cloneNode(true));
		}
	}
	
	observed(records, observer) {
		this.update();
	}
}

customElements.define("ambient-list", List);

export default List;
