class ListItem extends HTMLElement {
	static get observedAttributes() {
		return ['text', 'detail'];
	}
	
	constructor() {
		// Always call super first in constructor
		super();

		// Create a shadow root
		let shadow = this.attachShadow({mode: "open"});

		// Create elements
		let primaryLabel = document.createElement('div');
		this._primaryLabel = primaryLabel;
		let secondaryLabel = document.createElement('div');
		this._secondaryLabel = secondaryLabel;

		let style = document.createElement("style");
		style.textContent = `
:host {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: 72px;
	padding: 16px 16px 16px 72px;
	box-sizing: border-box;
}

:host::before {
	content: '';
	position: absolute;
	top: 50%;
	left: 16px;
	height: 40px;
	width: 40px;
	border-radius: 100%;
	background: #AAA;
	transform: translateY(-50%);
}

/* Select the detail element */
:host > div:nth-of-type(2n) {
	font-size: 0.8em;
	color: #8C8C8C;
}
`;

		// Attach the created elements to the shadow dom
		shadow.appendChild(style);
		shadow.appendChild(primaryLabel);
		shadow.appendChild(secondaryLabel);
	}
	
	attributeChangedCallback(attribute, oldValue, newValue) {
		if (attribute == 'text') {
			this._primaryLabel.innerHTML = newValue;
		} else if (attribute == 'detail') {
			this._secondaryLabel.innerHTML = newValue;
		}
	}
}

customElements.define("ambient-item", ListItem);

export default ListItem;
