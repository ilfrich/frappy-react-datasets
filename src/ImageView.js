import React from "react"
import { util } from "quick-n-dirty-utils"

class ImageView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            image: null,
        }
        this.loadImage = this.loadImage.bind(this)
    }

    componentDidMount() {
        this.loadImage()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.src !== this.props.src) {
            this.loadImage()
        }
    }

    loadImage() {
        fetch(`${this.props.src}`, {
            headers: util.getAuthHeader(),
        })
            .then(response => {
                if (response.status >= 400) {
                    // error loading image
                    return null
                }
                return response.blob()
            })
            .then(imageBlob => {
                if (imageBlob != null) {
                    this.setState({
                        image: URL.createObjectURL(imageBlob),
                    })
                }
            })
    }

    render() {
        if (this.state.image == null) {
            return null
        }
        return (
            <img src={this.state.image} width={this.props.width} height={this.props.height} style={this.props.style} />
        )
    }
}

export default ImageView
