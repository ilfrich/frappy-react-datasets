import React from "react"
import { mixins } from "quick-n-dirty-react"
import ImageView from "./ImageView"

const style = {
    imagePreview: {
        ...mixins.clickable,
        maxWidth: "150px",
        maxHeight: "150px",
        border: "1px solid #ccc",
    },
    image: {
        maxWidth: "740px",
        maxHeight: "400px",
    },
}

class ImagePreview extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            show: false,
        }
        this.toggle = this.toggle.bind(this)
    }

    toggle() {
        // show/hide the popup
        this.setState(oldState => ({
            ...oldState,
            show: !oldState.show,
        }))
    }

    render() {
        // helper function to determine img src (new vs. existing image)
        const getImageSrc = () => {
            if (this.props.dataSet == null) {
                return this.props.imageData
            }

            return `${this.props.apiPrefix}/${this.props.dataSet._id}/image`
        }

        return (
            <div>
                <img src={this.props.imageData} style={style.imagePreview} alt="Preview" onClick={this.toggle} />
                {this.state.show ? (
                    <div>
                        <div style={mixins.backdrop} onClick={this.toggle} />
                        <div style={{ ...mixins.popup.container(800), top: "50px" }}>
                            <div style={mixins.popup.header}>
                                Time Series Preview
                                <span style={mixins.popup.close} onClick={this.toggle}>
                                    &times;
                                </span>
                            </div>
                            <div style={mixins.popup.body}>
                                <ImageView src={getImageSrc()} style={style.image} />
                            </div>
                            <div style={mixins.popup.footer}>
                                <button type="button" style={mixins.button} onClick={this.toggle}>
                                    Ok
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        )
    }
}

export default ImagePreview
